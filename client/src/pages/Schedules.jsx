import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { HiPlus, HiPencil, HiTrash, HiEye } from 'react-icons/hi';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  // F7.3: useSearchParams for view/classId state
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'today';
  const filterClassId = searchParams.get('classId') || '';
  const [form, setForm] = useState({ classId: '', date: '', startTime: '', endTime: '', topic: '', description: '', status: 'scheduled', repeat: '', repeatUntil: '' });
  const [error, setError] = useState('');
  const [viewDetail, setViewDetail] = useState(null);

  const fetchSchedules = () => {
    const params = {};
    if (filterClassId) params.classId = filterClassId;
    API.get('/schedules', { params }).then(res => setSchedules(res.data)).catch(() => {});
    API.get('/schedules/today').then(res => setTodaySchedules(res.data)).catch(() => {});
  };
  const fetchClasses = () => API.get('/classes').then(res => setClasses(res.data)).catch(() => {});

  useEffect(() => { fetchSchedules(); fetchClasses(); }, [filterClassId]);

  const setView = (v) => { const p = new URLSearchParams(searchParams); p.set('view', v); setSearchParams(p); };
  const setFilterClass = (id) => { const p = new URLSearchParams(searchParams); if (id) p.set('classId', id); else p.delete('classId'); setSearchParams(p); };

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditing(null);
    setForm({ classId: filterClassId || classes[0]?._id || '', date: today, startTime: '09:00', endTime: '10:00', topic: '', description: '', status: 'scheduled', repeat: '', repeatUntil: '' });
    setError(''); setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ classId: s.classId?._id || s.classId, date: new Date(s.date).toISOString().split('T')[0], startTime: s.startTime, endTime: s.endTime, topic: s.topic || '', description: s.description || '', status: s.status, repeat: '', repeatUntil: '' });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await API.put(`/schedules/${editing._id}`, form);
        toast.success('Schedule updated');
      } else {
        const res = await API.post('/schedules', form);
        const count = Array.isArray(res.data) ? res.data.length : 1;
        toast.success(count > 1 ? `${count} weekly schedules created` : 'Schedule created');
      }
      setShowModal(false); fetchSchedules();
    } catch (err) { setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try { await API.delete(`/schedules/${id}`); toast.success('Deleted'); fetchSchedules(); }
    catch { toast.error('Failed to delete'); }
  };

  const openDetail = async (id) => {
    try {
      const res = await API.get(`/schedules/${id}`);
      setViewDetail(res.data);
    } catch { toast.error('Failed to load details'); }
  };

  const displayList = view === 'today' ? todaySchedules : schedules;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="subtitle">Manage class schedules</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><HiPlus /> New Schedule</button>
      </div>

      {/* F7.3: Navigation with params */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          <button className={`btn ${view === 'today' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('today')}>Today</button>
          <button className={`btn ${view === 'all' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('all')}>All</button>
        </div>
        <select className="form-control max-w-[200px]" value={filterClassId} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {displayList.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">📅</div>
          <h3 className="font-semibold">{view === 'today' ? 'No classes today' : 'No schedules yet'}</h3>
          <p className="text-sm text-[var(--text-secondary)]">Create a schedule to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(s => (
            <div key={s._id} className="glass-card schedule-card">
              <div className="time-block">
                <div className="time">{s.startTime}</div>
                <div className="label">Start</div>
              </div>
              <div className="divider" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{s.classId?.name || 'Class'}</h4>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {s.topic || 'No topic'} • {new Date(s.date).toLocaleDateString()}
                  {s.classId?.room ? ` • Room ${s.classId.room}` : ''}
                </p>
              </div>
              <div className="time-block">
                <div className="time">{s.endTime}</div>
                <div className="label">End</div>
              </div>
              <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'primary'}`}>{s.status}</span>
              <div className="actions-cell">
                <button className="btn btn-glass btn-sm" onClick={() => openDetail(s._id)} title="View"><HiEye /></button>
                <button className="btn btn-glass btn-sm" onClick={() => openEdit(s)}><HiPencil /></button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}><HiTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">{editing ? 'Edit Schedule' : 'New Schedule'}</h3><button className="btn btn-glass btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group"><label className="form-label">Class</label>
                  <select className="form-control" value={form.classId} onChange={e => setForm({...form, classId: e.target.value})} required>
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label flex items-center gap-2">
                      <input type="checkbox" checked={form.repeat === 'weekly'} onChange={e => setForm({...form, repeat: e.target.checked ? 'weekly' : '', repeatUntil: e.target.checked ? form.repeatUntil : ''})} />
                      Repeat weekly
                    </label>
                    {form.repeat === 'weekly' && (
                      <input type="date" className="form-control mt-2" value={form.repeatUntil} onChange={e => setForm({...form, repeatUntil: e.target.value})} placeholder="Repeat until" min={form.date} required />
                    )}
                  </div>
                )}
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Start Time</label><input type="time" className="form-control" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">End Time</label><input type="time" className="form-control" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Topic</label><input className="form-control" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="e.g. Newton's Laws" /></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F4.3: Schedule detail modal */}
      {viewDetail && (
        <div className="modal-overlay" onClick={() => setViewDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">Schedule Details</h3>
              <button className="btn btn-glass btn-sm" onClick={() => setViewDetail(null)}>✕</button>
            </div>
            <div className="modal-body space-y-4">
              <div><p className="text-xs text-[var(--text-tertiary)]">Class</p><p className="font-semibold">{viewDetail.classId?.name || '-'}</p></div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">Subject</p><p>{viewDetail.classId?.subject || '-'}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">Room</p><p>{viewDetail.classId?.room || '-'}</p></div>
              </div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">Date</p><p>{new Date(viewDetail.date).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">Status</p><span className={`badge badge-${viewDetail.status === 'completed' ? 'success' : viewDetail.status === 'cancelled' ? 'danger' : 'primary'}`}>{viewDetail.status}</span></div>
              </div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">Start Time</p><p className="font-medium">{viewDetail.startTime}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">End Time</p><p className="font-medium">{viewDetail.endTime}</p></div>
              </div>
              {viewDetail.topic && <div><p className="text-xs text-[var(--text-tertiary)]">Topic</p><p>{viewDetail.topic}</p></div>}
              {viewDetail.description && <div><p className="text-xs text-[var(--text-tertiary)]">Description</p><p className="text-sm">{viewDetail.description}</p></div>}
              {viewDetail.classId?.students?.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Students ({viewDetail.classId.students.length})</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {viewDetail.classId.students.map(st => (
                      <div key={st._id} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
                        {st.firstName} {st.lastName} <span className="text-[var(--text-tertiary)]">({st.studentId || '-'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-glass" onClick={() => setViewDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
