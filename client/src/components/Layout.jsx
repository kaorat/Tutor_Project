import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/useAuthStore';
import useThemeStore from '../stores/useThemeStore';
import useCartStore from '../stores/useCartStore';
import API from '../utils/api';
import { HiOutlineHome, HiOutlineUserGroup, HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineClipboardCheck, HiOutlineChartBar, HiOutlineDocumentReport, HiOutlineUser, HiOutlineLogout, HiOutlineCog, HiOutlineMoon, HiOutlineSun, HiOutlineMenu, HiOutlineX, HiOutlineShoppingCart, HiOutlineShieldCheck } from 'react-icons/hi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/students', label: 'Students', icon: HiOutlineUserGroup },
  { path: '/classes', label: 'Classes', icon: HiOutlineAcademicCap },
  { path: '/schedules', label: 'Schedules', icon: HiOutlineCalendar },
  { path: '/attendance', label: 'Attendance', icon: HiOutlineClipboardCheck },
  { path: '/grades', label: 'Grades', icon: HiOutlineChartBar },
  { path: '/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  { path: '/tasks', label: 'Admission', icon: HiOutlineCog },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/classes': 'Classes',
  '/schedules': 'Schedules',
  '/attendance': 'Attendance',
  '/grades': 'Grades',
  '/reports': 'Reports',
  '/profile': 'Profile',
  '/tasks': 'Admission Checker',
  '/admin/tutors': 'Tutor Management',
};

const accentColors = ['#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#00C7BE', '#FF2D55'];

export default function Layout() {
  const { user, logout, viewingTutorId, viewingTutorName, clearViewingTutor } = useAuthStore();
  const { mode, toggleMode, accentColor, setAccentColor } = useThemeStore();
  const cartItemCount = useCartStore(s => s.getItemCount());
  const toggleDrawer = useCartStore(s => s.toggleDrawer);
  const isDrawerOpen = useCartStore(s => s.isDrawerOpen);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Physics Tutor';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
        border-r border-[var(--glass-border)]
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(24px)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--glass-border)]">
          <div className="text-3xl">⚛</div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">PhysicTutor</h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Show tutor nav items only for tutors, or admin viewing a tutor */}
          {(user?.role !== 'admin' || viewingTutorId) && navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <item.icon className="text-lg flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
          {/* F2.5: Conditional UI by role — admin-only nav */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin/tutors"
              onClick={() => { clearViewingTutor(); setSidebarOpen(false); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <HiOutlineShieldCheck className="text-lg flex-shrink-0" />
              Tutor Management
            </NavLink>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-4 border-t border-[var(--glass-border)] space-y-1">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]'
              }`
            }
          >
            <HiOutlineUser className="text-lg" />
            {user?.name || 'Profile'}
          </NavLink>
          <button
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
            onClick={logout}
          >
            <HiOutlineLogout className="text-lg" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-[var(--glass-border)]" style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-all cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <HiOutlineMenu className="text-xl" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart button (F2.3) */}
            <button className="relative p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-all cursor-pointer" onClick={toggleDrawer}>
              <HiOutlineShoppingCart className="text-xl" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* F1.3: Color picker */}
            <div className="relative">
              <button
                className="w-8 h-8 rounded-full border-2 border-[var(--glass-border)] cursor-pointer transition-all hover:scale-110"
                style={{ background: accentColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Accent Color"
              />
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowColorPicker(false)} />
                  <div className="absolute right-0 top-full mt-2 p-3 glass-card z-40 flex gap-2">
                    {accentColors.map(c => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110 ${c === accentColor ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''}`}
                        style={{ background: c }}
                        onClick={() => { setAccentColor(c); setShowColorPicker(false); }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* F1.3: Dark/Light toggle */}
            <button
              className="p-2 rounded-lg hover:bg-[var(--glass-hover)] transition-all cursor-pointer"
              onClick={toggleMode}
              title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mode === 'dark' ? <HiOutlineSun className="text-xl text-yellow-400" /> : <HiOutlineMoon className="text-xl text-blue-400" />}
            </button>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: 'var(--glass-bg)' }}>
              <span className="badge badge-primary">{user?.role}</span>
              <span className="text-[var(--text-secondary)]">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Admin tutor-viewing banner */}
          {user?.role === 'admin' && viewingTutorId && (
            <div className="mb-4 flex items-center justify-between rounded-xl px-4 py-3 bg-[var(--primary)]/15 border border-[var(--primary)]/30">
              <span className="text-sm font-medium">
                Viewing as: <strong>{viewingTutorName || 'Tutor'}</strong>
              </span>
              <button
                className="btn btn-glass text-xs px-3 py-1"
                onClick={() => { clearViewingTutor(); window.location.href = '/admin/tutors'; }}
              >
                ← Back to Tutor List
              </button>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* F2.3: Side drawer */}
      <CartDrawer />
    </div>
  );
}

