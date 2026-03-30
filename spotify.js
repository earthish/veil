let audio;
let normalVolume = 1;
let isDucked = false;
let currentFade = null;
let isAnimating = false;

// Register Spotify tab
console.log("[Veil] Registering Spotify tab...");
chrome.runtime.sendMessage({ type: 'REGISTER_MUSIC_TAB' });

// Wait until audio/video element appears
function waitForAudio() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            // Spotify occasionally routes its secure audio through a <video> element instead of <audio>
            const el = document.querySelector('audio') || document.querySelector('video');
            if (el) {
                console.log("[Veil] Found media player element!");
                clearInterval(interval);
                resolve(el);
            }
        }, 500);
    });
}

// Smooth easing function
function easeInOut(t) {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Smooth fade
function fadeTo(target, duration = 800) {
    console.log("[Veil] Fading volume to:", target);
    if (!audio) return;

    if (currentFade) clearTimeout(currentFade);

    const start = audio.volume;
    const startTime = performance.now();
    isAnimating = true;

    function step(now) {
        const rawProgress = Math.min((now - startTime) / duration, 1);
        const progress = easeInOut(rawProgress);

        let currentCalculatedVolume;
        if (target < start) {
            const safeStart = Math.max(0.001, start);
            const safeTarget = Math.max(0.001, target);
            currentCalculatedVolume = rawProgress === 1 ? target : Math.max(
                0,
                Math.min(1, safeStart * Math.pow(safeTarget / safeStart, progress))
            );
        } else {
            currentCalculatedVolume = rawProgress === 1 ? target : Math.max(
                0,
                Math.min(1, start + (target - start) * progress)
            );
        }

        // Spotify hides the true audio player among multiple silent <video> tags (for canvas loops).
        // By changing the volume on ALL of them, we guarantee we hit the true player.
        document.querySelectorAll('audio, video').forEach(media => {
            media.volume = currentCalculatedVolume;
        });

        if (rawProgress < 1) {
            // requestAnimationFrame pauses when tabs are hidden. 
            // Using setTimeout ensures the fade happens even when Spotify is a background tab!
            currentFade = setTimeout(() => step(performance.now()), 20);
        } else {
            isAnimating = false;
        }
    }

    currentFade = setTimeout(() => step(performance.now()), 20);
}

// Initialize audio
async function init() {
    audio = await waitForAudio();
    
    // Track manual volume changes by the user
    audio.addEventListener('volumechange', () => {
        // If the user manually changes the volume AND we aren't actively animating it,
        // and it is NOT currently ducked, register this as their new preferred normal volume.
        if (!isAnimating && !isDucked) {
            normalVolume = audio.volume;
        }
    });
}

init();

// Listen for fade commands
chrome.runtime.onMessage.addListener((msg) => {
    console.log("[Veil] Received command from background:", msg.type);
    if (!audio) {
        console.log("[Veil] Error: audio element not attached yet!");
        return;
    }

    if (msg.type === 'FADE_DOWN' && !isDucked) {
        // Find the element that is actually playing audio to get the true normalVolume
        const allMedia = Array.from(document.querySelectorAll('audio, video'));
        const playingMedia = allMedia.find(m => !m.paused && m.volume > 0) || audio;
        
        normalVolume = playingMedia ? playingMedia.volume : 1;
        console.log("[Veil] Ducking volume from", normalVolume);
        fadeTo(0, 4500); // A super slow, 4.5-second gentle fade down to 0% volume ("bye bye study well mate")
        isDucked = true;
    }

    if (msg.type === 'FADE_UP' && isDucked) {
        console.log("[Veil] Restoring volume to", normalVolume);
        fadeTo(normalVolume, 5000); // A massive 5-second gentle fade back into focus
        isDucked = false;
    }
});