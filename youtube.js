function attachListeners() {
    // Specifically target the main YouTube video player to ignore muted preview thumbnails
    const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
    if (!video || video.dataset.veilAttached) return;

    video.dataset.veilAttached = 'true';

    // If the video is already playing when the script loads or the page navigates
    if (!video.paused) {
        console.log("[Veil] Video already playing, sending VIDEO_PLAY");
        chrome.runtime.sendMessage({ type: 'VIDEO_PLAY' });
    }

    video.addEventListener('play', () => {
        console.log("[Veil] Play event detected, sending VIDEO_PLAY");
        chrome.runtime.sendMessage({ type: 'VIDEO_PLAY' });
    });

    video.addEventListener('pause', () => {
        console.log("[Veil] Pause event detected, sending VIDEO_PAUSE");
        chrome.runtime.sendMessage({ type: 'VIDEO_PAUSE' });
    });
}

// YouTube is dynamic (SPA), so keep checking
setInterval(attachListeners, 2000);