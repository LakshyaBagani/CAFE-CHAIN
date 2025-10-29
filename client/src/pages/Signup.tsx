import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, Coffee, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import axios from 'axios';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signup(formData.name, formData.email, formData.password, formData.number);
      // Send OTP after successful signup
      await sendOTP();
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    try {
      const response = await axios.post('http://localhost:3000/auth/sendOTP', {
        email: formData.email
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        // Show success toast
        const { showToast } = await import('../utils/toast');
        showToast('OTP sent successfully! Check your email.', 'success');
      } else {
        throw new Error(response.data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      // Show error toast
      const { showToast } = await import('../utils/toast');
      showToast(error.message || 'Failed to send OTP. Please try again.', 'error');
      throw error;
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://cafe-chain.onrender.com/auth/verifyOTP', {
        verificationCode: otpCode,
        email: formData.email
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess(true);
        // Show success toast
        const { showToast } = await import('../utils/toast');
        showToast('Email verified successfully! Welcome to Cafe Chain!', 'success');
        navigate('/');
      } else {
        setError(response.data.message || 'OTP verification failed');
        // Show error toast
        const { showToast } = await import('../utils/toast');
        showToast(response.data.message || 'OTP verification failed. Please try again.', 'error');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed');
      // Show error toast
      const { showToast } = await import('../utils/toast');
      showToast(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError(null);

    try {
      await sendOTP();
      setResendCooldown(60); // 60 seconds cooldown
      
      // Start countdown
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to CafeChain!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been verified successfully. Redirecting you to the home page...
            </p>
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
            <p className="text-gray-600">We've sent a verification code to</p>
            <p className="text-amber-600 font-semibold">{formData.email}</p>
          </div>

          {/* OTP Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleOTPSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center space-x-3 mb-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                        otpCode.length > index
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : otpCode.length === index
                          ? 'border-amber-500 bg-white shadow-lg'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      {otpCode[index] || ''}
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-amber-600 hover:text-amber-500 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Code'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setOtpSent(false)}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Signup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join CafeChain</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
              
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-amber-600 hover:text-amber-500 font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
