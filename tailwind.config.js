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
          50: '#eff6ff',    // For primary-50 in CSS
          100: '#dbeafe',   // For hover states
          600: '#2563eb',   // Primary color from CSS
          700: '#1d4ed8',   // Primary hover from CSS
          800: '#1e40af',   // For gradients
        },
        'secondary': '#48bb78',
        
        // Error colors from CSS
        'error': {
          500: '#ef4444',   // error-500 from CSS
          600: '#dc2626',   // error-600 from CSS
          700: '#b91c1c',   // error-700 from CSS
        },
        
        // Gray scale from your CSS variables
        'gray': {
          50: '#f9fafb',    // --color-gray-50
          100: '#f3f4f6',   // --color-gray-100
          200: '#e5e7eb',   // --color-gray-200, border-gray-200
          300: '#d1d5db',   // For lighter borders
          400: '#9ca3af',   // For scrollbar
          500: '#6b7280',   // For muted text
          600: '#4b5563',   // --color-gray-600
          700: '#374151',   // --color-gray-700
          800: '#1f2937',   // For dark text
          900: '#111827',   // --color-gray-900
        },
        
        // Additional colors from your CSS
        'indigo': {
          50: '#eef2ff',
          600: '#4f46e5',   // From addButton in CSS
        },
        
        'orange': {
          50: '#fff7ed',    // For immediateRow background
          300: '#fdba74',   // For immediateRow border
        },
        
        'yellow': {
          50: '#fefce8',    // For warning states
          500: '#eab308',   // For warning badges
        },
        
        'red': {
          50: '#fef2f2',    // For expiredRow background
          500: '#ef4444',   // For expiredRow border
          600: '#dc2626',   // For immediateBadge
          100: '#fee2e2',   // For expiredBadge background
          700: '#b91c1c',   // For expiredBadge text
        },
        
        'green': {
          50: '#f0fdf4',    // For normal states
          100: '#dcfce7',   // For normalBadge background
          800: '#166534',   // For normalBadge text
        },
        
        'blue': {
          50: '#eff6ff',    // For activeModule
          500: '#3b82f6',   // From spinner and primary
          600: '#2563eb',   // From hover states
        },
      },
      
      spacing: {
        // Extended spacing for your specific needs
        '0.5': '2px',
        '2.5': '0.625rem',    // 10px
        '7.5': '1.875rem',    // 30px
        '11': '2.75rem',      // 44px for button sizes
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px for header height
        '15': '3.75rem',      // 60px
        '18': '4.5rem',       // 72px
        '36': '9rem',         // 144px
        '44': '11rem',        // 176px
      },
      
      fontSize: {
        'xxs': '0.65rem',     // 10.4px - matches your compactCellValue
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
        '7': '1.75rem',       // 28px - matches compactRow min-height
        '12': '3rem',         // 48px
        '14': '3.5rem',       // 56px
        '36': '9rem',         // 144px
        '44': '11rem',        // 176px
        '60': '15rem',        // 240px
        '70': '17.5rem',      // 280px
      },
      
      maxWidth: {
        '2xl': '42rem',       // 672px - closer to your 600px max
        '3xl': '48rem',       // 768px
        '4xl': '56rem',       // 896px
      },
      
      borderRadius: {
        'lg': '0.5rem',       // 8px
        'xl': '0.75rem',      // 12px - matches your 10px-12px borders
        '2xl': '1rem',        // 16px
      },
      
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.05)',      // header shadow
        'DEFAULT': '0 2px 6px rgba(0, 0, 0, 0.06)', // statCard shadow
        'md': '0 4px 12px rgba(0, 0, 0, 0.1)',      // hover states
        'lg': '0 10px 25px rgba(0, 0, 0, 0.15)',    // for modals
      },
      
      borderWidth: {
        '3': '3px',
        '6': '6px',
      },
      
      flex: {
        '2': '2 1 0%',        // For cellFlex2 in tables
      },
      
      animation: {
        'spin': 'spin 1s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      
      // Custom variants for your responsive design
      screens: {
        'xs': '480px',        // Your mobile breakpoint
        'sm': '640px',
        'md': '768px',        // Your tablet breakpoint
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
  // Important for overriding some base styles
  corePlugins: {
    preflight: true,
  },
}