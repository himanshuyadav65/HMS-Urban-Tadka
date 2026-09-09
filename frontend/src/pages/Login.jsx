import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, Loader2, User, ShieldCheck, 
  ArrowLeft, CheckCircle2, AlertCircle, Building2, Star, Shield, Key,
  Bed, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import GrandHorizonLogo from '../components/GrandHorizonLogo';

const Login = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSuccess, setApiSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // View states: 'login' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  const [selectedRole, setSelectedRole] = useState('Customer');
  
  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState(null); // Display OTP in UI for easy testing

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'alice@guest.com',
      password: 'guestpassword'
    }
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === 'Customer') {
      setValue('email', 'alice@guest.com');
      setValue('password', 'guestpassword');
    } else if (role === 'Housekeeper') {
      setValue('email', 'housekeeper@hotel.com');
      setValue('password', 'housekeeperpassword');
    } else if (role === 'Receptionist') {
      setValue('email', 'receptionist@hotel.com');
      setValue('password', 'receptionistpassword');
    } else if (role === 'SuperAdmin') {
      setValue('email', 'superadmin@system.com');
      setValue('password', 'superadminpassword');
    }
  };

  const tokenClientRef = useRef(null);

  const handleGoogleAccessTokenResponse = async (accessToken) => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await api.post('/auth/google', {
        accessToken,
        isSandbox: false
      });
      setLoading(false);
      if (res.data.success) {
        const authRes = loginWithToken(res.data.data.token, res.data.data);
        if (authRes.success) {
          navigate('/dashboard');
        } else {
          setApiError('Failed to synchronize authenticated session');
        }
      }
    } catch (err) {
      setLoading(false);
      setApiError(err.response?.data?.message || 'Google access token verification failed');
    }
  };

  const handleGoogleLoginResponse = async (response) => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const res = await api.post('/auth/google', {
        credential: response.credential,
        isSandbox: false
      });
      setLoading(false);
      if (res.data.success) {
        const authRes = loginWithToken(res.data.data.token, res.data.data);
        if (authRes.success) {
          navigate('/dashboard');
        } else {
          setApiError('Failed to synchronize authenticated session');
        }
      }
    } catch (err) {
      setLoading(false);
      setApiError(err.response?.data?.message || 'Google credentials verification failed');
    }
  };

  const initializeGoogleSignIn = () => {
    try {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '109283749283-dummy.apps.googleusercontent.com';

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginResponse,
        });

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              handleGoogleAccessTokenResponse(tokenResponse.access_token);
            }
          },
        });
      }
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
    }
  };

  useEffect(() => {
    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleSignIn();
      };
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const handleGoogleSandboxLogin = async () => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const simulatedCredential = JSON.stringify({
        email: 'google-sandbox@hotel.com',
        name: 'Google Sandbox Guest',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'
      });
      
      const res = await api.post('/auth/google', {
        credential: simulatedCredential,
        isSandbox: true
      });
      setLoading(false);
      if (res.data.success) {
        const authRes = loginWithToken(res.data.data.token, res.data.data);
        if (authRes.success) {
          navigate('/dashboard');
        } else {
          setApiError('Failed to synchronize sandbox authenticated session');
        }
      }
    } catch (err) {
      setLoading(false);
      setApiError(err.response?.data?.message || 'Sandbox Google login failed');
    }
  };

  const handleGoogleButtonClick = () => {
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID && tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      const userChoice = window.confirm(
        "Google Client ID is not configured in your .env file.\n\n" +
        "To test with real Gmail select popup, please set VITE_GOOGLE_CLIENT_ID in your frontend .env.\n\n" +
        "Click 'OK' to run the sandbox simulation, or 'Cancel' to configure your ID."
      );
      if (userChoice) {
        handleGoogleSandboxLogin();
      }
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setApiError(result.error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setApiError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    setDemoOtp(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      setLoading(false);
      if (response.data.success) {
        setApiSuccess('A 6-digit verification code has been generated!');
        if (response.data.debugOtp) {
          setDemoOtp(response.data.debugOtp);
        }
        setView('reset');
      }
    } catch (err) {
      setLoading(false);
      setApiError(err.response?.data?.message || 'Failed to request reset code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setApiError('Please fill in both the OTP code and new password');
      return;
    }
    if (newPassword.length < 6) {
      setApiError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const response = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: otpCode,
        newPassword
      });
      setLoading(false);
      if (response.data.success) {
        setApiSuccess('Password reset successfully! Please log in with your new password.');
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
        setDemoOtp(null);
        setView('login');
      }
    } catch (err) {
      setLoading(false);
      setApiError(err.response?.data?.message || 'Invalid or expired OTP code');
    }
  };

  return (
    <div className="relative min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#0B0C10] overflow-hidden font-sans text-slate-100">
      
      {/* Luxury Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-neutral-800/20 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      {/* Lobby Image Overlay (Refined Monochrome Luxury Edit) */}
      <img 
        src="/images/hotel_lobby_blur.png" 
        alt="Urban Tadka Lobby Overlay" 
        className="absolute inset-0 w-full h-full object-cover opacity-[0.07] filter grayscale contrast-125 pointer-events-none"
      />

      {/* LEFT PANEL: Branding & Visuals (Hidden on small screens) */}
      <div className="lg:col-span-5 hidden lg:flex flex-col justify-between p-16 relative overflow-hidden border-r border-neutral-900 z-10">
        
        {/* Subtle geometric line overlay for editorial feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Top Branding — GrandHorizonLogo (matches Sidebar & CustomerDashboard exactly) */}
        <GrandHorizonLogo size="large" variant="gold" />

        {/* Center Content: Premium Display Cards */}
        <div className="space-y-10 my-auto">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-amber-400 bg-amber-500/5 rounded-full border border-amber-500/20 tracking-wider uppercase">
              <Shield className="w-3 h-3" />
              Secure Privilege Portal
            </span>
            <h2 className="text-4xl font-light text-white tracking-tight leading-[1.2]">
              Elevate Your <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                Hospitality Experience.
              </span>
            </h2>
            <p className="text-neutral-400 text-sm max-w-sm leading-relaxed font-light">
              Access the management suite for Urban Tadka. Control bookings, personalize guest check-ins, process secure payments, and oversee 5-star operations.
            </p>
          </div>

          {/* Premium Glassmorphic Stats Widget (Redesigned) */}
          <div className="p-6 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl space-y-5 max-w-md hover:scale-[1.01] transition-all duration-500 group">
            <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest font-mono">Suite 302 - Penthouse</span>
              </div>
              <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md uppercase">
                Active
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Standard Rate</p>
                <p className="text-xl font-semibold text-white mt-0.5">Rs. 24,900<span className="text-xs font-light text-neutral-400">/night</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Guest Rating</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-neutral-300 ml-1 font-mono">5.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-neutral-950 rounded-full h-1 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-[94%] rounded-full transition-all duration-1000"></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-medium">
                <span>94% Occupancy Tonight</span>
                <span className="font-mono">148 Active Guests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-[10px] text-neutral-600 tracking-widest uppercase">
          <span>&copy; 2026 Urban Tadka Group</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Card Section */}
      <div className="lg:col-span-7 col-span-12 flex flex-col justify-center items-center p-6 md:p-16 relative z-10">
        
        {/* Glow effects for right panel */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-600/[0.03] rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md space-y-8">
          
          {/* Logo on small screens only — GrandHorizonLogo */}
          <div className="lg:hidden flex justify-center mb-6">
            <GrandHorizonLogo size="large" variant="gold" />
          </div>

          {/* Toast / Notification Banners */}
          {apiError && (
            <div className="p-4 bg-rose-950/20 border border-rose-900/30 text-rose-300 text-xs font-medium rounded-xl flex items-start gap-3 shadow-2xl animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 text-xs font-medium rounded-xl flex items-start gap-3 shadow-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{apiSuccess}</span>
            </div>
          )}

          {/* MAIN GLASS CARD CONTAINER */}
          <div className="backdrop-blur-2xl bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-8 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
            
            {/* Elegant luxury top border line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
            
            {/* VIEW 1: LOGIN VIEW */}
            {view === 'login' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl border ${
                      selectedRole === 'Customer' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      selectedRole === 'Housekeeper' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      selectedRole === 'Receptionist' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {selectedRole === 'Customer' ? <User className="w-5 h-5" /> :
                       selectedRole === 'Housekeeper' ? <Bed className="w-5 h-5" /> :
                       selectedRole === 'Receptionist' ? <Users className="w-5 h-5" /> :
                       <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-wide">
                        {selectedRole === 'Customer' ? 'Customer Login' :
                         selectedRole === 'Housekeeper' ? 'Housekeeper Login' :
                         selectedRole === 'Receptionist' ? 'Receptionist Login' :
                         'Super Admin Login'}
                      </h2>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1.5 font-light">
                    {selectedRole === 'Customer' ? 'Sign in to book hotel rooms and check itinerary logs.' :
                     selectedRole === 'Housekeeper' ? 'Sign in to review suite maintenance and cleaning schedules.' :
                     selectedRole === 'Receptionist' ? 'Sign in to execute check-ins, check-outs, and billing.' :
                     'General system administrative control room.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="yourname@Urban Tadkahotel.com"
                        className={`w-full pl-12 pr-4 py-3.5 bg-neutral-950/50 border rounded-xl text-slate-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 transition-all duration-300 font-light text-sm
                          ${errors.email ? 'border-rose-950 focus:ring-rose-500/10' : 'border-neutral-800'}`}
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                            message: 'Please enter a valid email address'
                          }
                        })}
                      />
                    </div>
                    {errors.email && (
                      <span className="text-xs text-rose-400 font-medium">{errors.email.message}</span>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Password</label>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`w-full pl-12 pr-11 py-3.5 bg-neutral-950/50 border rounded-xl text-slate-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 transition-all duration-300 font-light text-sm
                          ${errors.password ? 'border-rose-950 focus:ring-rose-500/10' : 'border-neutral-800'}`}
                        {...register('password', { required: 'Password is required' })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-xs text-rose-400 font-medium">{errors.password.message}</span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2.5 py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                {/* Google Sign-In: ONLY for Customer portal */}
                {selectedRole === 'Customer' && (
                  <>
                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-6">
                      <div className="absolute inset-x-0 h-px bg-neutral-800"></div>
                      <span className="relative px-4 text-[9px] uppercase font-bold text-neutral-500 tracking-[0.15em] bg-[#121319] rounded-full">
                        or continue with
                      </span>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="space-y-3">
                      <div id="google-btn-container" className="w-full hidden"></div>
                      
                      <button
                        type="button"
                        onClick={handleGoogleButtonClick}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-neutral-950/60 border border-neutral-850 hover:bg-neutral-900 hover:border-neutral-800 text-neutral-300 font-medium text-sm rounded-xl transition-all duration-300 cursor-pointer shadow hover:scale-[1.01]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.12 2.76-2.38 3.6v3h3.84c2.25-2.07 3.68-5.12 3.68-8.43z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-3c-1.07.72-2.45 1.15-4.09 1.15-3.15 0-5.82-2.13-6.77-5H1.28v3.1A11.988 11.988 0 0 0 12 24z" />
                          <path fill="#FBBC05" d="M5.23 14.24a7.195 7.195 0 0 1 0-4.48v-3.1H1.28a11.993 11.993 0 0 0 0 10.68l3.95-3.1z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.942 11.942 0 0 0 12 0C7.3 0 3.33 2.68 1.28 6.66l3.95 3.1c.95-2.87 3.62-5 6.77-5z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                    </div>
                  </>
                )}

                {/* Info & Navigation Section */}
                <div className="pt-6 border-t border-neutral-800 text-center space-y-4">
                  {selectedRole === 'Customer' ? (
                    <p className="text-xs text-neutral-450 font-light">
                      Don't have a guest account?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-amber-500 hover:text-amber-450 font-medium cursor-pointer underline underline-offset-4 decoration-amber-500/20 hover:decoration-amber-400 transition-all"
                      >
                        Create Account
                      </button>
                    </p>
                  ) : (
                    <p className="text-[11px] text-neutral-500 font-light flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Authorized staff access only. Managed by Hotel Administration.</span>
                    </p>
                  )}


                  {/* Portal Switcher Footer Link Grid */}
                  <div className="text-center pt-4 border-t border-neutral-900/60 space-y-2">
                    <p className="text-[9px] uppercase font-extrabold text-slate-500 tracking-widest">Select Portal View</p>
                    <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-[10px] text-slate-400 font-semibold">
                      <button type="button" onClick={() => handleRoleChange('Customer')} className={`hover:text-white hover:underline cursor-pointer ${selectedRole === 'Customer' ? 'text-emerald-500 font-bold' : ''}`}>Customer</button>
                      <span>•</span>
                      <button type="button" onClick={() => handleRoleChange('Housekeeper')} className={`hover:text-white hover:underline cursor-pointer ${selectedRole === 'Housekeeper' ? 'text-emerald-500 font-bold' : ''}`}>Housekeeper</button>
                      <span>•</span>
                      <button type="button" onClick={() => handleRoleChange('Receptionist')} className={`hover:text-white hover:underline cursor-pointer ${selectedRole === 'Receptionist' ? 'text-emerald-500 font-bold' : ''}`}>Receptionist</button>
                      <span>•</span>
                      <button type="button" onClick={() => handleRoleChange('SuperAdmin')} className={`hover:text-white hover:underline cursor-pointer ${selectedRole === 'SuperAdmin' ? 'text-emerald-500 font-bold' : ''}`}>Super Admin</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: FORGOT PASSWORD REQUEST EMAIL VIEW */}
            {view === 'forgot' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => { setView('login'); setApiError(null); setApiSuccess(null); }}
                  className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                  <span>Back to Login</span>
                </button>

                <div>
                  <h2 className="text-2xl font-medium text-white tracking-wide">Recover Password</h2>
                  <p className="text-xs text-neutral-400 mt-1.5 font-light">Enter your account email to receive a secure 6-digit OTP code.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="forgotEmail" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                        <Mail className="w-5 h-5" />
                      </span>
                      <input
                        id="forgotEmail"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="registered@email.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-xl text-slate-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 transition-all duration-300 font-light text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2.5 py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Code...</span>
                      </>
                    ) : (
                      <span>Request Verification Code</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* VIEW 3: RESET PASSWORD WITH OTP CODE VIEW */}
            {view === 'reset' && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setApiError(null); setApiSuccess(null); }}
                  className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                  <span>Change Email</span>
                </button>

                <div>
                  <h2 className="text-2xl font-medium text-white tracking-wide">Enter Code & Reset</h2>
                  <p className="text-xs text-neutral-400 mt-1.5 font-light">Enter the 6-digit code sent to your email and define your new password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  
                  {/* OTP Code Field */}
                  <div className="space-y-2">
                    <label htmlFor="otpCode" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">6-Digit Verification Code</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                        <Key className="w-5 h-5" />
                      </span>
                      <input
                        id="otpCode"
                        type="text"
                        maxLength="6"
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-xl text-slate-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 tracking-[0.2em] font-mono text-center text-base transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">New Password</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-amber-400 transition-colors">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-11 py-3.5 bg-neutral-950/50 border border-neutral-800 rounded-xl text-slate-100 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/80 transition-all duration-300 font-light text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2.5 py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;


