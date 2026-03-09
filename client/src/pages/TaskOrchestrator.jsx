import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { HiPlay, HiSearch, HiClock, HiCheckCircle, HiExclamationCircle, HiChartBar } from 'react-icons/hi';
import API from '../utils/api';

// F1.5: Async task orchestrator with concurrency limit of 2
const MAX_CONCURRENCY = 2;
const TCAS_COURSES_API = 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json?ts=19ccb8ee1ee';
const LY_PROGRAMS_API = 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/ly-programs/';

// Score component labels
const SCORE_LABELS = {
  tgat: 'TGAT', tpat1: 'TPAT1', tpat2: 'TPAT2', tpat3: 'TPAT3', tpat4: 'TPAT4', tpat5: 'TPAT5',
  a_lv_61: 'A-Level คณิตศาสตร์ประยุกต์ 1', a_lv_62: 'A-Level คณิตศาสตร์ประยุกต์ 2',
  a_lv_63: 'A-Level วิทยาศาสตร์ประยุกต์', a_lv_64: 'A-Level ฟิสิกส์',
  a_lv_65: 'A-Level เคมี', a_lv_66: 'A-Level ชีววิทยา',
  a_lv_67: 'A-Level สังคมศึกษา', a_lv_68: 'A-Level ภาษาไทย',
  a_lv_69: 'A-Level ภาษาอังกฤษ', a_lv_70: 'A-Level ภาษาฝรั่งเศส',
  a_lv_81: 'A-Level คณิตศาสตร์พื้นฐาน', a_lv_82: 'A-Level วิทยาศาสตร์พื้นฐาน',
};

