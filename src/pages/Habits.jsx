import photoMust from '../assets/my_photo.jpg.jpeg';
import photoCouldBe from '../assets/my_photo2.jpg.jpeg';

import React, { useState, useEffect } from 'react';
import { Plus, Flame, CheckCircle, Circle } from 'lucide-react';
import AddHabitModal from '../components/AddHabitModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Habits() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoomedImage, setZoomedImage] = useState(null);
    const { currentUser } = useAuth();

    // Obținem data de azi în format text (ex: "2026-05-16") pentru a o folosi la verificări
    const getTodayDateString = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getYesterdayDateString = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };

    // 1. Încărcarea obiceiurilor din Firestore în timp real
    useEffect(() => {
        if (!currentUser) return;

        const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
        const q = query(habitsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const habitsData = snapshot.docs.map(docSnapshot => {
                const data = docSnapshot.data();
                const history = data.history || [];
                const todayStr = getTodayDateString();
                const yesterdayStr = getYesterdayDateString();

                // Verificăm dacă obiceiul este deja completat azi
                const isCompletedToday = history.includes(todayStr);

                // --- LOGICĂ AUTO-RESET STREAK (Dacă utilizatorul a pierdut streak-ul) ---
                let currentStreak = data.currentStreak || 0;

                // Dacă nu e completat azi ȘI ultima completare nu a fost nici ieri
                // Înseamnă că a lăsat să treacă o zi liberă.
                if (!isCompletedToday && currentStreak > 0) {
                    const lastCompletedDate = history[history.length - 1];

                    if (data.type === 'must') {
                        // Regula MUST: trebuie făcut ZILNIC. Dacă ultima dată nu e ieri, streak-ul moare (devine 0)
                        if (lastCompletedDate !== yesterdayStr) {
                            currentStreak = 0;
                        }
                    } else if (data.type === 'couldbe') {
                        // Regula COULD BE: toleranță 1 zi. Streak-ul moare doar dacă a sărit peste mai mult de o zi
                        // Deci dacă ultima completare e mai veche decât ieri, se resetează.
                        if (lastCompletedDate && lastCompletedDate !== yesterdayStr) {
                            // Verificăm dacă a sărit două zile la rând
                            const lastDate = new Date(lastCompletedDate);
                            const diffTime = Math.abs(new Date(todayStr) - lastDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays > 2) {
                                currentStreak = 0;
                            }
                        }
                    }
                }

                return {
                    id: docSnapshot.id,
                    ...data,
                    history,
                    currentStreak,
                    isCompletedToday
                };
            });

            setHabits(habitsData);
            setLoading(false);
        }, (error) => {
            console.error("Eroare la citire:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 2. Adăugarea unui obicei nou
    const handleAddHabit = async (newHabit) => {
        try {
            const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
            await addDoc(habitsRef, {
                name: newHabit.name,
                type: newHabit.type,
                emoji: newHabit.emoji,
                color: newHabit.color,
                createdAt: newHabit.createdAt,
                currentStreak: 0,
                bestStreak: 0,
                history: [] // Aici vom salva zilele în care a fost bifat (ex: ["2026-05-16"])
            });
            toast.success('Obicei salvat!');
        } catch (error) {
            toast.error('Eroare la salvare.');
        }
    };

    // 3. LOGICA DE BIFAT / DEBIFAT OBICEI
    const toggleHabitComplete = async (habit) => {
        const habitRef = doc(db, 'users', currentUser.uid, 'habits', habit.id);
        const todayStr = getTodayDateString();
        let updatedHistory = [...habit.history];
        let newCurrentStreak = habit.currentStreak;
        let newBestStreak = habit.bestStreak || 0;

        if (habit.isCompletedToday) {
            // --- ANULARE BIFĂ (Dacă userul a dat click din greșeală și vrea să debifeze) ---
            updatedHistory = updatedHistory.filter(date => date !== todayStr);
            newCurrentStreak = Math.max(0, newCurrentStreak - 1);
            toast.success('Obicei debifat.');
        } else {
            // --- BIFĂ TRIMEASĂ CU SUCCES ---
            if (!updatedHistory.includes(todayStr)) {
                updatedHistory.push(todayStr);
            }

            // Creștem streak-ul
            newCurrentStreak += 1;

            // Verificăm dacă am bătut recordul personal (Best Streak)
            if (newCurrentStreak > newBestStreak) {
                newBestStreak = newCurrentStreak;
            }
            toast.success('Felicitări! Obicei completat. 🚀');
        }

        // Actualizăm direct în Firebase
        try {
            await updateDoc(habitRef, {
                history: updatedHistory,
                currentStreak: newCurrentStreak,
                bestStreak: newBestStreak
            });
        } catch (error) {
            console.error("Eroare la actualizare:", error);
            toast.error("Nu s-a putut salva progresul.");
        }
    };

    const handleDeleteHabit = async (habitId) => {
        if (window.confirm("Ești sigur că vrei să ștergi acest obicei?")) {
            try {
                const habitDocRef = doc(db, 'users', currentUser.uid, 'habits', habitId);
                await deleteDoc(habitDocRef);
                toast.success('Obicei șters cu succes.');
            } catch (error) {
                console.error("Eroare la ștergerea obiceiului:", error);
                toast.error("Nu s-a putut șterge obiceiul.");
            }
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
                <div className="text-center py-10 text-textMuted">Se încarcă...</div>
            ) : habits.length === 0 ? (
                <div className="text-center py-20 text-textMuted border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                    <p className="text-lg mb-2">Nu ai adăugat niciun obicei încă.</p>
                    <p className="text-sm">Apasă pe butonul "Adaugă" pentru a începe.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className={`p-4 bg-surface rounded-2xl border transition-all flex items-center justify-between shadow-sm ${habit.isCompletedToday ? 'border-accent/30 bg-accent/5 opacity-80' : 'border-gray-100 dark:border-gray-800'}`}
                        >
                            <div className="flex items-center space-x-4">
                                {/* Iconița de bifă */}
                                <button
                                    onClick={() => toggleHabitComplete(habit)}
                                    className="text-textMuted hover:text-accent transition-colors cursor-pointer"
                                >
                                    {habit.isCompletedToday ? (
                                        <CheckCircle size={28} className="text-accent fill-accent/10" />
                                    ) : (
                                        <Circle size={28} />
                                    )}
                                </button>

                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0" onClick={() => setZoomedImage(habit.frequency === 'MUST' || habit.type === 'MUST' || habit.frequency === 'must' || habit.type === 'must' ? photoMust : photoCouldBe)}>
                                  <img 
                                    src={habit.frequency === 'MUST' || habit.type === 'MUST' || habit.frequency === 'must' || habit.type === 'must' ? photoMust : photoCouldBe} 
                                    alt="Habit Icon" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-textMain ${habit.isCompletedToday ? 'line-through text-textMuted' : ''}`}>{habit.name}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="flex items-center gap-2">
                                          {habit.frequency === 'MUST' || habit.type === 'MUST' || habit.frequency === 'must' || habit.type === 'must' ? (
                                            <div className="flex items-center gap-1.5 bg-red-950/40 text-red-400 px-2.5 py-1 rounded-md border border-red-900/50 text-xs font-bold">
                                              <img src={photoMust} alt="Must" className="w-4 h-4 rounded-full object-cover" />
                                              <span>MUST</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-900/50 text-xs font-bold">
                                              <img src={photoCouldBe} alt="Could Be" className="w-4 h-4 rounded-full object-cover" />
                                              <span>COULD BE</span>
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-xs text-textMuted">Record: {habit.bestStreak || 0} zile</span>
                                    </div>
                                </div>
                            </div>

                            {/* Afișarea Streak-ului curent cu flacără și Buton de Ștergere */}
                            <div className="flex items-center space-x-3">
                                <div className={`flex items-center space-x-1 font-bold ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-textMuted'}`}>
                                    <Flame size={20} className={habit.currentStreak > 0 ? 'fill-orange-500/20 animate-pulse' : ''} />
                                    <span>{habit.currentStreak}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteHabit(habit.id)}
                                    className="text-gray-500 hover:text-red-400 transition-colors px-2 cursor-pointer"
                                    title="Șterge obicei"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AddHabitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddHabit={handleAddHabit}
            />

            {zoomedImage && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center cursor-pointer" onClick={() => setZoomedImage(null)}>
                <div className="relative max-w-md max-h-[80vh] p-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                  <img src={zoomedImage} alt="Zoomed View" className="rounded-xl max-w-full max-h-[75vh] object-contain" />
                  <button className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm hover:bg-black/80" onClick={() => setZoomedImage(null)}>✕</button>
                </div>
              </div>
            )}
        </div>
    );
}