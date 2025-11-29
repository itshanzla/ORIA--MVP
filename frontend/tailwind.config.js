/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'oria-purple': '#8B5CF6',
                'oria-blue': '#3B82F6',
                'oria-gold': '#F59E0B',
                'oria-dark': '#0A0A0A',
                'oria-gray': '#1A1A1A',
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
