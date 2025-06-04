/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6", // Blue-500 (kept for some elements, can be main glow)
          hover: "#2563eb", // Blue-600
        },
        // Process-specific glow colors
        glow: {
          default: "#3b82f6", // Blue-500
          recording: "#ef4444", // Red-500
          translating: "#8b5cf6", // Violet-500
          camera: "#10b981", // Emerald-500
          success: "#06b6d4", // Cyan-500
        },
        // Dark theme palette
        brand: {
          cyan: "#06b6d4",
          blue: "#3b82f6",
        },
        "gray-900": "#111827",
        "gray-800": "#1f2937",
        "gray-700": "#374151",
        "gray-400": "#9ca3af",
        "white-t": "rgba(255, 255, 255, 0.1)", // Transparent white for borders
      },
      gap: {
        section: "2rem",
      },
      borderRadius: {
        container: "0.5rem", // Default container
        "3xl": "1.5rem", // For larger rounded elements like input area
        "2xl": "1rem",   // For header and buttons
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-beat': 'subtle-beat 1.5s ease-in-out infinite',
        'arrow-slide': 'arrow-slide 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        'subtle-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'arrow-slide': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(5px)' },
        }
      },
    },
  },
  plugins: [],
};
