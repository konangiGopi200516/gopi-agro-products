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
            Don't have an account? <Link to="/signup" className="font-medium text-[#2D6A4F] hover:underline">Sign up</Link>
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
              className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" 
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
                className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" 
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
              <Link to="/forgot-password" className="text-sm font-medium text-[#2D6A4F] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <input id="remember" type="checkbox" className="h-4 w-4 text-[#2D6A4F] focus:ring-[#2D6A4F] border-gray-300 rounded" />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
              Remember me for 30 days
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1b4332] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
