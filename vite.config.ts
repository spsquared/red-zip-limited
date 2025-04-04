import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        target: 'es2021'
    },
    server: {
        port: 5178
    },
})