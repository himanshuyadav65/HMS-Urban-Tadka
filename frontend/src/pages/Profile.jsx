import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Calendar, UserCheck, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import ProfileImageUploader from '../components/ProfileImageUploader';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      showToast(error.response?.data?.message || 'Failed to load profile details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUploaded = (newImagePath) => {
    setProfileData(prev => prev ? { ...prev, profileImage: newImagePath, avatar: newImagePath } : null);
    // Reload user context to sync profile picture across layouts
    window.location.reload();
  };

  const handleDocsUpdated = (updatedDocs) => {
    setProfileData(prev => prev ? { ...prev, documents: updatedDocs } : null);
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
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  My Profile
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Personal Details · Avatar · Document Verification
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Manage your personal details, profile picture, and official document verification records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/profile/edit')}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border border-emerald-400/30 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-emerald-200" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <ProfileCard 
            user={profileData} 
            onImageUploaded={handleImageUploaded} 
            showToast={showToast} 
          />
        </div>

        {/* Right Column: Profile details summary and Document Uploader */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Summary */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{profileData?.name || 'N/A'}</span>
                </div>
              </div>

              {/* Email address */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Read Only)</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{profileData?.email || 'N/A'}</span>
                </div>
              </div>

              {/* Phone number */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{profileData?.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {profileData?.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Not Specified'}
                  </span>
                </div>
              </div>

              {/* Gender */}
              <div className="flex gap-3">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{profileData?.gender || 'Not Specified'}</span>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-3 md:col-span-2">
                <div className="p-2 h-9 w-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Address</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{profileData?.address || 'Not Specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
