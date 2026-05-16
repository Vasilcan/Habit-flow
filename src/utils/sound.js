// Generează un sunet plăcut tip "beep/chime" electronic folosind Web Audio API
export function playCheckSound() {
    try {
        // 1. Creăm contextul audio nativ din browser
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // 2. Creăm oscilatorul (generatorul de undă sonoră) și nodul de volum (Gain)
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 3. Setăm tipul de sunet (sine este cel mai smooth/plăcut) și frecvența (~880Hz e o notă înaltă, curată)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);

        // 4. Creăm un plic (envelope) de volum ca să scadă lin, transformând un beep enervant într-un chime fin
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Volumul de pornire mic, să nu spargă urechile
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Scade la 0 în 150ms

        // 5. Pornim și oprim oscilatorul
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
        console.error("Web Audio API nu a putut rula:", error);
    }
}