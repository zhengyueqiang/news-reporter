import httpx
from typing import Optional
from app.database import SessionLocal
from app import models


def _get_db_llm_config():
    db = SessionLocal()
    try:
        provider_cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == "llm_provider").first()
        api_key_cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == "llm_api_key").first()
        model_cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == "llm_model").first()
        provider = provider_cfg.value if provider_cfg and provider_cfg.value else None
        api_key = api_key_cfg.value if api_key_cfg and api_key_cfg.value else None
        model = model_cfg.value if model_cfg and model_cfg.value else None

        if not provider or not api_key or not model:
            raise RuntimeError(
                "LLM 模型未配置，请先在系统配置页面设置模型信息（包括提供商、API Key、模型名称）。"
            )
        return provider.lower(), api_key, model
    finally:
        db.close()


def generate_report_content(
    topic: str,
    period: Optional[str] = None,
    custom_prompt: Optional[str] = None,
    search_context: Optional[str] = None,
) -> str:
    provider, api_key, model = _get_db_llm_config()

    if custom_prompt:
        prompt = custom_prompt
    else:
        period_hint = f"，时间维度为{period}" if period else ""
        prompt = f"请针对主题「{topic}」{period_hint}生成一份详细的情报分析报告。报告应包含：行业概述、关键动态、主要参与者、风险与机遇、趋势预测。请使用 Markdown 格式输出，结构清晰、内容详实。"

    # If search context is provided, prepend it and instruct LLM to base analysis on it
    if search_context:
        prompt = (
            f"以下是与主题「{topic}」相关的最新网络搜索资料，请基于这些资料进行分析，"
            f"不要依赖你训练数据中的过时信息。如果搜索资料不足以回答某个问题，请明确说明。\n\n"
            f"{search_context}\n\n"
            f"---\n\n"
            f"请基于以上资料，{prompt}"
        )

    try:
        if provider == "deepseek":
            return _call_deepseek(api_key, model, prompt)
        elif provider == "openai":
            return _call_openai(api_key, model, prompt)
        elif provider == "claude":
            return _call_claude(api_key, model, prompt)
        elif provider == "kimi":
            return _call_kimi(api_key, model, prompt)
        else:
            return _call_generic(api_key, model, prompt, provider)
    except Exception as e:
        raise RuntimeError(f"LLM 调用失败（{provider}）：{str(e)}") from e


def _call_deepseek(api_key: str, model: str, prompt: str) -> str:
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _call_openai(api_key: str, model: str, prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _call_claude(api_key: str, model: str, prompt: str) -> str:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    payload = {
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}]
    }
    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]


def _call_kimi(api_key: str, model: str, prompt: str) -> str:
    url = "https://api.moonshot.cn/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }
    with httpx.Client(timeout=120) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _call_generic(api_key: str, model: str, prompt: str, provider: str) -> str:
    raise NotImplementedError(f"Provider '{provider}' is not supported yet")
