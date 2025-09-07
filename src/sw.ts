/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;
import { PrecacheController } from "workbox-precaching";
//import { cacheNames } from 'workbox-core';
import { registerRoute, setDefaultHandler, } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { NetworkFirst, CacheOnly, CacheFirst, StaleWhileRevalidate,  } from 'workbox-strategies';
//import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

console.log('=== start sw.ts ===');

const CACHE_NAME = 'pwa-cache';
//const CACHE_NAME = cacheNames.precache;

//const pcacheCtrl = new PrecacheController();

const __WB_MANIFEST = self.__WB_MANIFEST;
const cacheFilesWhenPWAInstall = import.meta.env.__DIST_FILES__;
const ver = import.meta.env.__APP_VERSION__;
console.log("__WB_MANIFEST", __WB_MANIFEST);
console.log("cacheFilesPWAInstall", cacheFilesWhenPWAInstall);


// use PrecacheController to manually handle caching in case the precache has been deleted
//precacheAndRoute(__WB_MANIFEST);
const pcctrl = new PrecacheController();
pcctrl.addToCacheList(__WB_MANIFEST);




self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('=== install sw ===');

  // precache
  event.waitUntil(pcctrl.install(event));
});
self.addEventListener('activate', (event) => {
  console.log('=== activate sw ===');
  
  // cleanup precache
  event.waitUntil(pcctrl.activate(event));

  // remove unnecessary old caches
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const keys = await cache.keys();
      await Promise.all(
        keys.map(request => {
          const url = new URL(request.url);
          const pathname = url.pathname;

          if( !cacheFilesWhenPWAInstall.includes(pathname) ) {
            console.log(`removed old cache "${pathname}"`);
            return cache.delete(request);
          }
        })
      );
    })
  );
});

self.addEventListener('message', async (event) => {
  const action = event.data?.type;
  if( action === 'SKIP_WAITING' ) {
    self.skipWaiting();
    clientsClaim();
    return;
  }
  
  // when install as PWA
  if( event.data === 'app-installed' ) {
    // cache all other files associated with the app
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('cache additional files for installed app.');
        return cache.addAll(cacheFilesWhenPWAInstall);
      })
    );
  }
});


const strategyOptions = {
  cacheName: CACHE_NAME,
  
  // *to enable caching, it's necessary to ignore the Vary header
  matchOptions: {
    ignoreVary: true,
  },
  plugins: [
    new ExpirationPlugin({
      maxEntries: 200,
    }),
  ],
};
const defaultStrategy = new StaleWhileRevalidate( strategyOptions );
const netfirst = new NetworkFirst( strategyOptions );

// handle precached route
registerRoute(
  ({ request, url }) => !!pcctrl.getCacheKeyForURL(url.href),
  async ({ request, event }) => {
    const cached = await pcctrl.matchPrecache(request.url);
    if( cached ) {
      console.log('handle precached route', request.url);
      return cached;
    }

    // Use manual cache if not found in precache
    console.log('manual caching');
    return defaultStrategy.handle(event as FetchEvent);
  }
);

// fallback to index.html for all SPA navigation requests
registerRoute(
  ({ request }) => request.destination === 'document',
  async (args) => {
    const { request, event, url } = args;
    
    const pcached = await pcctrl.matchPrecache('index.html');
    if( pcached ) {
      console.log('precached index.html');
      return pcctrl.createHandlerBoundToURL('index.html')(args);
    }
    else {
      console.log('manually cached index.html');
      const durl = 'index.html';
      return defaultStrategy.handle({
        request: new Request(durl),
        event,
      });
    }
  }
);

// handle route for Non-precached files
registerRoute(
  ({ request, url }) => cacheFilesWhenPWAInstall.includes(url.pathname),
  defaultStrategy
);

// default route
//setDefaultHandler( defaultStrategy );
