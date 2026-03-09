import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiHome } from 'react-icons/hi';

// F2.2: Proper 404 Not Found page
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-12 text-center max-w-md">
        <div className="text-8xl mb-4 opacity-60">🔭</div>
        <h1 className="text-6xl font-bold mb-2" style={{ color: 'var(--primary)' }}>404</h1>
        <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          The page you're looking for doesn't exist in this universe.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn btn-glass" onClick={() => navigate(-1)}>
            <HiArrowLeft /> Go Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            <HiHome /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
