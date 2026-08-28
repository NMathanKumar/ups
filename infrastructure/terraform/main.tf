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
data "aws_region" "current" {}

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
# DynamoDB Table for Workflow State (leave requests, HR approvals, IT tickets)
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "workflows" {
  name         = "${var.project_name}-workflows"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "workflowId"

  attribute {
    name = "workflowId"
    type = "S"
  }
}

# ------------------------------------------------------------------------------
# DynamoDB Enterprise Structured Data Tables (Step 13)
# Populated by: npm run seed (from backend/)
# Policy documents go to S3/Bedrock KB — NOT here.
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "employees" {
  name         = "${var.project_name}-employees"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "employeeId"

  attribute {
    name = "employeeId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "leave_balances" {
  name         = "${var.project_name}-leave-balances"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "employeeId"

  attribute {
    name = "employeeId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "assets" {
  name         = "${var.project_name}-assets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "employeeId"
  range_key    = "assetId"

  attribute {
    name = "employeeId"
    type = "S"
  }

  attribute {
    name = "assetId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "projects" {
  name         = "${var.project_name}-projects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "projectId"

  attribute {
    name = "projectId"
    type = "S"
  }
}

# ------------------------------------------------------------------------------
# OpenSearch Serverless — Vector Store for Bedrock Knowledge Base
# ------------------------------------------------------------------------------

# Encryption policy (required before collection creation)
resource "aws_opensearchserverless_security_policy" "kb_encryption" {
  name        = "${var.project_name}-kb-enc"
  type        = "encryption"
  description = "Encryption policy for KB vector collection"

  policy = jsonencode({
    Rules = [
      {
        ResourceType = "collection"
        Resource     = ["collection/${var.project_name}-kb-vectors"]
      }
    ]
    AWSOwnedKey = true
  })
}

# Network policy — allow Bedrock service access (no public access needed)
resource "aws_opensearchserverless_security_policy" "kb_network" {
  name        = "${var.project_name}-kb-net"
  type        = "network"
  description = "Network policy for KB vector collection"

  policy = jsonencode([
    {
      Description = "Public access for Bedrock KB"
      Rules = [
        {
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-kb-vectors"]
        },
        {
          ResourceType = "dashboard"
          Resource     = ["collection/${var.project_name}-kb-vectors"]
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# Data access policy — allow Bedrock KB role and the current deployer to manage index/data
resource "aws_opensearchserverless_access_policy" "kb_access" {
  name        = "${var.project_name}-kb-access"
  type        = "data"
  description = "Data access for Bedrock KB role"

  policy = jsonencode([
    {
      Description = "Bedrock KB role full index access"
      Rules = [
        {
          ResourceType = "index"
          Resource     = ["index/${var.project_name}-kb-vectors/*"]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
        },
        {
          ResourceType = "collection"
          Resource     = ["collection/${var.project_name}-kb-vectors"]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
        }
      ]
      Principal = [
        aws_iam_role.bedrock_kb_role.arn,
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/hackathon-admin"
      ]
    }
  ])
}

# The OpenSearch Serverless collection itself
resource "aws_opensearchserverless_collection" "kb_vectors" {
  name        = "${var.project_name}-kb-vectors"
  type        = "VECTORSEARCH"
  description = "Vector store for WorkPilot AI Bedrock Knowledge Base"

  depends_on = [
    aws_opensearchserverless_security_policy.kb_encryption,
    aws_opensearchserverless_security_policy.kb_network,
  ]
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
          aws_dynamodb_table.conversations.arn,
          aws_dynamodb_table.workflows.arn,
          aws_dynamodb_table.employees.arn,
          aws_dynamodb_table.leave_balances.arn,
          aws_dynamodb_table.assets.arn,
          aws_dynamodb_table.projects.arn
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
# Lambda — Real Backend Package
# Pre-built by: cd backend && npm run package
# The zip contains src/ + production node_modules.
# ------------------------------------------------------------------------------

locals {
  lambda_zip_path            = "${path.module}/lambda_backend.zip"
  agent_service_zip_path     = "${path.module}/agent_service.zip"
  task_service_zip_path      = "${path.module}/task_service.zip"
  hr_service_zip_path        = "${path.module}/hr_service.zip"
  it_service_zip_path        = "${path.module}/it_service.zip"
  onboarding_service_zip_path = "${path.module}/onboarding_service.zip"
}

# Legacy / Unified Router Lambda
resource "aws_lambda_function" "api_handler" {
  function_name    = "${var.project_name}-api-handler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/router.handler"
  runtime          = "nodejs20.x"
  filename         = local.lambda_zip_path
  source_code_hash = filebase64sha256(local.lambda_zip_path)
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
      KNOWLEDGE_BUCKET                    = aws_s3_bucket.knowledge_bucket.id
      BEDROCK_RELEVANCE_THRESHOLD         = "0.2"
      CONVERSATION_WINDOW_SIZE            = "10"
      COGNITO_USER_POOL_ID                = aws_cognito_user_pool.user_pool.id
      COGNITO_CLIENT_ID                   = aws_cognito_user_pool_client.user_pool_client.id
    }
  }
}

# Microservice 1: Agent & RAG Service
resource "aws_lambda_function" "agent_service" {
  function_name    = "${var.project_name}-agent-service"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/microservices/agent-service/index.handler"
  runtime          = "nodejs20.x"
  filename         = local.agent_service_zip_path
  source_code_hash = filebase64sha256(local.agent_service_zip_path)
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
      KNOWLEDGE_BUCKET                    = aws_s3_bucket.knowledge_bucket.id
      BEDROCK_RELEVANCE_THRESHOLD         = "0.2"
      CONVERSATION_WINDOW_SIZE            = "10"
      COGNITO_USER_POOL_ID                = aws_cognito_user_pool.user_pool.id
      COGNITO_CLIENT_ID                   = aws_cognito_user_pool_client.user_pool_client.id
    }
  }
}

# Microservice 2: Task & Reminders Service
resource "aws_lambda_function" "task_service" {
  function_name    = "${var.project_name}-task-service"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/microservices/task-service/index.handler"
  runtime          = "nodejs20.x"
  filename         = local.task_service_zip_path
  source_code_hash = filebase64sha256(local.task_service_zip_path)
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
    }
  }
}

# Microservice 3: HR & Employee Service
resource "aws_lambda_function" "hr_service" {
  function_name    = "${var.project_name}-hr-service"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/microservices/hr-service/index.handler"
  runtime          = "nodejs20.x"
  filename         = local.hr_service_zip_path
  source_code_hash = filebase64sha256(local.hr_service_zip_path)
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
    }
  }
}

# Microservice 4: IT Support & Assets Service
resource "aws_lambda_function" "it_service" {
  function_name    = "${var.project_name}-it-service"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/microservices/it-service/index.handler"
  runtime          = "nodejs20.x"
  filename         = local.it_service_zip_path
  source_code_hash = filebase64sha256(local.it_service_zip_path)
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
    }
  }
}

