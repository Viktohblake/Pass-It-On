/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#030712",
          surface: "#0f172a",
          "surface-light": "#1e293b",
          border: "#334155",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shake: "shake 0.15s ease-in-out infinite",
        flash: "flash 0.5s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "drift-1": "drift-1 25s ease-in-out infinite",
        "drift-2": "drift-2 30s ease-in-out infinite",
        "drift-3": "drift-3 20s ease-in-out infinite",
        "particle-rise": "particle-rise var(--duration) linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "75%": { transform: "translateX(3px)" },
        },
        flash: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        "drift-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(60px, -80px) scale(1.1)" },
          "66%": { transform: "translate(-40px, 40px) scale(0.9)" },
        },
        "drift-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-50px, 60px) scale(1.15)" },
          "66%": { transform: "translate(70px, -30px) scale(0.85)" },
        },
        "drift-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(40px, 50px) scale(0.95)" },
          "66%": { transform: "translate(-60px, -60px) scale(1.05)" },
        },
        "particle-rise": {
          "0%": {
            transform: "translateY(0) translateX(0)",
            opacity: "0",
          },
          "10%": { opacity: "var(--particle-opacity)" },
          "90%": { opacity: "var(--particle-opacity)" },
          "100%": {
            transform:
              "translateY(calc(-100vh - 20px)) translateX(var(--drift-x))",
            opacity: "0",
          },
        },
      },
      boxShadow: {
        "glow-green":
          "0 0 20px rgba(16, 185, 129, 0.3), 0 0 60px rgba(16, 185, 129, 0.1)",
        "glow-amber":
          "0 0 20px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.1)",
        "glow-red":
          "0 0 20px rgba(239, 68, 68, 0.4), 0 0 60px rgba(239, 68, 68, 0.15)",
        "glow-blue":
          "0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1)",
      },
    },
  },
  plugins: [],
};
