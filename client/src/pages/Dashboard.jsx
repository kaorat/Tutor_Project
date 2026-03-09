import { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/useAuthStore';
import { HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineClipboardCheck, HiOutlineTrendingUp, HiOutlineStar, HiOutlineLightningBolt } from 'react-icons/hi';

// F1.1: Dynamic rank based on XP with Math.random()
const getRank = (xp) => {
  if (xp >= 1000) return { name: 'Diamond', color: '#B9F2FF', emoji: '💎' };
  if (xp >= 500) return { name: 'Gold', color: '#FFD700', emoji: '🥇' };
  if (xp >= 200) return { name: 'Silver', color: '#C0C0C0', emoji: '🥈' };
  return { name: 'Bronze', color: '#CD7F32', emoji: '🥉' };
};

// F1.1: Child component receiving props — demonstrates React props & component composition
function RankBadge({ xp }) {
  const rank = getRank(xp);
  const nextThreshold = xp >= 1000 ? null : xp >= 500 ? 1000 : xp >= 200 ? 500 : 200;
  const progress = nextThreshold ? Math.min(100, xp >= 500 ? ((xp-500)/500)*100 : xp >= 200 ? ((xp-200)/300)*100 : (xp/200)*100) : 100;

  return (
    <div className="glass-card p-4 flex items-center gap-4 flex-1">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--glass-border)]" style={{ background: `${rank.color}15` }}>
        <span className="text-2xl">{rank.emoji}</span>
        <div>
          <span className="font-bold text-sm" style={{ color: rank.color }}>{rank.name}</span>
          <div className="text-[10px] text-[var(--text-tertiary)]">{xp} XP</div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
          <span>Next rank</span>
          <span>{xp} / {nextThreshold || '∞'}</span>
        </div>
        <div className="progress-bar h-2">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: rank.color }} />
        </div>
      </div>
    </div>
  );
}

