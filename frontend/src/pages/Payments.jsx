import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, IndianRupee, Calendar, Tag, Download, Eye, ShieldAlert, ShieldCheck, Printer, X, Banknote, QrCode, Building2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { TableSkeleton } from '../components/Skeletons';
import UrbanTadkaLogo from '../assets/urban-tadka-hotel-logo.jpg';

const Payments = () => {
  const { showToast } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  // Selected payment for Receipt Modal
  const [selectedPayment, setSelectedPayment] = useState(null);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ', ' +
      d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments
      const response = await api.get('/payments');
      if (response.data.success) {
        setPayments(response.data.data);
      }

      // Fetch invoices to match for downloads
      const invoiceRes = await api.get('/invoices');
      if (invoiceRes.data.success) {
        setInvoices(invoiceRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching payments details:', error);
      showToast('Failed to load payments ledger details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadInvoicePdf = async (invoiceId, invoiceNumber) => {
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

  const handleDownloadInvoiceByBooking = (bookingId) => {
    const matchingInvoice = invoices.find(inv => inv.booking?._id === bookingId);
    if (matchingInvoice) {
      handleDownloadInvoicePdf(matchingInvoice._id, matchingInvoice.invoiceNumber);
    } else {
      showToast('No matching invoice found for this payment booking.', 'error');
    }
  };

  // Tab Filtering
  const getFilteredPayments = () => {
    if (activeTab === 'All') return payments;
    if (activeTab === 'Advance') {
      return payments.filter(p => p.paymentType === 'Advance');
    }
    if (activeTab === 'Completed') {
      return payments.filter(p => p.paymentStatus === 'Completed' && p.paymentType !== 'Advance');
    }
    if (activeTab === 'Pending') return payments.filter(p => p.paymentStatus === 'Pending');
    if (activeTab === 'Failed') return payments.filter(p => p.paymentStatus === 'Failed');
    if (activeTab === 'Refunded') return payments.filter(p => p.paymentStatus === 'Refunded');
    return payments;
  };

  const filteredPayments = getFilteredPayments();

  const getPaymentDetails = (payment) => {
    if (payment.paymentStatus === 'Failed') {
      return {
        label: 'Failed',
        sub: 'Payment Unsuccessful',
        badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
      };
    }
    if (payment.paymentStatus === 'Pending') {
      return {
        label: 'Pending',
        sub: 'Awaiting Confirmation',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
      };
    }
    if (payment.paymentStatus === 'Refunded') {
      return {
        label: 'Refunded',
        sub: 'Amount Returned',
        badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
      };
    }

    const bTotal = payment.bookingTotalAmount || payment.booking?.totalAmount || 0;
    const due = payment.balanceDue !== undefined ? payment.balanceDue : Math.max(0, bTotal - (payment.amount || 0));
    const isAdvance = payment.paymentType === 'Advance' || due > 0.5;
    const isSettlement = payment.paymentType === 'Settlement' || payment.advancePaidPrior > 0.5;

    if (isAdvance) {
      return {
        label: 'Advance Paid',
        sub: bTotal > 0 ? `Stay: ₹${bTotal.toFixed(0)} • Balance Due: ₹${due.toFixed(0)}` : 'Partial Advance',
        badge: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30'
      };
    }

    if (isSettlement) {
      return {
        label: 'Settlement Paid',
        sub: 'Final Checkout Settle',
        badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
      };
    }

    return {
      label: 'Complete (Fully Paid)',
      sub: '100% Upfront Online',
      badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
    };
  };



  const formatTransactionId = (payment) => {
    if (!payment) return 'N/A';
    const method = payment.paymentMethod || 'Cash';
    const rawTxn = payment.transactionId || '';

    if (method === 'Cash') {
      const numPart = rawTxn.replace(/[^0-9]/g, '') || rawTxn.slice(-6);
      return `CASH-RCPT-${numPart || 'DESK'}`;
    }
    return rawTxn || 'N/A';
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-teal-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Payments Ledger
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Financial Transactions · Advance & Settlement Audit · Razorpay Gateways
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Track and review all advance booking payments and checkout settlements in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {[
          { key: 'All', label: 'All Transactions' },
          { key: 'Advance', label: '🟢 Advance Paid' },
          { key: 'Completed', label: '✓ Completed / Settle' },
          { key: 'Pending', label: 'Pending' },
          { key: 'Failed', label: 'Failed' },
          { key: 'Refunded', label: 'Refunded' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-750 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments list table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredPayments.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-800 dark:text-slate-100">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-450 uppercase tracking-wider">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Room & Booking</th>
                  <th className="p-4">Payment Status / Stage</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredPayments.map((payment) => {
                  const bookingObj = payment.booking;
                  const roomObj = bookingObj?.room;
                  const statusInfo = getPaymentDetails(payment);

                  return (
                    <tr key={payment._id || payment.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="block font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {formatTransactionId(payment)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                                payment.paymentMethod === 'Cash'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {payment.paymentMethod === 'Cash' ? '💵 Cash Desk' : payment.paymentMethod || 'Razorpay'}
                              </span>
                              {payment.paymentId && payment.paymentMethod !== 'Cash' && (
                                <span className="font-mono text-[9px] text-slate-400">ID: {payment.paymentId}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {payment.customer?.name || bookingObj?.customer?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {payment.customer?.phone || bookingObj?.customer?.phone || ''}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {roomObj ? (
                            `Room ${roomObj.roomNumber} (${roomObj.roomType})`
                          ) : bookingObj ? (
                            `Booking #${(bookingObj.bookingId || bookingObj._id || '').toString().slice(-6)}`
                          ) : (
                            'Hotel Reservation'
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Ref: {bookingObj?.bookingId || 'Direct'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                            {statusInfo.sub}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5 font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                          <IndianRupee className="w-3.5 h-3.5 mt-0.5" />
                          <span>{payment.amount.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                          
                          <button
                            onClick={() => handleDownloadInvoiceByBooking(bookingObj?._id || bookingObj?.id || payment._id || payment.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 border ${
                              payment.paymentStatus === 'Failed'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200/50'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{payment.paymentStatus === 'Failed' ? 'Failed Inv' : 'Invoice'}</span>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">
          No transaction payment logs found for the selected filter.
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md transition-opacity">
          <div className="relative max-w-lg w-full max-h-[92vh] flex flex-col bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl print:shadow-none animate-scale-up">
            
            {/* Modal Actions (Sticky Header) */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 print:hidden bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {selectedPayment.paymentStatus === 'Failed' ? '⚠️ Payment Failure Audit' : 'Official Transaction Receipt'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadInvoiceByBooking(selectedPayment.booking?._id || selectedPayment.booking?.id || selectedPayment._id || selectedPayment.id)}
                  className="px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={printReceipt}
                  className="px-2.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body (Scrollable with neat scrollbar) */}
            <div className="p-5 sm:p-6 space-y-4 text-slate-800 dark:text-slate-200 print:text-black overflow-y-auto flex-1">
              {/* Hotel Header */}
              <div className="text-center space-y-1">
                <div className="flex justify-center mb-1">
                  <img src={UrbanTadkaLogo} alt="Urban Tadka" className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400/50 shadow-md print:ring-amber-600" />
                </div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white print:text-black">Urban Tadka</h2>
                <p className="text-[11px] text-slate-400">Official Payment Transaction Receipt</p>
                <div className="pt-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 w-2/3 mx-auto"></div>
              </div>

              {/* Status & Type */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Payment Stage</span>
                {(() => {
                  const info = getPaymentDetails(selectedPayment);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${info.badge}`}>
                      {info.label}
                    </span>
                  );
                })()}
              </div>

              {/* Payment Details List */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 print:bg-transparent print:border-none print:p-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Guest Name</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {selectedPayment.customer?.name || selectedPayment.booking?.customer?.name || 'Guest'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Phone Number</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {selectedPayment.customer?.phone || selectedPayment.booking?.customer?.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Booking Reference</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {selectedPayment.booking?.bookingId || 'Direct'}
                  </span>
                </div>
                {selectedPayment.booking?.room && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Allocated Room</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Room {selectedPayment.booking.room.roomNumber} ({selectedPayment.booking.room.roomType})
                    </span>
                  </div>
                )}
                {selectedPayment.booking?.checkIn && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Check-In Date</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {new Date(selectedPayment.booking.checkIn).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                {selectedPayment.booking?.originalCheckOut && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Old Check-Out (Initial)</span>
                    <span className="font-semibold text-slate-500 line-through">
                      {new Date(selectedPayment.booking.originalCheckOut).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                {selectedPayment.booking?.checkOut && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{selectedPayment.booking?.originalCheckOut ? 'Extended Check-Out' : 'Check-Out Date'}</span>
                    <span className={`font-bold ${selectedPayment.booking?.originalCheckOut ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {new Date(selectedPayment.booking.checkOut).toLocaleDateString('en-IN')}
                      {selectedPayment.booking?.extensionNights > 0 && ` (+${selectedPayment.booking.extensionNights} Nights)`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/40 dark:border-slate-800/50">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    {selectedPayment.paymentMethod === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-500" />}
                    {selectedPayment.paymentMethod === 'UPI' && <QrCode className="w-3.5 h-3.5 text-emerald-500" />}
                    {selectedPayment.paymentMethod === 'NetBanking' && <Building2 className="w-3.5 h-3.5 text-emerald-500" />}
                    {(!selectedPayment.paymentMethod || selectedPayment.paymentMethod === 'Razorpay' || selectedPayment.paymentMethod === 'Card') && (
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>
                      {selectedPayment.paymentMethod === 'Cash' 
                        ? 'Cash (Front Desk Counter)' 
                        : selectedPayment.paymentMethod === 'UPI'
                        ? 'UPI / QR Payment'
                        : selectedPayment.paymentMethod === 'NetBanking'
                        ? 'Net Banking'
                        : 'Online (Card / Gateway)'}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">
                    {selectedPayment.paymentMethod === 'Cash' ? 'Cash Receipt No.' : 'Transaction / Order ID'}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatTransactionId(selectedPayment)}
                  </span>
                </div>
                {selectedPayment.paymentId && selectedPayment.paymentMethod !== 'Cash' && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Gateway Payment ID</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{selectedPayment.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Transaction Date & Time</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {formatDateTime(selectedPayment.paidAt || selectedPayment.createdAt)}
                  </span>
                </div>
              </div>

              {/* Itemized Total Paid & Extension Block */}
              <div className="space-y-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                {(() => {
                  const b = selectedPayment.booking;
                  const isExt = Boolean(b?.originalCheckOut || b?.extensionNights > 0 || b?.isExtended);
                  const extNights = parseInt(b?.extensionNights || 0);
                  const totalNights = parseInt(b?.totalDays || 1);
                  const initNights = isExt && extNights > 0 ? Math.max(1, totalNights - extNights) : totalNights;
                  const rate = parseFloat(b?.pricePerNight || b?.room?.pricePerNight || 0);
                  const initSubtotal = initNights * rate;
                  const extSubtotal = extNights * rate;
                  const taxAmount = parseFloat(b?.tax || 0);
                  const bTotal = selectedPayment.bookingTotalAmount || b?.totalAmount || 0;

                  return (
                    <div className="space-y-1.5 text-xs bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                      {isExt && extNights > 0 ? (
                        <>
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Initial Stay ({initNights}N @ ₹{rate}):</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">₹{initSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span>Stay Extension (+{extNights}N @ ₹{rate}):</span>
                            <span className="font-bold">₹{extSubtotal.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Room Tariff ({totalNights}N @ ₹{rate}):</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{(totalNights * rate).toFixed(2)}</span>
                        </div>
                      )}

                      {taxAmount > 0 && (
                        <div className="flex justify-between items-center text-slate-500">
                          <span>GST (18% Tax):</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{taxAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {bTotal > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                          <span>Total Stay Tariff:</span>
                          <span>₹{bTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* If this is settlement, show the prior advance paid deduction */}
                {selectedPayment.paymentType === 'Settlement' && selectedPayment.advancePaidPrior > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Advance Paid Earlier:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      -₹{selectedPayment.advancePaidPrior.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">
                    {selectedPayment.paymentStatus === 'Failed'
                      ? 'Attempted Amount (Failed):'
                      : selectedPayment.paymentType === 'Advance'
                      ? 'Advance Paid in this Txn:'
                      : 'Amount Paid in this Txn:'}
                  </span>
                  <div className={`flex items-center text-lg font-black ${
                    selectedPayment.paymentStatus === 'Failed'
                      ? 'text-rose-600 dark:text-rose-400 line-through'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <IndianRupee className="w-4 h-4 mt-0.5" />
                    <span>{selectedPayment.amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Accurate remaining balance calculation */}
                {(() => {
                  const bTotal = selectedPayment.bookingTotalAmount || selectedPayment.booking?.totalAmount || 0;

                  if (selectedPayment.paymentStatus === 'Failed') {
                    return (
                      <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                        <span>🔴 Balance Due (Payment Unsuccessful):</span>
                        <span className="text-sm font-extrabold">₹{bTotal.toFixed(2)}</span>
                      </div>
                    );
                  }

                  const rem = selectedPayment.balanceDue !== undefined 
                    ? selectedPayment.balanceDue 
                    : Math.max(0, bTotal - (selectedPayment.advancePaidPrior || 0) - selectedPayment.amount);

                  if (rem > 0.5) {
                    return (
                      <div className="flex justify-between items-center text-xs text-amber-400 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <span>🟠 Balance Due (Payable at Check-Out):</span>
                        <span className="text-sm font-extrabold">₹{rem.toFixed(2)}</span>
                      </div>
                    );
                  }

                  return (
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✓ Balance Due:</span>
                      </span>
                      <span>₹0.00 (Fully Settled / Cleared)</span>
                    </div>
                  );
                })()}
              </div>

              {/* Footer Note */}
              <div className="text-center space-y-0.5 pt-1 pb-1">
                <p className="text-[10px] text-slate-400">This is a system generated transaction proof document.</p>
                <p className="text-[10px] font-semibold text-slate-500">Thank you for choosing Urban Tadka!</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
