import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import useCartStore from '../stores/useCartStore';
import { StudentFormProvider, useStudentForm } from '../context/StudentFormContext';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiRefresh, HiArrowLeft, HiArrowRight, HiCheck, HiShoppingCart, HiEye, HiOutlineTrash } from 'react-icons/hi';

// F6.3: Zod schemas for multi-step form
const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Letters only'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Letters only'),
});
const step2Schema = z.object({
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string().optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
});
const step3Schema = z.object({
  university: z.array(z.string()).max(3, 'Maximum 3 programs').optional(),
});
const stepSchemas = [step1Schema, step2Schema, step3Schema];
const STEPS = ['Basic Info', 'Contact & School', 'University Goal'];
const GRADE_OPTIONS = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'จบ'];
const DRAFT_KEY = 'student_form_draft';
const TCAS_API = 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json?ts=19ccb8ee1ee';

export default function Students() {
  return <StudentFormProvider><StudentsInner /></StudentFormProvider>;
}

function StudentsInner() {
  const navigate = useNavigate();
  // F6.3: Get step/setStep from context instead of local state
  const { step, setStep } = useStudentForm();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashStudents, setTrashStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [gradeFilters, setGradeFilters] = useState([]);

  const toggleGradeFilter = (grade) => {
    setGradeFilters(prev => {
      if (prev.includes(grade)) {
        return prev.filter(g => g !== grade);
      }
      return [...prev, grade];
    });
    setPage(1);
  };

  const clearGradeFilters = () => {
    setGradeFilters([]);
    setPage(1);
  };
  // step/setStep from StudentFormContext (F6.3)
  const [courses, setCourses] = useState([]);
  const [uniSearch, setUniSearch] = useState('');
  const coursesRef = useRef([]);
  const [selected, setSelected] = useState(new Set());
  const addMultiple = useCartStore(s => s.addMultiple);
  const toggleDrawer = useCartStore(s => s.toggleDrawer);

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s._id)));
  };
  const addSelectedToCart = () => {
    const toAdd = students.filter(s => selected.has(s._id)).map(s => ({ _id: s._id, firstName: s.firstName, lastName: s.lastName, grade: s.grade || '' }));
    if (toAdd.length === 0) return;
    addMultiple(toAdd);
    setSelected(new Set());
    toast.success(`${toAdd.length} student(s) added to cart`);
    toggleDrawer();
  };

  // F6.2: Debounced search (600ms)
  const debouncedSet = useMemo(() => debounce((v) => setDebouncedSearch(v), 600), []);
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); debouncedSet(e.target.value); };

  const gradeFilterKey = useMemo(() => gradeFilters.join(','), [gradeFilters]);

  const fetchStudents = useCallback(() => {
    setLoading(true); setFetchError(false);
    API.get('/students', { params: { search: debouncedSearch, page, limit: 20, grades: gradeFilterKey || undefined } })
      .then(res => {
        setStudents(res.data.students || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
        setLoading(false);
      })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, [debouncedSearch, page, gradeFilterKey]);

  const fetchTrash = () => {
    API.get('/students/trash').then(res => setTrashStudents(res.data)).catch(() => {});
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Fetch TCAS courses for university search
  useEffect(() => {
    if (coursesRef.current.length) { setCourses(coursesRef.current); return; }
    fetch(TCAS_API).then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : [];
      coursesRef.current = list;
      setCourses(list);
    }).catch(() => {});
  }, []);

  const filteredCourses = useMemo(() => {
    if (!uniSearch || uniSearch.length < 2) return [];
    const q = uniSearch.toLowerCase();
    return courses.filter(c => {
      const label = `${c.university_name_th || ''} ${c.faculty_name_th || ''} ${c.program_name_th || ''}`.toLowerCase();
      return label.includes(q);
    }).slice(0, 30);
  }, [uniSearch, courses]);

  const getUniLabel = useCallback((programId) => {
    if (!programId) return '-';
    const c = coursesRef.current.find(x => String(x.program_id) === String(programId));
    return c ? `${c.university_name_th} - ${c.faculty_name_th} - ${c.program_name_th}` : programId;
  }, []);

  // F6.3: Multi-step form with Zod
  const defaultVals = { firstName: '', lastName: '', email: '', phone: '', grade: '', school: '', university: [] };
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  const { register, handleSubmit, reset, trigger, getValues, setValue, setError, clearErrors, watch, formState: { errors } } = useForm({
    defaultValues: savedDraft ? JSON.parse(savedDraft) : defaultVals,
    mode: 'onBlur',
  });
  const watchValues = watch();

  // F6.3: localStorage persistence
  const saveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));

  const openAdd = () => {
    setEditing(null); setStep(0);
    const draft = localStorage.getItem(DRAFT_KEY);
    reset(draft ? JSON.parse(draft) : defaultVals);
    setUniSearch('');
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditing(s); setStep(0);
    const uniArr = Array.isArray(s.university) ? s.university : (s.university ? [s.university] : []);
    reset({ firstName: s.firstName, lastName: s.lastName, email: s.email || '', phone: s.phone || '', grade: s.grade || '', school: s.school || '', university: uniArr });
    setUniSearch('');
    setShowModal(true);
  };

  const validateStep = (s) => {
    clearErrors();
    const values = getValues();
    const result = stepSchemas[s].safeParse(values);
    if (!result.success) {
      result.error.errors.forEach(e => setError(e.path[0], { message: e.message }));
      return false;
    }
    return true;
  };

  const nextStep = () => {
    // Only block on step 1 (required fields); steps 2-3 are all optional
    if (step === 0 && !validateStep(0)) return;
    saveDraft();
    setStep(s => Math.min(s + 1, 2));
  };
  const prevStep = () => { saveDraft(); setStep(s => Math.max(s - 1, 0)); };

  const onSubmit = async () => {
    if (!validateStep(0)) { setStep(0); return; }
    const data = getValues();
    try {
      if (editing) await API.put(`/students/${editing._id}`, data);
      else await API.post('/students', data);
      toast.success(editing ? 'Student updated' : 'Student added');
      localStorage.removeItem(DRAFT_KEY);
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error saving student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Move this student to trash?')) return;
    const prevStudents = students;
    const prevSelected = new Set(selected);

    // Optimistic UI: remove immediately
    setStudents(prev => prev.filter(s => s._id !== id));
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      const MAX_RETRIES = 3;
      let attempt = 0;
      let lastError;
      while (attempt < MAX_RETRIES) {
        attempt++;
        try {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw new Error('offline');
          }
          await API.delete(`/students/${id}`);
          toast.success('Student moved to trash');
          fetchStudents();
          return;
        } catch (err) {
          lastError = err;
          if (attempt >= MAX_RETRIES) throw err;
          await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
    } catch (err) {
      const isOffline = err?.message === 'offline' || err?.message === 'Network Error';
      if (isOffline) {
        await new Promise(r => setTimeout(r, 600));
      }
      // Restore previous state
      setStudents(prevStudents);
      setSelected(prevSelected);
      toast.error(isOffline ? 'Offline — delete failed after retries, restored list.' : 'Failed to delete student after retries, restored list.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await API.patch(`/students/${id}/restore`);
      toast.success('Student restored');
      fetchTrash();
      fetchStudents();
    } catch { toast.error('Failed to restore'); }
  };

  const openDetail = (s) => setViewing(s);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="subtitle">Manage your students</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button className="btn btn-glass" onClick={addSelectedToCart}><HiShoppingCart /> Add {selected.size} to Cart</button>
          )}
          <button className="btn btn-glass" onClick={() => { setShowTrash(true); fetchTrash(); }}><HiOutlineTrash /> Trash</button>
          <button className="btn btn-primary" onClick={openAdd}><HiPlus /> Add Student</button>
        </div>
      </div>

      {/* F6.2: Search with debounce */}
      <div className="search-bar">
        <div className="relative flex-1">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input className="form-control pl-10 w-full" placeholder="Search students (600ms debounce)..." value={search} onChange={handleSearch} />
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Filter by grade</p>
          <button type="button" className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]" onClick={clearGradeFilters} disabled={gradeFilters.length === 0}>
            Clear
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map(grade => {
            const active = gradeFilters.includes(grade);
            return (
              <button
                type="button"
                key={grade}
                onClick={() => toggleGradeFilter(grade)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${active ? 'bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
              >
                {grade}
              </button>
            );
          })}
        </div>
        {gradeFilters.length > 0 && (
          <p className="text-xs text-[var(--text-tertiary)] mt-3">{gradeFilters.length} grade filter{gradeFilters.length > 1 ? 's' : ''} active</p>
        )}
      </div>

      {/* F6.2: Skeleton loading */}
      {loading ? (
        <div className="glass-card overflow-auto">
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-5 w-16" />
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-5 w-24" />
                <div className="skeleton h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : fetchError ? (
        /* F6.2: Error + retry */
        <div className="glass-card p-10 text-center">
          <div className="text-5xl mb-3 opacity-50">⚠️</div>
          <h3 className="font-semibold mb-2">Failed to load students</h3>
          <button className="btn btn-primary" onClick={fetchStudents}><HiRefresh /> Retry</button>
        </div>
      ) : (
        <>
        <div className="glass-card overflow-auto">
          {students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👨‍🎓</div>
              <h3 className="font-semibold">No students found</h3>
              <p className="text-[var(--text-secondary)] text-sm">Add your first student to get started</p>
            </div>
          ) : (
            <table className="glass-table">
              <thead><tr>
                <th><input type="checkbox" checked={selected.size === students.length && students.length > 0} onChange={toggleAll} className="accent-[var(--primary)]" /></th>
                <th>Name</th><th>Email</th><th>Phone</th><th>Grade</th><th>University</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className={selected.has(s._id) ? 'bg-[var(--primary)]/5' : ''}>
                    <td><input type="checkbox" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)} className="accent-[var(--primary)]" /></td>
                    <td className="font-medium">{s.firstName} {s.lastName}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.grade || '-'}</td>
                    <td className="text-xs max-w-[200px] truncate" title={(Array.isArray(s.university) ? s.university : (s.university ? [s.university] : [])).map(u => getUniLabel(u)).join(', ')}>{(Array.isArray(s.university) ? s.university : (s.university ? [s.university] : [])).map(u => getUniLabel(u)).join(', ') || '-'}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'success' : 'warning'}`}>{s.status}</span></td>
                    <td className="actions-cell">
                      <button className="btn btn-glass btn-sm" onClick={() => navigate(`/students/${s._id}`)} title="View Detail"><HiEye /></button>
                      <button className="btn btn-glass btn-sm" onClick={() => openEdit(s)}><HiPencil /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}><HiTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 glass-card">
            <span className="text-xs text-[var(--text-secondary)]">{total} student(s) — Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button className="btn btn-glass btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-glass'}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="btn btn-glass btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
        </>
      )}

      {/* F6.3: Multi-step modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">{editing ? 'Edit Student' : 'Add Student'}</h3>
              <button className="btn btn-glass btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* F2.4: Progress bar */}
            <div className="px-5 pt-4">
              <div className="flex justify-between mb-2">
                {STEPS.map((label, i) => (
                  <div key={i} className={`text-xs font-medium ${i <= step ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}>
                    {i + 1}. {label}
                  </div>
                ))}
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
            </div>

            <form onSubmit={e => e.preventDefault()}>
              <div className="modal-body">
                {/* Step 1: Basic Info */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input className="form-control" {...register('firstName')} />
                        {errors.firstName && <span className="text-red-400 text-xs">{errors.firstName.message}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name *</label>
                        <input className="form-control" {...register('lastName')} />
                        {errors.lastName && <span className="text-red-400 text-xs">{errors.lastName.message}</span>}
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 2: Contact & School */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" {...register('email')} />
                        {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input className="form-control" {...register('phone')} />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Grade/Level</label>
                        <select className="form-control" {...register('grade')}>
                          <option value="">-- Select Grade --</option>
                          {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">School</label>
                        <input className="form-control" {...register('school')} />
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 3: University Goal + Review */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Target University / Program (max 3)</label>
                      {/* Selected programs as chips */}
                      {(getValues('university') || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(getValues('university') || []).map((pid, i) => (
                            <span key={pid} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                              <span className="max-w-[220px] truncate">{getUniLabel(pid)}</span>
                              <button type="button" className="ml-1 text-[var(--primary)] hover:text-red-400 cursor-pointer font-bold" onClick={() => { const cur = getValues('university') || []; setValue('university', cur.filter((_, j) => j !== i)); }}>✕</button>
                            </span>
                          ))}
                        </div>
                      )}
                      {(getValues('university') || []).length < 3 && (
                        <>
                          <div className="relative">
                            <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                              className="form-control pl-10 w-full"
                              placeholder="Search university, faculty, or program..."
                              value={uniSearch}
                              onChange={e => { setUniSearch(e.target.value); }}
                            />
                          </div>
                          {uniSearch.length >= 2 && filteredCourses.length > 0 && (
                            <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                              {filteredCourses.map((c, i) => {
                                const pid = String(c.program_id);
                                const already = (getValues('university') || []).includes(pid);
                                const label = `${c.university_name_th} - ${c.faculty_name_th} - ${c.program_name_th}`;
                                return (
                                  <button
                                    type="button"
                                    key={i}
                                    disabled={already}
                                    className={`w-full text-left px-3 py-2 text-sm border-b border-[var(--glass-border)] last:border-0 ${already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--primary)]/10 cursor-pointer'}`}
                                    onClick={() => { if (already) return; const cur = getValues('university') || []; setValue('university', [...cur, pid]); setUniSearch(''); }}
                                  >
                                    {label} {already && <span className="text-[10px] ml-1">(added)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {uniSearch.length >= 2 && filteredCourses.length === 0 && courses.length > 0 && (
                            <p className="text-xs text-[var(--text-tertiary)] mt-2">No matching programs found</p>
                          )}
                        </>
                      )}
                      {(getValues('university') || []).length >= 3 && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Maximum 3 programs selected</p>
                      )}
                      {courses.length === 0 && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">Loading university data...</p>
                      )}
                    </div>

                    <div className="glass-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Review before adding</h4>
                        <span className="text-xs text-[var(--text-tertiary)]">Make sure everything looks right</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Full Name</p>
                          <p className="font-medium">{`${watchValues.firstName || '-' } ${watchValues.lastName || ''}`.trim()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Email</p>
                          <p>{watchValues.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Phone</p>
                          <p>{watchValues.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Grade</p>
                          <p>{watchValues.grade || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">School</p>
                          <p>{watchValues.school || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">University Goals</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {(watchValues.university || []).length > 0
                              ? (watchValues.university || []).map(uid => getUniLabel(uid)).join(', ')
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {step > 0 && <button type="button" className="btn btn-glass" onClick={prevStep}><HiArrowLeft /> Back</button>}
                <div className="flex-1" />
                {step < 2 ? (
                  <button type="button" className="btn btn-primary" onClick={nextStep}>Next <HiArrowRight /></button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={onSubmit}><HiCheck /> {editing ? 'Update' : 'Add Student'}</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* F3.3: Student detail view modal */}
      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">Student Details</h3>
              <button className="btn btn-glass btn-sm" onClick={() => setViewing(null)}>✕</button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">First Name</p><p className="font-medium">{viewing.firstName}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">Last Name</p><p className="font-medium">{viewing.lastName}</p></div>
              </div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">Email</p><p>{viewing.email || '-'}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">Phone</p><p>{viewing.phone || '-'}</p></div>
              </div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">Grade</p><p>{viewing.grade || '-'}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">School</p><p>{viewing.school || '-'}</p></div>
              </div>
              <div><p className="text-xs text-[var(--text-tertiary)]">Status</p><span className={`badge badge-${viewing.status === 'active' ? 'success' : 'warning'}`}>{viewing.status}</span></div>
              <div><p className="text-xs text-[var(--text-tertiary)]">University Goals</p>
                {(Array.isArray(viewing.university) ? viewing.university : (viewing.university ? [viewing.university] : [])).length > 0
                  ? (Array.isArray(viewing.university) ? viewing.university : [viewing.university]).map((u, i) => (
                    <p key={i} className="text-sm mt-1">{getUniLabel(u)}</p>
                  ))
                  : <p className="text-sm">-</p>
                }
              </div>
              <div className="grid-2">
                <div><p className="text-xs text-[var(--text-tertiary)]">XP</p><p className="font-bold text-[var(--primary)]">{viewing.xp || 0}</p></div>
                <div><p className="text-xs text-[var(--text-tertiary)]">Created</p><p className="text-sm">{new Date(viewing.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-glass" onClick={() => setViewing(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* F3.5: Trash modal */}
      {showTrash && (
        <div className="modal-overlay" onClick={() => setShowTrash(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">🗑️ Trash ({trashStudents.length})</h3>
              <button className="btn btn-glass btn-sm" onClick={() => setShowTrash(false)}>✕</button>
            </div>
            <div className="modal-body">
              {trashStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-40">🗑️</div>
                  <p className="text-[var(--text-tertiary)] text-sm">Trash is empty</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trashStudents.map(s => (
                    <div key={s._id} className="flex items-center justify-between glass-card px-4 py-3">
                      <div>
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <p className="text-xs text-[var(--text-tertiary)]">Deleted {new Date(s.deletedAt).toLocaleDateString()}</p>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRestore(s._id)}>
                        <HiRefresh /> Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-glass" onClick={() => setShowTrash(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
