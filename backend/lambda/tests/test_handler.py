"""
Unit tests for WorkPilot AI Lambda handler and RAGService.
Uses Python Standard Library `unittest`.
"""

import json
import sys
import os
import unittest

# Ensure backend/lambda is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from handler import lambda_handler, parse_body
from services.rag_service import RAGService


class TestWorkPilotBackend(unittest.TestCase):

    def setUp(self):
        self.rag_service = RAGService(use_bedrock=False)

    def test_parse_body_direct(self):
        event = {"message": "Hello", "employeeId": "EMP001"}
        parsed = parse_body(event)
        self.assertEqual(parsed["message"], "Hello")
        self.assertEqual(parsed["employeeId"], "EMP001")

    def test_parse_body_api_gateway_string(self):
        event = {"body": json.dumps({"message": "VPN test", "employeeId": "EMP002"})}
        parsed = parse_body(event)
        self.assertEqual(parsed["message"], "VPN test")

    def test_parse_body_invalid_json(self):
        event = {"body": "{invalid json}"}
        with self.assertRaises(ValueError):
            parse_body(event)

    def test_parse_body_missing(self):
        event = {}
        with self.assertRaises(ValueError):
            parse_body(event)

    def test_policy_question_intent(self):
        res = lambda_handler({"body": json.dumps({"message": "How many annual leave days do I get?", "employeeId": "EMP001"})})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["intent"], "POLICY_QUESTION")
        self.assertTrue(body["mock"])
        self.assertTrue(len(body["sources"]) > 0)
        self.assertIn("leave-policy.txt", body["sources"][0]["document"])

    def test_it_question_intent(self):
        res = lambda_handler({"body": json.dumps({"message": "My VPN is not connecting. What should I do?", "employeeId": "EMP001"})})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["intent"], "IT_SUPPORT")
        self.assertTrue(body["mock"])
        self.assertIn("vpn-guide.txt", body["sources"][0]["document"])

    def test_learning_question_intent(self):
        res = lambda_handler({"body": json.dumps({"message": "Which security training is mandatory?", "employeeId": "EMP001"})})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["intent"], "LEARNING")
        self.assertTrue(body["mock"])
        self.assertIn("security-training.txt", body["sources"][0]["document"])

    def test_onboarding_question_intent(self):
        res = lambda_handler({"body": json.dumps({"message": "What should I complete during my first week onboarding?", "employeeId": "EMP001"})})
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["intent"], "ONBOARDING")
        self.assertTrue(body["mock"])
        self.assertIn("onboarding-checklist.txt", body["sources"][0]["document"])

    def test_missing_message(self):
        res = lambda_handler({"body": json.dumps({"employeeId": "EMP001"})})
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)

    def test_empty_message(self):
        res = lambda_handler({"body": json.dumps({"message": "   "})})
        self.assertEqual(res["statusCode"], 400)


if __name__ == "__main__":
    unittest.main()
