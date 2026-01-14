import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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
        // Check for saved user in localStorage
        const savedUser = localStorage.getItem('metra_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // Mock login - in production, call your API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    const userData = {
                        id: '1',
                        email,
                        name: email.split('@')[0],
                        avatar: null,
                        birthDate: null,
                    };
                    setUser(userData);
                    localStorage.setItem('metra_user', JSON.stringify(userData));
                    resolve(userData);
                } else {
                    reject(new Error('Email dan password diperlukan'));
                }
            }, 800);
        });
    };

    const loginWithGoogle = async () => {
        // Mock Google login - in production, integrate with Firebase/Google OAuth
        return new Promise((resolve) => {
            setTimeout(() => {
                const userData = {
                    id: 'google_123',
                    email: 'user@gmail.com',
                    name: 'Metra User',
                    avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
                    birthDate: null,
                    provider: 'google',
                };
                setUser(userData);
                localStorage.setItem('metra_user', JSON.stringify(userData));
                resolve(userData);
            }, 1000);
        });
    };

    const register = async (name, email, password) => {
        // Mock registration
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (name && email && password) {
                    const userData = {
                        id: Date.now().toString(),
                        email,
                        name,
                        avatar: null,
                        birthDate: null,
                    };
                    setUser(userData);
                    localStorage.setItem('metra_user', JSON.stringify(userData));
                    resolve(userData);
                } else {
                    reject(new Error('Semua field diperlukan'));
                }
            }, 800);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('metra_user');
    };

    const updateProfile = (data) => {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('metra_user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
