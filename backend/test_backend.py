import httpx, json

# 1. login
r = httpx.post('http://localhost:8000/api/auth/login', json={'username':'admin','password':'admin123'})
token = r.json()['access_token']
print("login ok")

# 2. create report
headers = {'Authorization': f'Bearer {token}'}
r2 = httpx.post(
    'http://localhost:8000/api/reports',
    json={'title':'人工智能测试','query_id':None,'period':None},
    headers=headers,
    follow_redirects=True,
    timeout=180
)
print("status:", r2.status_code)
print("body:", r2.text[:2000])
