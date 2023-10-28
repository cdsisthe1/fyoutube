console.log("content.js is loaded");

document.addEventListener('mousedown', function(event) {
    let target = event.target.closest('A');
    if (window.location.hostname === "www.youtube.com" && target && target.href && target.href.includes('youtube.com/watch?')) {
        console.log("YouTube link clicked:", target.href);
        chrome.storage.local.get("extensionEnabled", function(data) {
            if (data.extensionEnabled) {
                handleYouTubeLink(target);
            }
        });
    }
});

function handleYouTubeLink(target) {
    let clone = target.cloneNode(true);
    target.parentNode.replaceChild(clone, target);

    chrome.runtime.sendMessage({ youtubeURL: target.href, type: "openInSameTab" });

    clone.parentNode.replaceChild(target, clone);
}

if (window.location.hostname === "www.youtube.com" && window.location.pathname === "/watch") {
    const disableYouTubePlayer = () => {
        let videoContainer = document.querySelector(".html5-video-player");
        if (videoContainer) {
            videoContainer.remove();
            console.log("YouTube player disabled.");
        }
    };

    // Disable the player immediately
    disableYouTubePlayer();

    // Periodically check and disable the player to handle dynamic content loading on YouTube
    setInterval(disableYouTubePlayer, 500);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.event) {
        case 'tabActivated':
            if (window.location.href.includes('youtube.com/watch?')) {
                chrome.runtime.sendMessage({ event: "activateDirectLinkPopup" });
            }
            break;
        case 'tabUpdated':
            // No action to be taken for now.
            break;
        // Add more cases as needed...
    }
});
