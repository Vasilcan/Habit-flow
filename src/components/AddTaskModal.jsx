import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddTaskModal({ isOpen, onClose, onAddTask }) {
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    const [priority, setPriority] = useState('Medium');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAddTask({
            title,
            note,
            startTime,
            endTime,
            priority,
            completed: false
        });

        setTitle('');
        setNote('');
        setStartTime('08:00');
        setEndTime('09:00');
        setPriority('Medium');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-surface p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-10"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-textMain">Task Nou</h2>
                            <button onClick={onClose} className="text-textMuted hover:text-red-500 cursor-pointer">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Titlu Task</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="ex: Ședință de echipă"
                                    className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-textMain mb-1">Ora Start</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textMain mb-1">Ora Sfârșit</label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-textMain mb-2">Prioritate</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Low', 'Medium', 'High'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`py-2 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${priority === p
                                                    ? p === 'High' ? 'border-red-500 bg-red-500/10 text-red-500'
                                                        : p === 'Medium' ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                                            : 'border-blue-500 bg-blue-500/10 text-blue-500'
                                                    : 'border-gray-200 dark:border-gray-700 text-textMuted'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Note (Opțional)</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Detalii suplimentare..."
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity cursor-pointer mt-2"
                            >
                                Adaugă în Plan
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}