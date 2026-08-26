# Design Document: BrandSetu

## Overview

BrandSetu is an AI-powered Brand Bridge Platform built on modern, high-performance infrastructure. The system leverages Gemini 2.0 (multimodal reasoning), Llama 3.3 (text generation), and Flux.1 (image synthesis) for content creation, LangGraph for autonomous agent orchestration, Groq LPU Engine for <300ms inference speed, Supabase PostgreSQL with pgvector for RAG-powered brand memory, and Vercel for global edge hosting.

The architecture follows a modern agentic pattern with clear separation between the client tier (Next.js frontend), application orchestration tier (FastAPI + LangGraph), cognitive processing tier (multimodal AI models), data & memory tier (PostgreSQL + pgvector RAG), and distribution tier (Unified Social APIs). This design ensures real-time performance, enterprise-grade security, and cost-efficiency while serving Indian startups.

### Key Design Principles

1. **Brand-Aware AI Engine**: Persistent brand memory using Knowledge Graph and RAG
2. **Real-Time Performance**: <300ms latency using Groq LPU inference
3. **Autonomous Workflows**: LangGraph-powered multi-agent orchestration
4. **Enterprise Security**: Bank-level encryption with private brand data storage
5. **Cost-Conscious**: 90% cost reduction vs agencies (₹25,000/mo vs ₹4-12L/mo)
6. **Startup-First UX**: One voice, every platform - set brand once, generate everywhere

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT TIER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js Web App (Hosted on Vercel)                      │  │
│  │  - Responsive UI (Tailwind CSS)                           │  │
│  │  - Brand Profile Setup                                     │  │
│  │  - Content Generation Interface                            │  │
│  │  - 7-Day Smart Scheduler                                   │  │
│  │  - Analytics Dashboard                                     │  │
│  │  - Global Edge Hosting                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            APPLICATION ORCHESTRATION TIER                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI Gateway (Python Server)                          │  │
│  │  - Request Routing                                         │  │
│  │  - Authentication & Authorization                          │  │
│  │  - Rate Limiting                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LangGraph Autonomous Agent Orchestrator                  │  │
│  │  - Multi-Agent Workflow Management                         │  │
│  │  - Stateful Orchestration                                  │  │
│  │  - Brand Context Injection                                 │  │
│  │  - Content Generation Pipeline                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Inference Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  COGNITIVE PROCESSING TIER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Gemini 2.0 │  │  Llama 3.3   │  │   Flux.1     │         │
│  │  Multimodal  │  │     Text     │  │    Image     │         │
│  │  Reasoning   │  │  Generation  │  │  Synthesis   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Groq LPU Engine (<300ms Inference Speed)                │  │
│  │  - High-Velocity Text Inference                           │  │
│  │  - Real-Time Content Generation                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA & MEMORY TIER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Supabase PostgreSQL (Auth & App Data)                   │  │
│  │  - User Authentication                                     │  │
│  │  - Brand Profiles                                          │  │
│  │  - Content History                                         │  │
│  │  - Analytics Data                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  pgvector (RAG Brand Memory)                              │  │
│  │  - Brand Knowledge Graph                                   │  │
│  │  - Vector Search for Brand Context                         │  │
│  │  - Grounding AI in Brand DNA                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTION TIER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Unified Social API Gateway                               │  │
│  │  - LinkedIn API                                            │  │
│  │  - X (Twitter) API                                         │  │
│  │  - Instagram Graph API                                     │  │
│  │  - One-Click Multi-Channel Publishing                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Content Generation Flow:**
1. User submits content generation request via Next.js frontend
2. FastAPI Gateway validates request and routes to LangGraph orchestrator
3. LangGraph retrieves Brand Profile and Brand Knowledge Graph from Supabase + pgvector
4. LangGraph constructs brand-aware prompt with RAG context
5. Groq LPU Engine executes inference using Gemini 2.0 or Llama 3.3 (<300ms)
6. Platform-specific formatting applied based on target (LinkedIn/Twitter/Instagram/Email)
7. Generated content stored in Supabase with metadata
8. Response returned to frontend with one-click copy and publish options

**Brand Profile Creation Flow:**
1. User submits brand details (vision, tone, audience, values) via frontend
2. FastAPI Gateway forwards to Brand Profile Handler
3. Brand Knowledge Graph extracts key attributes and relationships
4. pgvector stores brand embeddings for RAG retrieval
5. Brand Profile saved in Supabase PostgreSQL with row-level security

## Technology Stack

### Frontend Experience
- **Next.js**: App router for responsive, high-performance UI
- **Tailwind CSS**: Utility-first styling for rapid development
- **Vercel**: Global edge hosting with automatic deployments

### Agentic Core (Backend)
- **FastAPI**: Python server for managing autonomous workflows
- **LangGraph**: Stateful orchestration of multi-agent systems

### Cognitive Layer (AI Models)
- **Gemini 2.0**: Multimodal reasoning (text + vision)
- **Llama 3.3**: High-velocity text generation
- **Flux.1**: Generative media synthesis for images

