'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AudioLanguage = 'fr' | 'fon';

interface AudioLanguageContextType {
    language: AudioLanguage;
    setLanguage: (lang: AudioLanguage) => void;
}

const AudioLanguageContext = createContext<AudioLanguageContextType | undefined>(undefined);

export function AudioLanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<AudioLanguage>('fr');

    return (
        <AudioLanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </AudioLanguageContext.Provider>
    );
}

export function useAudioLanguage() {
    const context = useContext(AudioLanguageContext);
    if (context === undefined) {
        throw new Error('useAudioLanguage must be used within an AudioLanguageProvider');
    }
    return context;
}
