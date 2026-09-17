"""
Check detailed error message from Twilio's inline Twiml rejection.
"""
import requests
from requests.auth import HTTPBasicAuth
from app.config import settings

ACCOUNT_SID = settings.twilio_account_sid
AUTH_TOKEN = settings.twilio_auth_token
FROM = settings.twilio_phone_number
TO = "+919391694513"
URL = f"https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Calls.json"

# Test: Basic Say inline
twiml = '<?xml version="1.0"?><Response><Say>Hello world</Say></Response>'
res = requests.post(URL, data={"To": TO, "From": FROM, "Twiml": twiml},
                    auth=HTTPBasicAuth(ACCOUNT_SID, AUTH_TOKEN))
print("STATUS:", res.status_code)
print("BODY:", res.text)
