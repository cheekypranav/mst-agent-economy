/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stitch: {
          bg: "#0a0e10",
          surface: "#12171a",
          surfaceSubtle: "#161d21",
          border: "#1e262a",
          borderHover: "#283339",
          mint: "#00e599",
          mintHover: "#00c985",
          mintSubtle: "rgba(0, 229, 153, 0.12)",
          mintBorder: "rgba(0, 229, 153, 0.25)",
          text: "#f0f4f6",
          muted: "#84939b",
          submuted: "#5a6870",
          amber: "#f59e0b",
          amberSubtle: "rgba(245, 158, 11, 0.12)",
          amberBorder: "rgba(245, 158, 11, 0.3)",
          blue: "#38bdf8",
          blueSubtle: "rgba(56, 189, 248, 0.12)",
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