# Microservice 5: Onboarding Workflow Service
resource "aws_lambda_function" "onboarding_service" {
  function_name    = "${var.project_name}-onboarding-service"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/microservices/onboarding-service/index.handler"
  runtime          = "nodejs20.x"
  filename         = local.onboarding_service_zip_path
  source_code_hash = filebase64sha256(local.onboarding_service_zip_path)
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      ENVIRONMENT                         = var.environment
      FRONTEND_ORIGIN                     = "*"
      BEDROCK_KNOWLEDGE_BASE_ID           = aws_bedrockagent_knowledge_base.employee_kb.id
      BEDROCK_MODEL_ID                    = var.bedrock_model_id
      TASKS_TABLE_NAME                    = aws_dynamodb_table.tasks.name
      REMINDERS_TABLE_NAME                = aws_dynamodb_table.reminders.name
      CONVERSATIONS_TABLE_NAME            = aws_dynamodb_table.conversations.name
      WORKFLOWS_TABLE_NAME                = aws_dynamodb_table.workflows.name
      EMPLOYEES_TABLE_NAME                = aws_dynamodb_table.employees.name
      LEAVE_BALANCES_TABLE_NAME           = aws_dynamodb_table.leave_balances.name
      ASSETS_TABLE_NAME                   = aws_dynamodb_table.assets.name
      PROJECTS_TABLE_NAME                 = aws_dynamodb_table.projects.name
    }
  }
}

# ------------------------------------------------------------------------------
# API Gateway (HTTP API)
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PATCH", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Integrations
resource "aws_apigatewayv2_integration" "agent_service_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.agent_service.invoke_arn
}

resource "aws_apigatewayv2_integration" "task_service_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.task_service.invoke_arn
}

