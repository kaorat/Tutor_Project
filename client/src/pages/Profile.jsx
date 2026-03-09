import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/useAuthStore';
import { HiUser, HiLockClosed, HiCheck } from 'react-icons/hi';

// F7.1: Random color generator for border
const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  // F7.1: Dynamic border color
  const [borderColor, setBorderColor] = useState('#007AFF');

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
    setLoading(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Profile</h2>
          <p className="subtitle">Manage your account</p>
        </div>
      </div>

      {/* F7.1: Profile card with dynamic border + random color on press */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setBorderColor(randomColor())}
          className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold cursor-pointer transition-all duration-300 hover:scale-105 mb-4"
          style={{ border: `4px solid ${borderColor}`, background: `${borderColor}20`, color: borderColor }}
          title="Click for random color"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </button>
        <h3 className="text-xl font-bold">{user?.name}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
        <span className="badge badge-primary mt-2">{user?.role}</span>
      </div>

      <div className="flex justify-center gap-2">
        <button className={`btn ${tab === 'profile' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setTab('profile')}>
          <HiUser /> Profile
        </button>
        <button className={`btn ${tab === 'password' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setTab('password')}>
          <HiLockClosed /> Password
        </button>
      </div>

      {tab === 'profile' && (
        <div className="glass-card max-w-md mx-auto p-8">
          <h3 className="text-lg font-bold mb-6">Edit Profile</h3>
          <form onSubmit={handleProfile} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Saving...' : <><HiCheck /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="glass-card max-w-md mx-auto p-8">
          <h3 className="text-lg font-bold mb-6">Change Password</h3>
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-control" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Changing...' : <><HiLockClosed /> Change Password</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
