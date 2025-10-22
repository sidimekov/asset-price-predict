/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './apps/web/**/*.{js,ts,jsx,tsx}', // Убедитесь, что путь включает globals.css
        './src/**/*.{js,ts,jsx,tsx}', // Добавьте путь к src, если он не покрыт выше
    ],
    theme: {
        extend: {
            colors: {
                'ink': '#FFFFFF',
                'surface': '#201D47',
                'surface-dark': '#2A265F',
                'gray-400': '#A0A0A0',
                'gray-600': '#333333',
                'red-500': '#FF4444',
                'pink-500': '#FF409A',
                'purple-700': '#C438EF',
                'red-400': '#FF4D4D',
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(to right, #FF409A, #C438EF)',
                'gradient-danger': 'linear-gradient(to right, #FF0000, #FF4D4D)',
            },
            borderRadius: {
                '3xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 4px 6px rgba(0, 0, 0, 0.1)',
                'md': '0 2px 8px rgba(0,0,0,0.15)',
                'lg': '0 4px 10px rgba(0, 0, 0, 0.2)',
            },
            fontFamily: {
                'montserrat': ['Montserrat', 'sans-serif'],
            },
            animation: {
                'pulse': 'pulse 1.5s ease-in-out infinite',
            },
            keyframes: {
                pulse: {
                    '0%, 100%': { opacity: 0.5 },
                    '50%': { opacity: 1 },
                },
            },
        },
    },
    plugins: [],
};