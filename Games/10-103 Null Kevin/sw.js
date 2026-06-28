const CACHE = "unity-merge-cache-v1";

self.addEventListener("fetch", (event) => {
    const url = event.request.url;

    // -----------------------------
    // INTERCEPT UNITY DATA FILE
    // -----------------------------
    if (url.includes("103NK_Html5.data.unityweb")) {
        event.respondWith(handleUnityData(url));
        return;
    }
});

async function handleUnityData(url) {

    const part1Url = url + ".part1";
    const part2Url = url + ".part2";

    const cache = await caches.open(CACHE);

    // Try cache first
    const cached = await cache.match(url);
    if (cached) return cached;

    // Fetch both parts
    const [p1, p2] = await Promise.all([
        fetch(part1Url),
        fetch(part2Url)
    ]);

    const b1 = new Uint8Array(await p1.arrayBuffer());
    const b2 = new Uint8Array(await p2.arrayBuffer());

    // Merge
    const merged = new Uint8Array(b1.length + b2.length);
    merged.set(b1, 0);
    merged.set(b2, b1.length);

    const response = new Response(merged, {
        headers: {
            "Content-Type": "application/octet-stream"
        }
    });

    // Cache merged result
    cache.put(url, response.clone());

    return response;
}
