import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.match(/[A-Z]/)) score++;
    if (pass.match(/[0-9]/)) score++;
    if (pass.match(/[^A-Za-z0-9]/)) score++;
    return score;
  };

  const strength = calculateStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (!agreed) {
      return toast.error("You must agree to the Terms & Conditions");
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || '/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: `+91${formData.phone}`,
          password: formData.password
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Signup failed");

      toast.success("Account created! Please verify your OTP.");
      navigate('/verify-otp', { state: { userId: data.userId, type: 'email-verify', email: formData.email } });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-medium text-[#2D6A4F] hover:underline">Log in</Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" placeholder="john@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <div className="mt-1 flex rounded-xl shadow-sm border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-[#2D6A4F] focus-within:border-[#2D6A4F]">
              <span className="inline-flex items-center px-4 bg-gray-50 text-gray-500 border-r border-gray-300">+91</span>
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} maxLength={10} className="flex-1 block w-full px-4 py-3 border-none focus:ring-0" placeholder="9876543210" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative rounded-xl shadow-sm">
              <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2 flex space-x-1 h-1.5">
                {[1, 2, 3, 4].map((v) => (
                  <div key={v} className={`flex-1 rounded-full ${v <= strength ? (strength <= 2 ? 'bg-red-400' : strength === 3 ? 'bg-yellow-400' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input type={showPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]" placeholder="••••••••" />
          </div>

          <div className="flex items-center">
            <input id="terms" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 text-[#2D6A4F] focus:ring-[#2D6A4F] border-gray-300 rounded" />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the <a href="#" className="text-[#2D6A4F] hover:underline">Terms & Conditions</a>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2D6A4F] hover:bg-[#1b4332] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D6A4F] disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
