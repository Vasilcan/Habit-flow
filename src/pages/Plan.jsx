import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Clock, Trash2 } from 'lucide-react';
import AddTaskModal from '../components/AddTaskModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { playCheckSound } from '../utils/sound';
import toast from 'react-hot-toast';

export default function Plan() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    // Obținem data curentă în format text (folosit ca ID de document în Firebase)
    const getTodayDateString = () => {
        return new Date().toISOString().split('T')[0];
    };

    const todayStr = getTodayDateString();

    // 1. Ascultăm în timp real taskurile din subcollecția zilei de azi
    useEffect(() => {
        if (!currentUser) return;

        // Structura din cerințe: users/{userId}/dailyPlans/{YYYY-MM-DD}/tasks
        const tasksRef = collection(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks');

        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const tasksData = snapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }));

            // Sortăm cronologic după ora de start direct în cod
            tasksData.sort((a, b) => a.startTime.localeCompare(b.startTime));

            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, todayStr]);

    // 2. Trimiterea taskului nou în Firestore
    const handleAddTask = async (taskData) => {
        try {
            const tasksRef = collection(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks');
            await addDoc(tasksRef, taskData);
            toast.success('Task adăugat!');
        } catch (error) {
            toast.error('Eroare la salvarea taskului.');
        }
    };

    // 3. Bifarea / Debifarea unui Task + Sunet
    const toggleTaskComplete = async (task) => {
        const taskRef = doc(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks', task.id);
        const nextState = !task.completed;

        if (nextState) {
            playCheckSound(); // Declanșăm sunetul generat programatic!
        }

        try {
            await updateDoc(taskRef, {
                completed: nextState,
                completedAt: nextState ? new Date().toISOString() : null
            });
        } catch (error) {
            toast.error('Nu s-a putut actualiza starea.');
        }
    };

    // 4. Ștergerea unui Task
    const deleteTask = async (taskId) => {
        if (!window.confirm("Ești sigur că vrei să ștergi acest task?")) return;
        try {
            const taskRef = doc(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks', taskId);
            await deleteDoc(taskRef);
            toast.success('Task șters.');
        } catch (error) {
            toast.error('Eroare la ștergere.');
        }
    };

    // --- LOGICĂ METRICE & HIGHLIGHTS ---
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Funcție care verifică dacă un task e întârziat (ora curentă a depășit ora de start și e necompletat)
    const isTaskOverdue = (startTime, completed) => {
        if (completed) return false;
        const now = new Date();
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const taskStartTime = new Date();
        taskStartTime.setHours(startHours, startMinutes, 0, 0);
        return now > taskStartTime;
    };

    return (
        <div className="relative min-h-full">
            {/* Header cu Data și Progress Bar */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">Planul de Azi</span>
                        <h1 className="text-2xl font-bold text-textMain">{new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent text-white py-2 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-accent/20"
                    >
                        <Plus size={18} />
                        <span>Adăugă Task</span>
                    </button>
                </div>

                {/* Bara de progres */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-textMuted">
                        <span>Progresul zilei</span>
                        <span>{completedCount} din {totalCount} finalizate ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Lista de Taskuri stil Timeline */}
            {loading ? (
                <div className="text-center py-10 text-textMuted">Se încarcă planul zilei...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 text-textMuted border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-surface/50">
                    <p className="text-lg mb-1">Niciun task planificat pentru azi.</p>
                    <p className="text-sm">Organizează-ți ziua adăugând primul tău interval orar.</p>
                </div>
            ) : (
                <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 pl-6 space-y-4">
                    {tasks.map((task) => {
                        const overdue = isTaskOverdue(task.startTime, task.completed);

                        return (
                            <div
                                key={task.id}
                                className={`relative p-4 rounded-xl border bg-surface shadow-sm transition-all flex items-start justify-between gap-4 ${task.completed
                                        ? 'border-gray-100 dark:border-gray-900 opacity-60'
                                        : overdue
                                            ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                                            : 'border-gray-100 dark:border-gray-800'
                                    }`}
                            >
                                {/* Bulină pe linia de timp */}
                                <div className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 bg-background ${task.completed ? 'border-gray-300' : overdue ? 'border-amber-500 bg-amber-500' : 'border-accent'}`} />

                                <div className="flex items-start space-x-3 flex-1">
                                    <button
                                        onClick={() => toggleTaskComplete(task)}
                                        className="mt-0.5 text-textMuted hover:text-accent transition-colors cursor-pointer flex-shrink-0"
                                    >
                                        {task.completed ? (
                                            <CheckSquare size={22} className="text-accent" />
                                        ) : (
                                            <Square size={22} />
                                        )}
                                    </button>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 text-xs font-semibold text-textMuted mb-1">
                                            <Clock size={12} />
                                            <span className={task.completed ? 'line-through' : ''}>{task.startTime} — {task.endTime}</span>

                                            {/* Badge prioritate */}
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-500/10 text-red-500'
                                                    : task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500'
                                                        : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {task.priority}
                                            </span>

                                            {overdue && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                                                    Întârziat
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`font-bold text-textMain text-base ${task.completed ? 'line-through text-textMuted' : ''}`}>
                                            {task.title}
                                        </h3>

                                        {task.note && (
                                            <p className={`text-sm text-textMuted mt-1 bg-background/50 p-2 rounded border border-gray-100 dark:border-gray-900/40 ${task.completed ? 'line-through' : ''}`}>
                                                {task.note}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-textMuted hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex-shrink-0"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddTask={handleAddTask}
            />
        </div>
    );
}