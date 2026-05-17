import React from 'react';
import WeeklyGoals from '../components/WeeklyGoals';
import { useAuth } from '../context/AuthContext';

export default function Goals() {
    const { currentUser } = useAuth() || {};

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-accent mb-2">Planificare Strategică</h1>
                <p className="text-textMuted text-sm">Stabilește-ți prioritățile majore pentru zilele de lucru și organizează-ți timpul de weekend.</p>
            </div>

            <WeeklyGoals userId={currentUser?.uid} />
        </div>
    );
}