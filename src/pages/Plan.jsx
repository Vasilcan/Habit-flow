import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Clock, Trash2, Folder, Calendar, Download, ArrowLeft } from 'lucide-react';
import AddTaskModal from '../components/AddTaskModal';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { playCheckSound } from '../utils/sound';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function Plan() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stări pentru vizualizare Istoric
    const [isHistoryMode, setIsHistoryMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { currentUser } = useAuth();

    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const todayStr = getTodayDateString();

    // Ascultăm taskurile în funcție de data selectată (fie azi, fie o zi din istoric)
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const tasksRef = collection(db, 'users', currentUser.uid, 'dailyPlans', selectedDate, 'tasks');

        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const tasksData = snapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }));

            tasksData.sort((a, b) => a.startTime.localeCompare(b.startTime));
            setTasks(tasksData);
            setLoading(false);
        }, (error) => {
            console.error(error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, selectedDate]);

    const handleAddTask = async (taskData) => {
        try {
            const tasksRef = collection(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks');
            await addDoc(tasksRef, taskData);
            toast.success('Task adăugat!');
        } catch (error) {
            toast.error('Eroare la salvare.');
        }
    };

    const toggleTaskComplete = async (task) => {
        if (isHistoryMode) return; // Istoricul este Read-Only
        const taskRef = doc(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks', task.id);
        const nextState = !task.completed;

        if (nextState) playCheckSound();

        try {
            await updateDoc(taskRef, {
                completed: nextState,
                completedAt: nextState ? new Date().toISOString() : null
            });
        } catch (error) {
            toast.error('Eroare la actualizare.');
        }
    };

    const deleteTask = async (taskId) => {
        if (isHistoryMode) return;
        if (!window.confirm("Ștergi acest task?")) return;
        try {
            const taskRef = doc(db, 'users', currentUser.uid, 'dailyPlans', todayStr, 'tasks', taskId);
            await deleteDoc(taskRef);
            toast.success('Task șters.');
        } catch (error) {
            toast.error('Eroare la ștergere.');
        }
    };

    // --- LOGICĂ EXPORT EXCEL (Varianta optimizată pe starea curentă) ---
    const exportToExcel = () => {
        try {
            if (tasks.length === 0) {
                return toast.error('Nu există task-uri afișate pe ecran pentru a fi exportate.');
            }

            // 1. Mapăm direct task-urile din starea curentă a paginii
            const rows = tasks.map(t => ({
                'Ora Start': t.startTime || '',
                'Ora Sfarsit': t.endTime || '',
                'Task': t.title || '',
                'Prioritate': t.priority || '',
                'Completat': t.completed ? 'DA' : 'NU',
                'Nota': t.note || ''
            }));

            // 2. Creăm un Workbook și un Worksheet (fila curentă)
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);

            // Adăugăm fila în Excel cu numele datei selectate
            XLSX.utils.book_append_sheet(workbook, worksheet, selectedDate);

            // 3. Generăm fișierul în memorie
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // 4. Forțăm descărcarea în browser
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = `HabitFlow_Plan_${selectedDate}.xlsx`;

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            toast.success('Excel descărcat cu succes! ⬇️');
        } catch (error) {
            console.error("Eroare la export:", error);
            toast.error('Nu s-a putut genera fișierul Excel.');
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const isTaskOverdue = (startTime, completed) => {
        if (completed || isHistoryMode) return false;
        const now = new Date();
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const taskStartTime = new Date();
        taskStartTime.setHours(startHours, startMinutes, 0, 0);
        return now > taskStartTime;
    };

    return (
        <div className="relative min-h-full">
            {/* Zona de Sus: Schimbare Mod (Azi vs Istoric) */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                {isHistoryMode ? (
                    <button
                        onClick={() => { setIsHistoryMode(false); setSelectedDate(todayStr); }}
                        className="flex items-center space-x-2 text-accent font-semibold hover:underline cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        <span>Înapoi la Ziua de Azi</span>
                    </button>
                ) : (
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setIsHistoryMode(true)}
                            className="flex items-center space-x-2 text-textMuted hover:text-accent font-medium text-sm border border-gray-200 dark:border-gray-800 bg-surface px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                            <Folder size={16} />
                            <span>📂 Istoric zile</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center space-x-2 text-textMuted hover:text-green-500 font-medium text-sm border border-gray-200 dark:border-gray-800 bg-surface px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                            <Download size={16} />
                            <span>⬇️ Export Excel</span>
                        </button>
                    </div>
                )}

                {/* Dacă suntem în mod istoric, afișăm un selector de dată */}
                {isHistoryMode && (
                    <div className="flex items-center space-x-2 bg-surface border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-sm">
                        <Calendar size={16} className="text-accent" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-textMain focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Cardul Principal cu Progres */}
            <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">
                            {isHistoryMode ? 'Vizualizare Arhivă (Read-Only)' : 'Planul de Azi'}
                        </span>
                        <h1 className="text-2xl font-bold text-textMain">
                            {new Date(selectedDate).toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h1>
                    </div>
                    {!isHistoryMode && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-accent text-white py-2 px-4 rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-accent/20"
                        >
                            <Plus size={18} />
                            <span>Adaugă Task</span>
                        </button>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-textMuted">
                        <span>Progres realizat</span>
                        <span>{completedCount} din {totalCount} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Listare Taskuri */}
            {loading ? (
                <div className="text-center py-10 text-textMuted">Se încarcă datele...</div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 text-textMuted border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-surface/50">
                    <p className="text-lg mb-1">Niciun task în această zi.</p>
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
                                <div className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 bg-background ${task.completed ? 'border-gray-300' : overdue ? 'border-amber-500 bg-amber-500' : 'border-accent'}`} />

                                <div className="flex items-start space-x-3 flex-1">
                                    <button
                                        onClick={() => toggleTaskComplete(task)}
                                        disabled={isHistoryMode}
                                        className={`mt-0.5 text-textMuted transition-colors flex-shrink-0 ${isHistoryMode ? 'cursor-default' : 'hover:text-accent cursor-pointer'}`}
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

                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-500/10 text-red-500'
                                                : task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500'
                                                    : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>

                                        <h3 className={`font-bold text-textMain text-base ${task.completed ? 'line-through text-textMuted' : ''}`}>
                                            {task.title}
                                        </h3>

                                        {task.note && (
                                            <p className="text-sm text-textMuted mt-1 bg-background/50 p-2 rounded border border-gray-100 dark:border-gray-900/40">
                                                {task.note}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {!isHistoryMode && (
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-textMuted hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer flex-shrink-0"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
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