output "knowledge_bucket_name" {
  description = "Name of the S3 bucket for enterprise knowledge documents"
  value       = aws_s3_bucket.knowledge_bucket.id
}

output "reminder_table_name" {
  description = "Name of the DynamoDB table for employee reminders"
  value       = aws_dynamodb_table.reminders.name
}

output "lambda_function_name" {
  description = "Name of the backend Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "api_gateway_url" {
  description = "URL endpoint for the API Gateway HTTP API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}
