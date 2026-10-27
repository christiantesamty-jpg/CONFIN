'use strict';
const VERSION='5.3.6';
const CACHE=`confin-static-${VERSION}`;
const ASSETS=[
  './index.html','./manifest.webmanifest',
  './assets/5.3.6/boot.js','./assets/5.3.6/core.js','./assets/5.3.6/app.js','./assets/5.3.6/styles.css',
  './icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png'
];
const scoped=path=>new URL(path,self.registration.scope).href;
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Any missing/mis-typed asset aborts install. No automatic skipWaiting.
    const responses=await Promise.all(ASSETS.map(async path=>{
      const response=await fetch(scoped(path),{cache:'reload'});
      if(!response.ok)throw new Error(`No se pudo descargar ${path}`);
      const type=response.headers.get('content-type')||'';
      if(path.endsWith('.js')&&!/javascript|ecmascript/.test(type))throw new Error('El servidor devolvio un archivo incorrecto');
      if(path.endsWith('.css')&&!type.includes('text/css'))throw new Error('Hoja de estilos incorrecta');
      return [path,response];
    }));
    await Promise.all(responses.map(([path,response])=>cache.put(scoped(path),response)));
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Keep the immediately previous static cache for already-open pages.
    const keys=await caches.keys(),prior=keys.filter(k=>k.startsWith('confin-static-')&&k!==CACHE);
    await Promise.all(prior.slice(0,-1).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url),scope=new URL(self.registration.scope);
  if(req.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(url.pathname===new URL('version.json',scope).pathname){event.respondWith(fetch(req,{cache:'no-store'}));return}
  if(req.mode==='navigate'){
    // Cached shell remains coherent with its versioned assets until activation is approved.
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),shell=await cache.match(scoped('./index.html'));
      if(shell)return shell;
      return fetch(req);
    })());return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(req);if(cached)return cached;
    // A script/style request must never receive an HTML offline fallback.
    return fetch(req);
  })());
});
