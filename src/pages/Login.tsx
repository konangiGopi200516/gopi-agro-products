import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      // Replace context login with JWT save logic
      // In a real app, you would pass data.accessToken to AuthContext to save.
      // For now, we mock the local save for compatibility:
      localStorage.setItem('kisanmart_token', data.accessToken);
      localStorage.setItem('kisanmart_user', JSON.stringify(data.user));
      
      // Update Context state manually if needed or let a useEffect handle it
      window.location.href = from; // Hard refresh to sync context with localStorage
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account? <Link to="/signup" className="font-medium text-[var(--color-primary)] hover:underline">Sign up</Link>
          </p>
        </div>

        {location.state?.message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg text-center font-medium">
            {location.state.message}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email or Mobile Number</label>
            <input 
              type="text" 
              required 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value)} 
              className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" 
              placeholder="john@example.com or 9876543210" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]" 
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <input id="remember" type="checkbox" className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded" />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
              Remember me for 30 days
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log In'}
          </button>

          <div className="relative pt-2 pb-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.alert('Google Auth pending production setup')}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
