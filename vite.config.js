import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
 
  base: '/my-3d-website/', 
  plugins: [
    tailwindcss(),
  ],
});