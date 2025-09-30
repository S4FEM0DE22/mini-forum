// tailwind.config.js
export default {
  darkMode: 'class', // เปิดใช้งาน Dark Mode แบบ class
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color (kept blue but tuned for better contrast)
        primary: "#1D4ED8",
        'primary-600': '#2563EB',
        'primary-dark': "#1E40AF",

        // Accent color for highlights / CTAs
        accent: '#06B6D4', // cyan-500

        // Neutral / surfaces
        surface: '#FFFFFF',
        muted: '#6B7280',
        'secondary-dark': "#374151",
        'secondary-light': "#F3F4F6",

        // Background / text tokens
        'bg-dark': "#1F2937",
        'text-dark': "#F9FAFB",

        // Feedback
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      backgroundImage: {
        // Primary brand gradient: blue -> cyan
        'primary-gradient': 'linear-gradient(90deg, #1D4ED8 0%, #06B6D4 60%)',
        // Header / hero gradient with softer stops
        'header-gradient': 'linear-gradient(120deg, rgba(29,78,216,0.95), rgba(6,182,212,0.92) 60%)',
        // Soft overlay gradient for panels
        'soft-gradient': 'linear-gradient(180deg, rgba(29,78,216,0.06), rgba(6,182,212,0.02))',
      },
      boxShadow: {
        card: "0 4px 10px rgba(2,6,23,0.08)",
        'card-dark': "0 8px 30px rgba(2,6,23,0.4)",
        soft: '0 6px 18px rgba(16,24,40,0.06)',
        glow: '0 8px 30px rgba(29,78,216,0.12)'
      },
      fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          lg: '2rem',
          xl: '4rem',
        },
      },
    },
  },
  plugins: [],
};

