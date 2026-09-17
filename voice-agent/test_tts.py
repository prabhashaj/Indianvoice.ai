import os
import asyncio
from dotenv import load_dotenv
import httpx

load_dotenv()

async def test_cartesia():
    api_key = os.getenv("CARTESIA_API_KEY")
    print(f"API Key: {api_key}")
    
    url = "https://api.cartesia.ai/tts/bytes"
    headers = {
        "X-API-Key": api_key,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
    }
    payload = {
        "model_id": "sonic-3.6",
        "transcript": "Hello world",
        "voice": {
            "mode": "id",
            "id": "658607d6-26cd-4ab5-8a36-d964ee4b1051"
        },
        "output_format": {
            "container": "raw",
            "encoding": "pcm_f32le",
            "sample_rate": 24000
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print("Error response:", response.text)
        else:
            print("Success! Got bytes:", len(response.content))

if __name__ == "__main__":
    asyncio.run(test_cartesia())