### Data & Memory (RAG)
- **Supabase**: PostgreSQL database for auth and app data
- **pgvector**: Vector search for brand context grounding

### Inference Speed
- **Groq**: LPU Engine providing <300ms latency for real-time feel

### Distribution Gateway
- **Unified Social APIs**: One-click multi-channel publishing to LinkedIn, Instagram, Twitter

## Cost Structure

### Monthly Production Burn Rate: ₹25,000

**Intelligence Core (₹13,000 - 52%)**
- Direct value: 100+ autonomous posts & multi-agent reasoning
- Replaces: ₹40,000/mo social media intern
- ROI: 3x cost savings

**Infrastructure (₹9,000 - 36%)**
- Backend + Database + Scheduler: ₹4,000 (16%)
- Database Storage: ₹3,000 (12%)
- Scheduler Automation: ₹2,000 (8%)
- Supports: 10+ concurrent users with zero downtime

**Security & Access (₹3,000 - 12%)**
- Auth + Frontend: ₹2,000 (8%)
- Security Measures: ₹1,000 (4%)
- Enterprise-grade data protection out of the box

**Hackathon Cost: ₹0** (Free tier: Vercel/Supabase/Groq)
**Scale-Up Cost: ₹25,000** (Serving 50+ B2B clients)

### Value Proposition
- **Traditional Agency**: ₹4-12L/month
- **BrandSetu**: ₹25,000/month
- **Cost Reduction**: 90%
- **Time-to-Market**: 10x faster

## Components and Interfaces

### Frontend Components (Next.js + Tailwind CSS)

#### 1. Authentication Module
- **Responsibility**: Handle user sign-up, login, and session management
- **Technology**: Supabase Auth
- **Key Functions**:
  - `signUp(email, password)`: Create new user account
  - `signIn(email, password)`: Authenticate existing user
  - `signOut()`: End user session
  - `getCurrentUser()`: Retrieve authenticated user details

#### 2. Dashboard Component
- **Responsibility**: Main navigation hub and activity summary
- **Key Functions**:
  - Display quick access to all features
  - Show weekly content generation statistics
  - Provide navigation to content generation, scheduler, analytics

#### 3. Brand Profile Setup
- **Responsibility**: One-time brand identity configuration
- **Key Functions**:
  - `submitBrandProfile(profileData)`: Send brand details to backend
  - `updateBrandProfile(profileData)`: Modify existing brand profile
  - Form validation for required fields
  - Tone selector (professional, casual, friendly, etc.)

#### 4. Content Generator Interface
- **Responsibility**: Primary content generation interface
- **Key Functions**:
  - Platform selector (Instagram, LinkedIn, Twitter/X, WhatsApp, Email)
  - Language selector (Hindi, Marathi, Tamil, Hinglish, English)
  - `generateContent(platform, language, prompt)`: Request content generation
  - Display generated content with copy-to-clipboard functionality
  - Regenerate option for alternative content

#### 5. Weekly Scheduler Component
- **Responsibility**: Display and manage weekly content plans
- **Key Functions**:
  - `generateWeeklyPlan(platforms)`: Request 7-day content schedule
  - Display calendar view with suggested posting times
  - Show platform distribution across the week

#### 6. Campaign Suggester Component
- **Responsibility**: Display festival campaigns and generate campaign content
- **Key Functions**:
  - Display upcoming festivals (next 30 days)
  - `getCampaignIdeas(festival, industry)`: Request campaign suggestions
  - Generate festival-specific content

#### 7. Content History Viewer
- **Responsibility**: Display and manage previously generated content
- **Key Functions**:
  - `fetchContentHistory(userId, limit)`: Retrieve user's content history
  - Display content with metadata (date, platform, language)
  - Copy-to-clipboard functionality
  - Filter by platform and language

### Backend Components (Lambda Functions)

#### 1. Auth Handler
- **Responsibility**: Handle authentication operations
- **Endpoints**:
  - `POST /auth/signup`: Create new user
  - `POST /auth/login`: Authenticate user
  - `POST /auth/logout`: End session
- **Integration**: AWS Cognito User Pools

#### 2. Brand Profile Handler
- **Responsibility**: Manage brand profile CRUD operations
- **Endpoints**:
  - `POST /brand-profile`: Create brand profile
  - `GET /brand-profile/{userId}`: Retrieve brand profile
  - `PUT /brand-profile/{userId}`: Update brand profile
- **Key Functions**:
  - `validateBrandProfile(data)`: Ensure required fields present
  - `analyzeTone(visionText, tonePreference)`: Use Comprehend to extract tone characteristics
  - `storeBrandProfile(userId, profileData)`: Persist to DynamoDB

#### 3. Content Generator
- **Responsibility**: Core AI content generation logic
- **Endpoints**:
  - `POST /content/generate`: Generate single marketing post
