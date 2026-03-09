import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import useSyncStore from '../stores/useSyncStore';
import { HiDownload, HiRefresh } from 'react-icons/hi';

export default function Reports() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [report, setReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [gradeAnalytics, setGradeAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('class');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { getCache, setCache } = useSyncStore();

  useEffect(() => {
    API.get('/classes').then(res => setClasses(res.data)).catch(() => {});
    API.get('/students').then(res => setStudents(res.data.students || [])).catch(() => {});
  }, []);

  // F7.4: Parallel API requests with Promise.allSettled + partial failure handling
  const loadClassReport = async () => {
    if (!selectedClass) return;
    setLoading(true); setErrors({});
    const cacheKey = `class_report_${selectedClass}`;
    const cached = getCache(cacheKey);
    if (cached) { setReport(cached.report); setAttendanceReport(cached.attendance); setGradeAnalytics(cached.analytics); setLoading(false); return; }

    const results = await Promise.allSettled([
      API.get(`/reports/class-summary/${selectedClass}`),
      API.get('/reports/attendance-report', { params: { classId: selectedClass } }),
      API.get('/reports/grade-analytics'),
    ]);

    const errs = {};
    const rep = results[0].status === 'fulfilled' ? results[0].value.data : (errs.report = 'Failed to load class summary', null);
    const att = results[1].status === 'fulfilled' ? results[1].value.data : (errs.attendance = 'Failed to load attendance', null);
    const ana = results[2].status === 'fulfilled' ? results[2].value.data : (errs.analytics = 'Failed to load analytics', null);

    setReport(rep); setAttendanceReport(att); setGradeAnalytics(ana); setErrors(errs); setLoading(false);
    // F7.4: Offline cache
    if (rep) setCache(cacheKey, { report: rep, attendance: att, analytics: ana });
    if (Object.keys(errs).length > 0) toast.error('Some reports failed to load');
  };

  const loadStudentProgress = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    const cacheKey = `student_progress_${selectedStudent}`;
    const cached = getCache(cacheKey);
    if (cached) { setStudentProgress(cached); setLoading(false); return; }
    try {
      const res = await API.get(`/reports/student-progress/${selectedStudent}`);
      setStudentProgress(res.data); setCache(cacheKey, res.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const exportData = async (type) => {
    try {
      const params = { type };
      if (selectedClass) params.classId = selectedClass;
      const res = await API.get('/reports/export', { params });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch { toast.error('Export failed'); }
  };

  useEffect(() => { if (activeTab === 'class' && selectedClass) loadClassReport(); }, [selectedClass]);
  useEffect(() => { if (activeTab === 'student' && selectedStudent) loadStudentProgress(); }, [selectedStudent]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="subtitle">View summaries and export data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-glass" onClick={() => exportData('students')}><HiDownload /> Students</button>
          {selectedClass && <button className="btn btn-glass" onClick={() => exportData('grades')}><HiDownload /> Grades</button>}
          {selectedClass && <button className="btn btn-glass" onClick={() => exportData('attendance')}><HiDownload /> Attendance</button>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['class', 'student', 'attendance', 'analytics'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-glass'}`} onClick={() => setActiveTab(tab)}>
            {tab === 'class' ? 'Class Report' : tab === 'student' ? 'Student Progress' : tab === 'attendance' ? 'Attendance' : 'Grade Analytics'}
          </button>
        ))}
      </div>

      {/* Partial failure warnings */}
      {Object.entries(errors).map(([k, v]) => <div key={k} className="error-msg">{v} <button className="underline ml-2" onClick={loadClassReport}><HiRefresh className="inline" /> Retry</button></div>)}

      {loading && <div className="glass-card p-6"><div className="skeleton h-40 w-full" /></div>}

      {activeTab === 'class' && !loading && (
        <div className="space-y-6">
          <select className="form-control max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select a class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {report && (
            <>
              <div className="stats-grid">
                <div className="glass-card stat-card"><div className="stat-value">{report.class?.students?.length || 0}</div><div className="stat-label">Students</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{report.totalSchedules}</div><div className="stat-label">Total Sessions</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{report.completedSchedules}</div><div className="stat-label">Completed</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{report.totalGrades}</div><div className="stat-label">Assessments</div></div>
              </div>
              {report.studentSummaries?.length > 0 && (
                <div className="glass-card overflow-auto">
                  <div className="p-5 pb-0"><h3 className="font-bold">Student Performance</h3></div>
                  <table className="glass-table"><thead><tr><th>Student</th><th>Average</th><th>Assessments</th></tr></thead>
                    <tbody>
                      {report.studentSummaries.map((s, i) => (
                        <tr key={i}><td>{s.student?.firstName} {s.student?.lastName}</td>
                          <td><span className={`badge ${parseFloat(s.averagePercentage) >= 80 ? 'badge-success' : parseFloat(s.averagePercentage) >= 50 ? 'badge-warning' : 'badge-danger'}`}>{s.averagePercentage}%</span></td>
                          <td>{s.totalAssessments}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'student' && !loading && (
        <div className="space-y-6">
          <select className="form-control max-w-xs" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
            <option value="">Select a student</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
          </select>
          {studentProgress && (
            <>
              <div className="stats-grid">
                <div className="glass-card stat-card"><div className="stat-value">{studentProgress.attendanceSummary?.present || 0}</div><div className="stat-label">Present</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{studentProgress.attendanceSummary?.absent || 0}</div><div className="stat-label">Absent</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{studentProgress.attendanceSummary?.late || 0}</div><div className="stat-label">Late</div></div>
                <div className="glass-card stat-card"><div className="stat-value">{studentProgress.attendanceSummary?.total || 0}</div><div className="stat-label">Total</div></div>
              </div>
              {studentProgress.gradeProgress?.length > 0 && (
                <div className="glass-card overflow-auto">
                  <div className="p-5 pb-0"><h3 className="font-bold">Grade History</h3></div>
                  <table className="glass-table"><thead><tr><th>Date</th><th>Assessment</th><th>Class</th><th>Score</th><th>%</th></tr></thead>
                    <tbody>{studentProgress.gradeProgress.map((g, i) => (
                      <tr key={i}><td>{new Date(g.date).toLocaleDateString()}</td><td>{g.assessment}</td><td>{g.class || '-'}</td><td>{g.score}/{g.maxScore}</td>
                        <td><span className={`badge ${parseFloat(g.percentage) >= 80 ? 'badge-success' : parseFloat(g.percentage) >= 50 ? 'badge-warning' : 'badge-danger'}`}>{g.percentage}%</span></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'attendance' && !loading && (
        <div className="space-y-6">
          <select className="form-control max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select a class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {attendanceReport && (
            <div className="stats-grid">
              <div className="glass-card stat-card"><div className="stat-value">{attendanceReport.summary?.totalPresent || 0}</div><div className="stat-label">Present</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{attendanceReport.summary?.totalAbsent || 0}</div><div className="stat-label">Absent</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{attendanceReport.summary?.totalLate || 0}</div><div className="stat-label">Late</div></div>
              <div className="glass-card stat-card"><div className="stat-value">{attendanceReport.summary?.sessions || 0}</div><div className="stat-label">Sessions</div></div>
            </div>
          )}
        </div>
      )}

      {/* F4.5: Grade analytics from aggregation pipeline */}
      {activeTab === 'analytics' && !loading && (
        <div className="space-y-6">
          <button className="btn btn-primary" onClick={() => { setSelectedClass('_all'); loadClassReport(); }}>
            <HiRefresh /> Load Analytics
          </button>
          {gradeAnalytics && gradeAnalytics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeAnalytics.map((a, i) => (
                <div key={i} className="glass-card p-5">
                  <h4 className="font-semibold mb-3">{a.className || 'Unknown Class'}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Avg Score</span><span className="font-medium">{a.averageScore}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Max Score</span><span className="font-medium">{a.maxScore}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Min Score</span><span className="font-medium">{a.minScore}</span></div>
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Avg %</span>
                      <span className={`badge ${a.avgPercentage >= 80 ? 'badge-success' : a.avgPercentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>{a.avgPercentage}%</span>
                    </div>
                    <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Assessments</span><span className="font-medium">{a.totalAssessments}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
