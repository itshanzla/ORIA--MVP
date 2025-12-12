import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.svg',
                'favicon-32.png',
                'favicon-16.png',
                'apple-touch-icon.png',
                'apple-touch-icon-152.png',
                'apple-touch-icon-180.png',
                'safari-pinned-tab.svg',
                'og-image.png'
            ],
            manifest: {
                name: 'ORIA - Digital Music & NFT Marketplace',
                short_name: 'ORIA',
                description: 'Upload, verify, and transfer audio assets on Nexus Blockchain',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'standalone',
                orientation: 'portrait-primary',
                scope: '/',
                start_url: '/',
                categories: ['music', 'entertainment', 'finance'],
                lang: 'en',
                dir: 'ltr',
                icons: [
                    {
                        src: '/icon-72.png',
                        sizes: '72x72',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-96.png',
                        sizes: '96x96',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-128.png',
                        sizes: '128x128',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-144.png',
                        sizes: '144x144',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-152.png',
                        sizes: '152x152',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-384.png',
                        sizes: '384x384',
                        type: 'image/png',
                        purpose: 'maskable any'
                    },
                    {
                        src: '/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable any'
                    }
                ],
                screenshots: [
                    {
                        src: '/screenshot-mobile.png',
                        sizes: '390x844',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'ORIA Home Screen'
                    }
                ],
                shortcuts: [
                    {
                        name: 'Discover Music',
                        short_name: 'Discover',
                        description: 'Explore trending music NFTs',
                        url: '/discover',
                        icons: [{ src: '/icon-96.png', sizes: '96x96' }]
                    },
                    {
                        name: 'Create Asset',
                        short_name: 'Create',
                        description: 'Upload and mint new audio NFT',
                        url: '/mint',
                        icons: [{ src: '/icon-96.png', sizes: '96x96' }]
                    },
                    {
                        name: 'My Library',
                        short_name: 'Library',
                        description: 'View your collected assets',
                        url: '/library',
                        icons: [{ src: '/icon-96.png', sizes: '96x96' }]
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            networkTimeoutSeconds: 10,
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ],
                skipWaiting: true,
                clientsClaim: true
            },
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ],
    server: {
        port: 3000,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                }
            }
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom']
    }
});
