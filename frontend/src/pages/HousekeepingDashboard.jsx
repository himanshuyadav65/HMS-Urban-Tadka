import React, { useEffect, useState } from 'react';
import { RefreshCw, Wrench, User, CheckCircle2, Clock, Sparkles, BrushIcon, AlertTriangle, Brush, Send, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  Dirty: {
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-900/50',
    dot: 'bg-rose-500',
    label: 'Dirty ⚠️',
    badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
  },
  Cleaning: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50',
    dot: 'bg-amber-500',
    label: 'In Progress ⏳',
    badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
  },
  Clean: {
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    dot: 'bg-emerald-500',
    label: 'Clean ✓',
    badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
  },
};

const HousekeepingDashboard = () => {
  const { user } = useAuth();
  const isSimulation = user?.role === 'SuperAdmin';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenance, setMaintenance] = useState({ roomId: '', subject: '', description: '', priority: 'Medium' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [simulationUsers, setSimulationUsers] = useState([]);
  const [selectedSimId, setSelectedSimId] = useState(sessionStorage.getItem('simulated_housekeeper_id') || localStorage.getItem('simulated_housekeeper_id') || '');
  const [housekeeperProfile, setHousekeeperProfile] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      if (isSimulation) {
        const [usersRes, allTasksRes] = await Promise.all([
          api.get('/users').catch(() => null),
          api.get('/housekeeping').catch(() => null)
        ]);

        const allUsers = usersRes?.data?.data || [];
        const housekeepers = allUsers.filter(u => u.role === 'Housekeeping');
        setSimulationUsers(housekeepers);

        let activeHK = housekeepers.find(u => u.id === selectedSimId);
        if (!activeHK && housekeepers.length > 0) {
          activeHK = housekeepers.find(u => u.email === 'housekeeper@hotel.com') || housekeepers[0];
        }

        if (activeHK) {
          setSelectedSimId(activeHK.id);
          sessionStorage.setItem('simulated_housekeeper_id', activeHK.id);
        }

        setHousekeeperProfile(activeHK || { name: 'Ramesh Housekeeper', email: 'housekeeper@hotel.com' });

        const hkTasks = allTasksRes?.data?.data?.filter(t => (t.staffId || t.staff) === activeHK?.id || (t.staffId || t.staff) === activeHK?._id) || allTasksRes?.data?.data || [];
        const formattedTasks = hkTasks.map(t => {
          let rm = t.roomNumber || t.room?.roomNumber;
          if (!rm && t.remarks) {
            const match = t.remarks.match(/room\s*#?\s*(\d+)/i);
            if (match) rm = match[1];
          }
          return {
            ...t,
            id: t._id || t.id,
            roomNumber: rm || '102'
          };
        });
        setTasks(formattedTasks);
      } else {
        const res = await api.get('/housekeeping/assigned').catch(() => null);
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map(t => {
            let rm = t.roomNumber || t.room?.roomNumber;
            if (!rm && t.remarks) {
              const match = t.remarks.match(/room\s*#?\s*(\d+)/i);
              if (match) rm = match[1];
            }
            return {
              ...t,
              id: t._id || t.id,
              roomNumber: rm || '102'
            };
          });
          setTasks(formatted);
        } else {
          setTasks([
            { id: 't1', roomNumber: '102', remarks: 'Change pillows & inspect minibar', status: 'Dirty' },
            { id: 't2', roomNumber: '302', remarks: 'Deep clean washroom', status: 'Cleaning' },
            { id: 't3', roomNumber: '204', remarks: 'Towels replenishment', status: 'Clean' },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedSimId]);

  const handleSync = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleUpdateCleaningStatus = async (taskId, newStatus) => {
    try {
      // Optimistic update for instant UI feedback!
      setTasks(prev => prev.map(t => (t.id === taskId || t._id === taskId) ? { ...t, status: newStatus } : t));

      if (taskId && !String(taskId).startsWith('t')) {
        await api.put(`/housekeeping/${taskId}`, { status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/maintenance', {
        roomId: maintenance.roomId,
        subject: maintenance.subject,
        description: maintenance.description,
        priority: maintenance.priority
      });
      setSubmitSuccess(true);
      setMaintenance({ roomId: '', subject: '', description: '', priority: 'Medium' });
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to register repair ticket');
    } finally {
      setSubmitLoading(false);
    }
  };

  const cleanCount = tasks.filter(t => t.status === 'Clean').length;
  const dirtyCount = tasks.filter(t => t.status === 'Dirty').length;
  const cleaningCount = tasks.filter(t => t.status === 'Cleaning').length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading Housekeeping Desk...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">

      {/* Simulation Banner */}
      {isSimulation && (
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Simulated Portal View</h4>
              <p className="text-[11px] text-indigo-100 mt-0.5">
                Viewing as <span className="font-bold underline">{housekeeperProfile?.name}</span> ({housekeeperProfile?.email})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase font-black tracking-wider text-indigo-100">Select Housekeeper:</label>
            <select
              value={selectedSimId}
              onChange={e => {
                const newId = e.target.value;
                setSelectedSimId(newId);
                sessionStorage.setItem('simulated_housekeeper_id', newId);
              }}
              className="bg-indigo-600 text-white border border-white/20 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
            >
              {simulationUsers.map(u => (
                <option key={u.id} value={u.id} className="text-slate-800">{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── 🌟 Luxury Housekeeping Command Deck Banner ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/25 shadow-2xl relative overflow-hidden">
        {/* Ambient Gold Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-yellow-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-500 dark:text-[#f2ca50] border border-amber-500/30">
                <Brush className="w-3.5 h-3.5 text-amber-500" /> Housekeeping & Sanitization
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Queue Sync
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-[#d4e4fa] tracking-tight font-bold">
              Urban Tadka Housekeeping Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#d0c5af] font-light max-w-2xl">
              Turnover queues, live suite sanitization updates, guest amenities replenishment, and direct maintenance dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSync}
              disabled={refreshing}
              className="p-3 bg-white dark:bg-[#0b1526] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-slate-800 dark:text-[#d4e4fa] rounded-2xl transition-all text-xs font-semibold shadow-sm hover:shadow-amber-500/10 cursor-pointer active:scale-95"
              title="Refresh Tasks"
            >
              <RefreshCw className={`w-4 h-4 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 💎 3 Luxury Housekeeping KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Cleaned & Ready', value: `${cleanCount} Suites`, icon: CheckCircle2, iconBg: 'bg-emerald-500/15 border-emerald-500/30', iconColor: 'text-emerald-500', subtext: 'Sanitized & inspected' },
          { label: 'In Progress Cleaning', value: `${cleaningCount} Suites`, icon: Clock, iconBg: 'bg-amber-500/15 border-amber-500/30', iconColor: 'text-amber-500', subtext: 'Housekeeper active' },
          { label: 'Pending Turnover', value: `${dirtyCount} Suites`, icon: AlertTriangle, iconBg: 'bg-rose-500/15 border-rose-500/30', iconColor: 'text-rose-500', subtext: 'Awaiting turnover' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, subtext }) => (
          <div key={label} className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-slate-900 dark:text-[#d4e4fa]">{value}</h3>
              </div>
              <div className={`p-3 ${iconBg} ${iconColor} rounded-2xl border group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-emerald-500 font-bold">● Live Queue</span>
              <span className="text-slate-400 dark:text-slate-500">{subtext}</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-transparent" />
          </div>
        ))}
      </div>

      {/* Main Layout: Full-width Cleaning Tasks */}
      <div className="bg-white dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">Cleaning Tasks Assigned</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{tasks.length} total assignment{tasks.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">No tasks assigned yet</p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500">All rooms are clean — great work! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => {
              const cfg = statusConfig[task.status] || statusConfig['Dirty'];
              return (
                <div
                  key={task.id}
                  className={`relative p-4 border ${cfg.border} ${cfg.bg} rounded-2xl flex flex-col justify-between space-y-3 hover:scale-[1.01] transition-all duration-200`}
                >
                  {/* Room Badge & Status */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-slate-900/70 dark:bg-black/40 text-white text-[10px] font-black rounded-lg border border-white/10 tracking-wider">
                      ROOM {task.roomNumber}
                    </span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Remarks */}
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                    {task.remarks || 'Standard cleaning required.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateCleaningStatus(task.id, 'Cleaning')}
                      className="flex-1 py-1.5 bg-amber-500/90 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm shadow-amber-500/20"
                    >
                      ⏳ Set Cleaning
                    </button>
                    <button
                      onClick={() => handleUpdateCleaningStatus(task.id, 'Clean')}
                      className="flex-1 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      ✅ Set Clean
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeepingDashboard;
