/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;
import { matchPrecache, PrecacheController } from "workbox-precaching";
//import { cacheNames } from 'workbox-core';
import { NavigationRoute, registerRoute, setDefaultHandler, } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { NetworkFirst, CacheOnly, CacheFirst, StaleWhileRevalidate,  } from 'workbox-strategies';
//import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

console.log('=== start sw.ts ===');

const CACHE_NAME = 'pwa-cache';
//const CACHE_NAME = cacheNames.precache;

//const pcacheCtrl = new PrecacheController();

const __WB_MANIFEST = self.__WB_MANIFEST;
// @ts-ignore
const cacheFilesWhenPWAInstall = self.__DIST_FILES__ || [];
const ver = import.meta.env.__APP_VERSION__;
const basePath = import.meta.env.VITE_BASE_PATH

console.log("basePath", basePath);
console.log("__APP_VERSION__", ver);
console.log("__WB_MANIFEST", __WB_MANIFEST);
console.log("cacheFilesPWAInstall", cacheFilesWhenPWAInstall);


// use PrecacheController to manually handle caching in case the precache has been deleted
//precacheAndRoute(__WB_MANIFEST);
const pcctrl = new PrecacheController({cacheName: 'precache'});
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
const netFirstStrategy = new NetworkFirst( strategyOptions );

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
    //return defaultStrategy.handle({event, request});
    return netFirstStrategy.handle({event, request});
  }
);


// handle route for Non-precached files
registerRoute(
  ({ request, url }) => (
      cacheFilesWhenPWAInstall.includes(url.pathname)
    ),
  defaultStrategy
);


// fallback to index.html for all SPA navigation requests
const ROOT_INDEX_PATH = basePath + 'index.html';
console.log("ROOT_INDEX_PATH", ROOT_INDEX_PATH);

registerRoute(
  ({ request, url }) => request.mode === 'navigate' &&
                   request.destination === 'document' &&
                   request.url.match(/\.html$|\/[a-z\-]*$/),
  async (args) => {
    const { request, event, url } = args;

    const normalizedUrl = new URL(url);
    if (
      !normalizedUrl.pathname.endsWith('/') &&
      !normalizedUrl.pathname.endsWith('.html')
    ) {
      normalizedUrl.pathname += '/';
    }

    const baseIndexCacheExists = await pcctrl.matchPrecache(ROOT_INDEX_PATH);
    if( !baseIndexCacheExists && normalizedUrl.pathname !== ROOT_INDEX_PATH ) {
      event.waitUntil( ensureBaseIndexCached() );
    }

    // check lang-indivisual index.html
    try {
      return await netFirstStrategy.handle({
        request: new Request(normalizedUrl),
        event,
      });
    } catch(e) {}

    // check precache's root index.html
    if( baseIndexCacheExists ) {
      console.log('fallback to base index.html');
      return pcctrl.createHandlerBoundToURL(ROOT_INDEX_PATH)(args);
    }
    else {
      console.log('manually cached index.html');
      return netFirstStrategy.handle({
        request: new Request(ROOT_INDEX_PATH),
        event,
      });
    }
  }
);

async function ensureBaseIndexCached() {
  await caches.open(CACHE_NAME).then(async cache => {
    if( await cache.match(ROOT_INDEX_PATH) ) {
      return;
    }
    
    const response = await fetch(ROOT_INDEX_PATH)
    if (response.ok) {
      await cache.put(ROOT_INDEX_PATH, response);
    }
  });
}




// default route
//setDefaultHandler( defaultStrategy );
