/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        clinical: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
        app: {
          bg: '#F8FAFC',
          border: '#E2E8F0',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F1F5F9',
        },
        content: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        status: {
          success: '#15803D',
          'success-bg': '#F0FDF4',
          warning: '#B45309',
          'warning-bg': '#FFFBEB',
          danger: '#B91C1C',
          'danger-bg': '#FEF2F2',
          info: '#0369A1',
          'info-bg': '#F0F9FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        clinical: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'clinical-md': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        clinical: '12px',
      }
    },
  },
  plugins: [],
}
