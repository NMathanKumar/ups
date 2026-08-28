"""
RAG Service Abstraction for WorkPilot AI.

NOTE: This is currently a MOCK implementation designed for local testing.
AWS Bedrock / Bedrock Knowledge Base is NOT connected in this file.
When AWS Bedrock permissions are configured, replace the `_mock_retrieval`
method with Boto3 Bedrock Agent Runtime calls (`retrieve_and_generate`).
"""

import logging

logger = logging.getLogger(__name__)

# Keyword to Intent and Mock Response Mapping
MOCK_KNOWLEDGE_BASE = [
    {
        "intent": "POLICY_QUESTION",
        "keywords": ["leave", "vacation", "pto", "holiday", "sick", "annual leave"],
        "answer": "Apex Enterprise Inc. provides 25 days of annual leave and 10 paid sick leave days per calendar year. Up to 5 unused annual leave days may be carried over to the next year.",
        "sources": [
            {
                "title": "Annual Leave & Paid Time Off Policy",
                "category": "HR",
                "document": "knowledge-base/hr/leave-policy.txt"
            }
        ]
    },
    {
        "intent": "POLICY_QUESTION",
        "keywords": ["wfh", "work from home", "remote", "telecommute", "home"],
        "answer": "Employees may work remotely for up to 3 days per week with prior manager approval via the HR Portal. Core working hours are 9:00 AM to 5:00 PM local time.",
        "sources": [
            {
                "title": "Work From Home (Remote Work) Policy",
                "category": "HR",
                "document": "knowledge-base/hr/work-from-home-policy.txt"
            }
        ]
    },
    {
        "intent": "POLICY_QUESTION",
        "keywords": ["benefit", "health", "insurance", "401k", "wellness", "stipend"],
        "answer": "Apex Enterprise Inc. offers health insurance starting Day 1, 100% 401(k) matching up to 5% of base salary, and a $50/month wellness stipend.",
        "sources": [
            {
                "title": "Employee Benefits & Compensation Overview",
                "category": "HR",
                "document": "knowledge-base/hr/benefits-policy.txt"
            }
        ]
    },
    {
        "intent": "IT_SUPPORT",
        "keywords": ["vpn", "connection", "connect", "globalprotect", "network"],
        "answer": "To resolve VPN issues: 1. Restart GlobalProtect client. 2. Verify internet connection. 3. Switch gateway to vpn-backup.apex-enterprise.com. 4. Clear VPN cache and restart.",
        "sources": [
            {
                "title": "VPN Connection & Troubleshooting Guide",
                "category": "IT Support",
                "document": "knowledge-base/it-support/vpn-guide.txt"
            }
        ]
    },
    {
        "intent": "IT_SUPPORT",
        "keywords": ["password", "reset", "lock", "locked", "login", "sso"],
        "answer": "Reset your password at identity.apex-enterprise.com/reset using Duo MFA. Passwords require 14+ characters. Locked accounts unlock automatically after 15 minutes.",
        "sources": [
            {
                "title": "Self-Service Password Reset Guide",
                "category": "IT Support",
                "document": "knowledge-base/it-support/password-reset.txt"
            }
        ]
    },
    {
        "intent": "IT_SUPPORT",
        "keywords": ["laptop", "hardware", "broken", "repair", "loaner", "dell", "macbook"],
        "answer": "Report hardware failures at itsm.apex-enterprise.com. In-office loaners are available in 4 hours; remote staff receive overnight replacement shipping.",
        "sources": [
            {
                "title": "Laptop Repair & Hardware Support Policy",
                "category": "IT Support",
                "document": "knowledge-base/it-support/laptop-support.txt"
            }
        ]
    },
    {
        "intent": "IT_SUPPORT",
        "keywords": ["software", "install", "access", "jira", "figma", "tableau", "aws"],
        "answer": "Standard tools (Slack, Zoom, Jira) are auto-provisioned. Restricted software (AWS, Figma, Tableau) requires manager approval via itsm.apex-enterprise.com/software (24h SLA).",
        "sources": [
            {
                "title": "Software Access Request Process",
                "category": "IT Support",
                "document": "knowledge-base/it-support/software-access.txt"
            }
        ]
    },
    {
        "intent": "LEARNING",
        "keywords": ["security training", "cybersecurity", "phishing", "mandatory course"],
        "answer": "Annual Cybersecurity Awareness 2026 is mandatory for all staff within 30 days of hire or by Sept 30 annually. Complete it at learning.apex-enterprise.com (80% pass score).",
        "sources": [
            {
                "title": "Mandatory Cybersecurity Awareness Training 2026",
                "category": "Learning",
                "document": "knowledge-base/learning/security-training.txt"
            }
        ]
    },
    {
        "intent": "LEARNING",
        "keywords": ["privacy", "gdpr", "ccpa", "data privacy"],
        "answer": "Data Privacy & GDPR/CCPA Compliance Training is required within 45 days of hire for data-handling roles, with annual renewal by Nov 15 (85% pass score).",
        "sources": [
            {
                "title": "Data Privacy & Compliance Training",
                "category": "Learning",
                "document": "knowledge-base/learning/data-privacy-training.txt"
            }
        ]
    },
    {
        "intent": "ONBOARDING",
        "keywords": ["onboard", "first day", "first week", "new hire", "orientation", "checklist"],
        "answer": "Day 1 tasks include HR forms, Duo MFA setup, laptop collection, and 2:00 PM HR orientation. Week 1 includes buddy sync, security training, and setting 30-day goals.",
        "sources": [
            {
                "title": "New Hire Onboarding Checklist",
                "category": "Onboarding",
                "document": "knowledge-base/onboarding/onboarding-checklist.txt"
            }
        ]
    },
    {
        "intent": "TASK_REQUEST",
        "keywords": ["reminder", "task", "schedule", "todo", "create task"],
        "answer": "I can help you log workplace reminders. Would you like me to add a reminder to your WorkPilot AI task list?",
        "sources": []
    }
]


