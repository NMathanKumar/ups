variable "aws_region" {
  description = "AWS region for deploying resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "employee-ai-assistant"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "reminder_table_name" {
  description = "DynamoDB table name for employee reminders"
  type        = string
  default     = "employee_reminders"
}

variable "bedrock_model_id" {
  description = "Foundation model ID for Bedrock generation"
  type        = string
  default     = "amazon.nova-micro-v1:0"
}

variable "bedrock_embedding_model_arn" {
  description = "Embedding model ARN for Bedrock Knowledge Base"
  type        = string
  default     = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
}
