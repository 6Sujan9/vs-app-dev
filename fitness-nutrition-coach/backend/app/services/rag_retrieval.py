"""RAG (Retrieval-Augmented Generation) service for document retrieval from S3."""

import boto3
import json
from typing import List, Dict, Optional, Tuple
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RAGRetrievalService:
    """Service for retrieving documents from S3 and Amazon Bedrock Knowledge Base."""

    def __init__(self):
        """Initialize S3 and Bedrock clients."""
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        
        self.bedrock_kb_client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    def retrieve_documents_from_knowledge_base(
        self,
        query: str,
        knowledge_base_id: str,
        max_results: int = 5,
    ) -> List[Dict[str, any]]:
        """
        Retrieve relevant documents from Bedrock Knowledge Base.
        
        Args:
            query: Search query
            knowledge_base_id: Bedrock Knowledge Base ID
            max_results: Maximum number of results to return
            
        Returns:
            List of relevant documents with content and metadata
        """
        try:
            response = self.bedrock_kb_client.retrieve(
                knowledgeBaseId=knowledge_base_id,
                retrievalConfiguration={
                    "vectorSearchConfiguration": {
                        "numberOfResults": max_results,
                    }
                },
                text=query,
            )
            
            documents = []
            for result in response.get("retrievalResults", []):
                doc = {
                    "content": result.get("content", ""),
                    "source": result.get("location", {}).get("s3Location", {}).get("uri", ""),
                    "score": result.get("score", 0),
                    "metadata": result.get("metadata", {}),
                }
                documents.append(doc)
            
            logger.info(f"Retrieved {len(documents)} documents from knowledge base")
            return documents
            
        except Exception as e:
            logger.error(f"Error retrieving from knowledge base: {e}")
            return []

    def retrieve_documents_from_s3(
        self,
        bucket_name: str,
        prefix: str = "",
        query_keywords: Optional[List[str]] = None,
    ) -> List[Dict[str, any]]:
        """
        Retrieve documents from S3 bucket.
        
        Args:
            bucket_name: S3 bucket name
            prefix: S3 prefix (folder path)
            query_keywords: Keywords to filter documents
            
        Returns:
            List of documents from S3
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix,
            )
            
            documents = []
            for obj in response.get("Contents", []):
                key = obj["Key"]
                
                # Skip if it doesn't match query keywords
                if query_keywords:
                    if not any(kw.lower() in key.lower() for kw in query_keywords):
                        continue
                
                # Read document content
                try:
                    file_response = self.s3_client.get_object(Bucket=bucket_name, Key=key)
                    content = file_response["Body"].read().decode("utf-8")
                    
                    doc = {
                        "key": key,
                        "content": content,
                        "bucket": bucket_name,
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat(),
                    }
                    documents.append(doc)
                except Exception as e:
                    logger.warning(f"Error reading S3 object {key}: {e}")
                    continue
            
            logger.info(f"Retrieved {len(documents)} documents from S3")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing S3 objects: {e}")
            return []

    def upload_document_to_s3(
        self,
        bucket_name: str,
        key: str,
        content: str,
        document_type: str = "text/plain",
    ) -> bool:
        """
        Upload a document to S3.
        
        Args:
            bucket_name: S3 bucket name
            key: S3 object key (path)
            content: Document content
            document_type: MIME type
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=key,
                Body=content.encode("utf-8"),
                ContentType=document_type,
            )
            logger.info(f"Uploaded document to S3: {key}")
            return True
        except Exception as e:
            logger.error(f"Error uploading to S3: {e}")
            return False

    def create_knowledge_base(
        self,
        name: str,
        description: str,
        s3_bucket_arn: str,
        role_arn: str,
    ) -> Optional[str]:
        """
        Create a Bedrock Knowledge Base.
        
        Args:
            name: Knowledge base name
            description: Knowledge base description
            s3_bucket_arn: ARN of S3 bucket with documents
            role_arn: ARN of IAM role for Bedrock
            
        Returns:
            Knowledge base ID or None if failed
        """
        try:
            client = boto3.client(
                "bedrock-agent",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            
            response = client.create_knowledge_base(
                name=name,
                description=description,
                roleArn=role_arn,
                knowledgeBaseConfiguration={
                    "type": "VECTOR",
                    "vectorKnowledgeBaseConfiguration": {
                        "embeddingModel": {
                            "provider": "BEDROCK",
                            "modelIdentifier": "amazon.titan-embed-text-v2:0",
                        }
                    },
                },
                storageConfiguration={
                    "type": "S3",
                    "s3StorageConfiguration": {
                        "bucketArn": s3_bucket_arn,
                    },
                },
            )
            
            kb_id = response.get("knowledgeBase", {}).get("id")
            logger.info(f"Created knowledge base: {kb_id}")
            return kb_id
            
        except Exception as e:
            logger.error(f"Error creating knowledge base: {e}")
            return None

    def sync_knowledge_base(
        self,
        knowledge_base_id: str,
        data_source_id: str,
    ) -> bool:
        """
        Sync knowledge base with S3 data source.
        
        Args:
            knowledge_base_id: Knowledge base ID
            data_source_id: Data source ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            client = boto3.client(
                "bedrock-agent",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            
            response = client.start_ingestion_job(
                knowledgeBaseId=knowledge_base_id,
                dataSourceId=data_source_id,
            )
            
            job_id = response.get("ingestionJob", {}).get("ingestionJobId")
            logger.info(f"Started ingestion job: {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error syncing knowledge base: {e}")
            return False

    def chunk_documents(
        self,
        documents: List[Dict[str, str]],
        chunk_size: int = 1000,
        overlap: int = 100,
    ) -> List[Dict[str, str]]:
        """
        Split documents into chunks for better retrieval.
        
        Args:
            documents: List of documents
            chunk_size: Number of characters per chunk
            overlap: Number of overlapping characters between chunks
            
        Returns:
            List of chunked documents
        """
        chunks = []
        
        for doc in documents:
            content = doc.get("content", "")
            source = doc.get("source", "")
            
            # Split content into chunks
            for i in range(0, len(content), chunk_size - overlap):
                chunk_content = content[i:i + chunk_size]
                
                chunks.append({
                    "content": chunk_content,
                    "source": source,
                    "chunk_index": i // (chunk_size - overlap),
                    "original_doc": doc,
                })
        
        logger.info(f"Created {len(chunks)} chunks from {len(documents)} documents")
        return chunks

    def format_context_for_prompt(
        self,
        documents: List[Dict[str, any]],
        max_tokens: int = 2000,
    ) -> str:
        """
        Format retrieved documents into context for LLM prompt.
        
        Args:
            documents: List of retrieved documents
            max_tokens: Maximum tokens to include
            
        Returns:
            Formatted context string
        """
        context_parts = []
        total_chars = 0
        max_chars = max_tokens * 4  # Rough estimate
        
        for i, doc in enumerate(documents, 1):
            content = doc.get("content", "")
            source = doc.get("source", "")
            
            # Skip if we've exceeded token limit
            if total_chars + len(content) > max_chars:
                break
            
            # Format document with source attribution
            source_text = f"\nSource: {source}" if source else ""
            formatted_doc = f"\n[Document {i}]:\n{content}{source_text}"
            context_parts.append(formatted_doc)
            total_chars += len(formatted_doc)
        
        if not context_parts:
            return "No relevant documents found in knowledge base."
        
        return "\n".join(context_parts)

    def extract_citations(
        self,
        documents: List[Dict[str, any]],
    ) -> List[Dict[str, str]]:
        """
        Extract citations from retrieved documents.
        
        Args:
            documents: List of retrieved documents
            
        Returns:
            List of citations
        """
        citations = []
        for doc in documents:
            source = doc.get("source", "")
            if source:
                citations.append({
                    "source": source,
                    "score": f"{doc.get('score', 0):.2f}" if doc.get('score') else "N/A",
                })
        return citations


class FitnessDocumentRetriever(RAGRetrievalService):
    """Specialized retriever for fitness-related documents."""

    def retrieve_workout_documents(
        self,
        goal: str,
        equipment: List[str],
        intensity: str,
        knowledge_base_id: Optional[str] = None,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Retrieve workout-related documents.
        
        Args:
            goal: Workout goal
            equipment: Available equipment
            intensity: Intensity level
            knowledge_base_id: Optional knowledge base ID
            
        Returns:
            Tuple of (knowledge_base_docs, citations)
        """
        # Query knowledge base if available
        kb_docs = []
        citations = []
        
        if knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID:
            kb_id = knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID
            query = f"{goal} workout {intensity} intensity {' '.join(equipment)}"
            kb_docs = self.retrieve_documents_from_knowledge_base(query, kb_id)
            citations = self.extract_citations(kb_docs)
        
        # Also retrieve from S3 if configured
        if settings.DOCUMENT_BUCKET_NAME:
            s3_keywords = [goal, "workout", intensity]
            s3_docs = self.retrieve_documents_from_s3(
                settings.DOCUMENT_BUCKET_NAME,
                prefix="workouts/",
                query_keywords=s3_keywords,
            )
            kb_docs.extend(s3_docs)
        
        return kb_docs, citations

    def retrieve_nutrition_documents(
        self,
        diet_type: str,
        goal: str,
        dietary_restrictions: List[str],
        knowledge_base_id: Optional[str] = None,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Retrieve nutrition-related documents.
        
        Args:
            diet_type: Type of diet
            goal: Nutrition goal
            dietary_restrictions: Dietary restrictions
            knowledge_base_id: Optional knowledge base ID
            
        Returns:
            Tuple of (knowledge_base_docs, citations)
        """
        # Query knowledge base if available
        kb_docs = []
        citations = []
        
        if knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID:
            kb_id = knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID
            restrictions_text = " ".join(dietary_restrictions)
            query = f"{diet_type} {goal} meal plan nutrition {restrictions_text}"
            kb_docs = self.retrieve_documents_from_knowledge_base(query, kb_id)
            citations = self.extract_citations(kb_docs)
        
        # Also retrieve from S3 if configured
        if settings.DOCUMENT_BUCKET_NAME:
            s3_keywords = [diet_type, goal, "nutrition"] + dietary_restrictions
            s3_docs = self.retrieve_documents_from_s3(
                settings.DOCUMENT_BUCKET_NAME,
                prefix="nutrition/",
                query_keywords=s3_keywords,
            )
            kb_docs.extend(s3_docs)
        
        return kb_docs, citations

    def retrieve_health_documents(
        self,
        query: str,
        medical_conditions: List[str],
        knowledge_base_id: Optional[str] = None,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Retrieve health/medical-related documents.
        
        Args:
            query: Search query
            medical_conditions: Medical conditions
            knowledge_base_id: Optional knowledge base ID
            
        Returns:
            Tuple of (knowledge_base_docs, citations)
        """
        # Query knowledge base if available
        kb_docs = []
        citations = []
        
        if knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID:
            kb_id = knowledge_base_id or settings.BEDROCK_KNOWLEDGE_BASE_ID
            conditions_text = " ".join(medical_conditions)
            full_query = f"{query} {conditions_text}"
            kb_docs = self.retrieve_documents_from_knowledge_base(full_query, kb_id)
            citations = self.extract_citations(kb_docs)
        
        # Also retrieve from S3 if configured
        if settings.DOCUMENT_BUCKET_NAME:
            s3_keywords = [query] + medical_conditions
            s3_docs = self.retrieve_documents_from_s3(
                settings.DOCUMENT_BUCKET_NAME,
                prefix="health/",
                query_keywords=s3_keywords,
            )
            kb_docs.extend(s3_docs)
        
        return kb_docs, citations
