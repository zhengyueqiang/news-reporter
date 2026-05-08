import httpx
import traceback

# 1. login
r = httpx.post('http://localhost:8000/api/auth/login', json={'username':'admin','password':'admin123'})
token = r.json()['access_token']
print(f"[1] login ok, user={r.json()['user']['username']} status={r.json()['user']['status']}")

# 2. check llm config
headers = {'Authorization': f'Bearer {token}'}
cfg = httpx.get('http://localhost:8000/api/system/config', headers=headers).json()
print(f"[2] llm_provider={cfg.get('llm_provider')}")
print(f"[2] llm_model={cfg.get('llm_model')}")
print(f"[2] llm_api_key={'已配置' if cfg.get('llm_api_key') and cfg.get('llm_api_key') != 'your-llm-api-key' else '未配置'}")

# 3. test report generation
print("[3] creating report...")
try:
    r2 = httpx.post(
        'http://localhost:8000/api/reports',
        json={'title':'人工智能测试','query_id':None,'period':None},
        headers=headers,
        follow_redirects=True,
        timeout=180
    )
    print(f"[3] status={r2.status_code}")
    print(f"[3] body={r2.text[:1000]}")
except Exception as e:
    print(f"[3] EXCEPTION: {e}")
    traceback.print_exc()
