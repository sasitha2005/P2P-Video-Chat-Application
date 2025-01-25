module.exports = {
  plugins: [
    'postcss-nesting', // Ensure this is before Tailwind CSS
    'tailwindcss',
    'autoprefixer',
  ],
};
