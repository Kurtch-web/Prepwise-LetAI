import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      colors: {
        edu: {
          50: '#eff6ff',
          500: '#1e3a8a',
          600: '#1e40af',
          700: '#1d4ed8',
          900: '#1e1b4b'
        },
        review: {
          400: '#6ee7b7',
          500: '#10b981',
          600: '#059669'
        },
        gold: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04'
        }
      },
      spacing: {
        '18': '4.5rem',
        '28': '7rem',
        '36': '9rem',
        '72': '18rem'
      },
      boxShadow: {
        'glass': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 25px rgba(16, 185, 129, 0.3)',
        'card': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-left': 'slideInLeft 0.6s ease-out',
        'typewriter': 'typewriter 3s steps(40) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        typewriter: {
          '0%, 90%, 100%': { width: '0' },
          '50%, 60%': { width: '100%' }
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' }
        }
      }
    }
  },
  plugins: [],
  safelist: [
    'animate-fade-in-up',
    'animate-slide-left',
    'animate-typewriter',
    'animate-glow-pulse'
  ],
  corePlugins: {
    preflight: true
  }
} satisfies Config;