- **Key Functions**:
  - `buildPrompt(brandProfile, platform, language, userInput)`: Construct AI prompt with brand context
  - `callBedrock(prompt, parameters)`: Invoke Amazon Bedrock API
  - `translateContent(content, targetLanguage)`: Use Amazon Translate for regional languages
  - `verifyTone(content, expectedTone)`: Use Amazon Comprehend to validate tone alignment
  - `formatForPlatform(content, platform)`: Apply platform-specific formatting
  - `addCTA(content, platform)`: Append appropriate call-to-action
  - `suggestHashtags(content, platform)`: Generate relevant hashtags
  - `saveToHistory(userId, content, metadata)`: Store generated content

**Prompt Engineering Strategy:**
```
System Context:
You are BrandSaarthi AI, a digital marketing assistant for Indian businesses.

Brand Context:
Business: {businessName}
Industry: {industry}
Vision: {vision}
Target Audience: {targetAudience}
Brand Tone: {tone}

Task:
Generate a {platform} post in {language} that:
- Reflects the brand's {tone} tone
- Speaks to {targetAudience}
- Aligns with the vision: {vision}
- Includes a clear call-to-action
- {platform-specific requirements}

User Input: {userPrompt}
```

#### 4. Scheduler Handler
- **Responsibility**: Generate weekly content plans
- **Endpoints**:
  - `POST /schedule/weekly`: Generate 7-day content plan
- **Key Functions**:
  - `generateWeeklyPlan(userId, platforms)`: Create balanced weekly schedule
  - `determineOptimalTimes(platform)`: Suggest best posting times per platform
  - `distributeContent(platforms, days)`: Balance content across platforms and days
  - `generateMultipleContent(brandProfile, schedule)`: Batch generate content for week

**Scheduling Logic:**
- Instagram: 2-3 posts per week (optimal times: 11 AM, 7 PM IST)
- LinkedIn: 1-2 posts per week (optimal times: 9 AM, 12 PM IST)
- Twitter/X: 3-4 posts per week (optimal times: 10 AM, 3 PM, 8 PM IST)
- WhatsApp Business: 1-2 broadcasts per week (optimal times: 10 AM, 6 PM IST)
- Email: 1 campaign per week (optimal time: Tuesday 10 AM IST)

#### 5. Campaign Suggester
- **Responsibility**: Provide festival and event-based campaign ideas
- **Endpoints**:
  - `GET /campaigns/upcoming`: List upcoming festivals
  - `POST /campaigns/generate`: Generate campaign ideas for specific festival
- **Key Functions**:
  - `getUpcomingFestivals(region, days)`: Retrieve festivals in next N days
  - `generateCampaignIdeas(festival, industry, brandProfile)`: Create campaign concepts
  - `generateCampaignContent(campaignIdea, platform, language)`: Produce campaign posts

**Festival Database:**
```json
{
  "festivals": [
    {
      "name": "Diwali",
      "date": "2024-11-01",
      "regions": ["all"],
      "themes": ["celebration", "prosperity", "new beginnings", "gifts"]
    },
    {
      "name": "Pongal",
      "date": "2024-01-15",
      "regions": ["Tamil Nadu", "South India"],
      "themes": ["harvest", "gratitude", "tradition"]
    }
    // ... more festivals
  ]
}
```

#### 6. History Handler
- **Responsibility**: Manage content history retrieval
- **Endpoints**:
  - `GET /history/{userId}`: Retrieve user's content history
  - `GET /history/{userId}/{contentId}`: Retrieve specific content
- **Key Functions**:
  - `fetchHistory(userId, limit, lastKey)`: Paginated history retrieval
  - `filterHistory(userId, platform, language)`: Filter content by criteria

### AI Services Integration

#### Amazon Bedrock Integration
- **Model**: Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)
- **Configuration**:
  - Temperature: 0.7 (balance creativity and consistency)
  - Max Tokens: 1000 (sufficient for longest platform - LinkedIn)
  - Top P: 0.9
- **Error Handling**: Retry with exponential backoff (3 attempts)
- **Cost Optimization**: Cache brand profile context to reduce token usage

#### Amazon Translate Integration
- **Supported Languages**:
  - English (en)
  - Hindi (hi)
  - Marathi (mr)
  - Tamil (ta)
- **Hinglish Handling**: Generate in English with Bedrock, then apply custom Hinglish transformation
- **Error Handling**: Fallback to English if translation fails

#### Amazon Comprehend Integration
- **Use Cases**:
  - Sentiment analysis for tone verification
  - Entity extraction for brand profile analysis
  - Language detection for input validation
- **Configuration**: Real-time API calls (not batch processing for MVP)

## Data Models

### Users Table (DynamoDB)
```json
{
  "TableName": "BrandSaarthi_Users",
  "PartitionKey": "userId (String)",
  "Attributes": {
    "userId": "String (UUID)",
    "email": "String",
    "createdAt": "Number (Unix timestamp)",
    "lastLogin": "Number (Unix timestamp)",
    "subscriptionTier": "String (free|pro|enterprise)"
  },
  "GSI": [
    {
      "IndexName": "EmailIndex",
      "PartitionKey": "email"
    }
  ]
}
```

