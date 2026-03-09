// F2.4: Parent route for /classes/:id — uses <Outlet> for nested routes
import { useEffect, useState } from 'react';
import { useParams, NavLink, Outlet, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiClipboardCheck, HiUserGroup, HiInformationCircle } from 'react-icons/hi';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/classes/${id}`)
      .then(res => setCls(res.data))
      .catch(() => toast.error('Failed to load class'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 skeleton rounded w-1/3" />
      <div className="glass-card h-32 skeleton rounded-xl" />
    </div>
  );

  if (!cls) return (
    <div className="glass-card p-8 text-center">
      <p className="text-[var(--text-secondary)]">Class not found.</p>
      <button className="btn btn-primary mt-4" onClick={() => navigate('/classes')}>Back to Classes</button>
    </div>
  );

  const tabClass = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-[var(--primary)] text-[var(--primary)]'
        : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="btn btn-glass p-2" onClick={() => navigate('/classes')}>
          <HiArrowLeft className="text-lg" />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{cls.name}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{cls.subject} · {cls.category} · {cls.level || 'All levels'}</p>
        </div>
        <span className={`ml-auto px-3 py-1 text-xs rounded-full font-semibold
          ${cls.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {cls.status}
        </span>
      </div>

      {/* Class summary card */}
      <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xl font-bold">{cls.students?.length ?? 0}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Students</div>
        </div>
        <div>
          <div className="text-xl font-bold">{cls.capacity}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Capacity</div>
        </div>
        <div>
          <div className="text-xl font-bold">{cls.room || '—'}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Room</div>
        </div>
        <div>
          <div className="text-xl font-bold">{cls.category}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Category</div>
        </div>
      </div>

      {/* F2.4: Nested route tab navigation */}
      <div className="border-b border-[var(--glass-border)] flex gap-1">
        <NavLink to={`/classes/${id}`} end className={tabClass}>
          <span className="flex items-center gap-1"><HiInformationCircle />Overview</span>
        </NavLink>
        <NavLink to={`/classes/${id}/attendance`} className={tabClass}>
          <span className="flex items-center gap-1"><HiClipboardCheck />Attendance</span>
        </NavLink>
        <NavLink to={`/classes/${id}/students`} className={tabClass}>
          <span className="flex items-center gap-1"><HiUserGroup />Students</span>
        </NavLink>
      </div>

      {/* F2.4: Outlet renders the matched child route */}
      <Outlet context={{ cls }} />
    </div>
  );
}
