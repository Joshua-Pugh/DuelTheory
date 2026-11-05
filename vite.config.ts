import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {publicBoundary} from './build/publicBoundary';
export default defineConfig({ plugins: [react(),publicBoundary()],publicDir:false });
