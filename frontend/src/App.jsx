import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages import
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import MyBookings from './pages/MyBookings';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Booking from './pages/Booking';
import KycRequests from './pages/KycRequests';
import Notifications from './pages/Notifications';
import ContactSupport from './pages/ContactSupport';
import MySupportTickets from './pages/MySupportTickets';
import TicketDetails from './pages/TicketDetails';
import AdminSupportManagement from './pages/AdminSupportManagement';
import AdminTicketDetails from './pages/AdminTicketDetails';
import Reviews from './pages/Reviews';

// Role-specific Logins
import CustomerLogin from './pages/CustomerLogin';
import ReceptionistLogin from './pages/ReceptionistLogin';
import HousekeepingLogin from './pages/HousekeepingLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import OwnerLogin from './pages/OwnerLogin';

// Role-specific Dashboards
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import HousekeepingManagement from './pages/HousekeepingManagement';
import InternalChat from './pages/InternalChat';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes — All render full luxury Login page */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/customer" element={<Login />} />
            <Route path="/login/receptionist" element={<Login />} />
            <Route path="/login/housekeeping" element={<Login />} />
            <Route path="/login/superadmin" element={<Login />} />
            <Route path="/login/owner" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Panel Shell Routes */}
            <Route path="/" element={<DashboardLayout />}>
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />

              {/* Separate dashboard routes for each role */}
              <Route path="dashboard/superadmin" element={<SuperAdminDashboard />} />
              <Route path="dashboard/owner" element={<OwnerDashboard />} />
              <Route path="dashboard/receptionist" element={<ReceptionistDashboard />} />
              <Route path="dashboard/housekeeping" element={<HousekeepingDashboard />} />
              <Route path="dashboard/customer" element={<CustomerDashboard />} />

              <Route path="housekeeping" element={<HousekeepingManagement />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="customers" element={<Customers />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="book-room" element={<Booking />} />
              <Route path="kyc-requests" element={<KycRequests />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="contact-support" element={<ContactSupport />} />
              <Route path="my-tickets" element={<MySupportTickets />} />
              <Route path="my-tickets/:ticketId" element={<TicketDetails />} />
              <Route path="admin/support" element={<AdminSupportManagement />} />
              <Route path="admin/support/:ticketId" element={<AdminTicketDetails />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="internal-chat" element={<InternalChat />} />
            </Route>

            {/* Catch-all Wildcard redirects back to login/dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
