// F2.4: Nested route — /classes/:id/students
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function ClassStudents() {
  const { cls } = useOutletContext();
  const navigate = useNavigate();

  if (!cls) return null;
  const students = cls.students || [];

  return (
    <div className="glass-card p-5">
      <h4 className="font-semibold mb-4">Enrolled Students ({students.length}/{cls.capacity})</h4>
      {students.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] py-8">No students enrolled in this class.</p>
      ) : (
        <div className="space-y-2">
          {students.map(s => (
            <button
              key={s._id || s}
              type="button"
              onClick={() => s._id && navigate(`/students/${s._id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--primary)]/5 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                {s.firstName?.[0] || '?'}
              </div>
              <div>
                <p className="font-medium text-sm">{s.firstName ? `${s.firstName} ${s.lastName}` : String(s)}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{s.studentId || ''} · {s.grade || 'No grade'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
