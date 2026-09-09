import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings as SettingsIcon, Building, Percent, Mail, Phone, MapPin, Save } from 'lucide-react';

const Settings = () => {
  const { showToast } = useOutletContext();
  const [hotelName, setHotelName] = useState('Urban Tadka');
  const [email, setEmail] = useState('info@Urban Tadkahotel.com');
  const [phone, setPhone] = useState('+1 (555) 019-2834');
  const [address, setAddress] = useState('123 Luxury Way, Paradise Valley, CA 90210');
  const [taxPercent, setTaxPercent] = useState('18');
  const [currency, setCurrency] = useState('INR (₹)');

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Hotel configurations saved successfully', 'success');
  };

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
                <SettingsIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-serif">
                  Hotel Configurations
                </h1>
                <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mt-0.5">
                  System Defaults · Tax Policies · Hotel Metadata
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400/90 max-w-xl leading-relaxed mt-1">
              Configure public metadata details, tax policies, and billing defaults for Urban Tadka.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
            <Building className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{hotelName}</h2>
            <p className="text-xs text-slate-400">System Configuration Panel</p>
          </div>
          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 text-left text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{phone}</span>
            </div>
          </div>
        </div>

        {/* Configurations Form */}
        <div className="glass-card p-6 lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hotel name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Hotel name</label>
                <input
                  type="text"
                  required
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contact Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contact Telephone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* GST Tax percentage */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>GST Tax Percentage (%)</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Physical Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
              <button
                type="submit"
                className="flex items-center gap-2 py-2 px-5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer shadow-md shadow-primary-600/10 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Configurations</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
