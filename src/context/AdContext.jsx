import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const AdContext = createContext();

export const AdProvider = ({ children }) => {
    const { user } = useAuth();

    // Ads are hidden if user has 'pro' or 'visionary' plan
    const isAdFree = user?.plan_type === 'pro' || user?.plan_type === 'visionary';

    return (
        <AdContext.Provider value={{ isAdFree }}>
            {children}
        </AdContext.Provider>
    );
};

export const useAds = () => {
    const context = useContext(AdContext);
    if (!context) {
        throw new Error('useAds must be used within an AdProvider');
    }
    return context;
};
