provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# Random Suffix for Unique Naming
# ------------------------------------------------------------------------------
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ------------------------------------------------------------------------------
# S3 Bucket for Enterprise Knowledge Documents
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "knowledge_bucket" {
  bucket        = "${var.project_name}-kb-${random_id.bucket_suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "knowledge_bucket_privacy" {
  bucket = aws_s3_bucket.knowledge_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "knowledge_bucket_encryption" {
  bucket = aws_s3_bucket.knowledge_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Upload local knowledge-base documents to S3
resource "aws_s3_object" "knowledge_docs" {
  for_each = fileset("${path.module}/../../knowledge-base", "**/*.txt")

  bucket       = aws_s3_bucket.knowledge_bucket.id
  key          = "knowledge-base/${each.value}"
  source       = "${path.module}/../../knowledge-base/${each.value}"
  etag         = filemd5("${path.module}/../../knowledge-base/${each.value}")
  content_type = "text/plain"
}

# ------------------------------------------------------------------------------
# DynamoDB Table for Employee Reminders
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "reminders" {
  name         = "${var.project_name}-${var.reminder_table_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "employee_id"
  range_key    = "reminder_id"

  attribute {
    name = "employee_id"
    type = "S"
  }

  attribute {
    name = "reminder_id"
    type = "S"
  }
}

# ------------------------------------------------------------------------------
# DynamoDB Table for Tasks
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "tasks" {
  name         = "${var.project_name}-tasks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "taskId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "taskId"
    type = "S"
  }
}

# ------------------------------------------------------------------------------
# DynamoDB Table for Conversation History
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "conversations" {
  name         = "${var.project_name}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "sk"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# ------------------------------------------------------------------------------
# IAM Role & Policies for Lambda
# ------------------------------------------------------------------------------
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.project_name}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.reminders.arn,
          aws_dynamodb_table.tasks.arn,
          aws_dynamodb_table.conversations.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${var.project_name}-lambda-bedrock-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:Retrieve",
          "bedrock:RetrieveAndGenerate",
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# Lambda Foundation (Placeholder Package)
# ------------------------------------------------------------------------------
data "archive_file" "lambda_placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder_lambda.zip"

  source {
    content  = "exports.handler = async (event) => { return { statusCode: 200, body: JSON.stringify({ message: 'WorkPilot AI Lambda Foundation Active' }) }; };"
    filename = "index.js"
  }
}

resource "aws_lambda_function" "api_handler" {
  function_name    = "${var.project_name}-api-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_placeholder.output_path
  source_code_hash = data.archive_file.lambda_placeholder.output_base64sha256

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "http://localhost:5173"
      BEDROCK_KNOWLEDGE_BASE_ID           = "REPLACE_AFTER_APPLY"
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      KNOWLEDGE_BUCKET                    = aws_s3_bucket.knowledge_bucket.id
      BEDROCK_RELEVANCE_THRESHOLD         = "0.4"
    }
  }
}

# ------------------------------------------------------------------------------
# API Gateway Foundation (HTTP API)
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api_handler.invoke_arn
}

resource "aws_apigatewayv2_route" "chat_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /chat"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "api_gw_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# ------------------------------------------------------------------------------
# IAM Role for Bedrock Knowledge Base
# ------------------------------------------------------------------------------
resource "aws_iam_role" "bedrock_kb_role" {
  name = "${var.project_name}-bedrock-kb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_s3_policy" {
  name = "${var.project_name}-bedrock-s3-policy"
  role = aws_iam_role.bedrock_kb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.knowledge_bucket.arn,
          "${aws_s3_bucket.knowledge_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = var.bedrock_embedding_model_arn
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# Bedrock Knowledge Base & S3 Data Source
# ------------------------------------------------------------------------------
resource "aws_bedrockagent_knowledge_base" "employee_kb" {
  name     = "${var.project_name}-kb"
  role_arn = aws_iam_role.bedrock_kb_role.arn

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = var.bedrock_embedding_model_arn
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = "arn:aws:aoss:${var.aws_region}:${data.aws_caller_identity.current.account_id}:collection/placeholder"
      vector_index_name = "bedrock-knowledge-base-default-index"
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }
}

resource "aws_bedrockagent_data_source" "s3_data_source" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.employee_kb.id
  name              = "${var.project_name}-s3-source"

  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.knowledge_bucket.arn
      inclusion_prefixes = [
        "knowledge-base/"
      ]
    }
  }
}
