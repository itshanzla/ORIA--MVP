import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems: NavItem[] = [
        {
            path: '/home',
            label: 'Home',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            )
        },
        {
            path: '/discover',
            label: 'Discover',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
            )
        },
        {
            path: '/mint',
            label: 'Mint',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            )
        },
        {
            path: '/library',
            label: 'Library',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
            )
        },
        {
            path: '/profile',
            label: 'Profile',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            )
        }
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-900">
            <div className="flex items-center justify-around py-2 pb-6">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
                            isActive(item.path)
                                ? 'text-purple-400'
                                : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                    >
                        {item.icon}
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
            {/* Active indicator line at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-center">
                <div className="w-32 h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full" />
            </div>
        </nav>
    );
};

export default BottomNav;
