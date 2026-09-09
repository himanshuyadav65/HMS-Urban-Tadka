import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CustomerLogin = () => {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('alice@guest.com');
  const [password, setPassword] = useState('guestpassword');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const tokenClientRef = useRef(null);

  const handleGoogleAccessTokenResponse = async (accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google', {
        accessToken,
      });
      setLoading(false);
      if (res.data.success) {
        const authRes = loginWithToken(res.data.data.token, res.data.data);
        if (authRes.success) {
          navigate('/dashboard/customer');
        } else {
          setError('Failed to synchronize authenticated session');
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Google login failed');
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1017026213247-vjf2lafb5vn1apu8siq35ldellnpp0ig.apps.googleusercontent.com';
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
    };

    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleGoogleLogin = () => {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      setError('Google Sign-In script is loading... Please try again in 2 seconds.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard/customer');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-2xl mb-2">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white font-serif">Customer Login</h2>
          <p className="text-xs text-slate-400">Sign in to book hotel rooms and check itinerary logs.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-slate-350 font-bold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="customer@email.com" 
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-350 font-bold">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500/50"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0B0C10] rounded-xl font-bold transition-all active:scale-95 shadow shadow-amber-500/10 cursor-pointer mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Google OAuth Login Button */}
        <div className="mt-5">
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-slate-950 px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">Or continue with</span>
            <div className="border-t border-white/10 w-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Portal Switcher Footer Link Grid */}
        <div className="text-center pt-5 border-t border-white/5 space-y-2 mt-6">
          <p className="text-[9px] uppercase font-extrabold text-slate-500 tracking-widest">Select Portal View</p>
          <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-[10px] text-slate-400 font-semibold">
            <button onClick={() => navigate('/login/customer')} className="text-amber-450 hover:text-white hover:underline cursor-pointer">Customer</button>
            <span>•</span>
            <button onClick={() => navigate('/login/housekeeping')} className="hover:text-white hover:underline cursor-pointer">Housekeeper</button>
            <span>•</span>
            <button onClick={() => navigate('/login/receptionist')} className="hover:text-white hover:underline cursor-pointer">Receptionist</button>
            <span>•</span>
            <button onClick={() => navigate('/login/superadmin')} className="hover:text-white hover:underline cursor-pointer">Super Admin</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerLogin;
