chrome.runtime.onMessage.addListener((msg, sender) => {
    console.log("[Veil Background] Received:", msg.type, "from tab:", sender?.tab?.id);

    if (msg.type === 'REGISTER_MUSIC_TAB') {
        // Use local storage instead of session storage so it persists even if the background script sleeps
        chrome.storage.local.set({ musicTabId: sender.tab.id }, () => {
            console.log("[Veil Background] Saved musicTabId:", sender.tab.id);
        });
    }

    if (msg.type === 'VIDEO_PLAY' || msg.type === 'VIDEO_PAUSE') {
        chrome.storage.local.get(['musicTabId'], (result) => {
            if (result.musicTabId) {
                console.log("[Veil Background] Forwarding to Music Tab:", result.musicTabId);
                chrome.tabs.sendMessage(result.musicTabId, { 
                    type: msg.type === 'VIDEO_PLAY' ? 'FADE_DOWN' : 'FADE_UP'
                }).catch((err) => console.log("[Veil Background] Error sending to Apple Music:", err));
            } else {
                console.log("[Veil Background] Alert: No music tab registered!");
            }
        });
    }
});