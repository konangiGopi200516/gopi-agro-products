import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Inline validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!email.includes('@')) {
      setEmailError('Invalid email address');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      if (data.accessToken) {
        localStorage.setItem('kisanmart_accessToken', data.accessToken);
        localStorage.setItem('kisanmart_token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('kisanmart_refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('kisanmart_user', JSON.stringify(data.user));
      }

      toast.success('Welcome back!');
      window.location.href = from;
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred during login.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Real Google Sign-In — opens native Google "Choose an account" popup
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setApiError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Send the Google profile to our backend to create/find user
      const response = await api.post('/auth/google', {
        profile: {
          email: user.email,
          name: user.displayName || 'Google User',
          picture: user.photoURL || '',
          uid: user.uid,
        }
      });

      const data = response.data;
      if (data.accessToken) {
        localStorage.setItem('kisanmart_accessToken', data.accessToken);
        localStorage.setItem('kisanmart_token', data.accessToken); // legacy fallback
      }
      if (data.refreshToken) {
        localStorage.setItem('kisanmart_refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('kisanmart_user', JSON.stringify(data.user));
      }

      toast.success('Welcome back!');
      window.location.href = from;
    } catch (err: any) {
      // Don't show error if user just closed the popup
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google login error:', err);
        setApiError(err.response?.data?.error || err.message || 'Google login failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-display font-bold flex items-center gap-2">
            🌱 KisanMart
          </Link>
          <div className="mt-20">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Fresh from farm, <br />
              <span className="text-green-200">straight to your door.</span>
            </h1>
            <p className="mt-6 text-lg text-green-50 max-w-md font-light leading-relaxed">
              Join thousands of buyers getting fresh produce directly from farmers at the best prices.
            </p>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 right-20 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 text-sm text-green-100/80">
          © {new Date().getFullYear()} KisanMart. All rights reserved.
        </div>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="text-3xl font-display font-bold text-[var(--color-primary)] flex items-center justify-center gap-2">
              🌱 KisanMart
            </Link>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors">
                Create one now <ArrowRight className="inline w-4 h-4" />
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none block w-full px-4 py-3.5 rounded-xl border ${
                  emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'
                } placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                placeholder="john@example.com"
              />
              {emailError && <p className="mt-1.5 text-sm text-red-500 font-medium">{emailError}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full px-4 py-3.5 rounded-xl border ${
                    passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'
                  } placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && <p className="mt-1.5 text-sm text-red-500 font-medium">{passwordError}</p>}
            </div>

            {/* Inline API Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                {apiError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : 'Sign in to account'}
            </button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 lg:bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In — Opens real Google "Choose an account" popup */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
