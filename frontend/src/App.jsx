import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<div>Dashboard</div>} />
                    <Route path="/drivers" element={<div>Drivers</div>} />
                    <Route path="/vehicles" element={<div>Vehicles</div>} />
                    <Route path="/holidays" element={<div>Holidays</div>} />
                    <Route path="/salaries" element={<div>Salaries</div>} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;