import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Calendar, UserCheck, Lock, Eye, EyeOff, Save, ArrowLeft, Loader2, Globe } from 'lucide-react';
import api from '../services/api';
import DatePicker from '../components/DatePicker';

const EditProfile = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  // Common Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  // Customer-only fields
  const [emergencyContact, setEmergencyContact] = useState('');
  const [nationality, setNationality] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [passport, setPassport] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users/profile');
        if (response.data.success) {
          const u = response.data.data;
          setName(u.name || '');
          setPhone(u.phone || '');
          setAddress(u.address || '');
          setGender(u.gender || '');
          setRole(u.role || 'Customer');
          
          // Customer-only details
          setEmergencyContact(u.emergencyContact || '');
          setNationality(u.nationality || '');
          setAadhaar(u.aadhaar || '');
          setPassport(u.passport || '');
          setDrivingLicense(u.drivingLicense || '');

          if (u.dateOfBirth) {
            const dateObj = new Date(u.dateOfBirth);
            const formattedDate = dateObj.toISOString().split('T')[0];
            setDateOfBirth(formattedDate);
          }
        }
      } catch (error) {
        console.error('Failed to load profile settings:', error);
        showToast('Failed to load profile configurations', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        phone,
        address,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      };

      if (password) {
        payload.password = password;
      }

      if (role === 'Customer') {
        payload.emergencyContact = emergencyContact;
        payload.nationality = nationality;
        payload.aadhaar = aadhaar;
        payload.passport = passport;
        payload.drivingLicense = drivingLicense;
      }

      const response = await api.put('/users/profile', payload);
      if (response.data.success) {
        showToast('Profile updated successfully', 'success');
        
        // Sync session and local storage user details (excluding tokens)
        const cachedUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
        const updatedUser = { ...cachedUser, ...response.data.data };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));

        navigate('/profile');
      }
    } catch (error) {
      console.error('Failed to update profile details:', error);
      showToast(error.response?.data?.message || 'Failed to update profile settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all cursor-pointer backdrop-blur-md"
                title="Back to Profile"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-400" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Edit Profile
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Account Configuration · Password · Security Settings
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Modify your contact details and account security settings for Urban Tadka.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            Profile Settings ({role})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter contact phone"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date of Birth</span>
              </label>
              <DatePicker
                value={dateOfBirth}
                onChange={(date) => setDateOfBirth(date)}
                max={new Date().toISOString().split('T')[0]}
                placeholder="Select Date of Birth"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Gender</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100 dark:bg-slate-900"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Physical Address</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Enter physical address"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Customer Only Fields */}
            {role === 'Customer' && (
              <>
                <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identity & Nationality</h4>
                  <p className="text-xs text-slate-400">Provide official details below to link for reservations verification.</p>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Emergency Contact</span>
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Emergency name or phone"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Nationality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Nationality</span>
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="e.g. Indian"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Aadhaar Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Aadhaar Number</span>
                  </label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    placeholder="12-digit Aadhaar Card number"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Passport Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Passport Number</span>
                  </label>
                  <input
                    type="text"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    placeholder="Passport registration number"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Driving License Number */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Driving License Number</span>
                  </label>
                  <input
                    type="text"
                    value={drivingLicense}
                    onChange={(e) => setDrivingLicense(e.target.value)}
                    placeholder="DL identification number"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Change Password</h4>
              <p className="text-xs text-slate-400 mb-2">Leave fields blank if you do not wish to modify password.</p>
            </div>

            {/* New Password */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-3 pr-10 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="py-2 px-5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 py-2 px-5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 disabled:opacity-75 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md shadow-primary-600/10 active:scale-95 disabled:scale-100"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
