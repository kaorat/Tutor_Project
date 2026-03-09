import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/useAuthStore';

// F6.1: React Hook Form with regex, custom rules
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Name must contain letters only (Thai or English)'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').regex(/(?=.*[0-9])/, 'Password must contain at least one number'),
  phone: z.string().optional(),
});

export default function Register() {
  const registerUser = useAuthStore(s => s.register);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password, data.phone);
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⚛</div>
          <h1 className="text-2xl font-bold mt-2">Create Account</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Join PhysicTutor today</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input {...register('name')} className="form-control" placeholder="Enter your name" />
            {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input {...register('email')} type="email" className="form-control" placeholder="Enter your email" />
            {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input {...register('phone')} className="form-control" placeholder="Enter your phone" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input {...register('password')} type="password" className="form-control" placeholder="At least 6 characters with a number" />
            {errors.password && <span className="text-red-400 text-xs">{errors.password.message}</span>}
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
