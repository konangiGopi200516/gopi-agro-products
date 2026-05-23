import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../lib/api';

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      // Always show success message for security
      setIsSuccess(true);
    } catch (err) {
      // Still show success to prevent email enumeration
      setIsSuccess(true);
    }
  };

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
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {isSuccess ? (
            <div className="rounded-xl bg-green-50 p-4 border border-green-100 animate-in fade-in duration-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Check your email</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      If an account exists for that email, we have sent a password reset link. Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`appearance-none block w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send reset link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
