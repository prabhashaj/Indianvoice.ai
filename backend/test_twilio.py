import urllib.parse
import requests
from requests.auth import HTTPBasicAuth
from app.config import settings

url = f'https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json'
twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="wss://example.com/stream" /></Connect></Response>'
echo_url = 'https://twimlets.com/echo?Twiml=' + urllib.parse.quote(twiml)

payload = {
    'To': '+919391694513',
    'From': settings.twilio_phone_number,
    'Url': echo_url,
    'Method': 'GET'
}

res = requests.post(url, data=payload, auth=HTTPBasicAuth(settings.twilio_account_sid, settings.twilio_auth_token))
print(res.status_code, res.text)
