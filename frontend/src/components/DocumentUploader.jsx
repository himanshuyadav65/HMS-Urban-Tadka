import React, { useState } from 'react';
import { Upload, CheckCircle, Clock, AlertTriangle, FileText, Download, Loader2 } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';

const DocumentUploader = ({ documents, onUploadSuccess, showToast }) => {
  const docTypes = ['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License'];
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [progress, setProgress] = useState(0);

  // Helper to find document status & path
  const getDocInfo = (type) => {
    const doc = documents?.find(d => d.docType === type);
    return doc || null;
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Document size must be less than 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('docType', type);
    formData.append('document', file);

    setUploadingDoc(type);
    setProgress(0);

    try {
      const response = await api.post('/users/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentage);
        },
      });

      if (response.data.success) {
        showToast(`${type} uploaded successfully. Status: Pending Admin Review.`, 'success');
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      showToast(error.response?.data?.message || 'Failed to upload document', 'error');
    } finally {
      setUploadingDoc(null);
      setProgress(0);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Document Uploaded (Verified ✓)</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Document Uploaded</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Rejected - Re-upload Required</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Document Not Uploaded</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Customer Identity Documents</h3>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          Optional for Express Check-in
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docTypes.map((type) => {
          const docInfo = getDocInfo(type);
          const isUploading = uploadingDoc === type;

          return (
            <div
              key={type}
              className={`p-4 border rounded-xl flex flex-col justify-between space-y-4 transition-all duration-200 ${
                docInfo?.status === 'Verified'
                  ? 'border-emerald-200 dark:border-emerald-950/50 bg-emerald-50/10 dark:bg-emerald-950/5'
                  : docInfo?.status === 'Rejected'
                  ? 'border-rose-200 dark:border-rose-950/50 bg-rose-50/10 dark:bg-rose-950/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    docInfo?.status === 'Verified'
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {type}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Identity Document
                    </p>
                  </div>
                </div>
                {getStatusBadge(docInfo?.status)}
              </div>

              {/* Action Upload Area */}
              <div className="pt-2">
                {isUploading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400">
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary-600 h-full transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    {docInfo?.status === 'Verified' ? (
                      <div className="flex-1 py-2 px-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        Document Verified & Approved
                      </div>
                    ) : (
                      /* Upload File Input */
                      <label className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/20 dark:hover:bg-primary-950/10 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 cursor-pointer text-center">
                        <Upload className="w-4 h-4" />
                        <span>{docInfo ? 'Replace Document' : 'Upload File'}</span>
                        <input
                          type="file"
                          onChange={(e) => handleUpload(e, type)}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                      </label>
                    )}

                    {/* View Document */}
                    {docInfo?.docPath && (
                      <a
                        href={getAssetUrl(docInfo.docPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-all duration-200 flex items-center justify-center"
                        title="Download / View document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentUploader;
