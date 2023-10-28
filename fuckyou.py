import requests
import re

def get_direct_link(youtube_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(youtube_url, headers=headers)
        if response.status_code == 200:
            match = re.search(r'\"url\":\"(https://[^\"]+videoplayback[^\"]+?)\"', response.text)
            if match:
                direct_link = match.group(1).replace("\\u0026", "&")
                return direct_link
            else:
                return "URL not found in the response."
        else:
            return f"Failed to fetch the YouTube page (HTTP {response.status_code})."
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    youtube_url = input("URL: ")
    
    direct_link = get_direct_link(youtube_url)
    
    if direct_link:
        print("Direct link:")
        print(direct_link)
    else:
        print("Could not retrieve")
