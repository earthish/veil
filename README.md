# Veil

Veil is a seamless Chrome extension designed to automatically manage your background study music. It intelligently detects when you start a lecture or video on YouTube, and flawlessly "ducks" your Apple Music volume down to absolute zero. When you pause the video, the music gently swells back up, keeping your focus completely unbroken without ever having to switch tabs.

## Features

- **Automated SPA Audio Ducking**: Engineered to handle YouTube's Single Page Application architecture, ensuring music fades the second a brand new video starts playing.
- **Acoustically Perfect Fade Downs**: Because human hearing is logarithmic, a mathematical linear fade feels like the volume "crashes" at the very end. Veil uses a precisely tuned **exponential decay curve** to pull the audio down to 0% over a lush, cinematic 4.5 seconds.
- **Orchestral Fade-Ups**: Fading up exponentially keeps the music hidden in silence for far too long. Veil intelligently splits its math, utilizing an aerodynamic ease-in-out curve to jump out of the "silent zone" quickly and gently taper its approach to your normal listening volume over a massive 5 seconds.
- **Robust Background Execution**: Built with Chrome Manifest V3 `chrome.storage.local` memory mapping and custom timed recursion to ensure Veil reliably fades your music even when the browser has aggressively put your background tabs to sleep.

## Installation

As Veil is a local developer extension, you can load it into Chrome in seconds:

1. Download or git clone this repository to a folder on your machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Toggle the **Developer mode** switch in the top right corner of the page.
4. Click the **Load unpacked** button in the top left.
5. Select the `veil/` folder.

You're all set! Just refresh your Apple Music tab and your YouTube tab so the new scripts attach, and test it out.

## Under the Hood
- `manifest.json`: Manifest V3 setup and required access configuration.
- `youtube.js`: Content script that manages dynamic video player elements and broadcasts state changes.
- `background.js`: The service worker that acts as a router, maintaining the active Apple Music tab ID in permanent volatile memory.
- `applemusic.js`: The conductor that receives messages and calculates millisecond-by-millisecond frame curves to achieve true cinematic acoustic fading.