function CartDrawer() {
  const { items, selectedClass, isDrawerOpen, toggleDrawer, removeItem, setSelectedClass, clearCart, getItemCount } = useCartStore();
  const [classes, setClasses] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  // Fetch classes list when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      API.get('/classes')
        .then(res => setClasses(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [isDrawerOpen]);

  const handleConfirmEnroll = async () => {
    if (!selectedClass || items.length === 0) return;
    setEnrolling(true);
    try {
      // Get current students in class, merge with new ones
      const cls = classes.find(c => c._id === selectedClass._id);
      const existingIds = cls?.students?.map(s => s._id || s) || [];
      const newIds = items.map(s => s._id);
      const allIds = [...new Set([...existingIds, ...newIds])];
      await API.put(`/classes/${selectedClass._id}`, { students: allIds });
      clearCart();
      toggleDrawer();
      // Refresh classes
      setClasses([]);
    } catch {}
    setEnrolling(false);
  };

  return (
    <>
      {isDrawerOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={toggleDrawer} />}
      <div className={`side-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]">
          <div>
            <h3 className="text-lg font-bold">Enrollment Cart</h3>
            <p className="text-[10px] text-[var(--text-tertiary)]">{getItemCount()} student(s) selected</p>
          </div>
          <button className="p-1 rounded-lg hover:bg-[var(--glass-hover)] cursor-pointer" onClick={toggleDrawer}><HiOutlineX className="text-xl" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 opacity-40">👨‍🎓</div>
              <p className="text-[var(--text-tertiary)] text-sm">No students in cart</p>
              <p className="text-[var(--text-tertiary)] text-[10px] mt-1">Select students from the Students page</p>
            </div>
          ) : (
            <>
              {/* Student list */}
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Students ({items.length})</p>
                <div className="space-y-1">
                  {items.map(s => (
                    <div key={s._id} className="flex items-center justify-between glass-card px-3 py-2">
                      <div>
                        <span className="text-sm font-medium">{s.firstName} {s.lastName}</span>
                        {s.grade && <span className="text-[10px] text-[var(--text-tertiary)] ml-2">{s.grade}</span>}
                      </div>
                      <button className="text-red-400 text-xs cursor-pointer hover:text-red-300" onClick={() => removeItem(s._id)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class picker */}
              <div className="border-t border-[var(--glass-border)] pt-3">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Enroll into class:</p>
                <select
                  className="form-control w-full text-xs py-2"
                  value={selectedClass?._id || ''}
                  onChange={e => {
                    const cls = classes.find(c => c._id === e.target.value);
                    if (cls) setSelectedClass({ _id: cls._id, name: cls.name, subject: cls.subject, level: cls.level });
                    else setSelectedClass(null);
                  }}
                >
                  <option value="">-- Select a class --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.subject} {c.level ? `• ${c.level}` : ''} ({c.students?.length || 0}/{c.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t border-[var(--glass-border)] space-y-2">
            <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Students</span><span>{getItemCount()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Target class</span><span className="font-bold truncate max-w-[140px]">{selectedClass?.name || 'Not selected'}</span></div>
            <button
              className="btn btn-primary w-full mt-3"
              disabled={!selectedClass || items.length === 0 || enrolling}
              onClick={handleConfirmEnroll}
            >
              {enrolling ? 'Enrolling...' : `Enroll ${getItemCount()} student(s)`}
            </button>
            <button className="btn btn-glass w-full text-sm" onClick={clearCart}>Clear Cart</button>
          </div>
        )}
      </div>
    </>
  );
}
