import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineChartBar, HiOutlineClipboardCheck } from 'react-icons/hi';

// F2.2: useParams for dynamic route + useNavigate for back navigation
export default function TutorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    API.get(`/admin/tutors/${id}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load tutor data'); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-32" />
        <div className="skeleton h-40 w-full" />
        <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="glass-card skeleton h-28" />)}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-10 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-lg font-bold mb-2">Tutor Not Found</h3>
        <p className="text-[var(--text-secondary)] mb-4">This tutor doesn't exist or has been removed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/tutors')}><HiArrowLeft /> Back to Tutors</button>
      </div>
    );
  }

  const { tutor, stats, students, classes, recentSchedules, recentGrades } = data;
  const attendanceRate = stats.attendance.totalRecords > 0
    ? ((stats.attendance.totalPresent / stats.attendance.totalRecords) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* F2.2: useNavigate back button */}
      <button className="btn btn-glass" onClick={() => navigate('/admin/tutors')}>
        <HiArrowLeft /> Back to Tutors
      </button>

      {/* Tutor header */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ background: `hsl(${tutor.name.charCodeAt(0) * 37 % 360}, 60%, 50%)`, color: '#fff' }}>
          {tutor.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{tutor.name}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{tutor.email}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Joined: {new Date(tutor.createdAt).toLocaleDateString()}</p>
        </div>
        <span className="badge badge-primary">Tutor</span>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <HiOutlineUserGroup className="text-2xl text-blue-400 mb-2" />
          <div className="stat-value">{stats.studentCount}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="glass-card stat-card">
          <HiOutlineAcademicCap className="text-2xl text-purple-400 mb-2" />
          <div className="stat-value">{stats.classCount}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="glass-card stat-card">
          <HiOutlineChartBar className="text-2xl text-green-400 mb-2" />
          <div className="stat-value">{stats.avgGrade}%</div>
          <div className="stat-label">Avg Grade</div>
        </div>
        <div className="glass-card stat-card">
          <HiOutlineClipboardCheck className="text-2xl text-orange-400 mb-2" />
          <div className="stat-value">{attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {['overview', 'students', 'classes', 'schedules', 'grades'].map(tab => (
          <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-glass'}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <h3 className="font-bold mb-3">Attendance Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Present', value: stats.attendance.totalPresent, color: 'bg-green-500' },
                { label: 'Absent', value: stats.attendance.totalAbsent, color: 'bg-red-500' },
                { label: 'Late', value: stats.attendance.totalLate, color: 'bg-yellow-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm w-16">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${stats.attendance.totalRecords > 0 ? (item.value / stats.attendance.totalRecords) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-bold mb-3">Grade Distribution</h3>
            <div className="text-center py-4">
              <div className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>{stats.avgGrade}%</div>
              <div className="text-sm text-[var(--text-secondary)]">Average across {stats.totalGrades} grades</div>
            </div>
          </div>
        </div>
      )}

      {/* Students tab */}
      {activeTab === 'students' && (
        <div className="glass-card overflow-hidden">
          {students.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">No students registered</div>
          ) : (
            <table className="glass-table">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td className="font-mono text-xs">{s.studentId}</td>
                    <td className="font-medium">{s.firstName} {s.lastName}</td>
                    <td className="text-sm text-[var(--text-secondary)]">{s.email || '—'}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'success' : 'warning'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Classes tab */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--text-secondary)] col-span-full">No classes</div>
          ) : (
            classes.map(c => (
              <div key={c._id} className="glass-card p-5">
                <h4 className="font-bold">{c.name}</h4>
                <p className="text-sm text-[var(--text-secondary)]">{c.subject}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`badge badge-${c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'warning'}`}>{c.status}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{c.students?.length || 0} / {c.capacity} students</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedules tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-3">
          {recentSchedules.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--text-secondary)]">No schedules</div>
          ) : (
            recentSchedules.map(s => (
              <div key={s._id} className="glass-card p-4 flex items-center gap-4">
                <div className="text-center min-w-[60px]">
                  <div className="text-sm font-bold">{new Date(s.date).toLocaleDateString()}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{s.startTime} - {s.endTime}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.classId?.name || 'Class'}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{s.topic || s.classId?.subject || ''}</div>
                </div>
                <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'primary'}`}>{s.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Grades tab */}
      {activeTab === 'grades' && (
        <div className="glass-card overflow-hidden">
          {recentGrades.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">No grades recorded</div>
          ) : (
            <table className="glass-table">
              <thead><tr><th>Student</th><th>Class</th><th>Type</th><th>Score</th><th>Percentage</th></tr></thead>
              <tbody>
                {recentGrades.map(g => {
                  const pct = ((g.score / g.maxScore) * 100).toFixed(1);
                  return (
                    <tr key={g._id}>
                      <td className="font-medium">{g.student?.firstName} {g.student?.lastName}</td>
                      <td className="text-sm">{g.classId?.name || '—'}</td>
                      <td><span className="badge badge-info">{g.assessmentType}</span></td>
                      <td>{g.score}/{g.maxScore}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444' }} />
                          </div>
                          <span className="text-xs font-bold w-12 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
