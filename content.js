console.log("content.js is loaded");

let shiftZPressed = false;

document.addEventListener('keydown', function(event) {
    if (event.shiftKey && event.key === 'Z') {
        console.log("Shift + Z pressed");
        shiftZPressed = true;
        document.addEventListener('mousedown', handleMouseDown, true);
    }
});

function handleMouseDown(event) {
    let target = event.target.closest('A');

    if (target && target.href && target.href.includes('youtube.com/watch?')) {
        console.log("YouTube link clicked:", target.href);

        if (shiftZPressed) {
            let clone = target.cloneNode(true);
            target.parentNode.replaceChild(clone, target);

            chrome.runtime.sendMessage({ youtubeURL: target.href, type: "openInSameTab" });

            clone.parentNode.replaceChild(target, clone);

            shiftZPressed = false;
            document.removeEventListener('mousedown', handleMouseDown, true);
        }
    }
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
