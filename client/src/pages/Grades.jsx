import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function Grades() {
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [form, setForm] = useState({ student: '', classId: '', assessmentName: '', assessmentType: 'quiz', score: '', maxScore: '100', date: '', notes: '' });
  const [error, setError] = useState('');

  const fetchGrades = () => API.get('/grades', { params: filterClass ? { classId: filterClass } : {} }).then(res => setGrades(res.data)).catch(() => {});
  const fetchClasses = () => API.get('/classes').then(res => setClasses(res.data)).catch(() => {});
  const fetchStudents = () => API.get('/students').then(res => setStudents(res.data.students || [])).catch(() => {});
  useEffect(() => { fetchGrades(); fetchClasses(); fetchStudents(); }, []);
  useEffect(() => { fetchGrades(); }, [filterClass]);

  const openAdd = () => {
    setEditing(null);
    setForm({ student: '', classId: filterClass || '', assessmentName: '', assessmentType: 'quiz', score: '', maxScore: '100', date: new Date().toISOString().split('T')[0], notes: '' });
    setError(''); setShowModal(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ student: g.student?._id || g.student, classId: g.classId?._id || g.classId, assessmentName: g.assessmentName, assessmentType: g.assessmentType, score: g.score.toString(), maxScore: g.maxScore.toString(), date: new Date(g.date).toISOString().split('T')[0], notes: g.notes || '' });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const data = { ...form, score: parseFloat(form.score), maxScore: parseFloat(form.maxScore) };
      if (editing) await API.put(`/grades/${editing._id}`, data);
      else await API.post('/grades', data);
      toast.success(editing ? 'Grade updated' : 'Grade added');
      setShowModal(false); fetchGrades();
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this grade?')) return;
    try { await API.delete(`/grades/${id}`); toast.success('Deleted'); fetchGrades(); }
    catch { toast.error('Failed'); }
  };

  // F7.2: Real-time calculation in form
  const livePercent = form.score && form.maxScore ? ((parseFloat(form.score) / parseFloat(form.maxScore)) * 100).toFixed(1) : null;
  const liveGrade = livePercent ? (livePercent >= 80 ? 'A' : livePercent >= 70 ? 'B' : livePercent >= 60 ? 'C' : livePercent >= 50 ? 'D' : 'F') : null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Grades</h2>
          <p className="subtitle">Manage student scores and assessments</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><HiPlus /> Add Grade</button>
      </div>

      <div className="flex gap-3">
        <select className="form-control max-w-[250px]" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* F7.2: Glassmorphism grade cards */}
      {grades.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">📝</div>
          <h3 className="font-semibold">No grades yet</h3>
          <p className="text-sm text-[var(--text-secondary)]">Add grades to track progress</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grades.map(g => {
            const pct = parseFloat(g.percentage);
            const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
            return (
              <div key={g._id} className="glass-card p-5 relative overflow-hidden">
                {/* Glassmorphism accent */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2" style={{ background: color }} />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{g.student?.firstName} {g.student?.lastName}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{g.classId?.name}</p>
                  </div>
                  <span className="badge badge-info">{g.assessmentType}</span>
                </div>
                <p className="text-sm font-medium mb-2">{g.assessmentName}</p>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold" style={{ color }}>{g.score}</span>
                    <span className="text-sm text-[var(--text-secondary)]"> / {g.maxScore}</span>
                  </div>
                  <span className={`text-lg font-bold badge ${pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                    {g.percentage}%
                  </span>
                </div>
                {/* F7.2: Glass progress bar */}
                <div className="progress-bar mb-3">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)]">{new Date(g.date).toLocaleDateString()}</span>
                  <div className="actions-cell">
                    <button className="btn btn-glass btn-sm" onClick={() => openEdit(g)}><HiPencil /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g._id)}><HiTrash /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">{editing ? 'Edit Grade' : 'Add Grade'}</h3><button className="btn btn-glass btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group"><label className="form-label">Student</label>
                  <select className="form-control" value={form.student} onChange={e => setForm({...form, student: e.target.value})} required>
                    <option value="">Select student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-control" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} required>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Assessment Name</label><input className="form-control" value={form.assessmentName} onChange={e => setForm({...form, assessmentName: e.target.value})} required placeholder="e.g. Quiz 1" /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-control" value={form.assessmentType} onChange={e => setForm({...form, assessmentType: e.target.value})}>
                      <option value="quiz">Quiz</option><option value="exam">Exam</option><option value="homework">Homework</option><option value="project">Project</option><option value="participation">Participation</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Score</label><input type="number" step="0.1" min="0" className="form-control" value={form.score} onChange={e => setForm({...form, score: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Max Score</label><input type="number" step="0.1" min="1" className="form-control" value={form.maxScore} onChange={e => setForm({...form, maxScore: e.target.value})} required /></div>
                </div>
                {/* F7.2: Real-time calculation display */}
                {livePercent && (
                  <div className="glass-card p-3 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Live Preview</span>
                    <div className="flex gap-3 items-center">
                      <span className={`badge ${livePercent >= 80 ? 'badge-success' : livePercent >= 50 ? 'badge-warning' : 'badge-danger'}`}>{livePercent}%</span>
                      <span className="text-lg font-bold">{liveGrade}</span>
                    </div>
                  </div>
                )}
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-control" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
