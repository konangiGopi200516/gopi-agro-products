import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { PasswordStrength, getPasswordScore } from '../components/PasswordStrength';

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const oobCode = searchParams.get('oobCode');

  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch("password", "");
  const passwordScore = getPasswordScore(passwordValue);

  const onSubmit = async (data: FormValues) => {
    if (!oobCode) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (passwordScore < 2) {
      setError('password', { message: "Password is too weak" });
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        oobCode,
        newPassword: data.password
      });
      navigate('/login?reset=success');
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset password. Link may be expired.");
    }
  };

  if (!oobCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-[var(--color-primary)] font-semibold hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-display font-bold text-[var(--color-primary)] flex items-center justify-center gap-2">
            🌱 KisanMart
          </Link>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create new password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your new password below.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`appearance-none block w-full px-4 py-3.5 rounded-xl border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-gray-50/50 focus:bg-white`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password.message}</p>}
              <PasswordStrength password={passwordValue} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                {...register('confirmPassword')}
                className={`appearance-none block w-full px-4 py-3.5 rounded-xl border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[var(--color-primary)]'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm bg-gray-50/50 focus:bg-white`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
