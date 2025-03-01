import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

export default defineConfig({
  build: {
    lib: {
      fileName: (_format, entryName) => `${entryName}.js`,
      entry: [path.resolve(__dirname, 'plugin/index.ts')],
      name: 'vite-plugin-prettier-format',
      formats: ['es'],
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
    },
    minify: false,
  },
  plugins: [
    dts({
      include: [path.join(__dirname, 'plugin/index.ts')],
      insertTypesEntry: true,
      strictOutput: true,
      rollupTypes: true,
    }),
  ],
})
