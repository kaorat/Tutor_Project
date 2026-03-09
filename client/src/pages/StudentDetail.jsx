// F2.2: Dynamic route /students/:id — student detail page
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiAcademicCap, HiPhone, HiMail, HiStar, HiTag } from 'react-icons/hi';

function getRank(xp = 0) {
  if (xp >= 1000) return { label: 'Diamond', color: '#00C7BE', border: 'border-cyan-400' };
  if (xp >= 500)  return { label: 'Gold',    color: '#FF9500', border: 'border-yellow-400' };
  if (xp >= 200)  return { label: 'Silver',  color: '#8E8E93', border: 'border-gray-300' };
  return           { label: 'Bronze',  color: '#A2845E', border: 'border-amber-600' };
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/students/${id}`),
      API.get(`/grades/student/${id}`),
    ])
      .then(([sRes, gRes]) => {
        setStudent(sRes.data);
        setGrades(gRes.data.grades || []);
      })
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 skeleton rounded w-1/3" />
      <div className="glass-card h-48 skeleton rounded-xl" />
    </div>
  );

  if (!student) return (
    <div className="glass-card p-8 text-center">
      <p className="text-[var(--text-secondary)]">Student not found.</p>
      <button className="btn btn-primary mt-4" onClick={() => navigate('/students')}>Back to Students</button>
    </div>
  );

  const rank = getRank(student.xp);
  const uniArr = Array.isArray(student.university) ? student.university : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn btn-glass p-2" onClick={() => navigate('/students')}>
          <HiArrowLeft className="text-lg" />
        </button>
        <h2 className="text-2xl font-bold">Student Profile</h2>
      </div>

      {/* Character Card — F1.1 props-based with rank border */}
      <div className={`glass-card p-6 border-2 ${rank.border}`}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${rank.color}, var(--primary))` }}>
            {student.firstName?.[0]}{student.lastName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-bold">{student.firstName} {student.lastName}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ background: rank.color }}>
                {rank.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${student.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {student.status}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mt-1">{student.studentId}</p>

            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: rank.color }}>{student.xp || 0}</div>
                <div className="text-xs text-[var(--text-tertiary)]">XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{grades.length}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Grades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{student.grade || '—'}</div>
                <div className="text-xs text-[var(--text-tertiary)]">Grade Level</div>
              </div>
              {student.birthday && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{student.age ?? '—'}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">Age</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="glass-card p-5 space-y-3">
          <h4 className="font-semibold flex items-center gap-2"><HiPhone /> Contact</h4>
          {student.email && <p className="text-sm flex gap-2"><HiMail className="shrink-0 mt-0.5" />{student.email}</p>}
          {student.phone && <p className="text-sm flex gap-2"><HiPhone className="shrink-0 mt-0.5" />{student.phone}</p>}
          {student.school && <p className="text-sm"><span className="text-[var(--text-tertiary)]">School:</span> {student.school}</p>}
          {student.parentName && <p className="text-sm"><span className="text-[var(--text-tertiary)]">Parent:</span> {student.parentName}</p>}
        </div>

        {/* Tags & University */}
        <div className="glass-card p-5 space-y-3">
          <h4 className="font-semibold flex items-center gap-2"><HiAcademicCap /> Programs of Interest</h4>
          {uniArr.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No target programs set.</p>
          ) : (
            <ul className="space-y-1">
              {uniArr.map((u, i) => (
                <li key={i} className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded">{u}</li>
              ))}
            </ul>
          )}
          {student.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {student.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs bg-[var(--glass-border)] px-2 py-0.5 rounded-full">
                  <HiTag className="text-[10px]" />{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Grades */}
      {grades.length > 0 && (
        <div className="glass-card p-5">
          <h4 className="font-semibold mb-3">Recent Grades</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-[var(--text-tertiary)] text-xs">
                  <th className="pb-2 text-left">Assessment</th>
                  <th className="pb-2 text-center">Score</th>
                  <th className="pb-2 text-center">%</th>
                  <th className="pb-2 text-left">Class</th>
                </tr>
              </thead>
              <tbody>
                {grades.slice(0, 10).map(g => (
                  <tr key={g._id} className="border-b border-[var(--glass-border)]/50">
                    <td className="py-2">{g.assessmentName}</td>
                    <td className="py-2 text-center">{g.score}/{g.maxScore}</td>
                    <td className="py-2 text-center">{g.percentage?.toFixed(1) ?? ((g.score / g.maxScore) * 100).toFixed(1)}%</td>
                    <td className="py-2 text-[var(--text-secondary)]">{g.classId?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
