import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Entry dashboard path dispatcher.
 * Automatically routes logged-in users to their role-specific dashboard routes.
 */
const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  if (role === 'SuperAdmin') {
    return <Navigate to="/dashboard/superadmin" replace />;
  } else if (role === 'HotelOwner') {
    return <Navigate to="/dashboard/owner" replace />;
  } else if (role === 'Receptionist') {
    return <Navigate to="/dashboard/receptionist" replace />;
  } else if (role === 'Housekeeping') {
    return <Navigate to="/dashboard/housekeeping" replace />;
  } else {
    return <Navigate to="/dashboard/customer" replace />;
  }
};

export default Dashboard;
