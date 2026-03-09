import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import useAuthStore from '../stores/useAuthStore';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineEye, HiSearch } from 'react-icons/hi';

// F2.2: useNavigate for programmatic navigation
export default function AdminTutors() {
  const navigate = useNavigate();
  const setViewingTutor = useAuthStore(s => s.setViewingTutor);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/admin/tutors')
      .then(res => { setTutors(res.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load tutors'); setLoading(false); });
  }, []);

  const filtered = tutors.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-16 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass-card skeleton h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Tutor Management</h2>
          <p className="subtitle">Admin Panel — View and monitor all tutors' performance</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input className="form-control pl-9" placeholder="Search tutors by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="glass-card p-4 flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          Total Tutors: <strong>{tutors.length}</strong>
        </span>
        <span className="badge badge-primary">{filtered.length} shown</span>
      </div>

      {/* Tutor grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="text-5xl mb-3 opacity-50">👨‍🏫</div>
          <p className="text-[var(--text-secondary)]">No tutors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tutor => (
            <div key={tutor._id} className="glass-card p-6 hover:border-[var(--primary)] transition-all cursor-pointer"
              onClick={() => { setViewingTutor(tutor._id, tutor.name); navigate('/dashboard'); }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `hsl(${tutor.name.charCodeAt(0) * 37 % 360}, 60%, 50%)`, color: '#fff' }}>
                  {tutor.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">{tutor.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{tutor.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
                  <HiOutlineUserGroup className="mx-auto text-blue-400 mb-1" />
                  <div className="text-lg font-bold">{tutor.studentCount}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Students</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
                  <HiOutlineAcademicCap className="mx-auto text-purple-400 mb-1" />
                  <div className="text-lg font-bold">{tutor.classCount}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Classes</div>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--glass-bg)' }}>
                  <HiOutlineCalendar className="mx-auto text-green-400 mb-1" />
                  <div className="text-lg font-bold">{tutor.scheduleCount}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">Sessions</div>
                </div>
              </div>

              <button className="btn btn-glass w-full text-sm" onClick={(e) => { e.stopPropagation(); setViewingTutor(tutor._id, tutor.name); navigate('/dashboard'); }}>
                <HiOutlineEye /> View as Tutor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
