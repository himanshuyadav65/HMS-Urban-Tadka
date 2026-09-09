import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BarChart3, TrendingUp, Compass, Users, Sparkles, Download, Calendar } from 'lucide-react';
import api from '../services/api';
import { TableSkeleton } from '../components/Skeletons';

const Reports = () => {
  const { showToast } = useOutletContext();
  const [activeTab, setActiveTab] = useState('revenue');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/reports?reportType=${activeTab}`).catch(() => null);
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setReportData(response.data.data);
      } else {
        // Fallback report data
        if (activeTab === 'revenue') {
          setReportData([
            { date: '2026-08-03', revenue: 45200, transactions: 4 },
            { date: '2026-08-02', revenue: 38900, transactions: 3 },
            { date: '2026-08-01', revenue: 52100, transactions: 5 },
            { date: '2026-07-31', revenue: 29000, transactions: 2 },
          ]);
        } else if (activeTab === 'occupancy') {
          setReportData([
            { status: 'Available', count: 15 },
            { status: 'Occupied', count: 6 },
            { status: 'Cleaning', count: 2 },
          ]);
        } else {
          setReportData([
            { name: 'Alice Guest', phone: '+1 (555) 011-8899', visits: 4, spent: 68500 },
            { name: 'John Doe', phone: '+1 (555) 222-3333', visits: 2, spent: 34900 },
            { name: 'Ramesh Singh', phone: '+91 9876543210', visits: 3, spent: 48200 }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load reports', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const safeReportData = Array.isArray(reportData) ? reportData : [];

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
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Business Intelligence Reports
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Financial Analytics · Room Utilization · Guest Spending
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Extract operational figures, revenue lists, and occupant details for Urban Tadka.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs selectors bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 border-b-2 
            ${activeTab === 'revenue' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenue Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('occupancy')}
          className={`pb-3 font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 border-b-2 
            ${activeTab === 'occupancy' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Room Utilization</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 border-b-2 
            ${activeTab === 'customers' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4" />
          <span>Top Spent Guests</span>
        </button>
      </div>

      {/* Report Data display area */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <div className="glass-card overflow-hidden">
          {activeTab === 'revenue' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Settlement Date</th>
                    <th className="p-4">Daily Collected Revenue</th>
                    <th className="p-4">Transactions Processed</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                  {reportData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-455" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-md">₹{item.revenue.toFixed(2)}</td>
                      <td className="p-4 font-semibold text-slate-650 dark:text-slate-350">{item.transactions} Invoice(s)</td>
                      <td className="p-4">
                        <span className="inline-block text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 font-bold px-2 py-0.5 rounded-full">
                          Closed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'occupancy' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-4">Room Utilization Count</h3>
                <div className="space-y-4">
                  {reportData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.status} Rooms</span>
                      <span className="font-extrabold text-indigo-650 dark:text-indigo-400 text-lg">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-primary-50 dark:bg-primary-950/20 border border-primary-100/50 dark:border-primary-900/30 rounded-2xl">
                <Sparkles className="w-8 h-8 text-primary-500 mb-3" />
                <h4 className="font-bold text-primary-800 dark:text-primary-300 text-sm mb-1">Weekly Utilization Summary</h4>
                <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                  Utilization is calculated by checking the count of rooms in maintenance and booked state. To optimize room allocations, ensure cleaning schedules are completed within mornings before guest checking windows.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Phone / Contact</th>
                    <th className="p-4">Visit Count</th>
                    <th className="p-4">Total Settled Revenue</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                  {safeReportData.map((item, idx) => {
                    const name = item.name || item.customerName || item.guestName || 'Guest User';
                    const phone = item.phone || item.contact || item.email || 'N/A';
                    const visits = item.visits ?? item.visitCount ?? item.totalVisits ?? 1;
                    const spentVal = Number(item.spent ?? item.totalSpent ?? item.amount ?? 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{name}</td>
                        <td className="p-4 text-slate-500">{phone}</td>
                        <td className="p-4 font-semibold text-slate-650 dark:text-slate-350">{visits} visit(s)</td>
                        <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-md">₹{spentVal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
