console.log("content.js is loaded");

if (window.location.hostname === "www.youtube.com" && window.location.pathname === "/watch") {
    setInterval(disableAndMuteYouTubePlayer, 500);
}

function disableAndMuteYouTubePlayer() {
    let videoElement = document.querySelector("video");
    if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
    }

    chrome.runtime.sendMessage({ event: "muteTab" });
}

document.addEventListener('mousedown', event => {
    let target = event.target.closest('A');
    if (window.location.hostname === "www.youtube.com" && target && target.href.includes('youtube.com/watch?')) {
        chrome.storage.local.get("extensionEnabled", ({extensionEnabled}) => {
            if (extensionEnabled) handleYouTubeLink(target);
        });
    }
});

function handleYouTubeLink(target) {
    let clone = target.cloneNode(true);
    target.parentNode.replaceChild(clone, target);
    chrome.runtime.sendMessage({ youtubeURL: target.href, type: "openInSameTab" });
    clone.parentNode.replaceChild(target, clone);
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.event === 'tabActivated' && window.location.href.includes('youtube.com/watch?')) {
        chrome.runtime.sendMessage({ event: "activateDirectLinkPopup" });
    }
});
