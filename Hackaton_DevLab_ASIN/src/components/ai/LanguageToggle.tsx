'use client';

import { useState } from 'react';

export type AudioLanguage = 'fr' | 'fon';

interface LanguageToggleProps {
    value: AudioLanguage;
    onChange: (language: AudioLanguage) => void;
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
    return (
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
                onClick={() => onChange('fr')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${value === 'fr'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
            >
                🇫🇷 Français
            </button>
            <button
                onClick={() => onChange('fon')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${value === 'fon'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
            >
                🇧🇯 Fongbé
            </button>
        </div>
    );
}
