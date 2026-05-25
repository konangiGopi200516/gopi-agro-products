import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { PasswordStrength, getPasswordScore } from '../components/PasswordStrength';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// ─── Validation Schemas ──────────────────────────────────────────────────────

const step1Schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Must be a 10-digit number"),
});

const step2Schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val, "You must agree to the Terms & Conditions"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

// ─── Component ───────────────────────────────────────────────────────────────

const Signup = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Data persisted across wizard steps
  const [formData, setFormData] = useState<Step1Values & Step2Values>({} as any);

  const navigate = useNavigate();

  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) });

  // Watch password to calculate strength in real-time
  const passwordValue = form2.watch("password", "");
  const passwordScore = getPasswordScore(passwordValue);

  // Step 1 → Step 2
  const onStep1Submit = (data: Step1Values) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  // Step 2 → Register & auto-login
  const onStep2Submit = async (data: Step2Values) => {
    if (passwordScore < 2) {
      form2.setError('password', { message: "Password is too weak" });
      return;
    }

    const finalData = { ...formData, ...data };
    setFormData(finalData);

    try {
        const res = await api.post('/auth/register', {
          fullName: finalData.fullName,
          email: finalData.email,
          // Ensure mobile number is sent without '+91' prefix; backend expects plain number
          mobile: finalData.mobile.replace(/^\+91/, ''),
          password: finalData.password,
        });
        const data = res.data;
        if (data.accessToken) {
          localStorage.setItem('kisanmart_accessToken', data.accessToken);
          localStorage.setItem('kisanmart_token', data.accessToken);
          if (data.refreshToken) localStorage.setItem('kisanmart_refreshToken', data.refreshToken);
          if (data.user) localStorage.setItem('kisanmart_user', JSON.stringify(data.user));
          
          toast.success(data.message || 'Logged in automatically!');
          window.location.href = '/'; // Reload to pick up AuthContext
        } else {
          toast.success('Account created successfully! Please log in.');
          navigate('/login');
        }
      } catch (err: any) {
        console.error("Full Registration Error:", err.response?.data);
        const errorMessage = err.response?.data?.error 
          || err.response?.data?.message
          || err.message 
          || 'Registration failed. Please check your details.';
        toast.error(errorMessage);
      }
  };

  // Real Google Sign-In — opens native Google "Choose an account" popup
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
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

      toast.success('Account created successfully!');
      window.location.href = '/';
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Google signup error:', err);
        toast.error(err.response?.data?.error || err.message || 'Google signup failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row-reverse">
      {/* Right side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b4332] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="relative z-10 text-right">
          <Link to="/" className="text-3xl font-display font-bold flex items-center justify-end gap-2">
            🌱 KisanMart
          </Link>
          <div className="mt-20">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
              Start your journey <br />
              <span className="text-[#a7c957]">with the best farmers.</span>
            </h1>
            <p className="mt-6 text-lg text-green-50 max-w-md ml-auto font-light leading-relaxed">
              Experience the freshest produce, directly from the source, at unbeatable prices.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#2D6A4F] rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-[#40916C] rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-sm text-green-100/80 text-right">
          © {new Date().getFullYear()} KisanMart. All rights reserved.
        </div>
      </div>

      {/* Left side — Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="text-3xl font-display font-bold text-[var(--color-primary)] flex items-center justify-center gap-2">
              🌱 KisanMart
            </Link>
          </div>

          <div className="text-center lg:text-left mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create an account</h2>
            {step === 1 && (
              <p className="mt-2 text-sm text-gray-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors">
                  Sign in instead <ArrowRight className="inline w-4 h-4" />
                </Link>
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
              <span>Step {step} of 2</span>
              <span>{step === 1 ? 'Personal Info' : 'Security'}</span>
            </div>
            <div className="flex gap-2 h-1.5">
              {[1, 2].map((s) => (
                <div key={s} className={`flex-1 rounded-full transition-colors ${s <= step ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          {/* ── STEP 1: Personal Info ───────────────────────────────────────── */}
          {step === 1 && (
            <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={form1.handleSubmit(onStep1Submit)}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  {...form1.register('fullName')}
                  className={`appearance-none block w-full px-4 py-3 rounded-xl border ${form1.formState.errors.fullName ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                  placeholder="John Doe"
                />
                {form1.formState.errors.fullName && <p className="mt-1 text-sm text-red-500">{form1.formState.errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  {...form1.register('email')}
                  className={`appearance-none block w-full px-4 py-3 rounded-xl border ${form1.formState.errors.email ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                  placeholder="john@example.com"
                />
                {form1.formState.errors.email && <p className="mt-1 text-sm text-red-500">{form1.formState.errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <div className={`mt-1 flex rounded-xl shadow-sm border ${form1.formState.errors.mobile ? 'border-red-500' : 'border-gray-200'} overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent transition-all bg-gray-50/50 focus-within:bg-white`}>
                  <span className="inline-flex items-center px-4 bg-gray-100 text-gray-500 font-semibold border-r border-gray-200">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    {...form1.register('mobile')}
                    className="flex-1 block w-full px-4 py-3 border-none focus:ring-0 bg-transparent"
                    placeholder="9876543210"
                  />
                </div>
                {form1.formState.errors.mobile && <p className="mt-1 text-sm text-red-500">{form1.formState.errors.mobile.message}</p>}
              </div>

              <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all transform hover:-translate-y-[1px] mt-2">
                Continue to Security
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
                onClick={handleGoogleSignup}
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
          )}

          {/* ── STEP 2: Password ───────────────────────────────────────────── */}
          {step === 2 && (
            <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={form2.handleSubmit(onStep2Submit)}>
              <button type="button" onClick={() => setStep(1)} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...form2.register('password')}
                    className={`appearance-none block w-full px-4 py-3 rounded-xl border ${form2.formState.errors.password ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-gray-50/50 focus:bg-white`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {form2.formState.errors.password && <p className="mt-1 text-sm text-red-500">{form2.formState.errors.password.message}</p>}
                <PasswordStrength password={passwordValue} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  {...form2.register('confirmPassword')}
                  className={`appearance-none block w-full px-4 py-3 rounded-xl border ${form2.formState.errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                  placeholder="••••••••"
                />
                {form2.formState.errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{form2.formState.errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-center mt-2">
                <input
                  id="terms"
                  type="checkbox"
                  {...form2.register('terms')}
                  className="h-4.5 w-4.5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded transition-colors cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2.5 block text-sm font-medium text-gray-700 cursor-pointer">
                  I agree to the <a href="#" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-semibold transition-colors">Terms & Conditions</a>
                </label>
              </div>
              {form2.formState.errors.terms && <p className="mt-1 text-sm text-red-500">{form2.formState.errors.terms.message}</p>}

              <button type="submit" disabled={form2.formState.isSubmitting} className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 transition-all transform hover:-translate-y-[1px] mt-2">
                {form2.formState.isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
