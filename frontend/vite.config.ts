import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({mode})=>{
const backend=loadEnv(mode,'.','PAGODA_').PAGODA_BACKEND_URL || 'http://localhost:2567';
return {
  plugins: [react()],
  server: {
    proxy: {
      "/api": backend,
      "/matchmake": backend,
      "/realtime": {
        target: backend.replace(/^http/,'ws'),
        ws: true,
        rewrite: (p) => p.replace(/^\/realtime/, ""),
      },
    },
  },
  build: { chunkSizeWarningLimit: 1100 },
};});
