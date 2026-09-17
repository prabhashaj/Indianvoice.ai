"""
Test which TwiML verb+noun combos Twilio trial accepts inline via the Twiml param.
"""
import requests
from requests.auth import HTTPBasicAuth
from app.config import settings

ACCOUNT_SID = settings.twilio_account_sid
AUTH_TOKEN = settings.twilio_auth_token
FROM = settings.twilio_phone_number
TO = "+919391694513"
URL = f"https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Calls.json"

def test_twiml(label, twiml):
    res = requests.post(URL, data={"To": TO, "From": FROM, "Twiml": twiml},
                        auth=HTTPBasicAuth(ACCOUNT_SID, AUTH_TOKEN))
    status = res.json().get("status", res.json().get("message", "?"))
    print(f"[{res.status_code}] {label}: {status}")

# Test 1: Basic Say
test_twiml("Say only", '<?xml version="1.0"?><Response><Say>Hello world</Say></Response>')

# Test 2: Connect + Stream  
test_twiml("Connect+Stream", '<?xml version="1.0"?><Response><Connect><Stream url="wss://example.com/s" /></Connect></Response>')

# Test 3: Say + Pause (no special verbs)
test_twiml("Say+Pause", '<?xml version="1.0"?><Response><Say>Hello</Say><Pause length="2"/><Say>Goodbye</Say></Response>')
