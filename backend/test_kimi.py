import httpx, json

url = "https://api.moonshot.cn/v1/chat/completions"
headers = {"Authorization": "Bearer sk-QmKOEjPmWiR9oUgsA519jc6yCNK6nFWYraRZQqEcK6GKu0Ks", "Content-Type": "application/json"}
payload = {
    "model": "kimi-k2.5",
    "messages": [{"role": "user", "content": "你好"}],
}

try:
    r = httpx.post(url, headers=headers, json=payload, timeout=60)
    print("status:", r.status_code)
    print("body:", r.text[:500])
except Exception as e:
    print("ERROR:", type(e).__name__, str(e))
