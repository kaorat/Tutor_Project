// F2.4: Nested route — /classes/:id (overview/index)
import { useOutletContext } from 'react-router-dom';

export default function ClassOverview() {
  const { cls } = useOutletContext();

  if (!cls) return null;

  return (
    <div className="glass-card p-5 space-y-4">
      {cls.description && (
        <div>
          <h5 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Description</h5>
          <p className="text-sm">{cls.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Students</h5>
          {cls.students?.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No students enrolled.</p>
          ) : (
            <ul className="space-y-1">
              {(cls.students || []).slice(0, 8).map(s => (
                <li key={s._id || s} className="text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                    {s.firstName?.[0] || '?'}
                  </span>
                  {s.firstName ? `${s.firstName} ${s.lastName}` : String(s)}
                </li>
              ))}
              {cls.students?.length > 8 && (
                <li className="text-xs text-[var(--text-tertiary)]">+{cls.students.length - 8} more</li>
              )}
            </ul>
          )}
        </div>
        <div>
          <h5 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">Details</h5>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-2"><dt className="text-[var(--text-tertiary)]">Room:</dt><dd>{cls.room || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-tertiary)]">Level:</dt><dd>{cls.level || '—'}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-tertiary)]">Category:</dt><dd>{cls.category}</dd></div>
            <div className="flex gap-2"><dt className="text-[var(--text-tertiary)]">Capacity:</dt><dd>{cls.enrollmentCount ?? 0}/{cls.capacity}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
