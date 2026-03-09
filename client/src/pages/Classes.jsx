import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { HiPlus, HiPencil, HiTrash, HiEye } from 'react-icons/hi';

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', subject: 'Physics', description: '', level: '', room: '', capacity: 30, students: [] });
  const [error, setError] = useState('');

  const fetchClasses = () => API.get('/classes').then(res => setClasses(res.data)).catch(() => {});
  const fetchStudents = () => API.get('/students').then(res => setStudents(res.data.students || [])).catch(() => {});
  useEffect(() => { fetchClasses(); fetchStudents(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', subject: 'Physics', description: '', level: '', room: '', capacity: 30, students: [] }); setError(''); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, subject: c.subject || 'Physics', description: c.description || '', level: c.level || '', room: c.room || '', capacity: c.capacity || 30, students: c.students?.map(s => s._id || s) || [] });
    setError(''); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) await API.put(`/classes/${editing._id}`, form);
      else await API.post('/classes', form);
      toast.success(editing ? 'Class updated' : 'Class created');
      setShowModal(false); fetchClasses();
    } catch (err) { setError(err.response?.data?.message || 'Error saving class'); }
  };

  // F6.4: Optimistic UI delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    const prev = [...classes];
    setClasses(c => c.filter(x => x._id !== id)); // optimistic
    try {
      await API.delete(`/classes/${id}`);
      toast.success('Class deleted');
    } catch {
      setClasses(prev); // rollback
      toast.error('Failed to delete, rolled back');
    }
  };

  // F6.4: Optimistic status toggle
  const toggleStatus = async (c) => {
    const newStatus = c.status === 'active' ? 'inactive' : 'active';
    const prev = [...classes];
    setClasses(cls => cls.map(x => x._id === c._id ? { ...x, status: newStatus } : x)); // optimistic
    try {
      await API.put(`/classes/${c._id}`, { status: newStatus });
      toast.success(`Class ${newStatus}`);
    } catch {
      setClasses(prev); // rollback
      toast.error('Failed to update, rolled back');
    }
  };

  const toggleStudent = (sid) => setForm(f => ({ ...f, students: f.students.includes(sid) ? f.students.filter(id => id !== sid) : [...f.students, sid] }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Classes</h2>
          <p className="subtitle">Manage your physics classes</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><HiPlus /> New Class</button>
      </div>

      {classes.length === 0 ? (
        <div className="glass-card empty-state">
          <div className="empty-icon">📚</div>
          <h3 className="font-semibold">No classes yet</h3>
          <p className="text-[var(--text-secondary)] text-sm">Create your first class to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c._id} className="glass-card p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{c.subject} {c.level ? `• ${c.level}` : ''}</p>
                </div>
                <button onClick={() => toggleStatus(c)} className="cursor-pointer">
                  <span className={`badge badge-${c.status === 'active' ? 'success' : c.status === 'completed' ? 'info' : 'warning'}`}>{c.status}</span>
                </button>
              </div>
              {c.room && <p className="text-xs text-[var(--text-secondary)] mb-2">Room: {c.room}</p>}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[var(--text-secondary)]">{c.students?.length || 0} / {c.capacity} students</span>
                <div className="progress-bar w-24">
                  <div className="progress-bar-fill" style={{ width: `${((c.students?.length || 0) / c.capacity) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-glass btn-sm" onClick={() => navigate(`/classes/${c._id}`)}><HiEye /> View</button>
                <button className="btn btn-glass btn-sm" onClick={() => openEdit(c)}><HiPencil /></button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}><HiTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">{showDetail.name}</h3><button className="btn btn-glass btn-sm" onClick={() => setShowDetail(null)}>✕</button></div>
            <div className="modal-body space-y-2">
              <p><strong>Subject:</strong> {showDetail.subject}</p>
              <p><strong>Level:</strong> {showDetail.level || '-'}</p>
              <p><strong>Room:</strong> {showDetail.room || '-'}</p>
              <p><strong>Status:</strong> {showDetail.status}</p>
              <p className="mb-4"><strong>Description:</strong> {showDetail.description || '-'}</p>
              <h4 className="font-semibold mb-2">Students ({showDetail.students?.length || 0})</h4>
              {showDetail.students?.length > 0 ? (
                <div className="space-y-1">
                  {showDetail.students.map(s => (
                    <div key={s._id || s} className="glass-card p-2 px-3 text-sm">{s.firstName} {s.lastName} ({s.studentId})</div>
                  ))}
                </div>
              ) : <p className="text-[var(--text-secondary)] text-sm">No students enrolled</p>}
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="font-bold">{editing ? 'Edit Class' : 'New Class'}</h3><button className="btn btn-glass btn-sm" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-group"><label className="form-label">Class Name</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Physics M.4/1" /></div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Subject</label><input className="form-control" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Level</label><input className="form-control" value={form.level} onChange={e => setForm({...form, level: e.target.value})} /></div>
                </div>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Room</label><input className="form-control" value={form.room} onChange={e => setForm({...form, room: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Capacity</label><input type="number" className="form-control" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 30})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Enrolled Students ({form.students.length})</label>
                  <div className="max-h-48 overflow-y-auto border border-[var(--glass-border)] rounded-xl p-2">
                    {students.map(s => (
                      <label key={s._id} className="flex items-center gap-2.5 p-2 cursor-pointer rounded-lg hover:bg-[var(--glass-hover)] transition-all">
                        <input type="checkbox" checked={form.students.includes(s._id)} onChange={() => toggleStudent(s._id)} className="accent-[var(--primary)]" />
                        <span className="text-sm">{s.firstName} {s.lastName} ({s.studentId})</span>
                      </label>
                    ))}
                    {students.length === 0 && <p className="text-[var(--text-secondary)] p-2 text-sm">No students available</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-glass" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create Class'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
