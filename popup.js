document.getElementById('fetch_link').addEventListener('click', function() {
    const youtube_url = document.getElementById('youtube_url').value;
    const urlObj = new URL(youtube_url);
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
        const embedURL = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `<a href="#" id="copied_link">${embedURL}</a>`;

        // Add event listener for the new link
        document.getElementById('copied_link').addEventListener('click', function(event) {
            event.preventDefault();
            copyToClipboard(embedURL);
            resultDiv.textContent = "Copied URL";
        });
    } else {
        document.getElementById('result').textContent = "Error: Invalid YouTube URL";
    }
});


document.getElementById('extensionToggle').addEventListener('change', function() {
    let isEnabled = this.checked;
    chrome.storage.local.set({ "extensionEnabled": isEnabled }, function() {
        console.log("Extension state saved:", isEnabled);
    });
});

// On popup load, set the toggle state
chrome.storage.local.get("extensionEnabled", function(data) {
    document.getElementById('extensionToggle').checked = data.extensionEnabled;
});


    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }
    