### BrandProfiles Table (DynamoDB)
```json
{
  "TableName": "BrandSaarthi_BrandProfiles",
  "PartitionKey": "userId (String)",
  "Attributes": {
    "userId": "String (UUID)",
    "businessName": "String",
    "industry": "String",
    "vision": "String",
    "targetAudience": "String",
    "tone": "String (professional|casual|friendly|authoritative|playful|inspirational)",
    "preferredLanguages": "List<String>",
    "createdAt": "Number (Unix timestamp)",
    "updatedAt": "Number (Unix timestamp)",
    "brandVoiceModel": {
      "toneCharacteristics": "Map<String, Number>",
      "keyPhrases": "List<String>",
      "sentimentScore": "Number"
    }
  }
}
```

### ContentHistory Table (DynamoDB)
```json
{
  "TableName": "BrandSaarthi_ContentHistory",
  "PartitionKey": "userId (String)",
  "SortKey": "contentId (String)",
  "Attributes": {
    "userId": "String (UUID)",
    "contentId": "String (UUID)",
    "platform": "String (instagram|linkedin|twitter|whatsapp|email)",
    "language": "String (en|hi|mr|ta|hinglish)",
    "content": "String",
    "hashtags": "List<String>",
    "cta": "String",
    "generatedAt": "Number (Unix timestamp)",
    "userPrompt": "String (optional)"
  },
  "GSI": [
    {
      "IndexName": "UserPlatformIndex",
      "PartitionKey": "userId",
      "SortKey": "platform"
    }
  ],
  "TTL": "expiresAt (90 days from generatedAt)"
}
```

### Campaigns Table (DynamoDB)
```json
{
  "TableName": "BrandSaarthi_Campaigns",
  "PartitionKey": "festivalId (String)",
  "Attributes": {
    "festivalId": "String",
    "festivalName": "String",
    "date": "String (ISO 8601)",
    "regions": "List<String>",
    "themes": "List<String>",
    "campaignTemplates": "List<Map>"
  }
}
```

### Data Access Patterns

1. **Get User Brand Profile**: Query BrandProfiles table with userId
2. **Get User Content History**: Query ContentHistory table with userId, sort by generatedAt descending
3. **Filter Content by Platform**: Query ContentHistory GSI (UserPlatformIndex) with userId and platform
4. **Get Upcoming Festivals**: Scan Campaigns table, filter by date >= today
5. **Store Generated Content**: PutItem to ContentHistory with TTL set to 90 days


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Authentication and Authorization Properties

**Property 1: Valid Credential Authentication**
*For any* valid email and password combination, when a user attempts to sign up or log in, the system should successfully authenticate the user and grant access within the specified time limit (3 seconds for signup, 2 seconds for login).
**Validates: Requirements 1.2, 1.4**

**Property 2: Invalid Credential Rejection**
*For any* invalid credential combination (empty email, weak password, incorrect password, non-existent user), the system should reject the authentication attempt and return a specific error message without granting access.
**Validates: Requirements 1.3, 1.5**

**Property 3: Session Token Persistence**
*For any* authenticated user, the system should maintain a valid session token that allows access to protected resources until the user logs out or the token expires.
**Validates: Requirements 1.6**

**Property 4: Data Access Isolation**
*For any* authenticated user, when requesting Brand_Profiles or Content_History, the system should return only data associated with that user's ID and reject attempts to access other users' data.
**Validates: Requirements 10.3, 10.4**

### Brand Profile Properties

**Property 5: Brand Profile Validation**
*For any* brand profile submission with missing required fields (businessName, industry, vision, targetAudience, or tone), the system should reject the submission and indicate which specific fields are required.
**Validates: Requirements 2.3**

**Property 6: Brand Voice Model Generation**
*For any* valid brand profile, when saved or updated, the system should generate or regenerate a Brand_Voice_Model within 5 seconds that includes tone characteristics, key phrases, and sentiment scores.
**Validates: Requirements 2.4, 2.5**

**Property 7: Data Persistence Round-Trip**
*For any* valid data object (Brand_Profile, Marketing_Post, or weekly schedule), when stored in the system, retrieving the data by its identifier should return an equivalent object with all original fields preserved.
**Validates: Requirements 2.2, 5.4, 7.1**

### Content Generation Properties

**Property 8: Platform-Specific Content Generation**
*For any* platform selection (Instagram, LinkedIn, Twitter/X, WhatsApp Business, Email) and brand profile, the system should generate a Marketing_Post within 10 seconds that includes platform-appropriate formatting and at least one CTA.
**Validates: Requirements 3.1, 3.9**

**Property 9: Brand Tone Consistency**
*For any* brand profile with a specified tone and generated content, the sentiment analysis of the generated content should align with the expected tone characteristics (within acceptable variance thresholds).
**Validates: Requirements 3.2**

