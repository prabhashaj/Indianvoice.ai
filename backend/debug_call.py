"""
Debug script: Tests the outbound call flow step by step and prints exactly
what TwiML is being sent to Twilio.
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, '.')

from app.config import settings


async def main():
    print("=== STEP 1: Settings ===")
    print(f"  livekit_url         : {settings.livekit_url}")
    print(f"  livekit_api_key     : {settings.livekit_api_key[:8]}...")
    print(f"  livekit_configured  : {settings.livekit_configured}")
    print(f"  twilio_account_sid  : {settings.twilio_account_sid}")
    print(f"  twilio_phone_number : {settings.twilio_phone_number}")

    print("\n=== STEP 2: LiveKit Connector ===")
    try:
        from livekit.api import LiveKitAPI, ConnectTwilioCallRequest
        async with LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        ) as api:
            resp = await api.connector.connect_twilio_call(
                ConnectTwilioCallRequest(
                    room_name="debug-room-001",
                    participant_identity="debug-lead",
                    participant_name="Debug Lead",
                )
            )
            connect_url = resp.connect_url
            print(f"  connect_url : {connect_url}")
    except Exception as e:
        print(f"  FAILED: {e}")
        connect_url = None

    if connect_url:
        print("\n=== STEP 3: TwiML that will be sent ===")
        import xml.sax.saxutils as saxutils
        import urllib.parse
        safe_url = saxutils.escape(connect_url)
        twiml = (
            '<?xml version="1.0" encoding="UTF-8">\n'
            '<Response>\n'
            '    <Connect>\n'
            f'        <Stream url="{safe_url}" />\n'
            '    </Connect>\n'
            '</Response>'
        )
        print(twiml)

        echo_url = "https://twimlets.com/echo?Twiml=" + urllib.parse.quote(twiml)
        print(f"\n  echo_url length : {len(echo_url)} chars")

        print("\n=== STEP 4: Placing Twilio call ===")
        import requests
        from requests.auth import HTTPBasicAuth
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json"
        payload = {
            "To": "+919391694513",
            "From": settings.twilio_phone_number,
            "Url": echo_url,
        }
        res = requests.post(url, data=payload, auth=HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token))
        print(f"  Twilio response: {res.status_code}")
        import json
        data = res.json()
        if res.status_code == 201:
            print(f"  Call SID: {data.get('sid')}")
            print(f"  Status  : {data.get('status')}")
        else:
            print(f"  ERROR   : {data}")
    else:
        print("Connector failed — would have used static TTS fallback")


asyncio.run(main())
