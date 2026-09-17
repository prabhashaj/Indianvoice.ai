"""
Test if Twilio trial allows <Say> TwiML via our backend URL.
If yes, the issue is specifically <Connect><Stream>.
"""
import requests, time, uuid
from requests.auth import HTTPBasicAuth
from app.config import settings

PUBLIC = "https://ended-flower-ash-woods.trycloudflare.com"
AUTH = HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token)
URL = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json"

# Pre-register a Say-only TwiML in the backend's _pending_twiml
# We do it manually here for testing
import sys
sys.path.insert(0, ".")
from app.routers.telephony import _pending_twiml

call_token = uuid.uuid4().hex
say_twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna-Neural">Hello! This is your AI sales assistant from VoxSales. How are you doing today?</Say><Pause length="2"/><Say voice="Polly.Joanna-Neural">I would love to tell you about how we can automate your sales calls. Do you have a moment?</Say></Response>'
_pending_twiml[call_token] = (say_twiml, time.time())
print(f"Stored TwiML with token: {call_token[:8]}...")

payload = {
    "To": "+919391694513",
    "From": settings.twilio_phone_number,
    "Url": f"{PUBLIC}/telephony/twiml-callback/{call_token}",
}
res = requests.post(URL, data=payload, auth=AUTH)
print("Call status:", res.status_code, res.json().get("status", res.json().get("message")))
if res.status_code == 201:
    print("Call SID:", res.json()["sid"])
