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

output "workflows_table_name" {
  description = "Name of the DynamoDB workflows table"
  value       = aws_dynamodb_table.workflows.name
}

output "employees_table_name" {
  description = "Name of the DynamoDB employees table"
  value       = aws_dynamodb_table.employees.name
}

output "leave_balances_table_name" {
  description = "Name of the DynamoDB leave balances table"
  value       = aws_dynamodb_table.leave_balances.name
}

output "assets_table_name" {
  description = "Name of the DynamoDB assets table"
  value       = aws_dynamodb_table.assets.name
}

output "projects_table_name" {
  description = "Name of the DynamoDB projects table"
  value       = aws_dynamodb_table.projects.name
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

output "bedrock_data_source_id" {
  description = "ID of the Bedrock Knowledge Base S3 data source"
  value       = aws_bedrockagent_data_source.s3_data_source.data_source_id
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = aws_opensearchserverless_collection.kb_vectors.collection_endpoint
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for the React frontend"
  value       = aws_s3_bucket.frontend_bucket.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for the frontend"
  value       = aws_cloudfront_distribution.frontend_distribution.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "cloudfront_url" {
  description = "HTTPS URL for the deployed frontend"
  value       = "https://${aws_cloudfront_distribution.frontend_distribution.domain_name}"
}
