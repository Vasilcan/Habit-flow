import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// IMPORTĂM POZELE TALE CU EXTENSIILE LOR ACTUALE
import photoWeekday from '../assets/my_photo.jpg.jpeg';
import photoWeekend from '../assets/my_photo2.jpg.jpeg';

const getWeeklyId = () => {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
};

export default function WeeklyGoals({ userId = "default_user" }) {
    const [weekdayGoals, setWeekdayGoals] = useState([]);
    const [weekendGoals, setWeekendGoals] = useState([]);
    const [newWeekdayInput, setNewWeekdayInput] = useState('');
    const [newWeekendInput, setNewWeekendInput] = useState('');
    const [loading, setLoading] = useState(true);

    const weekId = getWeeklyId();

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const docRef = doc(db, 'users', userId, 'weeklyGoals', weekId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setWeekdayGoals(data.weekdayGoals || []);
                    setWeekendGoals(data.weekendGoals || []);
                }
            } catch (error) {
                console.error("Eroare la încărcarea obiectivelor:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [userId, weekId]);

    const saveToFirebase = async (updatedWeekdays, updatedWeekends) => {
        try {
            const docRef = doc(db, 'users', userId, 'weeklyGoals', weekId);
            await setDoc(docRef, {
                weekdayGoals: updatedWeekdays,
                weekendGoals: updatedWeekends,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Eroare la salvare:", error);
        }
    };

    const addWeekdayGoal = (e) => {
        e.preventDefault();
        if (!newWeekdayInput.trim()) return;
        const updated = [...weekdayGoals, { text: newWeekdayInput, completed: false }];
        setWeekdayGoals(updated);
        setNewWeekdayInput('');
        saveToFirebase(updated, weekendGoals);
    };

    const addWeekendGoal = (e) => {
        e.preventDefault();
        if (!newWeekendInput.trim()) return;
        const updated = [...weekendGoals, { text: newWeekendInput, completed: false }];
        setWeekendGoals(updated);
        setNewWeekendInput('');
        saveToFirebase(weekdayGoals, updated);
    };

    const toggleGoal = (index, type) => {
        if (type === 'weekday') {
            const updated = [...weekdayGoals];
            updated[index].completed = !updated[index].completed;
            setWeekdayGoals(updated);
            saveToFirebase(updated, weekendGoals);
        } else {
            const updated = [...weekendGoals];
            updated[index].completed = !updated[index].completed;
            setWeekendGoals(updated);
            saveToFirebase(weekdayGoals, updated);
        }
    };

    const deleteGoal = (index, type) => {
        if (type === 'weekday') {
            const updated = weekdayGoals.filter((_, i) => i !== index);
            setWeekdayGoals(updated);
            saveToFirebase(updated, weekendGoals);
        } else {
            const updated = weekendGoals.filter((_, i) => i !== index);
            setWeekendGoals(updated);
            saveToFirebase(weekdayGoals, updated);
        }
    };

    if (loading) return <div className="text-center p-4 text-gray-500">Se încarcă obiectivele...</div>;

    return (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl max-w-4xl mx-auto my-6 border border-slate-800">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold tracking-wide text-indigo-400">🎯 Obiective Săptămânale</h2>
                <span className="bg-indigo-950 text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-800 font-semibold">
                    Săptămâna {weekId.split('-W')[1]}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* SECȚIUNEA 1: ZILE DE LUCRU (OBLIGATORII) */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-3">
                        <img src={photoWeekday} alt="Obligatoriu" className="w-8 h-8 rounded-full border border-emerald-500 object-cover" />
                        <span>Zile de lucru (Lun - Vin)</span>
                    </h3>

                    <form onSubmit={addWeekdayGoal} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newWeekdayInput}
                            onChange={(e) => setNewWeekdayInput(e.target.value)}
                            placeholder="Adaugă obiectiv mare..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            +
                        </button>
                    </form>

                    <ul className="space-y-2">
                        {weekdayGoals.map((goal, index) => (
                            <li key={index} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 group">
                                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGoal(index, 'weekday')}>
                                    <input
                                        type="checkbox"
                                        checked={goal.completed}
                                        readOnly
                                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span className={`text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                        {goal.text}
                                    </span>
                                </div>
                                <button onClick={() => deleteGoal(index, 'weekday')} className="text-gray-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                    🗑️
                                </button>
                            </li>
                        ))}
                        {weekdayGoals.length === 0 && <p className="text-xs text-gray-600 italic text-center py-4">Niciun obiectiv adăugat pentru săptămâna de lucru.</p>}
                    </ul>
                </div>

                {/* SECȚIUNEA 2: WEEKEND (OPȚIONALE) */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-3">
                        <img src={photoWeekend} alt="Optionale" className="w-8 h-8 rounded-full border border-amber-500 object-cover" />
                        <span>Weekend (Sâm - Dum)</span>
                    </h3>

                    <form onSubmit={addWeekendGoal} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newWeekendInput}
                            onChange={(e) => setNewWeekendInput(e.target.value)}
                            placeholder="Adaugă obiectiv relaxare/proiect..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                        <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            +
                        </button>
                    </form>

                    <ul className="space-y-2">
                        {weekendGoals.map((goal, index) => (
                            <li key={index} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 group">
                                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGoal(index, 'weekend')}>
                                    <input
                                        type="checkbox"
                                        checked={goal.completed}
                                        readOnly
                                        className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                                    />
                                    <span className={`text-sm ${goal.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                        {goal.text}
                                    </span>
                                </div>
                                <button onClick={() => deleteGoal(index, 'weekend')} className="text-gray-500 hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                    🗑️
                                </button>
                            </li>
                        ))}
                        {weekendGoals.length === 0 && <p className="text-xs text-gray-600 italic text-center py-4">Niciun obiectiv adăugat pentru weekend.</p>}
                    </ul>
                </div>

            </div>
        </div>
    );
}