import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, CalendarDays, Settings, LogOut, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
    const location = useLocation(); // Ne spune pe ce pagină ne aflăm (URL-ul curent)
    const { logout } = useAuth();

    // Acestea sunt butoanele noastre de meniu
    const navItems = [
        { path: '/', name: 'Habits', icon: Trophy },
        { path: '/plan', name: 'Plan Zi', icon: CalendarDays },
        { path: '/goals', name: 'Obiective', icon: Target },
        { path: '/settings', name: 'Setări', icon: Settings },
    ];

    // Variabile pentru animația de intrare a paginilor (Framer Motion)
    const pageVariants = {
        initial: { opacity: 0, y: 10 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -10 }
    };

    return (
        <div className="flex h-screen bg-background text-textMain overflow-hidden">

            {/* 1. SIDEBAR PENTRU DESKTOP (ascuns pe ecrane mici) */}
            <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-gray-200 dark:border-gray-800">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-accent">HabitFlow</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path; // Verificăm dacă suntem pe această pagină

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-textMuted hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <Icon size={20} className={isActive ? 'text-accent' : ''} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button onClick={logout} className="flex items-center space-x-3 text-textMuted hover:text-red-500 w-full px-4 py-2 transition-colors cursor-pointer">
                        <LogOut size={20} />
                        <span>Delogare</span>
                    </button>
                </div>
            </aside>

            {/* 2. ZONA PRINCIPALĂ DE CONȚINUT */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">

                {/* Header doar pentru Mobile */}
                <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-gray-200 dark:border-gray-800 z-10">
                    <h1 className="text-xl font-bold text-accent">HabitFlow</h1>
                    <button onClick={logout} className="text-textMuted hover:text-red-500 cursor-pointer">
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Aici randăm paginile (cu animație de tranziție) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <motion.div
                        key={location.pathname}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={{ duration: 0.3 }}
                        className="h-full max-w-4xl mx-auto"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>

            {/* 3. BOTTOM NAVIGATION PENTRU MOBILE (ascuns pe desktop) */}
            <nav className="md:hidden absolute bottom-0 w-full bg-surface border-t border-gray-200 dark:border-gray-800 flex justify-around p-3 z-50">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center space-y-1 p-2 transition-all ${isActive ? 'text-accent' : 'text-textMuted'}`}
                        >
                            <Icon size={24} className={isActive ? 'text-accent' : ''} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}