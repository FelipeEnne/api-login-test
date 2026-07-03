import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The source files use the .js extension but contain JSX, so esbuild is told to
// treat every .js file under src/ as JSX (CRA allowed this implicitly).
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        open: true,
    },
    build: {
        outDir: 'build',
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});