class RAGService:
    """
    RAG Service layer.
    Pluggable architecture:
    - Current: Rule-based mock retrieval
    - Future: Amazon Bedrock RetrieveAndGenerate API
    """

    def __init__(self, use_bedrock: bool = False):
        self.use_bedrock = use_bedrock
        if use_bedrock:
            logger.info("Bedrock integration enabled (Future mode)")
        else:
            logger.info("RAGService initialized in MOCK mode (Bedrock not connected)")

    def classify_intent(self, message: str) -> str:
        """Classify user prompt intent using keyword rules."""
        text = message.lower()

        for entry in MOCK_KNOWLEDGE_BASE:
            for kw in entry["keywords"]:
                if kw in text:
                    return entry["intent"]

        if any(word in text for word in ["policy", "rules", "guideline"]):
            return "POLICY_QUESTION"
        if any(word in text for word in ["it", "computer", "helpdesk", "tech"]):
            return "IT_SUPPORT"
        if any(word in text for word in ["course", "learn", "class", "study"]):
            return "LEARNING"

        return "GENERAL"

    def answer(self, message: str, employee_id: str = None) -> dict:
        """
        Generate answer for employee query.
        Returns a dictionary with answer, sources, intent, and mock flag.
        """
        if self.use_bedrock:
            raise NotImplementedError("Bedrock integration is not enabled in this step.")

        return self._mock_retrieval(message, employee_id)

    def _mock_retrieval(self, message: str, employee_id: str = None) -> dict:
        """Perform deterministic mock retrieval from simulated KB."""
        text = message.lower()
        intent = self.classify_intent(message)

        best_match = None
        highest_score = 0

        for entry in MOCK_KNOWLEDGE_BASE:
            score = sum(1 for kw in entry["keywords"] if kw in text)
            if score > highest_score:
                highest_score = score
                best_match = entry

        if best_match:
            return {
                "answer": best_match["answer"],
                "sources": best_match["sources"],
                "intent": best_match["intent"],
                "mock": True,
                "note": "MOCK RESPONSE — Amazon Bedrock not connected in this step"
            }

        return {
            "answer": f"I received your query: '{message}'. WorkPilot AI knowledge base includes HR policies, IT support guides, learning compliance, and onboarding checklists. Please try asking about WFH policy, leave balance, VPN, password reset, or security training.",
            "sources": [],
            "intent": intent,
            "mock": True,
            "note": "MOCK RESPONSE — Amazon Bedrock not connected in this step"
        }
