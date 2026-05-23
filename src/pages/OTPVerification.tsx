import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../services/api';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  // Using custom context to handle post-verify state update if needed
  
  const { userId, type, email } = location.state || {};

  useEffect(() => {
    if (!userId || !type) {
      navigate('/login');
    }
  }, [userId, type, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6th digit entered
    if (index === 5 && value !== '') {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpString: string) => {
    if (otpString.length !== 6) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: otpString, type })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      toast.success(data.message || "Verified successfully!");
      
      if (type === 'password-reset') {
        navigate('/reset-password', { state: { token: data.resetToken } });
      } else {
        navigate('/login', { state: { message: "Account verified. Please log in." } });
      }
    } catch (err: any) {
      toast.error(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      
      toast.success("New OTP sent!");
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Verify OTP</h2>
        <p className="text-gray-600 text-sm mb-8">
          We've sent a 6-digit verification code to <br />
          <span className="font-semibold text-gray-800">{email || 'your contact method'}</span>
        </p>

        <div className="flex justify-center gap-3 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-none transition-all"
              disabled={loading}
            />
          ))}
        </div>

        <button
          onClick={() => handleVerify(otp.join(''))}
          disabled={loading || otp.join('').length !== 6}
          className="w-full flex justify-center py-3 px-4 mb-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1b4332] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify Account'}
        </button>

        <div className="text-sm">
          {timer > 0 ? (
            <p className="text-gray-500">
              Resend OTP in <span className="font-semibold text-gray-700">00:{timer.toString().padStart(2, '0')}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-[#2D6A4F] font-semibold hover:underline flex items-center justify-center mx-auto"
            >
              {resending ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
