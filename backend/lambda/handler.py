"""
AWS Lambda Handler for WorkPilot AI.
Supports API Gateway HTTP API ($default / POST /chat) and direct event payloads.
"""

import json
import logging
import base64
from services.rag_service import RAGService

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize RAG Service (MOCK mode for local/offline dev)
rag_service = RAGService(use_bedrock=False)


def parse_body(event: dict) -> dict:
    """Safely parse JSON request body from API Gateway or direct invocation."""
    if not isinstance(event, dict):
        raise ValueError("Invalid event structure: expected dictionary.")

    # Direct invocation (message is directly in event)
    if "message" in event:
        return event

    body = event.get("body")
    if body is None:
        raise ValueError("Missing request body.")

    # Handle base64 encoded body if flagged by API Gateway
    if event.get("isBase64Encoded", False):
        try:
            body = base64.b64decode(body).decode("utf-8")
        except Exception as e:
            raise ValueError(f"Failed to decode base64 body: {str(e)}")

    if isinstance(body, str):
        if not body.strip():
            raise ValueError("Request body is empty.")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON format in request body.")
    elif isinstance(body, dict):
        return body

    raise ValueError("Unrecognized body format.")


def build_response(status_code: int, body: dict) -> dict:
    """Format standard API Gateway HTTP API proxy response."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context=None):
    """
    Lambda function handler entrypoint.
    """
    logger.info(f"Incoming event: {json.dumps(event) if isinstance(event, dict) else str(event)}")

    # Handle CORS preflight OPTIONS request if API Gateway routes it
    if isinstance(event, dict) and event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return build_response(200, {"message": "CORS preflight OK"})

    try:
        payload = parse_body(event)
    except ValueError as err:
        logger.warning(f"Bad Request: {str(err)}")
        return build_response(400, {
            "error": "Bad Request",
            "message": str(err)
        })
    except Exception as err:
        logger.error(f"Unexpected parsing error: {str(err)}")
        return build_response(500, {
            "error": "Internal Server Error",
            "message": "Failed to parse incoming payload."
        })

    message = payload.get("message")
    employee_id = payload.get("employeeId", "EMP_GUEST")

    if not message or not isinstance(message, str) or not message.strip():
        logger.warning("Missing or empty 'message' field in request.")
        return build_response(400, {
            "error": "Bad Request",
            "message": "The 'message' field is required and cannot be empty."
        })

    try:
        result = rag_service.answer(message=message.strip(), employee_id=employee_id)
        return build_response(200, result)
    except Exception as err:
        logger.error(f"Execution error in RAGService: {str(err)}", exc_info=True)
        return build_response(500, {
            "error": "Internal Server Error",
            "message": "An error occurred while processing your request."
        })
