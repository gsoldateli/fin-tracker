import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        fileParallelism: true,
        setupFiles: ['vitest.setup.ts'],
        globalSetup: ['vitest.global.setup.ts'],

        // Define quais arquivos serão considerados testes (unit e integration)
        // Testes de integração: .test.ts(x) | Testes Unitários: .spec.ts(x)
        include: ['src/**/*.{spec,test}.{ts,tsx}'],

        // Tempo máximo para cada teste (em milissegundos)
        // antes de ser considerado travado ou falho
        testTimeout: 10000,

        coverage: {
            reportsDirectory: './coverage',
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],

        },
    },

    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            // '@': path.resolve(__dirname, './*'),
        },
    },
});