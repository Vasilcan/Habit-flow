/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                accent: 'var(--accent-color)',
                background: 'var(--bg-color)',
                surface: 'var(--surface-color)',
                textMain: 'var(--text-main)',
                textMuted: 'var(--text-muted)',
            }
        },
    },
    plugins: [],
}