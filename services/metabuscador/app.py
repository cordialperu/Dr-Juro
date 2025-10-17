from __future__ import annotations

import asyncio
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote

app = FastAPI(title="MetaBuscador Jurídico", version="1.0.0")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
}

VALID_DOMAINS = {
    "PUCP": ["tesis.pucp.edu.pe", "repositorio.pucp.edu.pe", "revistas.pucp.edu.pe"],
    "UNMSM": ["cybertesis.unmsm.edu.pe"],
    "PJ/TC": ["pj.gob.pe", "tc.gob.pe"],
}

MAX_RESULTS_PER_SOURCE = 10
TIMEOUT = httpx.Timeout(15.0, connect=10.0)


class SearchRequest(BaseModel):
    term: str


class SearchResult(BaseModel):
    title: str
    link: str
    snippet: str
    source: str


class SearchResponse(BaseModel):
    term: str
    results: List[SearchResult]


def build_domain_filter(domains: List[str]) -> str:
    return " OR ".join(f"site:{domain}" for domain in domains)


async def fetch_html(client: httpx.AsyncClient, url: str) -> str:
    response = await client.get(url)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Error al consultar {url}")
    return response.text


async def search_google_scholar(
    client: httpx.AsyncClient, term: str, domains: List[str], source: str
) -> List[SearchResult]:
    query = f'"{term}" {build_domain_filter(domains)}'
    url = f"https://scholar.google.com/scholar?q={quote(query)}"
    html = await fetch_html(client, url)
    soup = BeautifulSoup(html, "html.parser")

    results: List[SearchResult] = []
    for item in soup.select(".gs_r.gs_or.gs_scl"):
        if len(results) >= MAX_RESULTS_PER_SOURCE:
            break

        title_tag = item.select_one(".gs_rt a")
        if not title_tag or not title_tag.get("href"):
            continue

        link = title_tag["href"]
        if not any(domain in link for domain in domains):
            continue

        snippet_tag = item.select_one(".gs_rs")
        snippet = snippet_tag.text.strip() if snippet_tag else ""

        results.append(
            SearchResult(
                title=title_tag.text.strip(),
                link=link,
                snippet=snippet,
                source=source,
            )
        )

    return results


async def search_google_web(
    client: httpx.AsyncClient, term: str, domains: List[str], source: str
) -> List[SearchResult]:
    query = f'"{term}" {build_domain_filter(domains)}'
    url = f"https://www.google.com/search?q={quote(query)}"
    html = await fetch_html(client, url)
    soup = BeautifulSoup(html, "html.parser")

    results: List[SearchResult] = []
    for item in soup.select("div.g"):
        if len(results) >= MAX_RESULTS_PER_SOURCE:
            break

        title_tag = item.select_one("h3")
        link_tag = item.select_one("a")
        if not title_tag or not link_tag or not link_tag.get("href"):
            continue

        link = link_tag["href"]
        if not any(domain in link for domain in domains):
            continue

        snippet_tag = item.select_one(".VwiC3b, .st")
        snippet = snippet_tag.text.strip() if snippet_tag else "Resumen no disponible."

        results.append(
            SearchResult(
                title=title_tag.text.strip(),
                link=link,
                snippet=snippet,
                source=source,
            )
        )

    return results


@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    term = request.term.strip()
    if not term:
        raise HTTPException(status_code=400, detail="Debes proporcionar un término de búsqueda")

    async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT) as client:
        pucp_task = search_google_scholar(client, term, VALID_DOMAINS["PUCP"], "PUCP")
        unmsm_task = search_google_scholar(client, term, VALID_DOMAINS["UNMSM"], "UNMSM")
        pjtc_task = search_google_web(client, term, VALID_DOMAINS["PJ/TC"], "PJ/TC")

        results_by_source = await asyncio.gather(pucp_task, unmsm_task, pjtc_task, return_exceptions=False)

    flattened = [result for subset in results_by_source for result in subset]
    return SearchResponse(term=term, results=flattened)
