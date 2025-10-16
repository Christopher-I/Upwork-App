/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral palette (primary colors)
        gray: {
          50: '#F8F9FA',   // Page background
          100: '#F5F5F6',  // Section background
          200: '#E5E7EB',  // Borders
          300: '#D1D5DB',  // Disabled/hints
          400: '#9CA3AF',  // Tertiary text
          500: '#6B7280',  // Secondary text
          600: '#4B5563',  // Body text
          700: '#374151',  // Dark text
          800: '#1F2937',  // Darker text
          900: '#1A1A1A',  // Primary text (near black)
        },
        // Semantic colors (use sparingly)
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          600: '#10B981',
          700: '#059669',
          800: '#047857',
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#F59E0B',
          700: '#D97706',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#EF4444',
          700: '#DC2626',
        },
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],      // Extra small (hints)
        'sm': ['13px', { lineHeight: '20px' }],      // Small (labels, meta)
        'base': ['14px', { lineHeight: '22px' }],    // Body text
        'lg': ['16px', { lineHeight: '24px' }],      // Card titles
        'xl': ['18px', { lineHeight: '28px' }],      // Section headers
        '2xl': ['20px', { lineHeight: '30px' }],     // Numbers/scores
        '3xl': ['28px', { lineHeight: '36px' }],     // Page title
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
