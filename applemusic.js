let audio;
let normalVolume = 1;
let isDucked = false;
let currentFade = null;
let isAnimating = false;

// Register Apple Music tab
console.log("[Veil] Registering Apple Music tab...");
chrome.runtime.sendMessage({ type: 'REGISTER_MUSIC_TAB' });

// Wait until audio element appears
function waitForAudio() {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const el = document.querySelector('audio');
            if (el) {
                console.log("[Veil] Found <audio> element!");
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

        // Human hearing is tricky: 
        // Fade Down requires an exponential curve so it doesn't sound like it crashes into silence.
        // But Fade Up sounds best as a linear ease so it immediately escapes the "inability to hear" zone!
        if (target < start) {
            const safeStart = Math.max(0.001, start);
            const safeTarget = Math.max(0.001, target);
            
            // At the exact end of the animation, snap perfectly to the target (0)
            audio.volume = rawProgress === 1 ? target : Math.max(
                0,
                Math.min(1, safeStart * Math.pow(safeTarget / safeStart, progress))
            );
        } else {
            // Fading up: regular easeInOut math avoids the volume hiding in silence for too long
            audio.volume = rawProgress === 1 ? target : Math.max(
                0,
                Math.min(1, start + (target - start) * progress)
            );
        }

        if (rawProgress < 1) {
            // requestAnimationFrame pauses when tabs are hidden. 
            // Using setTimeout ensures the fade happens even when Apple Music is a background tab!
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
        normalVolume = audio.volume;
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