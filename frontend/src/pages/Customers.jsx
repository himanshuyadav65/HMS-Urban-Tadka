import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Search, User, Phone, Mail, MapPin, CreditCard, Trash2, Edit, X, Eye, CalendarCheck } from 'lucide-react';
import api from '../services/api';
import { getAssetUrl } from '../utils/url';
import { TableSkeleton } from '../components/Skeletons';

const Customers = () => {
  const { showToast } = useOutletContext();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Driver License');
  const [idNumber, setIdNumber] = useState('');
  const [idProofImage, setIdProofImage] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const response = await api.get('/customers', { params });
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showToast('Failed to load guest list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIdType('Driver License');
    setIdNumber('');
    setIdProofImage(null);
    setEditingCustomer(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setIdType(c.governmentId?.idType || 'Driver License');
    setIdNumber(c.governmentId?.idNumber || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('idType', idType);
    formData.append('idNumber', idNumber);
    if (idProofImage) {
      formData.append('idProofImage', idProofImage);
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingCustomer) {
        const response = await api.put(`/customers/${editingCustomer._id}`, formData, config);
        if (response.data.success) {
          showToast('Guest profile updated successfully', 'success');
        }
      } else {
        const response = await api.post('/customers', formData, config);
        if (response.data.success) {
          showToast('Guest profile created successfully', 'success');
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save customer', 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guest profile? This checks for active bookings first.')) {
      return;
    }
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.data.success) {
        showToast('Guest profile deleted successfully', 'success');
        fetchCustomers();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Error deleting guest profile', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-[1450px] mx-auto pb-12">
      {/* ── Premium Hero Banner ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 sm:p-8 border border-purple-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 via-indigo-500/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-300 via-indigo-200 to-white bg-clip-text text-transparent font-serif">
                  Hotel Guests
                </h1>
                <p className="text-[10px] text-purple-400/70 font-bold uppercase tracking-widest mt-0.5">
                  Guest Directory · Identity Verification · Contact Profiles
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Register new customers, view government IDs, and check contact details for Urban Tadka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer border border-purple-400/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-purple-200" />
              <span>Register New Guest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and search parameters bar */}
      <div className="glass-card p-4 flex gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-855"
          />
        </div>
      </div>

      {/* Grid listing customers */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : customers.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contacts</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Govt. Identification</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-650 dark:text-slate-350">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={c.address}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.governmentId?.idType}: {c.governmentId?.idNumber}</span>
                      </div>
                      {c.idProofImage && (
                        <a 
                          href={getAssetUrl(c.idProofImage)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View ID Document
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/bookings', { state: { selectedCustomerId: c._id } })}
                          className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Book Room for Guest"
                        >
                          <CalendarCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Guest Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">No registered guest profiles matches requirements.</div>
      )}

      {/* CRUD Add/Edit customer modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg overflow-hidden animate-slide-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingCustomer ? `Modify Guest Profile - ${editingCustomer.name}` : 'Register New Guest'}
              </h3>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Guest Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Guest Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +1 555-019-2233"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 456 Elm St, Seattle, WA"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Government ID Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Government ID Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    >
                      <option value="Driver License">Driver License</option>
                      <option value="Passport">Passport</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="National Identity ID">National Identity ID</option>
                    </select>
                  </div>

                  {/* Government ID Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Government ID Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WA-9876-XP"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* ID Proof Document Upload */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Upload ID Document (Image/PDF)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setIdProofImage(e.target.files[0])}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 dark:file:bg-primary-950/30 file:text-primary-700 dark:file:text-primary-350 hover:file:bg-primary-100 transition-colors file:cursor-pointer text-slate-400"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
