import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, X, ZoomIn, ZoomOut, RotateCw, CheckCircle2, Sliders, Eye, ExternalLink, User } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';

const ProfileImageUploader = ({ currentImage, onUploadSuccess, showToast, userName }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(currentImage || '');
  
  // Instagram-style Fullscreen View Modal state
  const [showViewModal, setShowViewModal] = useState(false);

  // Customization modal states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
  // Image adjustment states (zoom & rotation)
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setCurrentAvatar(currentImage || '');
  }, [currentImage]);

  // Step 1: Handle File Selection (Open Customize Modal instead of direct upload)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size must be less than 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile(file);
      setFilePreview(reader.result);
      setZoom(1);
      setRotation(0);
      setShowViewModal(false); // Close view modal if open
      setShowCustomizeModal(true);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Step 2: Save Profile Picture to Server
  const handleSaveProfilePicture = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.post('/users/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      if (response.data.success) {
        const uploadedPath = response.data.data.profileImage;
        setCurrentAvatar(uploadedPath);
        showToast('Profile picture saved successfully!', 'success');
        if (onUploadSuccess) {
          onUploadSuccess(uploadedPath);
        }
        setShowCustomizeModal(false);
        setSelectedFile(null);
        setFilePreview(null);
      }
    } catch (error) {
      console.error('Profile image upload failed:', error);
      showToast(error.response?.data?.message || 'Failed to save profile picture', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCloseCustomizeModal = () => {
    if (isUploading) return;
    setShowCustomizeModal(false);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const fullAvatarUrl = getAssetUrl(currentAvatar);

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Avatar Container with fixed dimensions & Click to View like Instagram */}
      <div className="relative group shrink-0 w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px]">
        <div 
          onClick={() => setShowViewModal(true)}
          className="w-24 h-24 rounded-full overflow-hidden cursor-pointer relative shrink-0 ring-4 ring-emerald-500/20 hover:ring-emerald-500/60 transition-all duration-300 active:scale-95"
          title="Click to view Instagram-style full photo"
        >
          {currentAvatar ? (
            <img
              src={fullAvatarUrl}
              alt="Profile Avatar"
              style={{ width: '96px', height: '96px', maxWidth: '96px', maxHeight: '96px', objectFit: 'cover' }}
              className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-md transition-opacity group-hover:opacity-90 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-600 text-white border-4 border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-center font-extrabold text-2xl uppercase shrink-0">
              {userName?.slice(0, 2) || 'GP'}
            </div>
          )}

          {/* Hover View Overlay Hint */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Eye className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Change Camera Button Overlay */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
          className="absolute bottom-0 right-0 p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white rounded-full shadow-lg transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white dark:border-slate-900 z-10"
          title="Change / Upload profile photo"
        >
          <Camera className="w-4 h-4 text-white" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* 📸 1. INSTAGRAM-STYLE FULLSCREEN PROFILE PHOTO VIEWER MODAL */}
      {showViewModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowViewModal(false)}
        >
          {/* Close Button Top Right */}
          <button 
            onClick={() => setShowViewModal(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer backdrop-blur-md border border-white/20"
            title="Close viewer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal Container */}
          <div 
            className="flex flex-col items-center space-y-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Large Circular Avatar Frame */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl ring-8 ring-white/10 shrink-0 bg-slate-950 flex items-center justify-center">
              {currentAvatar ? (
                <img
                  src={fullAvatarUrl}
                  alt={userName || "Profile Picture"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-emerald-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-6xl uppercase">
                  {userName?.slice(0, 2) || 'GP'}
                </div>
              )}
            </div>

            {/* Profile User Info */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-white tracking-wide">{userName || "Guest Profile"}</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Profile Picture</p>
            </div>

            {/* Action Bar Buttons */}
            <div className="flex items-center justify-center gap-3 w-full pt-2">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Change Photo</span>
              </button>

              {currentAvatar && (
                <a
                  href={fullAvatarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Full Size</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✂️ 2. CUSTOMIZE & CROP PHOTO MODAL */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl animate-slide-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-950/40">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Customize Profile Photo</h3>
              </div>
              <button 
                onClick={handleCloseCustomizeModal}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex flex-col items-center">
              {/* Circular Preview Container with Zoom and Rotation applied */}
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-500/80 shadow-2xl bg-slate-950 flex items-center justify-center shrink-0">
                {filePreview && (
                  <img
                    src={filePreview}
                    alt="Customizing Preview"
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  />
                )}
              </div>

              {/* Adjustments Controls */}
              <div className="w-full space-y-4 bg-slate-50 dark:bg-neutral-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-neutral-800">
                {/* Zoom Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zoom Level ({zoom.toFixed(1)}x)</span>
                    </span>
                    <button 
                      onClick={() => setZoom(1)} 
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Reset Zoom
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <ZoomOut className="w-4 h-4 text-slate-400" />
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                    <ZoomIn className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Rotation Control */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-neutral-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rotation: {rotation}°</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-1.5 text-slate-800 dark:text-white"
                  >
                    <RotateCw className="w-3 h-3 text-indigo-500" />
                    <span>Rotate 90°</span>
                  </button>
                </div>
              </div>

              {/* Upload Progress bar if uploading */}
              {isUploading && (
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>Saving Profile Picture...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={handleCloseCustomizeModal}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfilePicture}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Save Profile Picture</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUploader;
