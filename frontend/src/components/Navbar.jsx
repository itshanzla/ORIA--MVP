import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('oria_user') || 'null');

    const handleLogout = () => {
        localStorage.removeItem('oria_user');
        localStorage.removeItem('oria_token');
        navigate('/login');
    };

    // Don't show navbar on login/register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-2xl font-bold bg-gradient-to-r from-oria-purple to-oria-blue bg-clip-text text-transparent"
                        >
                            ORIA
                        </button>
                    </div>

                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-oria-purple to-oria-blue flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {user.email?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-300 hidden sm:block">
                                    {user.email}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
