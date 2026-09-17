import requests
from requests.auth import HTTPBasicAuth
from app.config import settings
import json

url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json?PageSize=5"
res = requests.get(url, auth=HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token))
calls = res.json().get("calls", [])
for c in calls:
    print("SID       :", c["sid"])
    print("Status    :", c["status"])
    print("Direction :", c["direction"])
    print("Duration  :", c["duration"], "s")
    print("Url       :", c.get("url", "N/A"))
    print()
