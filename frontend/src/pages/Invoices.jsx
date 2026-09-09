import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Download, FileText, ArrowRight, Eye } from 'lucide-react';
import api from '../services/api';
import { TableSkeleton } from '../components/Skeletons';

const Invoices = () => {
  const { showToast } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const response = await api.get('/invoices', { params });
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showToast('Failed to load invoices list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      showToast('Preparing PDF download...', 'info');
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `invoice-${invoiceNumber || invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
      
      showToast('Invoice PDF downloaded successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to download invoice PDF', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-purple-200 to-white bg-clip-text text-transparent font-serif">
                  Hotel Invoices
                </h1>
                <p className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Billing Records · Tax Invoices · Downloadable PDFs
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              View billing invoices, tax breakdowns, and download official PDF summaries.
            </p>
          </div>
        </div>
      </div>

      {/* Search filter bar */}
      <div className="glass-card p-4 flex gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice code (e.g. INV-)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-855"
          />
        </div>
      </div>

      {/* Invoices list table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : invoices.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Invoice No</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Stay Room</th>
                  <th className="p-4">Invoice Date</th>
                  <th className="p-4">Pricing Breakdown</th>
                  <th className="p-4">Download</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.booking?.customer?.name}</div>
                      <div className="text-xs text-slate-400">{inv.booking?.customer?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Room {inv.booking?.room?.roomNumber}</div>
                      <div className="text-xs text-slate-400">{inv.booking?.room?.roomType}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-350">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-0.5 text-slate-550 dark:text-slate-400">
                        <div>Subtotal: ₹{inv.subtotal.toFixed(2)}</div>
                        <div>Tax: ₹{inv.tax.toFixed(2)}</div>
                        {inv.discount > 0 && <div className="text-rose-500">Discount: -₹{inv.discount.toFixed(2)}</div>}
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Total: ₹{inv.total.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">No generated invoices found.</div>
      )}
    </div>
  );
};

export default Invoices;
