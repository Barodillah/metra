import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for required role (e.g., admin)
    if (requiredRole && user?.role !== requiredRole) {
        // Redirect non-admins to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

