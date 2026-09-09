import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HousekeepingLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('housekeeper@hotel.com');
  const [password, setPassword] = useState('housekeeperpassword');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard/housekeeping');
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
          <div className="inline-flex p-3 bg-amber-500/15 text-amber-400 rounded-2xl mb-2">
            <span className="text-xl">🧹</span>
          </div>
          <h2 className="text-2xl font-black text-white font-serif">Housekeeper Login</h2>
          <p className="text-xs text-slate-400">Sign in to claim cleaning queues and check dirty rooms list.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-slate-350 font-bold">Housekeeper Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="housekeeper@hotel.com" 
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

        {/* Portal Switcher Footer Link Grid */}
        <div className="text-center pt-5 border-t border-white/5 space-y-2 mt-6">
          <p className="text-[9px] uppercase font-extrabold text-slate-500 tracking-widest">Select Portal View</p>
          <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 text-[10px] text-slate-400 font-semibold">
            <button onClick={() => navigate('/login/customer')} className="hover:text-white hover:underline cursor-pointer">Customer</button>
            <span>•</span>
            <button onClick={() => navigate('/login/housekeeping')} className="text-amber-450 hover:text-white hover:underline cursor-pointer">Housekeeper</button>
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

export default HousekeepingLogin;
