import os
import subprocess
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from pytube import YouTube

def install_requirements():
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

install_requirements()

app = Flask(__name__)
CORS(app)

@app.route('/get_link', methods=['POST'])
def get_link():
    youtube_url = request.json.get('youtube_url')
    
    try:
        yt = YouTube(youtube_url)
        stream = yt.streams.filter(progressive=True, file_extension="mp4").get_highest_resolution()
        
        if not stream:
            return jsonify({"error": "Could not find anything"})
        
        return jsonify({"direct_link": stream.url})

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(port=5000)