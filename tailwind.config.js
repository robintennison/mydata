/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from your CSS
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',   // Primary color from CSS
          700: '#1d4ed8',   // Primary hover from CSS
          800: '#1e40af',
        },
        'secondary': '#48bb78',
        
        // Error colors from CSS
        'error': {
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        
        // Gray scale from your CSS variables
        'gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        
        // Additional colors from your CSS
        'indigo': {
          50: '#eef2ff',
          600: '#4f46e5',
        },
        
        'orange': {
          50: '#fff7ed',
          300: '#fdba74',
        },
        
        'yellow': {
          50: '#fefce8',
          500: '#eab308',
        },
        
        'red': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          100: '#fee2e2',
          700: '#b91c1c',
        },
        
        'green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          800: '#166534',
        },
        
        'blue': {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      
      spacing: {
        '0.5': '2px',
        '2.5': '0.625rem',    // 10px
        '7.5': '1.875rem',    // 30px
        '11': '2.75rem',      // 44px
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px
        '15': '3.75rem',      // 60px
        '18': '4.5rem',       // 72px
        '36': '9rem',         // 144px
        '44': '11rem',        // 176px
      },
      
      fontSize: {
        'xxs': '0.65rem',     // 10.4px
        'xs': '0.75rem',      // 12px
        'sm': '0.875rem',     // 14px
        'base': '1rem',       // 16px
        'lg': '1.125rem',     // 18px
        'xl': '1.25rem',      // 20px
        '2xl': '1.5rem',      // 24px
        '3xl': '1.875rem',    // 30px
        '4xl': '2.25rem',     // 36px
        '5xl': '3rem',        // 48px
      },
      
      minHeight: {
        '7': '1.75rem',       // 28px
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px
        '36': '9rem',         // 144px
        '44': '11rem',        // 176px
        '60': '15rem',        // 240px
        '70': '17.5rem',      // 280px
      },
      
      maxWidth: {
        '2xl': '42rem',       // 672px
        '3xl': '48rem',       // 768px
        '4xl': '56rem',       // 896px
      },
      
      borderRadius: {
        'lg': '0.5rem',       // 8px
        'xl': '0.75rem',      // 12px
        '2xl': '1rem',        // 16px
      },
      
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.15)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      
      borderWidth: {
        '3': '3px',
        '6': '6px',
      },
      
      flex: {
        '2': '2 1 0%',
      },
      
      animation: {
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Additional utility classes for common patterns
      backgroundColor: {
        'primary-hover': '#1d4ed8',
        'secondary-hover': '#38a169',
      },
      
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },
      
      zIndex: {
        '1': '1',
        '5': '5',
        '10': '10',
        '20': '20',
        '25': '25',
        '30': '30',
        '40': '40',
        '50': '50',
        '75': '75',
        '100': '100',
        'auto': 'auto',
      },
      
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '85': '0.85',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,  // Keep Tailwind's base reset
  },
}