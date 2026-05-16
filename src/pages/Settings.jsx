import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Sun, Moon, Palette, Send, Lock, LogOut } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Settings() {
    const { currentUser, logout } = useAuth();

    // Stări pentru Temă și Culori
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accentColor') || '#3b82f6');

    // Stări pentru Telegram (stocate în Firestore profile)
    const [telegramChatId, setTelegramChatId] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Stare pentru schimbare parolă
    const [newPassword, setNewPassword] = useState('');
    const [loadingPass, setLoadingPass] = useState(false);

    // Culori predefinite pentru paletă rapidă
    const presetColors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'];

    // 1. ÎNCĂRCARE DATE TELEGRAM DIN FIRESTORE
    useEffect(() => {
        async function loadUserProfile() {
            if (!currentUser) return;
            try {
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTelegramChatId(data.telegramChatId || '');
                    setNotificationsEnabled(data.notificationsEnabled || false);
                }
            } catch (error) {
                console.error("Eroare la încărcarea profilului:", error);
            }
        }
        loadUserProfile();
    }, [currentUser]);

    // 2. LOGICĂ TOGGLE DARK MODE
    useEffect(() => {
        const root = window.document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    // 3. LOGICĂ TOGGLE CULOARE ACCENT (CSS Variable)
    useEffect(() => {
        document.documentElement.style.setProperty('--accent-color', accentColor);
        localStorage.setItem('accentColor', accentColor);
    }, [accentColor]);

    // 4. SALVARE SETĂRI TELEGRAM ÎN FIRESTORE
    const handleSaveTelegram = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, 'users', currentUser.uid);
            // Salvăm sau actualizăm profilul utilizatorului
            await setDoc(docRef, {
                email: currentUser.email,
                telegramChatId: telegramChatId.trim(),
                notificationsEnabled: notificationsEnabled,
                accentColor: accentColor,
                theme: darkMode ? 'dark' : 'light'
            }, { merge: true }); // Merge: true împiedică ștergerea altor câmpuri dacă existau deja

            toast.success('Setările de notificare au fost salvate!');
        } catch (error) {
            console.error(error);
            toast.error('Nu s-au putut salva setările în cloud.');
        }
    };

    // 5. LOGICĂ SCHIMBARE PAROLĂ
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            return toast.error('Noua parolă trebuie să aibă minim 6 caractere!');
        }
        try {
            setLoadingPass(true);
            await updatePassword(currentUser, newPassword);
            toast.success('Parola a fost modificată cu succes!');
            setNewPassword('');
        } catch (error) {
            console.error(error);
            toast.error('Eroare. Este posibil să fie nevoie să te re-autentifici (logout/login) pentru a face asta.');
        } finally {
            setLoadingPass(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <h1 className="text-3xl font-bold text-textMain">Setări ⚙️</h1>

            {/* CASĂ 1: ASPECT & TEMĂ */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-textMain flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <Palette size={20} className="text-accent" />
                    <span>Personalizare Aspect</span>
                </h2>

                {/* Dark Mode Toggle */}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-textMain">Modul Întunecat</p>
                        <p className="text-xs text-textMuted">Schimbă tema interfeței pentru utilizare pe timp de noapte.</p>
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer text-accent bg-background"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                {/* Color Picker Accent */}
                <div className="space-y-3">
                    <div>
                        <p className="font-semibold text-textMain">Culoare Accent</p>
                        <p className="text-xs text-textMuted">Alege culoarea principală a aplicației (butoane, flăcări, selecții).</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Paletă Rapidă */}
                        {presetColors.map(color => (
                            <button
                                key={color}
                                onClick={() => setAccentColor(color)}
                                className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${accentColor === color ? 'scale-125 ring-2 ring-offset-2 ring-accent dark:ring-offset-surface' : 'hover:scale-110'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}

                        {/* Custom Input Color Picker */}
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-background">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-8 h-8 rounded-md cursor-pointer bg-transparent border-none"
                            />
                            <span className="text-xs font-mono font-semibold text-textMain uppercase">{accentColor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CASĂ 2: NOTIFICĂRI TELEGRAM */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold text-textMain flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                    <Send size={20} className="text-accent" />
                    <span>Notificări Telegram Bot</span>
                </h2>

                <div className="bg-background border border-accent/20 p-4 rounded-xl text-xs text-textMuted mb-5 leading-relaxed space-y-1">
                    <p className="font-semibold text-accent mb-1">Cum afli ID-ul tău de Telegram?</p>
                    <p>1. Caută botul <span className="font-bold text-textMain">@userinfobot</span> pe Telegram și trimite-i mesajul <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-red-500">/start</span>.</p>
                    <p>2. Copiază numărul primit la rubrica <span className="font-bold text-textMain">Id</span> și lipește-l în câmpul de mai jos.</p>
                </div>

                <form onSubmit={handleSaveTelegram} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">Telegram Chat ID</label>
                        <input
                            type="text"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="ex: 593284021"
                            className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <div>
                            <p className="text-sm font-semibold text-textMain">Activează Reminder Zilnic</p>
                            <p className="text-xs text-textMuted">Primești notificare la ora 19:00 cu activitățile rămase.</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                            className="w-5 h-5 accent-accent cursor-pointer"
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-accent text-white font-semibold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer"
                    >
                        Salvează Setările Telegram
                    </button>
                </form>
            </div>

            {/* CASĂ 3: SECURITATE CONT */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-textMain flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <Lock size={20} className="text-accent" />
                    <span>Securitate Cont</span>
                </h2>

                <p className="text-sm text-textMuted">
                    Logat ca: <span className="font-semibold text-textMain">{currentUser?.email}</span>
                </p>

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">Noua Parolă</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minim 6 caractere"
                            className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loadingPass}
                        className="bg-background text-textMain border border-gray-300 dark:border-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loadingPass ? 'Se schimbă...' : 'Actualizează Parola'}
                    </button>
                </form>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-sm shadow-md shadow-red-500/20"
                    >
                        <LogOut size={16} />
                        <span>Închide Sesiunea (Logout)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}