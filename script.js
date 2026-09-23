console.log("WebMorph updated");
const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

let forced = null;
let hits = Number(localStorage.getItem("webmorphHits") || 0);


// ==================== NETWORK DETECTION ====================

function network() {

    if (!navigator.onLine) {
        return {
            cat: "OFFLINE",
            speed: 0,
            type: "Offline"
        };
    }

    if (forced) {
        return {
            cat: forced,
            speed: forced === "FAST"
                ? 20
                : forced === "MEDIUM"
                ? 5
                : 0.7,
            type: "Demo"
        };
    }

    const speed = Number(connection?.downlink || 0);
    const type = connection?.effectiveType || "Unavailable";
    const save = Boolean(connection?.saveData);

    let cat = "MEDIUM";

    if (
        save ||
        /2g|3g/i.test(type) ||
        (speed > 0 && speed < 1.5)
    ) {
        cat = "SLOW";
    } 
    else if (
        speed >= 10 ||
        /4g/i.test(type)
    ) {
        cat = "FAST";
    }

    return {
        cat,
        speed,
        type
    };
}


// ==================== DEVICE DETECTION ====================

function device() {

    const w = innerWidth;

    return {
        type:
            w < 600
                ? "Mobile"
                : w < 1000
                ? "Tablet"
                : "Desktop",

        screen: `${screen.width} × ${screen.height}`,

        cores:
            navigator.hardwareConcurrency || "—",

        memory:
            navigator.deviceMemory || "—"
    };
}


// ==================== SAFE TEXT UPDATE ====================

