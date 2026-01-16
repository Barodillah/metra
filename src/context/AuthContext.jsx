import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('metra_token');
        if (token) {
            fetchCurrentUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchCurrentUser = async (token) => {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token invalid, remove it
                localStorage.removeItem('metra_token');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            localStorage.removeItem('metra_token');
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registrasi gagal');
        }

        return data;
    };

    const verifyOtp = async (email, otp) => {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Verifikasi gagal');
        }

        // Save token and set user
        localStorage.setItem('metra_token', data.token);
        setUser(data.user);

        return data;
    };

    const resendOtp = async (email) => {
        const response = await fetch(`${API_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengirim OTP');
        }

        return data;
    };

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Check if needs verification
            if (data.needsVerification) {
                throw { message: data.error, needsVerification: true, email: data.email };
            }
            throw new Error(data.error || 'Login gagal');
        }

        // Save token and set user
        localStorage.setItem('metra_token', data.token);
        setUser(data.user);

        return data;
    };

    const loginWithGoogle = async (credential) => {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login Google gagal');
        }

        // Save token and set user
        localStorage.setItem('metra_token', data.token);
        setUser(data.user);

        return data;
    };

    const logout = async () => {
        localStorage.removeItem('metra_token');
        setUser(null);
    };

    const updateProfile = async (updates) => {
        const token = localStorage.getItem('metra_token');

        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Update profil gagal');
        }

        setUser(prev => ({ ...prev, ...data.user }));
        return data;
    };

    const getBirthDateChangeInfo = async () => {
        const token = localStorage.getItem('metra_token');

        const response = await fetch(`${API_URL}/auth/birth-date-changes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil info perubahan tanggal lahir');
        }

        return data;
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        register,
        verifyOtp,
        resendOtp,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
        getBirthDateChangeInfo,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
