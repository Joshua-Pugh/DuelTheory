import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],publicDir:false,define:{'import.meta.env.VITE_MATCH_API_URL':JSON.stringify('/api'),'import.meta.env.VITE_EVENT_API_URL':JSON.stringify('/api')},build:{outDir:'dist-private',emptyOutDir:true,rollupOptions:{input:'private/index.html'},sourcemap:false}});
