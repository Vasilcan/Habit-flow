import Goals from './pages/Goals';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importăm Layout-ul creat anterior
import Layout from './components/Layout';

// Importăm paginile
import Login from './pages/Login';
import Register from './pages/Register';
import Habits from './pages/Habits';
import Plan from './pages/Plan';
import Settings from './pages/Settings';

// Agentul de securitate
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute publice */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute private (îmbrăcate în Layout) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Habits />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <PrivateRoute>
              <Layout>
                <Plan />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          }
        />
        {/* RUTĂ NOUĂ PENTRU OBIECTIVE */}
        <Route 
          path="/goals" 
          element={
            <PrivateRoute>
              <Layout>
                <Goals />
              </Layout>
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
