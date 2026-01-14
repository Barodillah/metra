import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
        // Check if this is an OAuth callback (has hash params or access_token in URL)
        const isOAuthCallback = window.location.hash.includes('access_token') ||
            window.location.search.includes('code=');

        // Listen for auth changes FIRST - this is important for OAuth redirects
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    await fetchProfile(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            } else if (session?.user) {
                await fetchProfile(session.user);
            } else if (!isOAuthCallback) {
                // Only set loading false if this isn't an OAuth callback waiting to process
                setLoading(false);
            }
        });

        // Initial session check
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Session error:', error);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    await fetchProfile(session.user);
                } else if (!isOAuthCallback) {
                    // Only set loading false if we're not waiting for OAuth callback
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error getting session:', error);
                setLoading(false);
            }
        };

        getSession();

        // Safety timeout to prevent infinite loading on OAuth callback issues
        const timeout = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn('Auth loading timeout - forcing completion');
                    return false;
                }
                return prev;
            });
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const fetchProfile = async (authUser) => {
        try {
            const [profileResponse, planResponse] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single(),
                supabase
                    .from('plans')
                    .select('plan_type')
                    .eq('user_id', authUser.id)
                    .single()
            ]);

            const profileData = profileResponse.data || {};
            const planData = planResponse.data || { plan_type: 'free' };

            setUser({
                ...authUser,
                ...profileData,
                plan_type: planData.plan_type
            });

        } catch (error) {
            console.error("Error fetching profile/plan:", error);
            setUser({ ...authUser, plan_type: 'free' });
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    };

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/dashboard`
            },
        });

        if (error) throw error;
        return data;
    };

    const register = async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                }
            }
        });

        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
    };

    const updateProfile = async (updates) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Refresh user state
            setUser(prev => ({ ...prev, ...updates }));
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
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