function setText(selector, value) {

    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


// ==================== MAIN ADAPTIVE SYSTEM ====================

function update() {

    const n = network();
    const d = device();

    let mode =
        n.cat === "SLOW" || n.cat === "OFFLINE"
            ? "LITE"
            : n.cat === "FAST"
            ? "HIGH"
            : "BALANCED";


    // Low-memory device protection

    if (
        d.memory !== "—" &&
        Number(d.memory) <= 2
    ) {
        mode = "LITE";
    }


    // ==================== IMAGE ADAPTATION ====================

    const image =
        mode === "HIGH"
            ? "High"
            : mode === "LITE"
            ? "Low"
            : "Medium";

    const imageElement =
        document.querySelector("#imagePreview");

    if (imageElement) {

        if (mode === "HIGH") {

            imageElement.src =
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=90";

        } 
        else if (mode === "BALANCED") {

            imageElement.src =
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=700&q=70";

        } 
        else {

            imageElement.src =
                "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=350&q=40";
        }
    }


    // ==================== VIDEO ADAPTATION ====================

    const videoElement =
        document.querySelector("#adaptiveVideo");

    const videoSource =
        document.querySelector("#videoSource");

    if (videoElement && videoSource) {

        videoSource.src =
            "https://www.w3schools.com/html/mov_bbb.mp4";

        videoElement.load();
    }


    const video =
        mode === "HIGH"
            ? "720p"
            : mode === "LITE"
            ? "360p"
            : "480p";


    // ==================== REASON ====================

    const reason =
        mode === "HIGH"
            ? "High quality selected for suitable network/device conditions."
            : mode === "LITE"
            ? "Lite Mode selected to reduce data and improve loading."
            : "Balanced Mode selected for moderate conditions.";


    // ==================== LIVE ENVIRONMENT ====================

    setText("#network", n.cat);
    setText("#device", d.type);
    setText("#mode", mode);
    setText("#reason", reason);


    // ==================== ADAPTIVE CONTENT ====================

    setText("#imageQuality", image);
    setText("#videoQuality", video);
    setText("#video", video);
    setText("#videoMode", mode);


    // ==================== IMAGE METRICS ====================

    setText(
        "#resolution",
        mode === "HIGH"
            ? "1920×1080"
            : mode === "LITE"
            ? "640×360"
            : "1280×720"
    );


    setText(
        "#saved",
        mode === "HIGH"
            ? "0–10%"
            : mode === "LITE"
            ? "60–85%"
            : "25–45%"
    );


    // ==================== DASHBOARD ====================

    setText("#dNetwork", n.cat);
    setText("#dType", n.type);
    setText("#dDevice", d.type);
    setText("#dScreen", d.screen);
    setText("#dMode", mode);

    setText(
        "#dSpeed",
        n.speed
            ? `${n.speed} Mbps`
            : "—"
    );

    setText("#why", reason);
}

// ==================== SMART CACHE ====================

async function cacheInfo() {

    const status = document.querySelector("#cacheStatus");

    if (!("caches" in window)) {
        setText("#cacheStatus", "Not supported");
        return;
    }

    try {

        const cache = await caches.open("webmorph-v1");
        const keys = await cache.keys();

        setText("#cacheCount", keys.length);
        setText("#hits", hits);
        setText("#avoided", hits);

        setText(
            "#cacheStatus",
            keys.length > 0 ? "Active" : "Ready"
        );

    } catch (error) {

        console.error("Cache error:", error);
        setText("#cacheStatus", "Error");
    }
}


// ==================== CACHE BUTTON ====================

// ==================== CACHE BUTTON ====================

const cacheButton = document.querySelector("#cacheBtn");

if (cacheButton) {

    cacheButton.onclick = async () => {

        try {

            const cache = await caches.open("webmorph-v1");

            const files = [
                "./style.css",
                "./script.js"
            ];

            let added = 0;

            for (const file of files) {

                const response = await fetch(
                    file + "?cache=" + Date.now()
                );

                const blob = await response.blob();

                const cleanResponse = new Response(blob, {
                    status: 200,
                    headers: {
                        "Content-Type":
                            response.headers.get("Content-Type") || "text/plain"
                    }
                });

                await cache.put(file, cleanResponse);

                added++;
            }

            hits += added;

            localStorage.setItem(
                "webmorphHits",
                hits
            );

            const keys = await cache.keys();

            setText(
                "#cacheCount",
                keys.length
            );

            setText(
                "#hits",
                hits
            );

            setText(
                "#avoided",
                hits
            );

            setText(
                "#cacheStatus",
                "Active"
            );

        } catch (error) {

            console.error(
                "Cache error:",
                error
            );

            setText(
                "#cacheStatus",
                "Cache failed"
            );
        }
    };
}

// ==================== SMART RETRY ====================

const retryButton =
    document.querySelector("#retryBtn");

if (retryButton) {

    retryButton.onclick = async () => {

        const text =
            document.querySelector("#retryText");

        if (text) {
            text.textContent =
                "Checking resource...";
        }

        await new Promise(
            resolve =>
                setTimeout(resolve, 800)
        );


        if (text) {
            text.textContent =
                "Resource is slow. Switching to Lite Mode...";
        }

        forced = "SLOW";

        update();


        await new Promise(
            resolve =>
                setTimeout(resolve, 1000)
        );


        if (text) {
            text.textContent =
                "✓ Retry completed using Lite Mode.";
        }
    };
}


// ==================== EVENTS ====================

addEventListener(
    "online",
    update
);

addEventListener(
    "offline",
    update
);

addEventListener(
    "resize",
    update
);

connection?.addEventListener?.(
    "change",
    update
);


// ==================== START WEBMORPH ====================

update();

cacheInfo();
// ==================== SERVICE WORKER ====================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {

        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("WebMorph Service Worker registered");
            })
            .catch(error => {
                console.error(
                    "Service Worker registration failed:",
                    error
                );
            });

    });
}
// ==================== BACKEND CONNECTION ====================

async function connectBackend() {
    try {
        const n = network();
        const d = device();

        const response = await fetch(
            `http://127.0.0.1:8000/network?network=${n.cat}&device=${d.type}`
        );

        const data = await response.json();

        console.log("WebMorph Backend:", data);
        document.querySelector("#dMode").textContent = data.quality;

document.querySelector("#why").textContent =
    `Backend selected ${data.quality} quality for ${data.network} network`;

    } catch (error) {
        console.log("Backend connection failed:", error);
    }
}

connectBackend();