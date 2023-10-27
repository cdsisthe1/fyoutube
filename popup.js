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
            document.getElementById('result').textContent = data.direct_link;
        } else {
            document.getElementById('result').textContent = data.error;
        }
    });
});