**Property 10: Language Output Matching**
*For any* language selection (Hindi, Marathi, Tamil, Hinglish, English) and content generation request, the system should produce content in the specified language, verifiable through language detection.
**Validates: Requirements 3.3**

**Property 11: Instagram Format Constraints**
*For any* content generated for Instagram, the output should satisfy: length ≤ 2200 characters, contains at least one emoji, and includes hashtag recommendations.
**Validates: Requirements 3.4**

**Property 12: LinkedIn Format Constraints**
*For any* content generated for LinkedIn, the output should satisfy: length ≤ 3000 characters, professional tone (sentiment analysis), and includes industry-relevant hashtags.
**Validates: Requirements 3.5**

**Property 13: Twitter Format Constraints**
*For any* content generated for Twitter/X, the output should satisfy: length ≤ 280 characters and includes relevant hashtags.
**Validates: Requirements 3.6**

**Property 14: WhatsApp Format Requirements**
*For any* content generated for WhatsApp Business, the output should be concise (≤ 500 characters recommended) and include a clear CTA.
**Validates: Requirements 3.7**

**Property 15: Email Format Requirements**
*For any* content generated for Email campaigns, the output should include three distinct components: subject line, body text, and CTA.
**Validates: Requirements 3.8**

### Multilingual Properties

**Property 16: Translation Tone Preservation**
*For any* content translated from English to a regional language (Hindi, Marathi, Tamil), the sentiment score of the translated content should be within 15% of the original content's sentiment score.
**Validates: Requirements 4.3**

**Property 17: Translation Fallback**
*For any* content generation request where translation fails (service error, unsupported language), the system should return English content and include a notification about the fallback.
**Validates: Requirements 4.5**

### Scheduling Properties

**Property 18: Weekly Schedule Completeness**
*For any* weekly content plan request, the system should generate exactly 7 days of content with at least 5 Marketing_Posts distributed across the selected platforms.
**Validates: Requirements 5.1, 5.5**

**Property 19: Platform Distribution Balance**
*For any* weekly content plan with multiple platforms selected, no single platform should contain more than 60% of the total posts (ensuring balanced distribution).
**Validates: Requirements 5.2**

**Property 20: Optimal Time Suggestions**
*For any* weekly content plan, the suggested posting times for each platform should fall within the defined optimal ranges (e.g., Instagram: 11 AM or 7 PM IST ± 2 hours).
**Validates: Requirements 5.3**

### Campaign Properties

**Property 21: Festival Date Filtering**
*For any* request for upcoming festivals, all returned festivals should have dates within the next 30 days from the current date.
**Validates: Requirements 6.1**

**Property 22: Campaign Idea Generation**
*For any* festival selection and brand profile, the system should generate at least 3 distinct campaign ideas relevant to the specified industry.
**Validates: Requirements 6.2**

### Content History Properties

**Property 23: History Sort Order**
*For any* user's Content_History retrieval, the returned Marketing_Posts should be ordered by generatedAt timestamp in descending order (most recent first).
**Validates: Requirements 7.2**

**Property 24: History Metadata Completeness**
*For any* Marketing_Post in Content_History, the returned data should include all required fields: platform, language, generatedAt, content preview, and contentId.
**Validates: Requirements 7.3**

**Property 25: Content Retention Period**
*For any* Marketing_Post created less than 90 days ago, the content should be retrievable from Content_History; content older than 90 days may be expired (TTL).
**Validates: Requirements 7.6**

### Dashboard Properties

**Property 26: Activity Summary Accuracy**
*For any* user dashboard view, the displayed count of "posts generated this week" should equal the actual number of entries in Content_History with generatedAt timestamps within the current week.
**Validates: Requirements 8.3**

**Property 27: Responsive Layout**
*For any* screen width between 320px and 1920px, the dashboard should render without horizontal scrolling and maintain functional navigation elements.
**Validates: Requirements 8.4**

### Performance Properties

**Property 28: Content Generation Response Time**
*For any* content generation request under normal load, the system should return a response within 10 seconds (measured from request initiation to response receipt).
**Validates: Requirements 9.1**

**Property 29: Efficient Data Storage**
*For any* data stored in DynamoDB (Users, BrandProfiles, ContentHistory), the partition key should be userId to ensure efficient query performance.
**Validates: Requirements 9.4**

**Property 30: Cache Performance**
*For any* Brand_Voice_Model accessed multiple times within a 5-minute window, the second and subsequent accesses should be faster than the first access (cache hit).
**Validates: Requirements 9.5**

### Security Properties

**Property 31: Password Hashing**
*For any* user credential stored in the system, the password field should be hashed (not plaintext), verifiable by checking that the stored value differs from the input and has characteristics of a hash (fixed length, alphanumeric).
**Validates: Requirements 10.1**

