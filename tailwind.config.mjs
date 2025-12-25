/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'flowUp': 'flowUp 2s linear infinite',
        'flowInRight': 'flowInRight 2s linear infinite',
        'flowInLeft': 'flowInLeft 2s linear infinite',
      },
    },
  },
  plugins: [],
};
