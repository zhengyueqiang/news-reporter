import httpx
from typing import Optional, List, Dict, Any
from app.database import SessionLocal
from app import models


def _get_db_search_config():
    """Read search engine config from DB."""
    db = SessionLocal()
    try:
        engine_cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == "search_engine").first()
        api_key_cfg = db.query(models.SystemConfig).filter(models.SystemConfig.key == "search_api_key").first()
        engine = engine_cfg.value if engine_cfg and engine_cfg.value else ""
        api_key = api_key_cfg.value if api_key_cfg and api_key_cfg.value else ""
        return engine, api_key
    finally:
        db.close()


def is_search_enabled() -> bool:
    """Check if search engine is properly configured."""
    engine, api_key = _get_db_search_config()
    return bool(engine and api_key)


def search_news(topic: str, period: Optional[str] = None, num_results: int = 10) -> List[Dict[str, Any]]:
    """Search the web for latest information about the topic.

    Returns a list of result items with title, link, snippet, date etc.
    """
    engine, api_key = _get_db_search_config()
    if not engine or not api_key:
        raise RuntimeError(
            "搜索引擎未配置，请先在系统配置页面设置搜索引擎和 API Key。"
        )

    engine = engine.lower()

    # Build query with time hint if period is provided
    query = topic
    if period:
        query = f"{topic} {period}"

    try:
        if engine in ("serpapi", "google"):
            return _search_serpapi(api_key, query, num_results)
        elif engine == "bing":
            return _search_bing(api_key, query, num_results)
        else:
            raise RuntimeError(f"不支持的搜索引擎类型: {engine}")
    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"搜索 API 请求失败: {e.response.status_code} - {e.response.text}") from e
    except Exception as e:
        raise RuntimeError(f"搜索服务调用失败: {str(e)}") from e


def _search_serpapi(api_key: str, query: str, num_results: int) -> List[Dict[str, Any]]:
    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "api_key": api_key,
        "engine": "google",
        "num": min(num_results, 20),
        "hl": "zh-CN",
        "gl": "cn",
    }
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    # organic_results
    for item in data.get("organic_results", [])[:num_results]:
        results.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
            "date": item.get("date", ""),
            "source": "Google",
        })

    # news_results if available
    for item in data.get("news_results", [])[:num_results]:
        results.append({
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
            "date": item.get("date", ""),
            "source": item.get("source", "News"),
        })

    return results


def _search_bing(api_key: str, query: str, num_results: int) -> List[Dict[str, Any]]:
    url = "https://api.bing.microsoft.com/v7.0/search"
    headers = {"Ocp-Apim-Subscription-Key": api_key}
    params = {
        "q": query,
        "count": min(num_results, 20),
        "mkt": "zh-CN",
    }
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("webPages", {}).get("value", [])[:num_results]:
        results.append({
            "title": item.get("name", ""),
            "link": item.get("url", ""),
            "snippet": item.get("snippet", ""),
            "date": item.get("dateLastCrawled", ""),
            "source": "Bing",
        })

    for item in data.get("news", {}).get("value", [])[:num_results]:
        results.append({
            "title": item.get("name", ""),
            "link": item.get("url", ""),
            "snippet": item.get("description", ""),
            "date": item.get("datePublished", ""),
            "source": item.get("provider", [{}])[0].get("name", "News"),
        })

    return results


def format_search_results(results: List[Dict[str, Any]]) -> str:
    """Format search results into a context string for LLM prompt."""
    if not results:
        return ""

    lines = ["## 实时网络搜索结果", ""]
    for idx, r in enumerate(results, 1):
        date_str = f" ({r.get('date', '')})" if r.get("date") else ""
        lines.append(f"{idx}. **{r.get('title', '无标题')}**{date_str}")
        lines.append(f"   来源: {r.get('source', '未知')} | 链接: {r.get('link', '')}")
        lines.append(f"   摘要: {r.get('snippet', '')}")
        lines.append("")

    return "\n".join(lines)
