import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const user = localStorage.getItem('oria_user');
    return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <div className="App">
                <Navbar />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/dashboard" element={<Navigate to="/home" />} />
                    <Route path="/" element={<Navigate to="/home" />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
};

export default App;
