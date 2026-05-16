import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importăm paginile noastre
import Login from './pages/Login';
import Register from './pages/Register';

// Aceasta este componenta care protejează paginile interne.
// Dacă nu există 'currentUser', redirecționează la '/login'.
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Dacă utilizatorul este logat, randează copiii (pagina pe care o cere)
  return children;
}

// O componentă temporară (Dashboard) pe care o vom construi la Task 3.
// Momentan ne asigurăm doar că utilizatorul ajunge aici după login și că se poate deloga.
function TempDashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-accent mb-4">HabitFlow - Dashboard Principal 🚀</h1>
      <p className="text-lg text-textMuted mb-8">
        Te-ai logat cu succes ca: <span className="font-semibold text-textMain">{currentUser.email}</span>
      </p>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors cursor-pointer"
      >
        Delogare
      </button>
    </div>
  );
}

// Aici setăm regulile de circulație ale aplicației
function App() {
  return (
    <Router>
      <Routes>
        {/* Rute publice (oricine poate accesa) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute private (doar pentru cei logați) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <TempDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;