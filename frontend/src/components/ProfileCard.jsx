import React from 'react';
import { Calendar, Shield, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import ProfileImageUploader from './ProfileImageUploader';

const ProfileCard = ({ user, onImageUploaded, showToast }) => {
  const getDocStatus = () => {
    let docs = [];
    if (user && user.documents) {
      if (Array.isArray(user.documents)) {
        docs = user.documents;
      } else if (typeof user.documents === 'string') {
        try {
          docs = JSON.parse(user.documents);
        } catch (e) {
          docs = [];
        }
      }
    }
    if (!docs || docs.length === 0) return { text: 'No Docs Uploaded', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700', icon: <Shield className="w-3.5 h-3.5" /> };
    const hasVerified = docs.some(d => d && d.status === 'Verified');
    if (hasVerified) {
      return { text: 'Docs Verified', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
    }
    return { text: 'Docs Uploaded', color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30', icon: <Shield className="w-3.5 h-3.5" /> };
  };

  const docBadge = getDocStatus();

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
      {/* Background Decorator */}
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Sparkles className="w-20 h-20 text-indigo-500" />
      </div>

      {/* Integrated Profile Image Uploader */}
      <div className="relative z-10">
        <ProfileImageUploader
          currentImage={user?.profileImage}
          onUploadSuccess={onImageUploaded}
          showToast={showToast}
          userName={user?.name}
        />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.name || 'Guest'}</h2>
        <p className="text-xs text-slate-400">{user?.email}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 text-xs font-semibold border border-primary-100/50 dark:border-primary-900/30">
          <Shield className="w-3.5 h-3.5" />
          <span>{user?.role || 'Guest'}</span>
        </span>
        {user?.role === 'Customer' && (
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${docBadge.color}`}>
            {docBadge.icon}
            <span>{docBadge.text}</span>
          </span>
        )}
      </div>

      <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2 text-xs text-slate-500 space-y-2 text-left">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Member Since</span>
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
