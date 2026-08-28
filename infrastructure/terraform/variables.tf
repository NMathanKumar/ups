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
