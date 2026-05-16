import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AddHabitModal from '../components/AddHabitModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Habits() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true); // Pentru a arata un text pana vin datele
    const { currentUser } = useAuth();

    // 1. CITIREA DATELOR IN TIMP REAL (onSnapshot)
    useEffect(() => {
        if (!currentUser) return;

        // Căutăm în: users -> [ID-ul tău] -> habits
        const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
        const q = query(habitsRef, orderBy('createdAt', 'desc')); // Le ordonăm de la cel mai nou

        // onSnapshot ascultă live. Orice modificare în Firestore se vede instant pe ecran!
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const habitsData = snapshot.docs.map(doc => ({
                id: doc.id, // ID-ul unic generat de Firebase
                ...doc.data() // Restul datelor (nume, culoare, emoji etc.)
            }));
            setHabits(habitsData);
            setLoading(false);
        }, (error) => {
            console.error("Eroare la citirea obiceiurilor:", error);
            toast.error("Nu am putut încărca obiceiurile.");
            setLoading(false);
        });

        return () => unsubscribe(); // Curățăm ascultătorul când părăsim pagina
    }, [currentUser]);

    // 2. SALVAREA DATELOR IN FIRESTORE
    const handleAddHabit = async (newHabit) => {
        try {
            const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
            // Adăugăm documentul în Firebase (nu mai folosim setHabits, pentru că onSnapshot le va aduce automat)
            await addDoc(habitsRef, {
                name: newHabit.name,
                type: newHabit.type,
                emoji: newHabit.emoji,
                color: newHabit.color,
                createdAt: newHabit.createdAt,
                currentStreak: 0,
                bestStreak: 0
            });
            toast.success('Obicei salvat cu succes!');
        } catch (error) {
            console.error("Eroare la adăugare:", error);
            toast.error('A apărut o eroare la salvare.');
        }
    };

    return (
        <div className="relative min-h-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-textMain">Obiceiuri 🏆</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-accent text-white p-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center space-x-2 px-4 shadow-lg shadow-accent/30"
                >
                    <Plus size={20} />
                    <span className="font-semibold hidden sm:inline">Adaugă</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-textMuted">Se încarcă obiceiurile...</div>
            ) : habits.length === 0 ? (
                <div className="text-center py-20 text-textMuted border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p className="text-lg mb-2">Nu ai adăugat niciun obicei încă.</p>
                    <p className="text-sm">Apasă pe butonul "Adaugă" pentru a începe.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {habits.map((h) => (
                        <div key={h.id} className="p-4 bg-surface rounded-xl border border-gray-100 dark:border-gray-800 flex items-center space-x-4 shadow-sm">
                            <span className="text-2xl">{h.emoji}</span>
                            <div className="flex-1">
                                <h3 className="font-bold text-textMain">{h.name}</h3>
                                <span className="text-xs text-textMuted uppercase font-semibold tracking-wider">
                                    {h.type === 'must' ? '🔥 Must' : '🌱 Could Be'}
                                </span>
                            </div>
                            {/* Bulina care arată culoarea setată */}
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: h.color }}></div>
                        </div>
                    ))}
                </div>
            )}

            <AddHabitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddHabit={handleAddHabit}
            />
        </div>
    );
}