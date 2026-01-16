import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import HistoryPage from './pages/HistoryPage';
import GuestChatPage from './pages/GuestChatPage';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import { AdProvider } from './context/AdContext';

function App() {
    return (
        <AdProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
                <Route path="/verify-otp" element={<GuestRoute><OtpPage /></GuestRoute>} />
                <Route path="/guest-chat" element={<GuestChatPage />} />
                <Route path="/chat" element={<ChatbotPage />} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/history/:sessionId" element={<ProtectedRoute><ChatHistoryPage /></ProtectedRoute>} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AdProvider>
    );
}

export default App;

