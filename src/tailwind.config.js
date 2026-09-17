import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.jsx',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
        display: ['"Barlow Condensed"', 'Barlow', ...defaultTheme.fontFamily.sans],
        brand: ['Barlow', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Línea visual Apple Boss (tienda, acceso y panel)
        ab: { navy: '#011446', navy2: '#0A1F5C', periwinkle: '#585E9F', lime: '#C6CB36', ink: '#0D0D1A', page: '#F5F6FA' },
        primary: {
          DEFAULT: '#0f172a', // Azul oscuro profesional
          light: '#1e293b',
        },
        secondary: '#6366f1', // Indigo Tailwind
        accent: '#14b8a6',    // Teal/Aqua
        success: '#10b981',   // Verde éxito
        warning: '#facc15',
        danger: '#ef4444',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },

  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
};
