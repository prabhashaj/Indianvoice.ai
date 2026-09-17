"""
Test <Dial><Sip> TwiML — uses SIP to dial into LiveKit directly.
Works on Twilio trial unlike <Connect><Stream>.
"""
import requests, time, uuid, sys
sys.path.insert(0, ".")
from requests.auth import HTTPBasicAuth
from app.config import settings
from app.routers.telephony import _pending_twiml

PUBLIC = "https://ended-flower-ash-woods.trycloudflare.com"
AUTH = HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token)
API_URL = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json"

# LiveKit SIP ingest host
lk_host = "voxsales-4u9sv3pw.sip.livekit.cloud"
room = "voxsales-sip-test-001"
sip_uri = f"sip:{room}@{lk_host}"

call_token = uuid.uuid4().hex
dial_twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Sip>{sip_uri}</Sip></Dial></Response>'
_pending_twiml[call_token] = (dial_twiml, time.time())
print("TwiML:", dial_twiml)
print("Token:", call_token[:8])
print("URL  :", f"{PUBLIC}/telephony/twiml-callback/{call_token}")

payload = {
    "To": "+919391694513",
    "From": settings.twilio_phone_number,
    "Url": f"{PUBLIC}/telephony/twiml-callback/{call_token}",
}
res = requests.post(API_URL, data=payload, auth=AUTH)
d = res.json()
print("Status:", res.status_code, d.get("status", d.get("message")))
if res.status_code == 201:
    print("Call SID:", d["sid"])
