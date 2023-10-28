document.getElementById('fetch_link').addEventListener('click', function() {
    const youtube_url = document.getElementById('youtube_url').value;
    fetch('http://localhost:5000/get_link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ youtube_url })
    })
    .then(response => response.json())
    .then(data => {
        if(data.direct_link) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = `<a href="#" id="copied_link">${data.direct_link}</a>`;
            
            // Add event listener for the new link
            document.getElementById('copied_link').addEventListener('click', function(event) {
                event.preventDefault();
                copyToClipboard(data.direct_link);
                resultDiv.textContent = "copied url";
            });
        } else {
            document.getElementById('result').textContent = data.error;
        }
    });
});

document.getElementById('github_link').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/cdsisthe1/fyoutube' });
});

document.getElementById('donate_link').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://www.paypal.com/donate/?hosted_button_id=R92KGPYHPE3JY' });
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
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}
