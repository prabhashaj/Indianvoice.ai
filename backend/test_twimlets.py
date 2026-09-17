import urllib.request
import urllib.parse

twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Hello</Say></Response>'
echo_url = 'https://twimlets.com/echo?Twiml=' + urllib.parse.quote(twiml)

req = urllib.request.Request(echo_url, method='POST')
try:
    res = urllib.request.urlopen(req)
    print('POST works:', res.read().decode())
except Exception as e:
    print('POST failed:', e)
