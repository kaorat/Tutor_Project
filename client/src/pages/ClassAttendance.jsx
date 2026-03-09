// F2.4: Nested route — /classes/:id/attendance
import { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiClipboardCheck } from 'react-icons/hi';

export default function ClassAttendance() {
  const { id } = useParams();
  const { cls } = useOutletContext();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/attendance', { params: { classId: id } })
      .then(res => setAttendances(res.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="glass-card p-6 skeleton h-48 rounded-xl animate-pulse" />;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <HiClipboardCheck className="text-[var(--primary)] text-xl" />
        <h4 className="font-semibold">Attendance Records — {cls?.name}</h4>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">{attendances.length} sessions</span>
      </div>

      {attendances.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] py-8">No attendance records yet for this class.</p>
      ) : (
        <div className="space-y-3">
          {attendances.map(att => {
            const total = att.records?.length || 0;
            const present = att.records?.filter(r => r.status === 'present').length || 0;
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            return (
              <div key={att._id} className="flex items-center gap-4 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <div className="flex-1">
                  <p className="font-medium text-sm">{new Date(att.date).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{att.schedule?.topic || 'No topic'}</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: rate >= 80 ? '#34C759' : rate >= 60 ? '#FF9500' : '#FF3B30' }}>{rate}%</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{present}/{total}</div>
                </div>
                <div className="w-16 bg-[var(--glass-border)] rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${rate}%`, background: rate >= 80 ? '#34C759' : rate >= 60 ? '#FF9500' : '#FF3B30' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
