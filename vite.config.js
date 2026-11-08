import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE is "/ORAL241/" on GitHub Pages (set by the workflow) and "/" on Netlify.
export default defineConfig({ plugins: [react()], base: process.env.VITE_BASE || "/" });
