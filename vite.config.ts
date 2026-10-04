/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBaseUrl = env.VITE_ACCOUNT_API_URL ?? ''
  // Si la URL base es relativa (p. ej. /account-api/...), en dev se redirige al backend real.
  const proxy =
    apiBaseUrl.startsWith('/') && env.VITE_API_PROXY_TARGET
      ? {
          [apiBaseUrl]: {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
          },
        }
      : undefined

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    // En modo librería Vite no reemplaza process.env.NODE_ENV y React lo necesita.
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      ...(command === 'build' && {
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    },
    server: { proxy },
    build: {
      copyPublicDir: false,
      lib: {
        entry: 'src/app/embed.ts',
        name: 'AccountWidget',
        formats: ['iife'],
        fileName: () => 'account-widget.js',
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      restoreMocks: true,
      css: { include: [/widget\.css/] },
    },
  }
})