resource "aws_apigatewayv2_integration" "hr_service_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.hr_service.invoke_arn
}

resource "aws_apigatewayv2_integration" "it_service_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.it_service.invoke_arn
}

resource "aws_apigatewayv2_integration" "onboarding_service_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.onboarding_service.invoke_arn
}

# Route: POST /api/chat -> Agent Service
resource "aws_apigatewayv2_route" "chat_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/chat"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

# Route: GET /api/health -> Agent Service
resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

# Route: GET /api/conversations -> Agent Service
resource "aws_apigatewayv2_route" "conversations_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/conversations"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

# Route: GET /api/tasks -> Task Service
resource "aws_apigatewayv2_route" "tasks_get_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/tasks"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Route: POST /api/tasks -> Task Service
resource "aws_apigatewayv2_route" "tasks_post_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/tasks"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Route: PATCH /api/tasks/{taskId} -> Task Service
resource "aws_apigatewayv2_route" "tasks_patch_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PATCH /api/tasks/{taskId}"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Route: GET /api/reminders -> Task Service
resource "aws_apigatewayv2_route" "reminders_get_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/reminders"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Route: POST /api/reminders -> Task Service
resource "aws_apigatewayv2_route" "reminders_post_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/reminders"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Route: PATCH /api/reminders/{reminderId} -> Task Service
resource "aws_apigatewayv2_route" "reminders_patch_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "PATCH /api/reminders/{reminderId}"
  target    = "integrations/${aws_apigatewayv2_integration.task_service_integration.id}"
}

# Lambda Permissions for API Gateway Invocation
resource "aws_lambda_permission" "agent_service_perm" {
  statement_id  = "AllowAgentServiceExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.agent_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "task_service_perm" {
  statement_id  = "AllowTaskServiceExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.task_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "hr_service_perm" {
  statement_id  = "AllowHRServiceExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.hr_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "it_service_perm" {
  statement_id  = "AllowITServiceExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.it_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "onboarding_service_perm" {
  statement_id  = "AllowOnboardingServiceExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.onboarding_service.function_name
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
      },
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = aws_opensearchserverless_collection.kb_vectors.arn
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
      collection_arn    = aws_opensearchserverless_collection.kb_vectors.arn
      vector_index_name = "bedrock-knowledge-base-default-index"
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }

  depends_on = [
    aws_opensearchserverless_access_policy.kb_access,
    aws_iam_role_policy.bedrock_kb_s3_policy,
  ]
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

# ------------------------------------------------------------------------------
# Dedicated S3 Bucket for React Frontend Static Assets
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend_bucket" {
  bucket        = "${var.project_name}-frontend-${random_id.bucket_suffix.hex}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "frontend_bucket_privacy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_bucket_encryption" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Origin Access Control (OAC) for Frontend S3 Bucket
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "${var.project_name}-frontend-oac"
  description                       = "OAC for WorkPilot AI Frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution for Frontend Web App
resource "aws_cloudfront_distribution" "frontend_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "WorkPilot AI Frontend Distribution"

  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.frontend_bucket.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # SPA Routing — Map 403 & 404 to /index.html with 200 OK
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# S3 Bucket Policy allowing CloudFront OAC to read objects
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend_distribution.arn
          }
        }
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# AWS Cognito User Pool for Employee Authentication
# ------------------------------------------------------------------------------
resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.project_name}-user-pool"

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  password_policy {
    minimum_length    = 6
    require_lowercase = false
    require_numbers   = false
    require_symbols   = false
    require_uppercase = false
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "name"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "phone_number"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "gender"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "designation"
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name         = "${var.project_name}-user-pool-client"
  user_pool_id = aws_cognito_user_pool.user_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  generate_secret = false
}

resource "aws_iam_role_policy" "lambda_cognito" {
  name = "${var.project_name}-lambda-cognito-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:SignUp",
          "cognito-idp:AdminConfirmSignUp",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminGetUser",
          "cognito-idp:InitiateAuth",
          "cognito-idp:GetUser"
        ]
        Resource = "*"
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# Auth Routes
# ------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "auth_signup_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/signup"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

resource "aws_apigatewayv2_route" "auth_login_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

resource "aws_apigatewayv2_route" "auth_me_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/auth/me"
  target    = "integrations/${aws_apigatewayv2_integration.agent_service_integration.id}"
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.user_pool_client.id
}
