export async function playTextAsFon(text: string): Promise<void> {
    const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'http://185.224.139.206:8000';

    const response = await fetch(`${TTS_API_URL}/tts/fr-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error('Failed to generate Fon audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
        };
        audio.onerror = reject;
        audio.play();
    });
}

export async function playTextAsFrench(text: string): Promise<void> {
    const TTS_API_URL = process.env.NEXT_PUBLIC_TTS_API_URL || 'http://185.224.139.206:8000';

    const response = await fetch(`${TTS_API_URL}/tts/fr-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error('Failed to generate French audio');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
        };
        audio.onerror = reject;
        audio.play();
    });
}
