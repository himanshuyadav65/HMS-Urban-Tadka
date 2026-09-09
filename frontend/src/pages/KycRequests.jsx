import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, FileText, Calendar, User, Mail, Eye, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';

const KycRequests = () => {
  const { showToast } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); // tracking doc uploader button loading state
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'Processed'
  
  // Lightbox preview modal state
  const [previewImage, setPreviewImage] = useState(null);

  const fetchKycRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/kyc-requests?status=${activeTab}`);
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error);
      showToast('Failed to load KYC reviews list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycRequests();
  }, [activeTab]);

  const handleVerify = async (userId, docId, actionStatus) => {
    setProcessingId(docId);
    try {
      const response = await api.put(`/users/${userId}/documents/${docId}/verify`, {
        status: actionStatus
      });

      if (response.data.success) {
        showToast(`Document marked as ${actionStatus} successfully`, 'success');
        fetchKycRequests();
      }
    } catch (error) {
      console.error('KYC update action failed:', error);
      showToast(error.response?.data?.message || 'Failed to update verification status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Flatten documents for mapping
  const docItems = [];
  requests.forEach(user => {
    user.documents?.forEach(doc => {
      if (activeTab === 'Pending' && doc.status === 'Pending') {
        docItems.push({
          user,
          doc
        });
      } else if (activeTab === 'Processed' && ['Verified', 'Rejected'].includes(doc.status)) {
        docItems.push({
          user,
          doc
        });
      }
    });
  });

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-orange-200 to-white bg-clip-text text-transparent font-serif">
                  Document Verification
                </h1>
                <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-widest mt-0.5">
                  KYC Audit · ID Compliance · Front-Desk Check-In
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Review and verify uploaded customer identification documents for Urban Tadka.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('Pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer
            ${activeTab === 'Pending'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <span>Pending Review</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Processed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer
            ${activeTab === 'Processed'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <span>Verification History</span>
        </button>
      </div>

      {docItems.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {activeTab === 'Pending' ? 'All Caught Up!' : 'No Processed Documents'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'Pending'
                ? 'There are no pending identity documents requiring validation review.'
                : 'There are no verified or rejected identity documents on record.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docItems.map(({ user, doc }) => (
            <div key={doc._id} className="glass-card p-6 flex flex-col justify-between space-y-6">
              {/* User and Doc Type Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                    {doc.docType}
                  </span>
                  <h3 className="text-base font-bold text-slate-850 dark:text-slate-150 flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{user.name}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Uploaded on</span>
                  </span>
                  <span className="block font-semibold mt-0.5">
                    {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Document Image Preview */}
              <div className="relative group overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-900/5 dark:bg-slate-950/20 h-48 flex items-center justify-center">
                {doc.docPath ? (
                  <>
                    <img
                      src={getAssetUrl(doc.docPath)}
                      alt={doc.docType}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setPreviewImage(getAssetUrl(doc.docPath))}
                        className="p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={getAssetUrl(doc.docPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Download className="w-4 h-4" />
                        <span>Open Original</span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <FileText className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">Document file path missing</p>
                  </div>
                )}
              </div>

              {/* Action Buttons or Status Badge */}
              {activeTab === 'Processed' ? (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    doc.status === 'Verified'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200/30'
                  }`}>
                    {doc.status === 'Verified' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  {/* Reject Button */}
                  <button
                    onClick={() => handleVerify(user._id, doc._id, 'Rejected')}
                    disabled={processingId !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl text-xs transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 disabled:scale-100"
                  >
                    {processingId === doc._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>Reject</span>
                  </button>

                  {/* Approve Button */}
                  <button
                    onClick={() => handleVerify(user._id, doc._id, 'Verified')}
                    disabled={processingId !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/10 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-50 disabled:scale-100"
                  >
                    {processingId === doc._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Preview</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-slate-400 hover:text-slate-850 dark:hover:text-slate-150 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-slate-950/5 dark:bg-slate-950/20 max-h-[70vh] overflow-auto">
              <img
                src={getAssetUrl(previewImage)}
                alt="Document Fullsize Preview"
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycRequests;