**Property 32: Rate Limiting**
*For any* user making more than 100 requests per minute to any endpoint, the system should throttle subsequent requests and return a 429 (Too Many Requests) status code.
**Validates: Requirements 10.5**

### Cost Optimization Properties

**Property 33: Request Batching**
*For any* set of multiple content generation requests submitted within a 2-second window for the same user, the system should batch the AI API calls to reduce total API invocations.
**Validates: Requirements 11.2**

**Property 34: Content Caching**
*For any* content generation request with identical parameters (same brand profile, platform, language, and user prompt) within a 1-hour window, the system should return cached content rather than making a new AI API call.
**Validates: Requirements 11.3**

**Property 35: Service Usage Logging**
*For any* AWS service invocation (Bedrock, Translate, Comprehend, DynamoDB), the system should log the service name, operation, timestamp, and user ID for cost monitoring.
**Validates: Requirements 11.5**

### Error Handling Properties

**Property 36: Comprehensive Error Logging**
*For any* error occurring in the system (AI service errors, database failures, validation errors), the system should log the error with timestamp, error type, error message, user ID, and stack trace.
**Validates: Requirements 3.10, 12.1, 12.5**

**Property 37: Retry with Exponential Backoff**
*For any* transient failure (network timeout, database throttling), the system should retry the operation up to 3 times with exponentially increasing delays (1s, 2s, 4s) before returning an error to the user.
**Validates: Requirements 12.2, 12.4**

**Property 38: User-Friendly Error Messages**
*For any* error returned to the user, the error message should be user-friendly (no technical jargon or stack traces) and include actionable guidance when possible.
**Validates: Requirements 12.3**

## Error Handling

### Error Categories

1. **Validation Errors** (4xx)
   - Invalid input data (missing fields, wrong format)
   - Authentication failures
   - Authorization failures
   - Response: Immediate rejection with specific error message

2. **Service Errors** (5xx)
   - AI service failures (Bedrock, Translate, Comprehend)
   - Database failures (DynamoDB)
   - Network timeouts
   - Response: Retry with exponential backoff, then user-friendly error

3. **Rate Limiting Errors** (429)
   - Excessive requests from single user
   - Response: Throttle with retry-after header

### Error Handling Strategy

**Validation Errors:**
```typescript
function validateBrandProfile(profile: BrandProfile): ValidationResult {
  const errors: string[] = [];
  
  if (!profile.businessName) errors.push("Business name is required");
  if (!profile.industry) errors.push("Industry is required");
  if (!profile.vision) errors.push("Vision is required");
  if (!profile.targetAudience) errors.push("Target audience is required");
  if (!profile.tone) errors.push("Brand tone is required");
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true };
}
```

**Service Errors with Retry:**
```typescript
async function callBedrockWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await bedrock.invokeModel({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        body: JSON.stringify({ prompt, max_tokens: 1000 })
      });
      
      return response.content;
    } catch (error) {
      lastError = error;
      
      // Log error
      logger.error("Bedrock API error", {
        attempt: attempt + 1,
        error: error.message,
        timestamp: Date.now()
      });
      
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  // All retries failed
  throw new ServiceError(
    "Unable to generate content. Please try again.",
    lastError
  );
}
```

**User-Friendly Error Mapping:**
```typescript
const ERROR_MESSAGES = {
  BEDROCK_TIMEOUT: "Content generation is taking longer than expected. Please try again.",
  BEDROCK_THROTTLE: "We're experiencing high demand. Please wait a moment and try again.",
  TRANSLATE_ERROR: "Translation service unavailable. Showing content in English.",
  DYNAMODB_ERROR: "Unable to save your data. Please check your connection and try again.",
  VALIDATION_ERROR: "Please check your input and fill in all required fields.",
  AUTH_ERROR: "Invalid credentials. Please check your email and password.",
  RATE_LIMIT: "You've made too many requests. Please wait a minute and try again."
};
```

### Graceful Degradation

1. **Translation Failure**: Fall back to English content
2. **Comprehend Failure**: Skip tone verification, proceed with generation
3. **Cache Failure**: Proceed with direct API calls
4. **History Storage Failure**: Return generated content to user, log storage error

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and integration points
- **Property-Based Tests**: Verify universal properties across randomized inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide input space.

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/TypeScript**: fast-check
- **Python**: Hypothesis

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: brandsaarthi-ai, Property {N}: {property_text}`
- Each correctness property implemented as a single property-based test

**Example Property Test (TypeScript with fast-check):**
```typescript
import fc from 'fast-check';