// F1.1: Student XP card — child component
function StudentXpCard({ student, onAwardXp }) {
  const rank = getRank(student.xp || 0);
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `${rank.color}20`, color: rank.color }}>
        {rank.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{student.firstName} {student.lastName}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{student.xp || 0} XP • {rank.name}</div>
      </div>
      <button
        onClick={() => onAwardXp(student)}
        className="btn btn-sm btn-glass flex items-center gap-1"
        title="Award XP"
      >
        <HiOutlineStar className="text-yellow-400" /> +XP
      </button>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [showAwardModal, setShowAwardModal] = useState(null);
  const [xpAmount, setXpAmount] = useState(10);
  const [xpReason, setXpReason] = useState('');
  const [awardMsg, setAwardMsg] = useState('');

  useEffect(() => {
    Promise.allSettled([
      API.get('/reports/overview'),
      API.get('/students/leaderboard/xp'),
      API.get('/students'),
    ]).then(([overview, lb, studs]) => {
      if (overview.status === 'fulfilled') setData(overview.value.data);
      if (lb.status === 'fulfilled') setLeaderboard(lb.value.data);
      if (studs.status === 'fulfilled') setAllStudents(studs.value.data.students || []);
      setLoading(false);
    });
  }, []);

  const awardXp = async () => {
    if (!showAwardModal || !xpReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      const res = await API.post(`/students/${showAwardModal._id}/xp`, { amount: xpAmount, reason: xpReason });
      const updated = res.data.student;
      setAllStudents(prev => prev.map(s => s._id === updated._id ? { ...s, xp: updated.xp } : s));
      setLeaderboard(prev => {
        const newList = prev.map(s => s._id === updated._id ? { ...s, xp: updated.xp } : s);
        if (!newList.find(s => s._id === updated._id)) newList.push({ _id: updated._id, firstName: updated.firstName, lastName: updated.lastName, xp: updated.xp });
        return newList.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);
      });
      const rank = getRank(updated.xp);
      setAwardMsg(`+${xpAmount} XP to ${updated.firstName}! Now ${rank.name} ${rank.emoji}`);
      setTimeout(() => setAwardMsg(''), 4000);
      setShowAwardModal(null); setXpReason(''); setXpAmount(10);
      toast.success(`+${xpAmount} XP awarded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to award XP');
    }
  };

  // Quick award presets
  const XP_PRESETS = [
    { label: 'Great Answer', amount: 10, icon: '💡' },
    { label: 'Homework Done', amount: 15, icon: '📝' },
    { label: 'Lab Excellence', amount: 25, icon: '🔬' },
    { label: 'Exam Top Score', amount: 50, icon: '🏆' },
    { label: 'Helping Others', amount: 20, icon: '🤝' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 w-full" />
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="glass-card skeleton h-32" />)}
        </div>
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  if (!data) return <div className="glass-card p-10 text-center">Failed to load data</div>;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Here's what's happening today</p>
        </div>
      </div>

      {awardMsg && (
        <div className="success-msg text-center font-medium animate-pulse flex items-center justify-center gap-2">
          <HiOutlineLightningBolt className="text-yellow-400" /> {awardMsg}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: 'rgba(0,122,255,0.15)', color: 'var(--primary)' }}>
            <HiOutlineUserGroup />
          </div>
          <div className="stat-value">{data.activeStudents}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="glass-card stat-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: 'rgba(175,82,222,0.15)', color: 'var(--accent)' }}>
            <HiOutlineAcademicCap />
          </div>
          <div className="stat-value">{data.activeClasses}</div>
          <div className="stat-label">Active Classes</div>
        </div>
        <div className="glass-card stat-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: 'rgba(52,199,89,0.15)', color: 'var(--success)' }}>
            <HiOutlineCalendar />
          </div>
          <div className="stat-value">{data.todaySchedules}</div>
          <div className="stat-label">Today's Classes</div>
        </div>
        <div className="glass-card stat-card">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ background: 'rgba(255,149,0,0.15)', color: 'var(--warning)' }}>
            <HiOutlineClipboardCheck />
          </div>
          <div className="stat-value">{data.totalSchedules}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
      </div>

      {/* XP Leaderboard + Award Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <HiOutlineTrendingUp className="text-yellow-400" /> Student XP Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="glass-card p-6 text-center text-[var(--text-secondary)]">
                <div className="text-3xl mb-2">🏆</div>
                No students yet — add students and award XP!
              </div>
            ) : leaderboard.map((s, i) => {
              const rank = getRank(s.xp || 0);
              return (
                <div key={s._id} className="glass-card p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-400/20 text-orange-400' : 'bg-[var(--glass-bg)] text-[var(--text-tertiary)]'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.firstName} {s.lastName}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">{s.studentId}</div>
                  </div>
                  <RankBadge xp={s.xp || 0} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Award XP */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <HiOutlineStar className="text-yellow-400" /> Award XP to Students
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allStudents.length === 0 ? (
              <div className="glass-card p-6 text-center text-[var(--text-secondary)]">No students found</div>
            ) : allStudents.map(s => (
              <StudentXpCard key={s._id} student={s} onAwardXp={setShowAwardModal} />
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <h3 className="text-lg font-bold">Today's Schedule</h3>
      {data.todayClasses.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <div className="text-5xl mb-3 opacity-50">📅</div>
          <h3 className="text-[var(--text-secondary)] font-medium">No classes scheduled for today</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {data.todayClasses.map(s => (
            <div key={s._id} className="glass-card schedule-card">
              <div className="time-block">
                <div className="time">{s.startTime}</div>
                <div className="label">Start</div>
              </div>
              <div className="divider" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{s.classId?.name || 'Class'}</h4>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {s.topic || s.classId?.subject || 'Physics'} {s.classId?.room ? `• Room ${s.classId.room}` : ''}
                </p>
              </div>
              <div className="time-block">
                <div className="time">{s.endTime}</div>
                <div className="label">End</div>
              </div>
              <span className={`badge badge-${s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'primary'}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Award XP Modal */}
      {showAwardModal && (
        <div className="modal-overlay" onClick={() => setShowAwardModal(null)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold flex items-center gap-2">
                <HiOutlineStar className="text-yellow-400" />
                Award XP to {showAwardModal.firstName} {showAwardModal.lastName}
              </h3>
              <button className="btn btn-glass btn-sm" onClick={() => setShowAwardModal(null)}>✕</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="flex items-center gap-3 glass-card p-3">
                <div className="text-2xl">{getRank(showAwardModal.xp || 0).emoji}</div>
                <div>
                  <div className="font-medium">{showAwardModal.firstName} {showAwardModal.lastName}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">Current: {showAwardModal.xp || 0} XP • {getRank(showAwardModal.xp || 0).name}</div>
                </div>
              </div>

              {/* Quick presets */}
              <div>
                <label className="form-label">Quick Award</label>
                <div className="grid grid-cols-2 gap-2">
                  {XP_PRESETS.map(p => (
                    <button key={p.label}
                      className={`glass-card p-2 text-left text-sm cursor-pointer transition-all hover:border-[var(--primary)]/40 ${xpAmount === p.amount && xpReason === p.label ? 'border-[var(--primary)] bg-[var(--primary)]/10' : ''}`}
                      onClick={() => { setXpAmount(p.amount); setXpReason(p.label); }}
                    >
                      <span className="mr-1">{p.icon}</span> {p.label}
                      <span className="text-xs text-[var(--text-tertiary)] ml-1">+{p.amount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">XP Amount</label>
                  <input type="number" className="form-control" min={1} max={500} value={xpAmount} onChange={e => setXpAmount(Math.max(1, Math.min(500, +e.target.value)))} />
                </div>
                <div className="form-group">
                  <label className="form-label">After Award</label>
                  <div className="form-control flex items-center gap-1 text-sm" style={{ background: 'var(--glass-bg)' }}>
                    {getRank((showAwardModal.xp || 0) + xpAmount).emoji} {(showAwardModal.xp || 0) + xpAmount} XP
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <input className="form-control" placeholder="e.g. Great lab work on wave optics" value={xpReason} onChange={e => setXpReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-glass" onClick={() => setShowAwardModal(null)}>Cancel</button>
              <button className="btn btn-primary flex items-center gap-2" onClick={awardXp}>
                <HiOutlineLightningBolt /> Award +{xpAmount} XP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
