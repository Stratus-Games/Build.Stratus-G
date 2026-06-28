const CACHE_NAME = "unity-data-cache-v1";

self.addEventListener("fetch", (event) => {
    const url = event.request.url;

    // ONLY intercept main Unity data file
    if (url.includes("103NK_Html5.data.unityweb") &&
        !url.includes(".part1") &&
        !url.includes(".part2")) {

        event.respondWith(handleUnityData(url));
    }
});

async function handleUnityData(url) {

    const cache = await caches.open(CACHE_NAME);

    // If already merged, return cached version
    const cached = await cache.match(url);
    if (cached) return cached;

    const part1Url = url + ".part1";
    const part2Url = url + ".part2";

    const [r1, r2] = await Promise.all([
        fetch(part1Url),
        fetch(part2Url)
    ]);

    if (!r1.ok || !r2.ok) {
        throw new Error("Unity data parts missing");
    }

    const b1 = new Uint8Array(await r1.arrayBuffer());
    const b2 = new Uint8Array(await r2.arrayBuffer());

    // Merge binary
    const merged = new Uint8Array(b1.length + b2.length);
    merged.set(b1, 0);
    merged.set(b2, b1.length);

    // Create REAL Response (this is the “memory file” Unity reads)
    const response = new Response(merged, {
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Length": merged.length.toString()
        }
    });

    // Store in browser cache (this replaces “blob memory idea” correctly)
    await cache.put(url, response.clone());

    return response;
}