// Feature: brandsaarthi-ai, Property 7: Data Persistence Round-Trip
describe('Brand Profile Persistence', () => {
  it('should preserve all fields in round-trip storage and retrieval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          businessName: fc.string({ minLength: 1, maxLength: 100 }),
          industry: fc.constantFrom('retail', 'food', 'tech', 'healthcare'),
          vision: fc.string({ minLength: 10, maxLength: 500 }),
          targetAudience: fc.string({ minLength: 5, maxLength: 200 }),
          tone: fc.constantFrom('professional', 'casual', 'friendly', 'authoritative')
        }),
        async (brandProfile) => {
          const userId = generateTestUserId();
          
          // Store brand profile
          await storeBrandProfile(userId, brandProfile);
          
          // Retrieve brand profile
          const retrieved = await getBrandProfile(userId);
          
          // Verify all fields preserved
          expect(retrieved.businessName).toBe(brandProfile.businessName);
          expect(retrieved.industry).toBe(brandProfile.industry);
          expect(retrieved.vision).toBe(brandProfile.vision);
          expect(retrieved.targetAudience).toBe(brandProfile.targetAudience);
          expect(retrieved.tone).toBe(brandProfile.tone);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

1. **Authentication Edge Cases**
   - Empty email/password
   - Malformed email addresses
   - SQL injection attempts in credentials
   - Session expiration handling

2. **Platform-Specific Formatting**
   - Twitter 280-character boundary
   - Instagram emoji rendering
   - Email subject line truncation
   - WhatsApp message formatting

3. **Error Conditions**
   - AI service timeouts
   - Database connection failures
   - Invalid API responses
   - Rate limit enforcement

4. **Integration Points**
   - API Gateway → Lambda integration
   - Lambda → DynamoDB integration
   - Lambda → Bedrock integration
   - Frontend → API Gateway integration

### Test Coverage Goals

- **Unit Test Coverage**: 80% code coverage minimum
- **Property Test Coverage**: All 38 correctness properties implemented
- **Integration Test Coverage**: All API endpoints tested
- **E2E Test Coverage**: Critical user flows (signup → profile → generate → view history)

### Testing Infrastructure

**Local Development:**
- DynamoDB Local for database testing
- AWS SAM for Lambda local testing
- Mock services for Bedrock/Translate/Comprehend

**CI/CD Pipeline:**
- Run unit tests on every commit
- Run property tests on every PR
- Run integration tests before deployment
- Run E2E tests in staging environment

### Performance Testing

While not part of unit/property tests, performance testing should verify:
- Content generation < 10 seconds (normal load)
- API response times < 2 seconds (excluding AI generation)
- Database query times < 100ms
- Cache hit rates > 70% for Brand_Voice_Models

## Scalability Considerations

### Horizontal Scaling

**Serverless Auto-Scaling:**
- Lambda functions scale automatically based on concurrent requests
- API Gateway handles up to 10,000 requests per second per region
- DynamoDB on-demand mode scales automatically

**Scaling Limits:**
- Lambda concurrent executions: 1,000 (default), can request increase to 10,000+
- DynamoDB throughput: Unlimited with on-demand mode
- Bedrock API: 100 requests per minute (default), can request increase

### Data Partitioning Strategy

**DynamoDB Partition Key Design:**
- Users table: `userId` as partition key (even distribution)
- BrandProfiles table: `userId` as partition key (1:1 relationship)
- ContentHistory table: `userId` as partition key, `contentId` as sort key
  - Enables efficient queries for user's history
  - GSI on `userId` + `platform` for filtered queries

**Hot Partition Prevention:**
- User IDs are UUIDs (random distribution)
- No celebrity/power user concentration expected
- Content generation is user-specific (no shared resources)

### Caching Strategy

**Multi-Level Caching:**

1. **API Gateway Cache** (optional for MVP, recommended for scale)
   - Cache GET requests for festival data (TTL: 24 hours)
   - Cache GET requests for user dashboard (TTL: 5 minutes)

2. **Lambda Memory Cache**
   - Cache Brand_Voice_Models in Lambda memory (TTL: 5 minutes)
   - Cache festival database in Lambda memory (TTL: 24 hours)
   - Reduces DynamoDB read costs

3. **Content Cache**
   - Cache identical content generation requests (TTL: 1 hour)
   - Key: hash(userId + platform + language + prompt)
   - Reduces Bedrock API costs significantly

**Cache Invalidation:**
- Brand profile updates invalidate Brand_Voice_Model cache
- Content generation always checks cache before API call
- Festival data refreshed daily

### Cost Projections

**Per-User Monthly Cost (Estimated):**
- DynamoDB: $0.05 (assuming 100 reads, 50 writes per month)
- Lambda: $0.10 (assuming 200 invocations per month)
- Bedrock: $0.50 (assuming 50 content generations per month)
- Translate: $0.15 (assuming 30 translations per month)
- Comprehend: $0.05 (assuming 20 sentiment analyses per month)
- **Total: ~$0.85 per active user per month**

**At Scale (1 Million Active Users):**
- Monthly infrastructure cost: ~$850,000
- With caching (50% reduction): ~$425,000
- Revenue target: $2-5 per user per month (freemium model)

### Future Scalability Enhancements

**For Bharat-Scale (100M+ users):**

1. **Multi-Region Deployment**
   - Deploy in Mumbai (ap-south-1) and additional regions
   - Use Route 53 for geo-routing
   - Replicate DynamoDB tables globally

2. **CDN for Static Assets**
   - CloudFront for frontend assets
   - Reduce latency for tier-2/tier-3 cities

3. **Advanced Caching**
   - ElastiCache (Redis) for distributed caching
   - Cache common content patterns across users

4. **Batch Processing**
   - SQS + Lambda for weekly schedule generation
   - Reduce real-time API costs

5. **Cost Optimization**
   - Reserved capacity for predictable workloads
   - Spot instances for batch processing
   - Bedrock model optimization (smaller models for simple tasks)

## Security Considerations

### Authentication & Authorization

**AWS Cognito Integration:**
- User pools for authentication
- JWT tokens for API authorization
- Token expiration: 1 hour (access token), 30 days (refresh token)
- MFA support (optional for MVP, recommended for production)

**API Gateway Authorization:**
```yaml
securitySchemes:
  CognitoAuthorizer:
    type: apiKey
    name: Authorization
    in: header
    x-amazon-apigateway-authtype: cognito_user_pools
```

### Data Encryption

**At Rest:**
- DynamoDB encryption enabled (AWS managed keys)
- S3 encryption for any stored assets (AWS managed keys)

**In Transit:**
- HTTPS/TLS 1.2+ for all API communication
- Certificate management via AWS Certificate Manager

### IAM Policies

**Lambda Execution Role (Least Privilege):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/BrandSaarthi_*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "translate:TranslateText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectDominantLanguage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Input Validation & Sanitization

**API Gateway Request Validation:**
- JSON schema validation for all POST/PUT requests
- Maximum request size: 1 MB
- Rate limiting: 100 requests per minute per user

**Lambda Input Sanitization:**
- Sanitize all user inputs before database storage
- Prevent NoSQL injection in DynamoDB queries
- Validate email format, password strength
- Escape special characters in AI prompts

### Rate Limiting & DDoS Protection

**API Gateway Throttling:**
- Per-user limit: 100 requests per minute
- Burst limit: 200 requests
- Global limit: 10,000 requests per second

**AWS WAF (Recommended for Production):**
- Block common attack patterns
- Geo-blocking if needed
- IP reputation lists

### Monitoring & Alerting

**CloudWatch Alarms:**
- Lambda error rate > 5%
- API Gateway 5xx errors > 1%
- DynamoDB throttling events
- Bedrock API failures
- Unusual cost spikes

**Security Monitoring:**
- Failed authentication attempts (> 10 per user per hour)
- Unusual API access patterns
- Data access anomalies

### Compliance Considerations

**Data Privacy:**
- GDPR compliance for EU users (if applicable)
- Data retention policies (90 days for content history)
- User data deletion on account closure
- Privacy policy and terms of service

**Content Moderation:**
- AI-generated content review (future enhancement)
- User reporting mechanism
- Content filtering for inappropriate requests

## Deployment Architecture

### Infrastructure as Code

**AWS SAM Template Structure:**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # API Gateway
  BrandSaarthiAPI:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn
  
  # Lambda Functions
  ContentGeneratorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: content-generator.handler
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 1024
      Environment:
        Variables:
          BRAND_PROFILES_TABLE: !Ref BrandProfilesTable
          CONTENT_HISTORY_TABLE: !Ref ContentHistoryTable
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref BrandProfilesTable
        - DynamoDBCrudPolicy:
            TableName: !Ref ContentHistoryTable
        - Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: '*'
  
  # DynamoDB Tables
  BrandProfilesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: BrandSaarthi_BrandProfiles
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
```

### CI/CD Pipeline

**GitHub Actions Workflow:**
1. **Build Stage**: Install dependencies, compile TypeScript
2. **Test Stage**: Run unit tests, property tests
3. **Package Stage**: Package Lambda functions, create SAM artifacts
4. **Deploy Stage**: Deploy to AWS using SAM CLI
5. **Smoke Test Stage**: Run basic health checks

### Environment Strategy

- **Development**: Local development with SAM Local + DynamoDB Local
- **Staging**: Full AWS deployment for integration testing
- **Production**: Multi-AZ deployment with monitoring

### Rollback Strategy

- CloudFormation stack rollback on deployment failure
- Lambda versioning and aliases for blue-green deployments
- Database backups with point-in-time recovery

## Future Enhancements (Post-MVP)

1. **Auto-Posting Integration**: Direct posting to social media platforms
2. **Analytics Dashboard**: Track post performance, engagement metrics
3. **Competitor Analysis**: AI-powered competitor content analysis
4. **SEO Optimization**: SEO scoring and suggestions for content
5. **Ad Budget Optimization**: AI recommendations for ad spend
6. **Team Collaboration**: Multi-user accounts for agencies
7. **Content Calendar**: Visual calendar with drag-and-drop scheduling
8. **A/B Testing**: Test multiple content variations
9. **Image Generation**: AI-generated images for posts (Stable Diffusion)
10. **Voice Input**: Voice-to-text for content prompts (regional languages)
