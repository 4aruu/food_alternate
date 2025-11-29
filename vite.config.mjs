import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 4028,
    host: "0.0.0.0"
  },
  build: {
    outDir: "build"
  },
  plugins: [react()]
});
