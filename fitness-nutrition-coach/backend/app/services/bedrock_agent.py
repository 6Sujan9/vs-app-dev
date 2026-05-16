"""Amazon Bedrock Knowledge Base integration using retrieve_and_generate."""

import boto3
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BedrockAgent:
    """Queries the Bedrock Knowledge Base with retrieve_and_generate.

    Unlike a plain invoke_model call, retrieve_and_generate does retrieval
    and generation in a single API round-trip and supports multi-turn sessions.
    """

    def __init__(self):
        self.client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.AWS_REGION,
        )
        # Full model ARN required by retrieve_and_generate
        self.model_arn = (
            f"arn:aws:bedrock:{settings.AWS_REGION}"
            f"::foundation-model/{settings.BEDROCK_MODEL_ID}"
        )

    def query(self, message: str, session_id: Optional[str] = None) -> dict:
        """Send a message and get a grounded response from the Knowledge Base.

        Args:
            message: The user's question or message.
            session_id: Bedrock session ID for multi-turn conversation continuity.
                        Pass the value returned in the previous response to keep context.

        Returns:
            dict with keys:
                response   – the model's answer text
                session_id – use this in the next call to continue the conversation
                citations  – list of S3 URIs that grounded the answer
        """
        kwargs = {
            "input": {"text": message},
            "retrieveAndGenerateConfiguration": {
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": settings.BEDROCK_KNOWLEDGE_BASE_ID,
                    "modelArn": self.model_arn,
                },
            },
        }
        if session_id:
            kwargs["sessionId"] = session_id

        try:
            response = self.client.retrieve_and_generate(**kwargs)
        except Exception as e:
            logger.error("Bedrock retrieve_and_generate failed: %s", e)
            raise

        output_text = response.get("output", {}).get("text", "")

        citations = []
        for citation in response.get("citations", []):
            for ref in citation.get("retrievedReferences", []):
                uri = (
                    ref.get("location", {})
                    .get("s3Location", {})
                    .get("uri", "")
                )
                if uri:
                    citations.append(uri)

        return {
            "response": output_text,
            "session_id": response.get("sessionId"),
            "citations": citations,
        }
