/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-page': '#0a0a0a',
        'bg-card': '#141414',
        'bg-card-hover': '#1a1a1a',
        'border-color': '#242424',
        'border-subtle': '#1e1e1e',
        'orange-primary': '#FF6B00',
        'orange-hover': '#e05f00',
        'orange-muted': '#cc5500',
        'white-primary': '#FFFFFF',
        'white-muted': '#a0a0a0',
        'white-faint': '#555555',
        'green-live': '#22c55e',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '10px',
        'button': '8px',
        'pill': '6px',
      },
      boxShadow: {
        'glow': '0 0 0 1px #FF6B00',
      },
    },
  },
  plugins: [],
}
