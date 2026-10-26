import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite';
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa'
import electron from 'vite-plugin-electron/simple'


export default defineConfig(({ command, mode }) => {
  const isElectron = mode === 'electron'

  return {
    base: isElectron && command === 'build' ? './' : '/',
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),

      // IMP: if its not electron it builds a web app + website
      ...(!isElectron ? [
        VitePWA({
          manifest: {
            name: 'Spader — PDF Reader',
            short_name: 'Spader',
            description: 'Read and manage PDF documents.',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: '#111111',
            theme_color: '#111111',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
          },
        })
      ] : []),

      // If its electron it builds an App
      ...(isElectron ? [
        electron({
          main: {
            entry: 'electron/main.ts',
          },
        }),
      ] : []),
    ]
  }
})

// https://vite.dev/config/
// export default defineConfig( {
//   plugins: [
//     react(),
//     babel({ presets: [reactCompilerPreset()] }),
//     tailwindcss(),
//     VitePWA({
//       manifest: {
//         name: 'Spader — PDF Reader',
//         short_name: 'Spader',
//         description: 'Read and manage PDF documents.',
//         start_url: '/',
//         scope: '/',
//         display: 'standalone',
//         background_color: '#111111',
//         theme_color: '#111111',
//         icons: [
//           {
//             src: '/pwa-192x192.png',
//             sizes: '192x192',
//             type: 'image/png',
//           },
//           {
//             src: '/pwa-512x512.png',
//             sizes: '512x512',
//             type: 'image/png',
//           },
//         ],
//       },
//     }),
//   electron({
//     main: {
//       entry:'electron/main.ts'
//     }
//   }),
//   ],
// })
