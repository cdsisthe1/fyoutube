console.log("content.js is loaded");

// This function will check the extension's enabled status and then mute & disable the YouTube player if necessary.
function checkAndDisablePlayer() {
    chrome.storage.local.get("extensionEnabled", ({extensionEnabled}) => {
        if (extensionEnabled && window.location.hostname === "www.youtube.com" && window.location.pathname === "/watch") {
            disableAndMuteYouTubePlayer();
        }
    });
}

// This function mutes and disables the YouTube player.
function disableAndMuteYouTubePlayer() {
    let videoElement = document.querySelector("video");
    if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
    }

    chrome.storage.local.get("extensionEnabled", ({extensionEnabled}) => {
        if (extensionEnabled) {
            chrome.runtime.sendMessage({ event: "muteTab" });
        }
    });
}

// This function is triggered when a user clicks on a YouTube video link.

document.addEventListener('mousedown', event => {
    // Console log for debugging - to check which mouse button was clicked
    console.log('Mouse button clicked:', event.button);

    // Check for left-clicks only (mouse button 0)
    if (event.button !== 0) return;

    // The rest of the original code goes here
    let target = event.target.closest('A');
    if (target && target.href.includes('watch?v=')) {
        chrome.storage.local.get("extensionEnabled", ({extensionEnabled}) => {
            if (extensionEnabled) handleYouTubeLink(target);
        });
    }
});
    
    let target = event.target.closest('A');
    if (window.location.hostname === "www.youtube.com" && target && target.href.includes('youtube.com/watch?')) {
        chrome.storage.local.get("extensionEnabled", ({extensionEnabled}) => {
            if (extensionEnabled) handleYouTubeLink(target);
        });
    }
});

// This function processes the YouTube link, cleans it, and sends it to the background script.
function handleYouTubeLink(target) {
    let cleanURL = target.href.split('&')[0];
    let clone = target.cloneNode(true);
    target.parentNode.replaceChild(clone, target);
    chrome.runtime.sendMessage({ youtubeURL: cleanURL, type: "openInSameTab" });
    clone.parentNode.replaceChild(target, clone);
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === 'tabActivated' && window.location.href.includes('youtube.com/watch?')) {
        chrome.runtime.sendMessage({ event: "activateDirectLinkPopup" });
    }
});

// Check and disable the player at regular intervals.
setInterval(checkAndDisablePlayer, 500);
