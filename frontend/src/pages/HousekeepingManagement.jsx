import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RefreshCw, User, CheckCircle2, AlertCircle, Sparkles, Loader2, PlayCircle, Plus, Info } from 'lucide-react';
import api from '../services/api';

const HousekeepingManagement = () => {
  const { showToast } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [housekeepers, setHousekeepers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      // 1. Fetch Housekeeping Tasks
      const tasksRes = await api.get('/housekeeping');
      if (tasksRes?.data?.success) {
        setTasks(tasksRes.data.data);
      }

      // 2. Fetch Rooms
      const roomsRes = await api.get('/rooms');
      if (roomsRes?.data?.success) {
        setRooms(roomsRes.data.data);
      }

      // 3. Fetch Staff (to filter Housekeepers)
      const staffRes = await api.get('/users');
      if (staffRes?.data?.success) {
        const cleaners = staffRes.data.data.filter(u => u.role === 'Housekeeping');
        setHousekeepers(cleaners);
      }
    } catch (error) {
      console.error('Failed to load housekeeping management data:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !selectedStaffId) {
      showToast('Please select both a room and a housekeeper', 'error');
      return;
    }

    setAssigning(true);
    try {
      // Find room in our list to get hotelId
      const room = rooms.find(r => r.id === selectedRoomId);
      const hotelId = room?.hotelId || room?.hotel?.id || '00000000-0000-0000-0000-000000000000'; // fallback mock UUID

      const response = await api.post('/housekeeping', {
        hotelId,
        roomId: selectedRoomId,
        staffId: selectedStaffId,
        remarks
      });

      if (response.data.success) {
        showToast('Housekeeping task assigned successfully', 'success');
        setSelectedRoomId('');
        setSelectedStaffId('');
        setRemarks('');
        fetchData();
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to assign task', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const response = await api.put(`/housekeeping/${taskId}`, { status: newStatus });
      if (response.data.success) {
        showToast(`Cleaning task marked as ${newStatus}`, 'success');
        fetchData();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update task status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Filter out rooms that are already clean / occupied or dirty
  // We can show all rooms, but it's nice to label them
  const eligibleRooms = rooms.filter(r => r.status !== 'Booked');

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-orange-200 to-white bg-clip-text text-transparent font-serif">
                  Housekeeping Control
                </h1>
                <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Cleaning Assignments · Staff Workloads · Inspection Queue
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Assign rooms for cleaning and inspect housekeeper tasks for Urban Tadka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border border-amber-400/30 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-200" />
              <span>Refresh Control</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Assign Cleaning Task Form */}
        <div className="lg:col-span-4 bg-white dark:bg-[#121319] border border-slate-200/60 dark:border-neutral-900 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Assign New Task</h2>
          </div>

          <form onSubmit={handleAssignTask} className="space-y-4 text-xs font-semibold">
            {/* Select Room */}
            <div className="space-y-1.5">
              <label htmlFor="roomSelect" className="block text-[11px] text-slate-300 dark:text-slate-300 uppercase font-bold tracking-wider">Room Number</label>
              <select
                id="roomSelect"
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                required
                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium text-xs focus:border-indigo-500 transition-colors"
              >
                <option value="" className="text-slate-500 dark:text-slate-400">Select Room</option>
                {eligibleRooms.map(r => (
                  <option key={r.id} value={r.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                    Room {r.roomNumber} - {r.roomType} (Currently {r.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Housekeeper */}
            <div className="space-y-1.5">
              <label htmlFor="staffSelect" className="block text-[11px] text-slate-300 dark:text-slate-300 uppercase font-bold tracking-wider">Assign Housekeeper</label>
              <select
                id="staffSelect"
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
                required
                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium text-xs focus:border-indigo-500 transition-colors"
              >
                <option value="" className="text-slate-500 dark:text-slate-400">Select Cleaner</option>
                {housekeepers.map(h => (
                  <option key={h.id} value={h.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label htmlFor="remarksInput" className="block text-[11px] text-slate-300 dark:text-slate-300 uppercase font-bold tracking-wider">Remarks / Instructions</label>
              <textarea
                id="remarksInput"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="e.g. Towel replacement, sanitize minibar, clean bathroom..."
                rows={3}
                className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 h-20 resize-none font-medium text-xs focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={assigning}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-xl font-bold transition-all active:scale-95 shadow flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Cleaning Task</span>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Tasks Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#121319] border border-slate-200/60 dark:border-neutral-900 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Assigned Tasks Queue</h2>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-[10px] font-bold rounded-md">
              {tasks.length} Active Tasks
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">All Rooms Cleaned</h3>
              <p className="text-xs text-slate-500">There are no outstanding rooms in the cleaning queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-300 uppercase font-bold">
                    <th className="py-3 font-semibold">Room</th>
                    <th className="py-3 font-semibold">Type</th>
                    <th className="py-3 font-semibold">Assigned Housekeeper</th>
                    <th className="py-3 font-semibold">Remarks</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {tasks.map(task => {
                    const hk = housekeepers.find(h => h.id === task.staffId);
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-900/20">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                          Room {task.room?.roomNumber || 'Unknown'}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                          {task.room?.roomType || 'Standard'}
                        </td>
                        <td className="py-3.5 text-slate-800 dark:text-slate-200 font-semibold">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{hk ? hk.name : 'Unknown Staff'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={task.remarks}>
                          {task.remarks || 'No instructions'}
                        </td>
                        <td className="py-3.5">
                          {task.status === 'Cleaning' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 shadow-sm animate-pulse">
                              <span>⏳</span> In Progress
                            </span>
                          )}
                          {task.status === 'Clean' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shadow-sm">
                              <span>✓</span> Clean
                            </span>
                          )}
                          {task.status === 'Inspected' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/60 shadow-sm">
                              <span>✅</span> Inspected
                            </span>
                          )}
                          {(task.status === 'Dirty' || !['Cleaning', 'Clean', 'Inspected'].includes(task.status)) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 shadow-sm">
                              <span>⚠️</span> Dirty / Assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {task.status === 'Clean' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'Inspected')}
                                disabled={updatingId === task.id}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold tracking-wide active:scale-95 transition-all text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {updatingId === task.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                <span>Inspect & Approve</span>
                              </button>
                            )}
                            {task.status === 'Dirty' && (
                              <button
                                onClick={() => handleUpdateStatus(task.id, 'Cleaning')}
                                disabled={updatingId === task.id}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-bold tracking-wide active:scale-95 transition-all text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {updatingId === task.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <PlayCircle className="w-3 h-3" />
                                )}
                                <span>Start Cleaning</span>
                              </button>
                            )}
                            {['Clean', 'Inspected'].includes(task.status) && (
                              <span className="text-[10px] text-slate-450 italic">No action needed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HousekeepingManagement;
