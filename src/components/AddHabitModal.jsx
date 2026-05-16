import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddHabitModal({ isOpen, onClose, onAddHabit }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('must');
    const [emoji, setEmoji] = useState('💧');
    const [color, setColor] = useState('#3b82f6'); // Default albastru

    // Culori predefinite din care poate alege utilizatorul
    const colorOptions = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Trimitem datele către componenta părinte (Habits)
        onAddHabit({
            name,
            type,
            emoji,
            color,
            createdAt: new Date().toISOString(),
            currentStreak: 0,
            bestStreak: 0
        });

        // Resetăm formularul și închidem modalul
        setName('');
        setType('must');
        setEmoji('💧');
        setColor('#3b82f6');
        onClose();
    };

    // AnimatePresence permite animații atunci când componenta dispare din ecran
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Fundalul întunecat care închide modalul la click */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Fereastra modalului */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-surface p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-10"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-textMain">Obicei Nou</h2>
                            <button onClick={onClose} className="text-textMuted hover:text-red-500 transition-colors cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Nume și Emoji */}
                            <div className="flex space-x-3">
                                <div className="w-20">
                                    <label className="block text-sm font-medium text-textMain mb-1">Emoji</label>
                                    <input
                                        type="text"
                                        value={emoji}
                                        onChange={(e) => setEmoji(e.target.value)}
                                        className="w-full px-3 py-2 text-center text-2xl rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-textMain mb-1">Nume Obicei</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="ex: Citesc 10 pagini"
                                        className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            {/* Tipul Obiceiului (Must vs Could Be) */}
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-2">
                                    Tip (Regulă de menținere Streak)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setType('must')}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${type === 'must' ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold' : 'border-gray-200 dark:border-gray-700 text-textMuted'}`}
                                    >
                                        🔥 MUST
                                        <span className="block text-xs font-normal mt-1 text-textMuted">Zilnic (Toleranță 0 zile)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('couldbe')}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all cursor-pointer ${type === 'couldbe' ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 font-bold' : 'border-gray-200 dark:border-gray-700 text-textMuted'}`}
                                    >
                                        🌱 COULD BE
                                        <span className="block text-xs font-normal mt-1 text-textMuted">Flexibil (Toleranță 1 zi)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Culoare */}
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-2">Culoare</label>
                                <div className="flex space-x-2">
                                    {colorOptions.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-accent dark:ring-offset-surface' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer mt-4"
                            >
                                Salvează Obiceiul
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}