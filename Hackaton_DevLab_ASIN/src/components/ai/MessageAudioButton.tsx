'use client';

import { useState } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { playTextAsFon, playTextAsFrench } from '@/lib/tts';
import { useAudioLanguage } from './AudioLanguageContext';

interface MessageAudioButtonProps {
    text: string;
}

export function MessageAudioButton({ text }: MessageAudioButtonProps) {
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language } = useAudioLanguage();

    const handlePlay = async () => {
        setPlaying(true);
        setError(null);

        try {
            if (language === 'fon') {
                await playTextAsFon(text);
            } else {
                await playTextAsFrench(text);
            }
        } catch (err) {
            console.error('Audio playback error:', err);
            setError('Erreur de lecture audio');
        } finally {
            setPlaying(false);
        }
    };

    return (
        <button
            onClick={handlePlay}
            disabled={playing}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors disabled:opacity-50"
            title={`Écouter en ${language === 'fon' ? 'Fongbé' : 'Français'}`}
        >
            {playing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : error ? (
                <VolumeX className="w-3 h-3" />
            ) : (
                <Volume2 className="w-3 h-3" />
            )}
            <span className="uppercase font-semibold">{language}</span>
        </button>
    );
}
