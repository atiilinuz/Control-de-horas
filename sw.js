
const CACHE_NAME = 'horas-2026-offline-v1';

// Lista exhaustiva de recursos para funcionamiento Offline
const ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './types.ts',
  './App.tsx',
  // Utils
  './utils/calendar.ts',
  './utils/security.ts',
  './utils/storage.ts',
  './utils/export.ts',
  './utils/pdf.ts',
  // Context & Hooks
  './context/AppContext.tsx',
  './hooks/usePayroll.ts',
  // Components
  './components/LoginScreen.tsx',
  './components/DayModal.tsx',
  './components/SettingsView.tsx',
  './components/CalendarView.tsx',
  './components/YearView.tsx',
  './components/ReportsView.tsx',
  './components/StatsView.tsx',
  './components/StatsCard.tsx',
  './components/Onboarding.tsx',
  // External Libraries (CDNs) - Crucial para offline
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/lucide-react@0.460.0?deps=react@18.3.1',
  'https://esm.sh/zod@3.22.4',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs',
  'https://esm.sh/recharts@2.12.0?deps=react@18.3.1,react-dom@18.3.1',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/jspdf-autotable@3.8.1',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  // Forzar la espera para asegurar que se descargue todo
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Abriendo caché y descargando recursos offline...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Cache First, falling back to Network
  // Esto hace que la app se sienta instantánea y nativa
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        // Cachear dinámicamente nuevos recursos (ej: fuentes, iconos extra)
        if (!response || response.status !== 200 || response.type !== 'basic') {
            // Permitir respuestas opacas (CDN cors) pero intentando cachearlas si es posible
            if (response.type === 'opaque' && event.request.url.startsWith('http')) {
                // Opaque responses can be cached
            } else {
                return response;
            }
        }
        
        // Clonar y guardar en cache si es un recurso http válido
        if (event.request.url.startsWith('http')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return response;
      }).catch(() => {
        // Fallback para navegación si estamos offline y no hay cache
        if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
        }
      });
    })
  );
});
