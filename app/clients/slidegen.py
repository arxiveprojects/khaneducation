from __future__ import annotations

import json
import logging
from typing import Any, Optional

import boto3
import httpx

from ..config import settings

logger = logging.getLogger(__name__)


class SlidegenClient:
    """Thin client: enqueue work to SQS or POST to the slidegen HTTP API."""

    def enqueue(self, payload: dict[str, Any]) -> Optional[str]:
        if settings.sqs_slidegen_queue_url:
            return self._send_sqs(payload)
        if settings.slidegen_api_url:
            return self._post_http(payload)
        logger.info("Slidegen not configured; caller should use the local stub.")
        return None

    def search(self, namespace: str, query: str, top_k: int = 6) -> list[dict[str, Any]]:
        if not settings.slidegen_api_url:
            return []
        url = settings.slidegen_api_url.rstrip("/") + "/v1/rag/query"
        response = httpx.post(
            url,
            json={"namespace": namespace, "query": query, "top_k": top_k},
            headers=self._headers(),
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("chunks") or data.get("results") or []

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if settings.slidegen_api_key:
            headers["Authorization"] = f"Bearer {settings.slidegen_api_key}"
        return headers

    def _send_sqs(self, payload: dict[str, Any]) -> str:
        client = boto3.client("sqs", region_name=settings.aws_region)
        book_id = payload.get("book_id") or payload.get("job_id")
        response = client.send_message(
            QueueUrl=settings.sqs_slidegen_queue_url,
            MessageBody=json.dumps(payload),
            MessageGroupId=str(book_id),
            MessageDeduplicationId=str(payload.get("job_id")),
        )
        return response.get("MessageId")

    def _post_http(self, payload: dict[str, Any]) -> str:
        url = settings.slidegen_api_url.rstrip("/") + "/v1/jobs"
        response = httpx.post(url, json=payload, headers=self._headers(), timeout=30.0)
        response.raise_for_status()
        data = response.json()
        return data.get("id") or data.get("job_id") or payload["job_id"]


slidegen_client = SlidegenClient()
