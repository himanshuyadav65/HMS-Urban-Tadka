import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, Mail, Lock, Eye, EyeOff, Loader2, User, Phone, 
  ShieldCheck, AlertCircle, Building2, Star, Shield, Users 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GrandHorizonLogo from '../components/GrandHorizonLogo';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: 'Weak', pct: '0%', color: 'bg-rose-500' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Weak', pct: '33%', color: 'bg-rose-500' };
    if (score <= 4) return { label: 'Medium', pct: '66%', color: 'bg-amber-500' };
    return { label: 'Strong', pct: '100%', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    setApiError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
      });

      if (response.success) {
        setSuccessMsg('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } }
  };

  return (
    <div className="relative min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-950 font-sans text-slate-100 overflow-x-hidden select-none">
      
      {/* LEFT PANEL: Branding & Visuals (Hidden on mobile) */}
      <div className="lg:col-span-6 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-white/5 bg-slate-950">
        
        {/* Glow Decorators */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo Brand Header */}
        <div className="relative z-10">
          <GrandHorizonLogo size="large" variant="gold" />
        </div>

        {/* Visual Cards */}
        <div className="space-y-8 my-auto relative z-10">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-400 bg-amber-500/5 rounded-full border border-amber-500/20">
              <Shield className="w-3.5 h-3.5" />
              Secure Public Gateway
            </span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Join Our <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                Hospitality Network
              </span>
            </h2>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Explore signatures suites, ocean-facing rooms, and make direct booking reservations instantly using our premium SaaS planner.
            </p>
          </div>

          {/* Premium Room Suite 302 Visual Card */}
          <div className="p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl space-y-4 max-w-sm hover:scale-[1.01] transition-transform duration-300">
            <div className="relative h-44 overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" 
                alt="Luxury Ocean View Suite" 
                className="absolute inset-0 w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent z-10"></div>
              <div className="absolute bottom-3 left-3 z-20">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Luxury Ocean View</span>
                <h4 className="text-sm font-bold text-white">Premium Suite 302</h4>
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold text-emerald-400 bg-slate-950/80 border border-emerald-500/30 rounded-md z-20 backdrop-blur-sm">
                Suite 302
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Ocean Front Suites</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">4.9</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Rate Per Night</p>
                  <p className="text-base font-bold text-white">$249<span className="text-xs font-medium text-slate-400">/night</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Live Statistics</p>
                  <div className="flex items-center gap-1 text-slate-350 font-semibold justify-end mt-0.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs">1201+ Guests Today</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full w-[90%] rounded-full"></div>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>90% Occupancy Rate Today</span>
                  <span>Fully Serviced</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-xs text-slate-500 relative z-10">
          <span>&copy; 2026 Urban Tadka Group</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="lg:col-span-6 col-span-12 flex flex-col justify-center items-center p-6 md:p-12 relative bg-slate-950">
        
        {/* Glow effects for right panel */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          
          {/* Logo on small screens */}
          <div className="lg:hidden flex flex-col items-center justify-center text-center gap-2 mb-6">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl shadow-xl shadow-amber-500/20">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-serif">Urban Tadka</h1>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">5-Star Luxury</p>
            </div>
          </div>

          {/* Form Card Content */}
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl relative">
            <div className="space-y-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-100 tracking-wide font-serif">Create Account</h2>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Urban Tadka Portals</p>
                </div>
                {/* Badge: Signing up as: CUSTOMER */}
                <span className="text-[9px] px-2.5 py-1 rounded-full font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase tracking-widest">
                  Signing up as: CUSTOMER
                </span>
              </div>

              {/* SECURITY NOTE */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                  ℹ️ Staff accounts are created by Super Admin via invitation only. Public portals are restricted.
                </p>
              </div>

              {/* Display Messages */}
              {apiError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/25 text-rose-455 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold">{apiError}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Signup form */}
              <motion.form 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-4 text-xs"
              >
                            {/* Full Name */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <label htmlFor="name" className="block text-slate-350 font-bold uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-900/40 border rounded-xl text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/50 transition-colors
                        ${errors.name ? 'border-rose-500/50' : 'border-white/10'}`}
                      {...register('name', { required: 'Name is required' })}
                    />
                  </div>
                  {errors.name && (
                    <span className="text-xs text-rose-400 font-medium">{errors.name.message}</span>
                  )}
                </motion.div>

                {/* Email Address */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <label htmlFor="email" className="block text-slate-350 font-bold uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-900/40 border rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:border-amber-500/50 transition-colors
                        ${errors.email ? 'border-rose-500/50' : 'border-white/10'}`}
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
                </motion.div>

                {/* Phone Number */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <label htmlFor="phone" className="block text-slate-350 font-bold uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-900/40 border rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:border-amber-500/50 transition-colors
                        ${errors.phone ? 'border-rose-500/50' : 'border-white/10'}`}
                      {...register('phone', { required: 'Phone number is required' })}
                    />
                  </div>
                  {errors.phone && (
                    <span className="text-xs text-rose-400 font-medium">{errors.phone.message}</span>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <label htmlFor="password" className="block text-slate-350 font-bold uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 bg-slate-900/40 border rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:border-amber-500/50 transition-colors
                        ${errors.password ? 'border-rose-500/50' : 'border-white/10'}`}
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* PASSWORD STRENGTH METER */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-555">
                        <span>Password Strength:</span>
                        <span className="uppercase">{strength.label}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                        <div className={`h-full transition-all duration-300 rounded-full ${strength.color}`} style={{ width: strength.pct }} />
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <span className="text-xs text-rose-400 font-medium">{errors.password.message}</span>
                  )}
                </motion.div>

                {/* Confirm Password */}
                <motion.div variants={itemVariants} className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-slate-350 font-bold uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 bg-slate-900/40 border rounded-xl text-slate-200 placeholder-slate-655 focus:outline-none focus:border-amber-500/50 transition-colors
                        ${errors.confirmPassword ? 'border-rose-500/50' : 'border-white/10'}`}
                      {...register('confirmPassword', { 
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs text-rose-400 font-medium">{errors.confirmPassword.message}</span>
                  )}
                </motion.div>

                {/* Trust badge text */}
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 justify-center py-1">
                  <span>🔒 Email OTP + ID verified at hotel check-in</span>
                </div>

                {/* Submit button */}
                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:bg-slate-800 disabled:text-slate-500 text-[#0B0C10] font-bold rounded-xl shadow-lg shadow-amber-500/10 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </motion.button>
              </motion.form>

              {/* Login redirection */}
              <div className="text-center pt-3.5 border-t border-white/5">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/login/customer')} 
                    className="text-amber-500 hover:text-amber-400 font-bold underline ml-1 cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>

            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default Register;
