const V="lechuza-v3";
const CORE=["./","index.html","manifest.json","apple-touch-icon.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  if(url.origin===location.origin){
    // red primero (para recibir actualizaciones); si no hay señal o la red tarda más de 3 s, la copia guardada.
    // La descarga sigue en segundo plano y actualiza la copia para la próxima vez.
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r});
    e.waitUntil(net.catch(()=>{}));
    const cached=()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"));
    const slow=new Promise(res=>setTimeout(res,3000)).then(cached);
    e.respondWith(Promise.race([net.catch(cached),slow.then(r=>r||net)]));
  }else if(url.hostname.endsWith("googleapis.com")||url.hostname.endsWith("gstatic.com")){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp));return res})));
  }
});
