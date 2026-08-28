# 🚀 WorkPilot AI — Enterprise Digital Assistant

[![AWS Powered](https://img.shields.io/badge/AWS-CloudFront%20%7C%20Bedrock%20%7C%20DynamoDB%20%7C%20Cognito-232F3E?style=flat-square&logo=amazon-aws)](https://aws.amazon.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20AWS%20Lambda-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-dzm9oii5lyk4d.cloudfront.net-FF9900?style=flat-square)](https://dzm9oii5lyk4d.cloudfront.net)

**WorkPilot AI** is an advanced, enterprise-grade AI Digital Assistant that provides employees with a unified, conversational workspace interface across HR, IT Support, Resource Mobility, Onboarding, Learning, and Workplace Services.

Grounded in **Amazon Bedrock RAG (Retrieval-Augmented Generation)**, **OpenSearch Serverless Vector Engine**, **AWS Cognito**, and **Amazon DynamoDB**, WorkPilot AI goes beyond traditional Q&A by executing end-to-end multi-step enterprise workflows directly from natural language requests and dedicated workspace portals.

---

## 🌐 Live Production Resources

- **Production URL**: [https://dzm9oii5lyk4d.cloudfront.net](https://dzm9oii5lyk4d.cloudfront.net)
- **API Gateway Endpoint**: `https://h135maoxfc.execute-api.us-east-1.amazonaws.com`
- **AWS Region**: `us-east-1` (N. Virginia)
- **Cognito User Pool ID**: `us-east-1_1de2ju7LG`
- **S3 Hosting Bucket**: `employee-ai-assistant-frontend-8a30f804`
- **CloudFront Distribution**: `E2VZJ189FEZ821`
- **GitHub Repository**: [https://github.com/NMathanKumar/ups.git](https://github.com/NMathanKumar/ups.git)
- **Git Branches**: `main`, `master`

---

## 🔥 Key System Capabilities

### 1. Amazon Bedrock RAG & ChatGPT/Claude Conversational Persona
- **Vector Search RAG**: Grounded in OpenSearch Serverless vector embeddings for accurate company policy retrieval.
- **Universal LLM Fallback (100% Answer Guarantee)**: If vector RAG search returns 0 document matches, the system seamlessly falls back to **Amazon Nova Micro (`amazon.nova-micro-v1:0`) LLM synthesis**.
- **Direct First-Sentence Answers**: Answers specific user questions immediately in line 1 without robotic intros (*"Based on the context..."*), supporting natural multi-turn conversation history.

### 2. Integrated Resource Mobility & Employee Transfer Workspace
- **Dedicated Sidebar Menu**: Access via **"Resource Mobility"** (`#transfers`).
- **Cognito & Enterprise Employee Selector Dropdown**: Select active employees (*Priya Sharma, Meera Nair, Alex Rivera, Sarah Jenkins, John Doe, Michael Chang, Emma Watson + logged-in Cognito account*).
- **Live Employee Inspector Card**: Displays Employee ID, Title, Current Department, Email, and assigned IT Devices.
- **Target Department Transfer Workflow**: Transfer employees across departments (*Engineering & AI*, *Product UX*, *IT Infrastructure*, *HR*, *Operations*, *Finance*).
- **Automated Workflow Ticket Generation**: Persists transfer records in **DynamoDB**, creates an **HR Department Transfer Task**, and provisions an **IT SSO & Permission Re-configuration Ticket**.
- **Resource Allocation Radar**: Displays unassigned staff matching project skill requests.

### 3. Policy-to-Action Multi-Step Workflows
- **Accident & Emergency Medical Leave Workflow (Male & All Employees)**:
  - Detects accident, injury, or emergency medical requests.
  - Entitles up to 30 days fully paid emergency medical leave.
  - Generates an URGENT HR Approval & Granting Ticket and IT Emergency Remote Access task upon user confirmation.
- **Maternity Leave Workflow**:
  - Validates eligibility via `checkLeaveBalance`.
  - Creates DynamoDB leave record, HR Approval Task, and IT Asset-Return Ticket.
- **Intern Onboarding Workflow**:
  - Provisions intern onboarding plans, HR tax setup tasks, IT SSO/Duo MFA provisioning, and mandatory security training modules.

### 4. Dashboard Search Transfer & Auto-Submit
- Prompts entered into the Dashboard Hero Search or selected via Quick Action Chips (*Apply Leave*, *Accident Leave Ticket*, *IT Support Ticket*, *Learning Programs*) auto-execute upon navigating to the **AI Assistant** tab.

### 5. AWS Cognito Authentication & Security
- Secure User Registration & Sign In with form validation (Name, Email, Phone, Gender, Designation, Password matching).
- Direct AWS SDK integration with AWS Cognito User Pool `us-east-1_1de2ju7LG`.

---

## 🏗️ System Architecture

```
[ Employee User / Browser ]
         │
         ▼
[ AWS CloudFront CDN (dzm9oii5lyk4d.cloudfront.net) ]
         │
         ▼
[ AWS S3 Web Hosting Bucket ]
         │
         ▼ (REST API HTTP / HTTPS)
[ AWS API Gateway (h135maoxfc.execute-api.us-east-1.amazonaws.com) ]
         │
 ┌───────┴──────────────────────────────────────────┐
 │               AWS Lambda Microservices           │
 ├───────────────────┬──────────────────────────────┤
 │ 1. Agent Service  │ 2. Task & Reminders Service  │
 │ 3. HR Service     │ 4. IT Support Service        │
 │ 5. Onboarding Svc │                              │
 └───────┬───────────┴──────────────┬───────────────┘
         │                          │
         ▼                          ▼
 [ Amazon Bedrock RAG ]    [ Amazon DynamoDB ]
 (Nova Micro / OpenSearch)  (8 Enterprise Tables)
```

---

## 📁 Repository Directory Structure

```
employee-ai-assistant/
├── backend/                        # Node.js Serverless Microservices & RAG Agent
│   ├── src/
│   │   ├── agent/                  # Agent Orchestrator & Planner Engine
│   │   │   ├── agent.js            # Main RAG & Workflow Orchestrator
│   │   │   ├── planner.js          # Intent Classification & Plan Generator
│   │   │   └── tools.js            # Tool Execution Layer (DynamoDB & RAG stubs)
│   │   ├── config/                 # Environment Configuration
│   │   │   └── environment.js      # AWS Credentials & Resource Identifiers
│   │   ├── handlers/               # API Gateway Event Handlers
│   │   │   ├── auth.js             # AWS Cognito Sign Up / Login Handlers
│   │   │   ├── chat.js             # POST /api/chat Endpoint
│   │   │   ├── conversations.js    # Chat History Handlers
│   │   │   ├── health.js           # API Health Checker
│   │   │   ├── reminders.js        # Reminders Endpoints
│   │   │   └── tasks.js            # Tasks Endpoints
│   │   ├── microservices/          # AWS Lambda Entry Points
│   │   └── services/               # AWS SDK Integrations
│   │       ├── bedrock.js          # Amazon Bedrock Converse API Client
│   │       ├── cognito.js          # AWS Cognito Authentication Service
│   │       ├── dynamodb.js         # Amazon DynamoDB Client & Helper Methods
│   │       ├── openSearch.js       # OpenSearch Vector Search Client
│   │       └── workflowService.js  # Business Logic & Record Provisioning
│   ├── tests/                      # Jest Test Suite (120 Tests across 9 Suites)
│   │   ├── agent.test.js
│   │   ├── bedrock.test.js
│   │   ├── chat.test.js
│   │   ├── maternity.test.js
│   │   ├── microservices.test.js
│   │   ├── onboarding.test.js
│   │   ├── planner.test.js
│   │   └── tools.test.js
│   ├── package.json
│   └── server.js                   # Local Express API Server
│
├── frontend/                       # React 18 + Vite Production Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── ActionCard.jsx      # Policy-to-Action Interactive Cards
│   │   │   ├── ChatMessage.jsx     # AI Chat Message Bubbles & Avatars
│   │   │   ├── Header.jsx          # Top Workspace Bar
│   │   │   ├── Icon.jsx            # SVG Icon System
│   │   │   ├── Sidebar.jsx         # Amazon Royal Navigation Bar
│   │   │   └── Toast.jsx           # Notification Toast Stack
│   │   ├── pages/                  # Top-Level Page Workspaces
│   │   │   ├── Assistant.jsx       # AI Assistant Conversational Chat Workspace
│   │   │   ├── Auth.jsx            # AWS Cognito Login & Sign Up Page
│   │   │   ├── Dashboard.jsx       # Overview Dashboard & Hero AI Search
│   │   │   ├── ITSupport.jsx       # IT Hardware & VPN Access Portal
│   │   │   ├── Learning.jsx        # Mandatory Compliance & Skill Center
│   │   │   ├── Policies.jsx        # Policy Explorer Workspace
│   │   │   ├── Settings.jsx        # Dynamic Logged-In User Profile
│   │   │   ├── Tasks.jsx           # Unified Priority Task Workspace
│   │   │   └── Transfers.jsx       # Resource & Employee Mobility Workspace
│   │   ├── services/
│   │   │   ├── api.js              # REST API Client Integration
│   │   │   └── cognitoAuth.js      # AWS Cognito SDK Wrapper
│   │   ├── App.jsx                 # Main Router & Authentication State
│   │   ├── index.css               # Amazon Enterprise Royal Color Tokens & Styles
│   │   └── main.jsx                # React DOM Mount Entry Point
│   ├── package.json
│   └── vite.config.js              # Vite Production Build Configuration
│
├── implementation_plan.md          # Architectural Design & Plan Artifact
├── walkthrough.md                  # Task Verification & Change Summaries
└── README.md                       # Master Documentation (This File)
```

---

## 🛠️ Local Development & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **AWS CLI**: Configured with appropriate AWS credentials (optional for backend API testing)

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd employee-ai-assistant/backend

# Install backend dependencies
npm install

# Start the local development server (runs Express on port 3001)
npm start
```

#### Running Backend Unit Tests (120 Test Cases)

```bash
# Run all backend unit test suites using Node ES modules
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd employee-ai-assistant/frontend

# Install frontend dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

---

### 3. Production Build & Deployment

To build and deploy updates directly to AWS S3 & CloudFront:

```bash
# Build Vite production assets in frontend/
cd employee-ai-assistant/frontend
npm run build

# Sync dist assets to AWS S3 bucket
aws s3 sync dist s3://employee-ai-assistant-frontend-8a30f804 --delete --region us-east-1

# Invalidate CloudFront CDN cache
aws cloudfront create-invalidation --distribution-id E2VZJ189FEZ821 --paths "/*" --region us-east-1
```

---

## 📡 API Gateway Endpoint Reference

| HTTP Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Main Agent entry point. Processes employee prompt, executes RAG/tools, and returns answer & workflow confirmation flags. |
| `POST` | `/api/auth/signup` | Registers account in AWS Cognito User Pool & DynamoDB. |
| `POST` | `/api/auth/login` | Authenticates via AWS Cognito & returns user session profile. |
| `GET` | `/api/tasks` | Retrieves employee task items from DynamoDB. |
| `POST` | `/api/tasks` | Toggles or creates task completion status. |
| `GET` | `/api/reminders` | Fetches proactive reminders for the logged-in employee. |
| `POST` | `/api/reminders` | Adds a new proactive reminder. |
| `GET` | `/api/hr/leave-balance` | Queries leave balance & maternity/accident eligibility. |
| `POST` | `/api/hr/leave-request` | Provisions formal leave request records in DynamoDB. |
| `GET` | `/api/it/assets` | Retrieves hardware and software assets assigned to employee. |
| `GET` | `/api/onboarding/status` | Fetches onboarding workflow status & task checklist. |

---

## 🔐 AWS Cognito Integration Details

The authentication module (`frontend/src/services/cognitoAuth.js`) communicates directly with AWS Cognito User Pool `us-east-1_1de2ju7LG` (Client ID: `25q7q6m53vghvsp878m7t290v8`):

- **User Sign Up**: Registers new employees with custom attributes (`email`, `given_name`, `family_name`, `phone_number`, `gender`, `designation`).
- **User Sign In**: Authenticates credentials, retrieves Cognito JWT ID tokens, and establishes session state.
- **Session Management**: Automatically restores logged-in user profile details across page refreshes.

---

## ⚖️ License & Acknowledgments

Built for the **Apex Enterprise Employee Digital Assistant Initiative**.  
Powered by **Amazon Web Services**, **Amazon Bedrock**, and **Google Antigravity**.
