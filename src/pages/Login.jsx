import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setLoading(true);
            await login(email, password);
            toast.success('Te-ai logat cu succes!');
            navigate('/'); // Redirecționăm utilizatorul către dashboard
        } catch (error) {
            console.error(error);
            toast.error('Eroare la logare. Verifică emailul și parola.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Toaster position="top-center" />

            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-accent mb-2">HabitFlow</h1>
                    <p className="text-textMuted">Bine ai revenit! Loghează-te pentru a-ți vedea progresul.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            placeholder="nume@exemplu.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">Parolă</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-gray-300 dark:border-gray-700 text-textMain focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 cursor-pointer"
                    >
                        {loading ? 'Se încarcă...' : 'Intră în cont'}
                    </button>
                </form>

                <div className="mt-6 text-center text-textMuted text-sm">
                    Nu ai cont? <Link to="/register" className="text-accent hover:underline font-medium">Înregistrează-te aici</Link>
                </div>
            </div>
        </div>
    );
}