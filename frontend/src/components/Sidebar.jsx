import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bed, 
  CalendarCheck, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  CalendarPlus,
  Wrench,
  User,
  Shield,
  Bell,
  LifeBuoy,
  MessageSquare,
  Star
} from 'lucide-react';
import GrandHorizonLogo from './GrandHorizonLogo';
import { useAuth } from '../context/AuthContext';
import { getAssetUrl } from '../utils/url';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavSections = () => {
    const role = user?.role;

    if (role === 'SuperAdmin') {
      return [
        {
          title: 'Management',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { path: '/rooms', label: 'Rooms', icon: <Bed className="w-5 h-5" /> },
            { path: '/housekeeping', label: 'Housekeeping', icon: <Wrench className="w-5 h-5" /> },
            { path: '/bookings', label: 'Bookings', icon: <CalendarCheck className="w-5 h-5" /> },
            { path: '/customers', label: 'Guests', icon: <Users className="w-5 h-5" /> },
            { path: '/kyc-requests', label: 'Document Check', icon: <Shield className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Finance & Tools',
          items: [
            { path: '/payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
            { path: '/invoices', label: 'Invoices', icon: <FileText className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Administration',
          items: [
            { path: '/admin/support', label: 'Support Tickets', icon: <LifeBuoy className="w-5 h-5" /> },
            { path: '/reviews', label: 'Guest Reviews', icon: <Star className="w-5 h-5" /> },
            { path: '/internal-chat', label: 'Staff Chat', icon: <MessageSquare className="w-5 h-5" /> },
            { path: '/reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
            { path: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
          ]
        }
      ];
    }

    if (role === 'HotelOwner') {
      return [
        {
          title: 'Property Core',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { path: '/rooms', label: 'Rooms Inventory', icon: <Bed className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Finance & Directory',
          items: [
            { path: '/payments', label: 'Payments History', icon: <CreditCard className="w-5 h-5" /> },
            { path: '/invoices', label: 'Invoices Issued', icon: <FileText className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Support & Settings',
          items: [
            { path: '/profile', label: 'Profile settings', icon: <User className="w-5 h-5" /> }
          ]
        }
      ];
    }

    if (role === 'Receptionist') {
      return [
        {
          title: 'Operational desk',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
            { path: '/rooms', label: 'Rooms Map', icon: <Bed className="w-5 h-5" /> },
            { path: '/housekeeping', label: 'Housekeeping', icon: <Wrench className="w-5 h-5" /> },
            { path: '/bookings', label: 'Bookings list', icon: <CalendarCheck className="w-5 h-5" /> },
            { path: '/customers', label: 'Guests profile', icon: <Users className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Finance & KYC',
          items: [
            { path: '/payments', label: 'Payments collect', icon: <CreditCard className="w-5 h-5" /> },
            { path: '/invoices', label: 'Invoices list', icon: <FileText className="w-5 h-5" /> },
            { path: '/kyc-requests', label: 'Document Check', icon: <Shield className="w-5 h-5" /> },
          ]
        },
        {
          title: 'Support Desk',
          items: [
            { path: '/admin/support', label: 'Support Tickets', icon: <LifeBuoy className="w-5 h-5" /> },
            { path: '/reviews', label: 'Guest Reviews', icon: <Star className="w-5 h-5" /> },
            { path: '/internal-chat', label: 'Staff Chat', icon: <MessageSquare className="w-5 h-5" /> }
          ]
        }
      ];
    }

    if (role === 'Housekeeping') {
      return [
        {
          title: 'Operations',
          items: [
            { path: '/dashboard', label: 'Clean Tasks', icon: <LayoutDashboard className="w-5 h-5" /> }
          ]
        },
        {
          title: 'Communication',
          items: [
            { path: '/internal-chat', label: 'Staff Chat', icon: <MessageSquare className="w-5 h-5" /> }
          ]
        }
      ];
    }

    // Customer
    return [
      {
        title: 'Reservations',
        items: [
          { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { path: '/rooms', label: 'Search Rooms', icon: <Bed className="w-5 h-5" /> },
          { path: '/book-room', label: 'Book Room', icon: <CalendarPlus className="w-5 h-5" /> },
          { path: '/my-bookings', label: 'My Bookings', icon: <CalendarCheck className="w-5 h-5" /> },
        ]
      },
      {
        title: 'Finance',
        items: [
          { path: '/payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" /> },
          { path: '/invoices', label: 'Invoices', icon: <FileText className="w-5 h-5" /> },
        ]
      },
      {
        title: 'Customer Care',
        items: [
          { path: '/contact-support', label: 'Help & Support', icon: <LifeBuoy className="w-5 h-5" /> },
          { path: '/reviews', label: 'My Reviews', icon: <Star className="w-5 h-5" /> },
        ]
      }
    ];
  };

  const sections = getNavSections();
 
  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white/95 dark:bg-[#120D09]/95 backdrop-blur-2xl text-slate-800 dark:text-[#F5EDE4] border-r border-amber-900/10 dark:border-amber-500/15 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex flex-col h-full justify-between p-5 overflow-y-auto scrollbar-none">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="px-1 border-b border-amber-900/10 dark:border-amber-500/15 pb-4">
            <GrandHorizonLogo />
          </div>
 
          {/* Navigation Links Grouped by Section */}
          <nav className="space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="space-y-1.5">
                <span className="block px-3 text-[9px] font-bold text-amber-900/50 dark:text-amber-400/60 uppercase tracking-[0.2em]">
                  {section.title}
                </span>
                <div className="space-y-1">
                  {section.items.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={toggleSidebar}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30 font-bold' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300'}
                      `}
                    >
                      <div className="shrink-0 transition-transform duration-300">
                        {link.icon}
                      </div>
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
 
        {/* User Footer Profile Card */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 px-3 py-2.5 mb-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#0b1526] dark:hover:bg-[#122131] border border-slate-200/60 dark:border-slate-800/80 rounded-xl cursor-pointer transition-all duration-300 group"
            title="View Profile"
          >
            {user?.avatar ? (
              <img
                src={getAssetUrl(user.avatar)}
                alt={user.name}
                style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'cover' }}
                className="w-9 h-9 rounded-full border border-amber-500/40 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center font-bold text-amber-500 text-xs uppercase tracking-wider">
                {user?.name?.slice(0, 2) || 'GH'}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xs font-semibold truncate text-slate-800 dark:text-[#d4e4fa] leading-none mb-1 group-hover:text-amber-500 transition-colors">{user?.name || 'Guest'}</h2>
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest leading-none">{user?.role || 'Staff'}</span>
            </div>
          </div>
 
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout Session</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
