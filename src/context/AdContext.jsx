
import React, { createContext, useContext, useState } from 'react';

const AdContext = createContext();

export const AdProvider = ({ children }) => {
    // In a real app, this value would come from the user's subscription status in AuthContext or a database.
    // Defaulting to false (ads enabled) for now.
    const [isAdFree, setIsAdFree] = useState(false);

    const toggleAdFree = () => setIsAdFree(prev => !prev);

    return (
        <AdContext.Provider value={{ isAdFree, toggleAdFree }}>
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
