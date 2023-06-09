/**
 * @copyright ${copyright}
 * @namespace thalesvb.5R
 */
class CacheBusterWorker {
    static #appCacheName = "5RPWA-draft";
    static #uifCacheName = "5RPWA_UIF";
    static #cbFileName = "sap-ui-cachebuster-info.json";
    static #instance;

    #manifest;

    async #init() {
        const reqCurrentCacheBusterInfo = new Request(CacheBusterWorker.#cbFileName);
        let [currentManifest, cachedManifest] = await Promise.all([
            fetch(reqCurrentCacheBusterInfo),
            caches.match(CacheBusterWorker.#cbFileName)
        ]);
        if (currentManifest.status !== 200) {
            return;
        }
        const currentJson = await currentManifest.clone().json();
        const cachedJson = cachedManifest ? await cachedManifest.json() : undefined;
        // TODO: Use a better JSON comparison instead of relying on stringfy.
        if (JSON.stringify(currentJson) !== JSON.stringify(cachedJson)) {
            CacheBusterWorker.#revokeObsoleteData(currentJson, cachedJson);
            CacheBusterWorker.#revokeUI5Data();
            CacheBusterWorker.storeCache(reqCurrentCacheBusterInfo, currentManifest.clone());
        }
        this.#manifest = currentJson;
    }
    /**
     * Remove obsolete entries from application cache.
     * This is done by deleting existing entries from oldManifest that eithers have a different
     * hash from the new one or doesn't exists on new manifest.
     * @param newManifest 
     * @param oldManifest 
     */
    static async #revokeObsoleteData(newManifest, oldManifest) {
        for (const k in oldManifest) {
            if (oldManifest[k] = newManifest[k]) {
                continue;
            }
            const urlCached = `/~${oldManifest[k]}~/${k}`;
            if (await caches.match(urlCached)) {
                caches.delete(k);
            }
        }
    }
    static async #revokeUI5Data() {
        const cache = await caches.open(CacheBusterWorker.#uifCacheName);
        cache.keys().then((keyList) => {
            Promise.all(
                keyList.map((key) => cache.delete(key) )
            );
        });
    }
    static async storeCache(request, response) {
        const cacheName = request.url.includes("/resources/") ? CacheBusterWorker.#uifCacheName : CacheBusterWorker.#appCacheName;
        const cache = await caches.open(cacheName);
        console.debug(`[Service Worker] Caching new resource: ${request.url}`);
        cache.put(request, response);
    }
    async fetchHandler(e) {
        const r = await caches.match(e.request);
        console.debug(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) {
            console.debug(`[Service Worker] Fetched from cache: ${e.request.url}`);
            return r;
        }
        const response = await fetch(e.request);
        CacheBusterWorker.storeCache(e.request, response.clone());
        return response;
    }
    static async getInstance() {
        if (!CacheBusterWorker.#instance) {
            CacheBusterWorker.#instance = new CacheBusterWorker();
            await CacheBusterWorker.#instance.#init();
        }
        return CacheBusterWorker.#instance;
    }

}

self.addEventListener('fetch', function(e) {
    if(e.request.destination === "audio") {
        return;
    }
    e.respondWith(
        (async() => {
            return (await CacheBusterWorker.getInstance()).fetchHandler(e);
        })()
    );
});