export default function AdmissionChecker() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const coursesRef = useRef([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [tasks, setTasks] = useState([]);
  const [userScores, setUserScores] = useState({}); // { [scoreKey]: number }
  const queueRef = useRef([]);
  const runningRef = useRef(0);
  const abortControllers = useRef(new Map());
  const taskIdCounter = useRef(0);

  // Fetch students + courses on mount
  useEffect(() => {
    API.get('/students').then(res => setStudents(res.data.students || [])).catch(() => {});
    if (coursesRef.current.length) { setCourses(coursesRef.current); return; }
    fetch(TCAS_COURSES_API).then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : [];
      coursesRef.current = list;
      setCourses(list);
    }).catch(() => {});
  }, []);

  const getUniLabel = useCallback((programId) => {
    if (!programId) return '-';
    const c = coursesRef.current.find(x => String(x.program_id) === String(programId));
    return c ? `${c.university_name_th} - ${c.faculty_name_th} - ${c.program_name_th}` : programId;
  }, []);

  const getUniShort = useCallback((programId) => {
    if (!programId) return '-';
    const c = coursesRef.current.find(x => String(x.program_id) === String(programId));
    return c ? c.university_name_th : programId;
  }, []);

  const filteredStudents = useMemo(() => {
    if (!studentSearch || studentSearch.length < 1) return [];
    const q = studentSearch.toLowerCase();
    return students.filter(s => {
      const uniArr = Array.isArray(s.university) ? s.university : (s.university ? [s.university] : []);
      return uniArr.length > 0 && `${s.firstName} ${s.lastName} ${s.studentId || ''}`.toLowerCase().includes(q);
    }).slice(0, 20);
  }, [studentSearch, students]);

  // Process queue with concurrency limit (F1.5)
  const processQueue = useCallback(() => {
    while (runningRef.current < MAX_CONCURRENCY && queueRef.current.length > 0) {
      const taskId = queueRef.current.shift();
      runningRef.current++;

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running', progress: 30 } : t));

      const programId = queueRef.current._taskMap?.get(taskId)?.programId;
      const controller = new AbortController();
      abortControllers.current.set(taskId, controller);

      fetch(`${LY_PROGRAMS_API}${encodeURIComponent(programId)}.json`, { signal: controller.signal })
        .then(r => {
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 70 } : t));
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(data => {
          const result = Array.isArray(data) ? data[0] : data;
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100, result } : t));
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', progress: 100, error: err.message } : t));
          }
        })
        .finally(() => {
          runningRef.current--;
          abortControllers.current.delete(taskId);
          processQueue();
        });
    }
  }, []);

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch('');
    setTasks([]);
    queueRef.current = [];
    runningRef.current = 0;
    abortControllers.current.forEach(c => c.abort());
    abortControllers.current.clear();
  };

  const startCheck = () => {
    if (!selectedStudent) return;
    const uniArr = Array.isArray(selectedStudent.university) ? selectedStudent.university : (selectedStudent.university ? [selectedStudent.university] : []);
    if (uniArr.length === 0) return;

    setTasks([]);
    queueRef.current = [];
    runningRef.current = 0;

    const newTasks = uniArr.map((pid) => {
      const id = ++taskIdCounter.current;
      return { id, programId: pid, label: getUniLabel(pid), status: 'queued', progress: 0, result: null, error: null };
    });

    if (!queueRef.current._taskMap) queueRef.current._taskMap = new Map();
    newTasks.forEach(t => {
      queueRef.current.push(t.id);
      queueRef.current._taskMap.set(t.id, { programId: t.programId });
    });

    setTasks(newTasks);
    setTimeout(() => processQueue(), 50);
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'queued': return <HiClock className="text-yellow-400" />;
      case 'running': return <HiPlay className="text-blue-400 animate-pulse" />;
      case 'completed': return <HiCheckCircle className="text-green-400" />;
      case 'error': return <HiExclamationCircle className="text-red-400" />;
      default: return null;
    }
  };

  const runningCount = tasks.filter(t => t.status === 'running').length;
  const queuedCount = tasks.filter(t => t.status === 'queued').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const allDone = tasks.length > 0 && tasks.every(t => t.status === 'completed' || t.status === 'error');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Admission Checker</h2>
          <p className="subtitle">Select a student to check admission scores for their target departments (max {MAX_CONCURRENCY} concurrent lookups)</p>
        </div>
      </div>

      {/* Step 1: Select student */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-3">1. Select Student</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Choose a student who has target university departments</p>

        {selectedStudent ? (
          <div className="flex items-center gap-4">
            <div className="flex-1 glass-card p-4 border-[var(--primary)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                  {selectedStudent.firstName[0]}
                </div>
                <div>
                  <div className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{selectedStudent.grade || 'No grade'} • {(Array.isArray(selectedStudent.university) ? selectedStudent.university : []).length} department(s)</div>
                </div>
              </div>
            </div>
            <button className="btn btn-glass text-sm" onClick={() => { setSelectedStudent(null); setTasks([]); }}>Change</button>
          </div>
        ) : (
          <div className="relative">
            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              className="form-control pl-10 w-full"
              placeholder="Search student name..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
            {studentSearch.length >= 1 && filteredStudents.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                {filteredStudents.map(s => {
                  const uniArr = Array.isArray(s.university) ? s.university : (s.university ? [s.university] : []);
                  return (
                    <button
                      type="button"
                      key={s._id}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--primary)]/10 border-b border-[var(--glass-border)] last:border-0 cursor-pointer"
                      onClick={() => selectStudent(s)}
                    >
                      <div className="font-medium text-sm">{s.firstName} {s.lastName}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">{s.grade || '-'} • {uniArr.length} dept(s): {uniArr.map(u => getUniShort(u)).join(', ')}</div>
                    </button>
                  );
                })}
              </div>
            )}
            {studentSearch.length >= 1 && filteredStudents.length === 0 && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2">No students found with target departments</p>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Show departments & start check */}
      {selectedStudent && tasks.length === 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-3">2. Target Departments</h3>
          <div className="space-y-2 mb-4">
            {(Array.isArray(selectedStudent.university) ? selectedStudent.university : (selectedStudent.university ? [selectedStudent.university] : [])).map((pid, i) => (
              <div key={pid} className="glass-card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)] font-bold text-sm">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{getUniLabel(pid)}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Program ID: {pid}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={startCheck}>
            <HiPlay /> Check Admission Scores ({(Array.isArray(selectedStudent.university) ? selectedStudent.university : []).length} task{(Array.isArray(selectedStudent.university) ? selectedStudent.university : []).length > 1 ? 's' : ''})
          </button>
        </div>
      )}

      {/* Task queue + results */}
      {tasks.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{runningCount}</div>
              <div className="text-xs text-[var(--text-secondary)]">Fetching</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{queuedCount}</div>
              <div className="text-xs text-[var(--text-secondary)]">Queued</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
              <div className="text-xs text-[var(--text-secondary)]">Done</div>
            </div>
          </div>

          {/* Task cards with results */}
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  {statusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate block">{task.label}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">ID: {task.programId}</span>
                  </div>
                  <span className={`badge ${task.status === 'running' ? 'badge-primary' : task.status === 'completed' ? 'badge-success' : task.status === 'error' ? 'badge-danger' : 'badge-warning'}`}>
                    {task.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--glass-bg)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${task.progress}%`,
                      background: task.status === 'error' ? '#ef4444' : task.status === 'completed' ? '#22c55e' : 'var(--accent-color)',
                    }}
                  />
                </div>

                {/* Error */}
                {task.status === 'error' && (
                  <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                    No admission data available for this program
                  </div>
                )}

                {/* Result */}
                {task.status === 'completed' && task.result && (
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 rounded-xl bg-blue-500/10">
                        <div className="text-lg font-bold text-blue-400">{task.result.min_score?.toFixed(2) ?? '-'}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Min Score</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-green-500/10">
                        <div className="text-lg font-bold text-green-400">{task.result.max_score?.toFixed(2) ?? '-'}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Max Score</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-purple-500/10">
                        <div className="text-lg font-bold text-purple-400">{task.result.receive_student_number ?? '-'}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Seats</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-orange-500/10">
                        <div className="text-lg font-bold text-orange-400">{task.result.min_score_ds?.toFixed(2) ?? '-'}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Min Score (DS)</div>
                      </div>
                    </div>

                    {/* Score components with input */}
                    {task.result.scores && Object.keys(task.result.scores).length > 0 && (() => {
                      const entries = Object.entries(task.result.scores);
                      const totalWeight = entries.reduce((s, [, w]) => s + w, 0);
                      const weightedTotal = entries.reduce((s, [key, weight]) => {
                        const raw = parseFloat(userScores[key]) || 0;
                        return s + (raw * weight / 100);
                      }, 0);
                      const minScore = task.result.min_score ?? 0;
                      const pass = weightedTotal >= minScore;
                      return (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><HiChartBar className="text-[var(--primary)]" /> Score Components — Enter Your Scores</h4>
                          <div className="space-y-2 mb-4">
                            {entries.map(([key, weight]) => {
                              const raw = userScores[key] ?? '';
                              const contributed = (parseFloat(raw) || 0) * weight / 100;
                              return (
                                <div key={key} className="flex items-center gap-3 glass-card px-3 py-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium">{SCORE_LABELS[key] || key}</div>
                                    <div className="text-[10px] text-[var(--text-tertiary)]">{weight}% weight → contributes {contributed.toFixed(2)}</div>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="form-control w-20 text-center text-sm py-1"
                                    placeholder="0"
                                    value={raw}
                                    onChange={e => setUserScores(prev => ({ ...prev, [key]: e.target.value }))}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Total comparison */}
                          <div className={`rounded-xl p-4 ${pass ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Your Weighted Score</span>
                              <span className={`text-xl font-bold ${pass ? 'text-green-400' : 'text-red-400'}`}>{weightedTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Min Score Required</span>
                              <span className="text-xl font-bold text-blue-400">{minScore.toFixed(2)}</span>
                            </div>
                            <div className="w-full h-3 rounded-full overflow-hidden bg-[var(--glass-bg)] relative">
                              {/* Min score marker */}
                              <div className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10" style={{ left: `${Math.min(minScore, 100)}%` }} />
                              <div className={`h-full rounded-full transition-all duration-300 ${pass ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(weightedTotal, 100)}%` }} />
                            </div>
                            <div className="mt-2 text-center">
                              {pass
                                ? <span className="text-green-400 font-bold text-sm">✓ Score meets minimum requirement! (+{(weightedTotal - minScore).toFixed(2)} above)</span>
                                : <span className="text-red-400 font-bold text-sm">✗ Below minimum by {(minScore - weightedTotal).toFixed(2)} points</span>
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reset */}
          {allDone && (
            <div className="flex justify-center">
              <button className="btn btn-glass" onClick={() => { setSelectedStudent(null); setTasks([]); }}>
                Check Another Student
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
