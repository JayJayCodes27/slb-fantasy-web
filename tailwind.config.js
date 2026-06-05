/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A1628',
        orange: '#FF5500',
        'orange-hover': '#FF6B1A',
        'bg-primary': '#0D0D0D',
        'bg-card': '#141414',
        'bg-card-hover': '#1C1C1C',
        'border-color': '#2A2A2A',
        'text-primary': '#FFFFFF',
        'text-secondary': '#999999',
        'text-muted': '#555555',
        'green-live': '#00FF87',
        'red-out': '#FF3B3B',
        'amber-doubtful': '#FFB800',
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        bebas: ['Bebas Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
