import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.VERBOSE': 'false',
  },
  resolve: {
    alias: [
      { find: "@app", replacement: path.resolve(__dirname, "./src") },
      { find: /^fs$/, replacement: path.resolve(__dirname, "./src/lib/shims/fs.ts") },
      { find: /^path$/, replacement: path.resolve(__dirname, "./src/lib/shims/path.ts") },
      { find: /^util$/, replacement: path.resolve(__dirname, "./src/lib/shims/util.ts") },
      { find: /^prettier$/, replacement: path.resolve(__dirname, "./src/lib/shims/prettier.ts") },
    ],
  },
})
