import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
export default defineConfig({base: process.env.BASE_PATH || '/', plugins: [react(), tailwindcss()], resolve: {alias: {'@': path.resolve(import.meta.dirname, 'src'), '@assets': path.resolve(import.meta.dirname, '../../attached_assets')},dedupe:['react','react-dom']},root:import.meta.dirname,build:{outDir:path.resolve(import.meta.dirname,'../../dist'),emptyOutDir:true},server:{port:Number(process.env.PORT)||4173,host:'0.0.0.0',allowedHosts:true},preview:{port:4173,host:'0.0.0.0',allowedHosts:true}});
