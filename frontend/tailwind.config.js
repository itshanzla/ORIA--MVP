/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary brand colors
                'oria': {
                    purple: '#8B5CF6',
                    'purple-dark': '#7C3AED',
                    'purple-light': '#A78BFA',
                    blue: '#3B82F6',
                    'blue-dark': '#2563EB',
                    'blue-light': '#60A5FA',
                    gold: '#F59E0B',
                    'gold-dark': '#D97706',
                    'gold-light': '#FBBF24',
                },
                // Background colors
                'surface': {
                    primary: '#000000',
                    secondary: '#0A0A0A',
                    tertiary: '#111111',
                    elevated: '#1A1A1A',
                    overlay: '#141414',
                },
                // Text colors
                'content': {
                    primary: '#FFFFFF',
                    secondary: '#A1A1AA',
                    tertiary: '#71717A',
                    muted: '#52525B',
                },
                // Border colors
                'stroke': {
                    primary: '#27272A',
                    secondary: '#3F3F46',
                    subtle: '#1F1F23',
                },
                // Status colors
                'status': {
                    success: '#22C55E',
                    'success-muted': '#166534',
                    warning: '#F59E0B',
                    'warning-muted': '#92400E',
                    error: '#EF4444',
                    'error-muted': '#991B1B',
                    info: '#3B82F6',
                    'info-muted': '#1E40AF',
                },
            },
            fontFamily: {
                'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
                'display': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                // Mobile-first type scale
                'display-lg': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
                'display-sm': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
                'heading': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
                'heading-sm': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
                'body-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
                'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
                'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
                'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
                'overline': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
            },
            spacing: {
                // PWA safe areas
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
                // Custom spacing
                '4.5': '1.125rem',
                '13': '3.25rem',
                '15': '3.75rem',
                '18': '4.5rem',
                '22': '5.5rem',
                '26': '6.5rem',
                '30': '7.5rem',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            boxShadow: {
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
                'card-hover': '0 8px 32px rgba(0, 0, 0, 0.5)',
                'button': '0 4px 12px rgba(0, 0, 0, 0.3)',
                'nav': '0 -4px 24px rgba(0, 0, 0, 0.8)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out',
                'fade-in-down': 'fadeInDown 0.4s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'shimmer': 'shimmer 2s infinite',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
                'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-4px)' },
                },
            },
            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'gradient-purple': 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                'gradient-gold': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                'gradient-blue': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                'gradient-dark': 'linear-gradient(180deg, #0A0A0A 0%, #000000 100%)',
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            },
        },
    },
    plugins: [],
}
