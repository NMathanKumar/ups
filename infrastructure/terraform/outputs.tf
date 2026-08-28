output "knowledge_bucket_name" {
  description = "Name of the S3 bucket for enterprise knowledge documents"
  value       = aws_s3_bucket.knowledge_bucket.id
}

output "reminder_table_name" {
  description = "Name of the DynamoDB reminders table"
  value       = aws_dynamodb_table.reminders.name
}

output "tasks_table_name" {
  description = "Name of the DynamoDB tasks table"
  value       = aws_dynamodb_table.tasks.name
}

output "conversations_table_name" {
  description = "Name of the DynamoDB conversations table"
  value       = aws_dynamodb_table.conversations.name
}

output "lambda_function_name" {
  description = "Name of the backend Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "api_gateway_url" {
  description = "URL endpoint for the API Gateway HTTP API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "bedrock_knowledge_base_id" {
  description = "ID of the Amazon Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.employee_kb.id
}

output "bedrock_knowledge_base_arn" {
  description = "ARN of the Amazon Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.employee_kb.arn
}
