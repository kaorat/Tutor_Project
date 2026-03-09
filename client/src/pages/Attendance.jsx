import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import useSyncStore from '../stores/useSyncStore';
import { HiClipboardCheck, HiTrash } from 'react-icons/hi';

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showTake, setShowTake] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const addToQueue = useSyncStore(s => s.addToQueue);

  const fetchAttendances = () => API.get('/attendance', { params: filterClass ? { classId: filterClass } : {} }).then(res => setAttendances(res.data)).catch(() => {});
  const fetchSchedules = () => API.get('/schedules').then(res => setSchedules(res.data.filter(s => s.status !== 'cancelled'))).catch(() => {});
  const fetchClasses = () => API.get('/classes').then(res => setClasses(res.data)).catch(() => {});

  useEffect(() => { fetchAttendances(); fetchSchedules(); fetchClasses(); }, []);
  useEffect(() => { fetchAttendances(); }, [filterClass]);

  const startTakeAttendance = async (schedule) => {
    setSelectedSchedule(schedule);
    const classId = schedule.classId?._id || schedule.classId;
    try {
      const res = await API.get(`/classes/${classId}`);
      const students = res.data.students || [];
      setClassStudents(students);
      const existing = attendances.find(a => (a.schedule?._id || a.schedule) === schedule._id);
      if (existing) {
        setRecords(students.map(s => {
          const rec = existing.records?.find(r => (r.student?._id || r.student) === s._id);
          return { student: s._id, status: rec?.status || 'present', note: rec?.note || '' };
        }));
      } else {
        setRecords(students.map(s => ({ student: s._id, status: 'present', note: '' })));
      }
      setShowTake(true);
    } catch { /* */ }
  };

  const updateStatus = (studentId, status) => setRecords(prev => prev.map(r => r.student === studentId ? { ...r, status } : r));

  const saveAttendance = async () => {
    if (!selectedSchedule) return;
    const classId = selectedSchedule.classId?._id || selectedSchedule.classId;
    const payload = { schedule: selectedSchedule._id, classId, date: selectedSchedule.date, records };
    // F7.5: Offline queue — if no network, queue for later sync
    if (!navigator.onLine) {
      addToQueue({ method: 'post', url: '/attendance', data: payload });
      toast.success('Saved offline — will sync when back online');
      setShowTake(false);
      return;
    }
    try {
      await API.post('/attendance', payload);
      toast.success('Attendance saved');
      setShowTake(false); fetchAttendances();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try { await API.delete(`/attendance/${id}`); toast.success('Deleted'); fetchAttendances(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="subtitle">Track student attendance</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="form-control max-w-[250px]" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <h3 className="text-lg font-semibold">Take Attendance</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {schedules.map(s => (
          <div key={s._id} className="glass-card p-4 cursor-pointer hover:border-[var(--primary)]/40 transition-all" onClick={() => startTakeAttendance(s)}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-semibold">{s.classId?.name}</h4>
                <p className="text-xs text-[var(--text-secondary)]">{new Date(s.date).toLocaleDateString()} • {s.startTime} - {s.endTime}</p>
                {s.topic && <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.topic}</p>}
              </div>
              <HiClipboardCheck className="text-2xl text-[var(--primary)]" />
            </div>
          </div>
        ))}
        {schedules.length === 0 && <div className="glass-card p-8 text-center text-[var(--text-secondary)]">No schedules available</div>}
      </div>

      <h3 className="text-lg font-semibold">Attendance Records</h3>
      <div className="glass-card overflow-auto">
        {attendances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="font-semibold">No attendance records</h3>
            <p className="text-sm text-[var(--text-secondary)]">Take attendance from a schedule above</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead><tr><th>Date</th><th>Class</th><th>Time</th><th>Present</th><th>Absent</th><th>Late</th><th>Actions</th></tr></thead>
            <tbody>
              {attendances.map(a => {
                const present = a.records?.filter(r => r.status === 'present').length || 0;
                const absent = a.records?.filter(r => r.status === 'absent').length || 0;
                const late = a.records?.filter(r => r.status === 'late').length || 0;
                return (
                  <tr key={a._id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.classId?.name || '-'}</td>
                    <td>{a.schedule?.startTime || '-'} - {a.schedule?.endTime || '-'}</td>
                    <td><span className="badge badge-success">{present}</span></td>
                    <td><span className="badge badge-danger">{absent}</span></td>
                    <td><span className="badge badge-warning">{late}</span></td>
                    <td className="actions-cell">
                      <button className="btn btn-glass btn-sm" onClick={() => startTakeAttendance({ _id: a.schedule?._id || a.schedule, classId: a.classId, date: a.date, startTime: a.schedule?.startTime, endTime: a.schedule?.endTime })}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)}><HiTrash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showTake && (
        <div className="modal-overlay" onClick={() => setShowTake(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">Take Attendance</h3><button className="btn btn-glass btn-sm" onClick={() => setShowTake(false)}>✕</button></div>
            <div className="modal-body">
              <p className="mb-4 text-[var(--text-secondary)] text-sm">
                {selectedSchedule?.classId?.name} • {new Date(selectedSchedule?.date).toLocaleDateString()}
              </p>
              {classStudents.length === 0 ? (
                <p className="text-[var(--text-secondary)]">No students in this class</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map(s => {
                    const rec = records.find(r => r.student === s._id);
                    const status = rec?.status || 'present';
                    return (
                      <div key={s._id} className="attendance-row">
                        <span className="student-name">{s.firstName} {s.lastName}</span>
                        <div className="attendance-status-group">
                          {['present', 'absent', 'late', 'excused'].map(st => (
                            <button key={st} type="button"
                              className={`status-btn ${status === st ? `selected-${st}` : ''}`}
                              onClick={() => updateStatus(s._id, st)}>
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-glass" onClick={() => setShowTake(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAttendance}>Save Attendance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
