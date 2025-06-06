# Phone App Backend - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
7. [Database Schema](#database-schema)
8. [Services Documentation](#services-documentation)
9. [Real-time Communication](#real-time-communication)
10. [Testing](#testing)
11. [Development Guide](#development-guide)
12. [Deployment](#deployment)
13. [Monitoring & Health Checks](#monitoring--health-checks)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

## Project Overview

### Description
A production-ready Node.js backend API for a phone calling application that supports voice and video calls, contact management, and real-time communication. Built with modern technologies and designed for scalability.

### Key Features
- 📞 **Voice & Video Calling** via Agora SDK
- 🔐 **Phone-based Authentication** with SMS verification
- 👥 **Contact Management** with search capabilities
- 📊 **Call Analytics** and history tracking
- 🔌 **Real-time Notifications** via WebSocket
- 📱 **Multi-platform Support** with cross-platform compatibility
- 🛡️ **Enterprise Security** with rate limiting and validation
- 📈 **Scalable Architecture** with multi-database design

### Tech Stack
- **Backend**: Node.js 18+, Express.js 4.21.2
- **Authentication**: JWT, Firebase Auth
- **Real-time**: Socket.IO, Agora SDK
- **Databases**: PostgreSQL, MongoDB, Redis, ClickHouse
- **Testing**: Jest, Supertest
- **DevOps**: Docker, Docker Compose

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │  Admin Panel    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │      Load Balancer         │
                    └─────────────┬──────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │  App      │          │  App      │          │  App      │
    │ Instance 1│          │ Instance 2│          │ Instance N│
    └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
              ┌────────────────────┼────────────────────┐
              │                   │                    │
         ┌────▼────┐        ┌─────▼─────┐       ┌──────▼──────┐
         │ Redis   │        │PostgreSQL │       │  MongoDB    │
         │ Cache   │        │ Primary   │       │ Documents   │
         └─────────┘        └───────────┘       └─────────────┘
              │                   │                    │
         ┌────▼────┐               │             ┌──────▼──────┐
         │ Socket  │               │             │ ClickHouse  │
         │   I/O   │               │             │ Analytics   │
         └─────────┘               │             └─────────────┘
                                   │
                            ┌──────▼──────┐
                            │  External   │
                            │  Services   │
                            │             │
                            │ • Firebase  │
                            │ • Agora     │
                            │ • SMS       │
                            └─────────────┘
```

### Database Architecture

**Multi-Database Strategy**
- **PostgreSQL**: ACID-compliant core data (users, sessions, settings)
- **MongoDB**: Flexible documents (call metadata, contacts)
- **Redis**: High-speed caching and session management
- **ClickHouse**: Time-series analytics and call logs

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1-Minute Setup
```bash
# Clone repository
git clone <repository-url>
cd phone-app-backend

# Start databases
docker-compose up -d

# Install dependencies
npm install

# Run migrations
npm run migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## Installation & Setup

### Development Environment

#### 1. Clone and Install
```bash
git clone <repository-url>
cd phone-app-backend
npm install
```

#### 2. Environment Configuration
Create `.env` file:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here

# Database URLs
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=phoneapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

MONGODB_URI=mongodb://localhost:27017/phoneapp
REDIS_HOST=localhost
REDIS_PORT=6379
CLICKHOUSE_URL=http://localhost:8123

# External Services
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# Frontend
FRONTEND_URL=http://localhost:3000
```

#### 3. Database Setup
```bash
# Start databases with Docker
docker-compose up -d

# Wait for databases to be ready
sleep 30

# Run PostgreSQL migrations
npm run migrate

# Verify setup
curl http://localhost:3000/health
```

### Production Environment

#### Docker Deployment
```bash
# Build production image
docker build -t phone-app-backend .

# Deploy with compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Environment Variables (Production)
```env
NODE_ENV=production
JWT_SECRET=complex-production-secret-key

# Use managed database services
POSTGRES_HOST=your-rds-endpoint
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/phoneapp
REDIS_HOST=your-elasticache-endpoint
CLICKHOUSE_URL=https://your-clickhouse-cloud.com:8443

# Production services
FIREBASE_PROJECT_ID=your-production-project
AGORA_APP_ID=your-production-agora-id
```

## Configuration

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `POSTGRES_HOST` | **Yes** | localhost | PostgreSQL host |
| `POSTGRES_PORT` | No | 5432 | PostgreSQL port |
| `POSTGRES_DB` | **Yes** | phoneapp | Database name |
| `POSTGRES_USER` | **Yes** | postgres | Database user |
| `POSTGRES_PASSWORD` | **Yes** | - | Database password |
| `MONGODB_URI` | **Yes** | - | MongoDB connection string |
| `REDIS_HOST` | **Yes** | localhost | Redis host |
| `REDIS_PORT` | No | 6379 | Redis port |
| `CLICKHOUSE_URL` | No | - | ClickHouse URL (optional) |
| `FIREBASE_PROJECT_ID` | No | - | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | No | - | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | No | - | Firebase private key |
| `AGORA_APP_ID` | No | - | Agora app ID |
| `AGORA_APP_CERTIFICATE` | No | - | Agora app certificate |
| `FRONTEND_URL` | No | http://localhost:3000 | Frontend URL for CORS |

### Rate Limiting Configuration

```javascript
// Default rate limits
const authLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per window
};

const verificationLimiter = {
  windowMs: 60 * 1000, // 1 minute
  max: 1 // 1 code per minute
};

const callLimiter = {
  windowMs: 60 * 1000, // 1 minute
  max: 10 // 10 calls per minute
};
```

## API Documentation

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <jwt-token>
```

### Response Format
```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Response data
  "errors": [], // Validation errors (if any)
  "pagination": {} // For paginated responses
}
```

### Authentication Endpoints

#### Send Verification Code
```http
POST /api/auth/verify-phone
Content-Type: application/json

{
  "phoneNumber": "+15551234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "data": {
    "phoneNumber": "+15551234567",
    "expiresIn": 600
  }
}
```

#### Login with Verification Code
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+15551234567",
  "verificationCode": "123456",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "phoneNumber": "+15551234567",
      "displayName": "John Doe"
    },
    "token": "jwt-token-here"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### Call Management Endpoints

#### Initiate Call
```http
POST /api/calls/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "toPhoneNumber": "+15551234568",
  "callType": "voice", // or "video"
  "metadata": {
    "fromDisplayName": "John Doe",
    "connectionType": "wifi"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "callId": "call-uuid",
    "status": "initiated",
    "toPhoneNumber": "+15551234568",
    "callType": "voice",
    "agoraToken": "agora-token-for-caller"
  }
}
```

#### Accept Call
```http
POST /api/calls/{callId}/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "metadata": {
    "deviceInfo": {
      "platform": "iOS",
      "version": "15.0"
    }
  }
}
```

#### Reject Call
```http
POST /api/calls/{callId}/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "busy", // busy, declined, unavailable, blocked
  "metadata": {}
}
```

#### End Call
```http
POST /api/calls/{callId}/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "qualityScore": 5, // 1-5 rating
  "metadata": {}
}
```

#### Get Active Calls
```http
GET /api/calls/active
Authorization: Bearer <token>
```

#### Get Call History
```http
GET /api/calls/history?page=1&limit=20&callType=voice&status=ended
Authorization: Bearer <token>
```

#### Get Call Analytics
```http
GET /api/calls/analytics?period=7d
Authorization: Bearer <token>
```

### Contact Management Endpoints

#### List Contacts
```http
GET /api/contacts?page=1&limit=50&search=john
Authorization: Bearer <token>
```

#### Create Contact
```http
POST /api/contacts
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+15551234569",
  "displayName": "Jane Smith",
  "avatarUrl": "https://example.com/avatar.jpg",
  "tags": ["work", "important"]
}
```

#### Update Contact
```http
PUT /api/contacts/{contactId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Jane Smith Updated",
  "isFavorite": true
}
```

#### Delete Contact
```http
DELETE /api/contacts/{contactId}
Authorization: Bearer <token>
```

### Health Check Endpoints

#### Basic Health Check
```http
GET /health
```

#### Detailed Service Health
```http
GET /health/services
```

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "postgres": { "connected": true, "latency": 5 },
    "mongodb": { "connected": true, "latency": 3 },
    "redis": { "connected": true, "latency": 1 },
    "firebase": { "connected": true },
    "agora": { "configured": true },
    "websocket": { "connectedUsers": 42, "isActive": true },
    "callTimeout": { "activeTimeouts": 5 }
  },
  "statistics": {
    "activeVerifications": 3,
    "activeCallRooms": 2
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Database Schema

### PostgreSQL Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_active ON users(is_active, last_login_at DESC);
```

#### Verification Codes Table
```sql
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone_number);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);
```

#### Call Sessions Table
```sql
CREATE TABLE call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID UNIQUE NOT NULL,
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    to_phone_number VARCHAR(20) NOT NULL,
    call_type VARCHAR(10) CHECK (call_type IN ('voice', 'video')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('initiated', 'ringing', 'active', 'ended', 'failed', 'missed', 'rejected')) DEFAULT 'initiated',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    connection_type VARCHAR(20) DEFAULT 'unknown',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_call_sessions_from_user ON call_sessions(from_user_id, start_time DESC);
CREATE INDEX idx_call_sessions_to_user ON call_sessions(to_user_id, start_time DESC);
CREATE INDEX idx_call_sessions_status ON call_sessions(status, start_time DESC);
CREATE INDEX idx_call_sessions_call_id ON call_sessions(call_id);
```

#### User Settings Table
```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);
```

#### Analytics View
```sql
CREATE VIEW call_analytics AS
SELECT 
    u.id as user_id,
    u.display_name,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE cs.status = 'ended') as completed_calls,
    COUNT(*) FILTER (WHERE cs.status = 'missed') as missed_calls,
    COUNT(*) FILTER (WHERE cs.status = 'rejected') as rejected_calls,
    AVG(cs.duration_seconds) FILTER (WHERE cs.status = 'ended') as avg_call_duration,
    SUM(cs.duration_seconds) FILTER (WHERE cs.status = 'ended') as total_call_time,
    MAX(cs.start_time) as last_call_time
FROM users u
LEFT JOIN call_sessions cs ON u.id = cs.from_user_id
GROUP BY u.id, u.display_name;
```

### MongoDB Collections

#### Call Collection
```javascript
{
  callId: "uuid-string", // Unique identifier
  fromUserId: "user-uuid",
  toUserId: "user-uuid",
  toPhoneNumber: "+15551234567",
  callType: "voice" | "video",
  status: "initiated" | "ringing" | "active" | "ended" | "failed" | "missed" | "rejected",
  startTime: Date,
  endTime: Date,
  duration: Number, // seconds
  qualityScore: Number, // 1-5
  connectionType: "wifi" | "cellular" | "unknown",
  metadata: {
    deviceInfo: {
      caller: {
        platform: String,
        version: String,
        userAgent: String
      },
      callee: {
        platform: String,
        version: String,
        userAgent: String
      }
    },
    networkInfo: {
      callerIP: String,
      calleeIP: String,
      region: String
    },
    callSettings: {
      audioEnabled: Boolean,
      videoEnabled: Boolean,
      recordingEnabled: Boolean
    }
  },
  errorInfo: {
    errorCode: String,
    errorMessage: String,
    timestamp: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Contact Collection
```javascript
{
  userId: "user-uuid",
  phoneNumber: "+15551234567",
  displayName: "John Doe",
  avatarUrl: "https://example.com/avatar.jpg",
  isBlocked: Boolean,
  isFavorite: Boolean,
  tags: [String],
  metadata: {
    importSource: String,
    lastInteraction: Date,
    callCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### User Collection (Extended)
```javascript
{
  phoneNumber: "+15551234567",
  displayName: "John Doe",
  avatarUrl: "https://example.com/avatar.jpg",
  isActive: Boolean,
  lastLoginAt: Date,
  settings: {
    callSettings: {
      autoAcceptCalls: Boolean,
      allowVideoSalls: Boolean,
      blockUnknownCallers: Boolean
    },
    privacy: {
      showLastSeen: Boolean,
      showOnlineStatus: Boolean
    },
    notifications: {
      callNotifications: Boolean,
      messageNotifications: Boolean
    }
  },
  metadata: {
    registrationIP: String,
    deviceInfo: {
      platform: String,
      version: String,
      userAgent: String
    },
    timezone: String,
    locale: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Redis Data Structures

#### Active Calls Cache
```
Key: active_calls:{userId}
Type: String (JSON)
TTL: 30 seconds
Value: [Call objects]
```

#### Verification Codes
```
Key: verification:{phoneNumber}
Type: String (JSON)
TTL: 600 seconds (10 minutes)
Value: {
  code: "123456",
  attempts: 0,
  createdAt: timestamp
}
```

#### Call Rooms
```
Key: call_room:{callId}
Type: String (JSON)
TTL: 3600 seconds (1 hour)
Value: {
  callId: "uuid",
  channelName: "call_uuid",
  appId: "agora-app-id",
  callerUserId: "user-uuid",
  calleeUserId: "user-uuid",
  createdAt: "ISO-string",
  expiresAt: "ISO-string"
}
```

#### User Sessions
```
Key: token:{userId}
Type: String
TTL: 86400 seconds (24 hours)
Value: jwt-token-string
```

### ClickHouse Schema (Analytics)

#### Call Logs Table
```sql
CREATE TABLE call_logs (
    call_id String,
    from_user_id String,
    to_user_id String,
    to_phone_number String,
    call_type Enum8('voice' = 1, 'video' = 2),
    status Enum8('initiated' = 1, 'ringing' = 2, 'active' = 3, 'ended' = 4, 'failed' = 5, 'missed' = 6, 'rejected' = 7),
    start_time DateTime,
    end_time Nullable(DateTime),
    duration UInt32,
    quality_score UInt8,
    connection_type LowCardinality(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (from_user_id, start_time)
PARTITION BY toYYYYMM(start_time);
```

## Services Documentation

### AuthService

**Responsibilities:**
- User authentication and registration
- JWT token management
- Phone number normalization
- Password hashing (for future use)

**Key Methods:**
```javascript
// User management
async getUserByPhone(phoneNumber)
async getUserById(userId)
async createUser(phoneNumber, displayName)
async updateUserProfile(userId, updates)

// Token management
generateToken(userId)
async validateToken(token)
async refreshToken(oldToken)
async revokeToken(token)

// Utilities
normalizePhoneNumber(phoneNumber)
async hashPassword(password)
async verifyPassword(password, hash)
```

### CallingService

**Responsibilities:**
- Call lifecycle management
- Agora integration
- WebSocket notifications
- Active call caching

**Key Methods:**
```javascript
// Call management
async initiateCall(fromUserId, toPhoneNumber, callType, metadata)
async acceptCall(callId, userId, metadata)
async rejectCall(callId, userId, reason)
async endCall(callId, userId, qualityScore)

// Call queries
async getActiveCalls(userId)
async getCall(callId)

// Cache management
async cacheActiveCall(callId, call)
async removeActiveCall(callId)

// Background tasks
async handleMissedCalls()
async notifyCallStatusChange(userId, callId, status)
```

### ProductionPhoneService

**Responsibilities:**
- SMS verification via Firebase and fallback
- Agora token generation
- Call room management
- Service health monitoring

**Key Methods:**
```javascript
// Verification
async sendVerificationCode(phoneNumber)
async verifyCode(phoneNumber, providedCode)
async verifyFirebaseToken(idToken)

// Agora integration
generateAgoraToken(channelName, userId, role)
async createCallRoom(callId, callerUserId, calleeUserId)
async getCallRoom(callId)
async cleanupCallRoom(callId)

// Utilities
normalizePhoneNumber(phoneNumber)
async healthCheck()
async getStats()
```

### WebSocketService

**Responsibilities:**
- Real-time communication
- User presence management
- Call notifications

**Key Methods:**
```javascript
// Connection management
initialize(server)
isUserOnline(userId)
getOnlineUsersCount()

// Notifications
notifyIncomingCall(toUserId, callData)
notifyCallStatusChange(userId, callId, status, additionalData)
```

### CallTimeoutService

**Responsibilities:**
- Automatic call timeout handling
- Cleanup of stale calls
- Background maintenance

**Key Methods:**
```javascript
// Service lifecycle
start()
stop()

// Timeout management
setRingTimeout(callId)
clearTimeout(callId)

// Maintenance
async cleanupStaleCalls()
getStats()
```

### CallService (Analytics)

**Responsibilities:**
- Call logging to ClickHouse
- Call history queries
- Analytics and reporting

**Key Methods:**
```javascript
// Logging
async logCall(callData)
async updateCallStatus(callId, status, endTime, duration)

// Queries
async getCallHistory(userId, page, limit, filters)
async getCallAnalytics(userId, period)
```

### ContactService

**Responsibilities:**
- Contact CRUD operations
- Contact search
- Cache management

**Key Methods:**
```javascript
// CRUD operations
async createContact(userId, contactData)
async getUserContacts(userId, page, limit)
async updateContact(contactId, updateData)
async deleteContact(contactId)

// Search and utilities
async searchContacts(userId, query)
async updateContactCache(userId)
```

## Real-time Communication

### WebSocket Connection

#### Client Connection
```javascript
// Frontend connection example
import io from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt-token-here'
  }
});

// Listen for incoming calls
socket.on('incoming_call', (data) => {
  console.log('Incoming call:', data);
  // Show incoming call UI
  // data.callId, data.fromUserId, data.fromDisplayName, data.callType
});

// Listen for call status changes
socket.on('call_status_change', (data) => {
  console.log('Call status changed:', data);
  // Update UI based on data.status
});

// Handle user status changes
socket.on('user_status_change', (data) => {
  console.log('User status:', data);
  // Update contact status in UI
});
```

#### Server Events

**Outgoing Events:**
- `incoming_call` - Notify user of incoming call
- `call_status_change` - Notify call status updates
- `user_status_change` - Notify user online/offline status

**Incoming Events:**
- `user_online` - User sets status to online
- `disconnect` - User disconnects

### Agora Integration

#### Token Generation
```javascript
// Generate token for call participant
const tokenData = productionPhoneService.generateAgoraToken(
  channelName,  // "call_" + callId
  userId,       // Unique user identifier
  role         // "publisher" or "audience"
);

// Returns:
{
  success: true,
  token: "agora-rtc-token",
  appId: "agora-app-id",
  channelName: "call_uuid",
  userId: 12345,
  role: "publisher",
  expiresAt: "2024-01-01T13:00:00.000Z"
}
```

#### Call Room Management
```javascript
// Create call room for 2 participants
const room = await productionPhoneService.createCallRoom(
  callId,
  callerUserId,
  calleeUserId
);

// Room includes tokens for both participants
{
  success: true,
  callId: "call-uuid",
  channelName: "call_uuid",
  appId: "agora-app-id",
  callerToken: { token: "...", ... },
  calleeToken: { token: "...", ... },
  roomInfo: { ... }
}
```

### Call Flow Sequence

```
Caller                 Backend                Callee
  |                     |                     |
  |-- POST /initiate -->|                     |
  |                     |-- WebSocket ------->|
  |                     |   incoming_call     |
  |<-- 201 Created -----|                     |
  |    + Agora token    |                     |
  |                     |                     |
  |                     |<-- POST /accept ----|
  |<-- WebSocket -------|                     |
  |    call_accepted    |-- 200 OK ---------->|
  |                     |   + Agora token     |
  |                     |                     |
  |<------- Agora RTC Connection ----------->|
  |                     |                     |
  |-- POST /end ------->|                     |
  |<-- 200 OK ----------|-- WebSocket ------->|
  |                     |   call_ended        |
```

## Testing

### Test Structure
```
tests/
├── setup.js              # Test environment setup
├── auth.test.js          # Authentication tests
├── calls.test.js         # Call management tests
├── contacts.test.js      # Contact management tests
├── integration/          # Integration tests
│   ├── call-flow.test.js # End-to-end call flows
│   └── websocket.test.js # WebSocket tests
└── unit/                 # Unit tests
    ├── services/         # Service unit tests
    └── utils/            # Utility unit tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:auth

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Debug tests
npm run test:debug
```

### Test Environment Setup

The application includes comprehensive test configuration:

#### Demo Users
Demo users are configured in `.env.test`:
```env
DEMO_USER_1=+15551234567:John Doe
DEMO_USER_2=+15551234568:Jane Smith
DEMO_USER_3=+1234567890:Test User
```

#### Test Database
Tests use separate database instances to avoid conflicts:
```env
POSTGRES_DB=phoneapp_test
MONGODB_URI=mongodb://localhost:27017/phoneapp_test
```

### Example Test Cases

#### Authentication Test
```javascript
describe('Authentication', () => {
  test('should send verification code', async () => {
    const response = await request(app)
      .post('/api/auth/verify-phone')
      .send({ phoneNumber: '+15551234567' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.phoneNumber).toBe('+15551234567');
  });

  test('should login with valid code', async () => {
    // First get verification code
    await request(app)
      .post('/api/auth/verify-phone')
      .send({ phoneNumber: '+15551234567' });

    // Then login with code
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '+15551234567',
        verificationCode: '123456', // Mock service returns this
        displayName: 'Test User'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

#### Call Management Test
```javascript
describe('Call Management', () => {
  let authToken;
  
  beforeEach(async () => {
    // Login and get token
    const loginResponse = await loginTestUser();
    authToken = loginResponse.body.data.token;
  });

  test('should initiate call', async () => {
    const response = await request(app)
      .post('/api/calls/initiate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toPhoneNumber: '+15551234568',
        callType: 'voice'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.callId).toBeDefined();
    expect(response.body.data.agoraToken).toBeDefined();
  });
});
```

### Mock Services

The application includes mock services for testing:

#### MockPhoneVerificationService
- Simulates Redis-based verification
- Provides predictable test codes
- Supports demo users
- Includes proper timeout handling

```javascript
// Mock service always returns "123456" for demo users
const mockService = new MockPhoneVerificationService();
await mockService.sendVerificationCode('+15551234567');
// Logs: "📱 Verification code for +15551234567: 123456"
```

## Development Guide

### Project Structure
```
phone-app-backend/
├── src/
│   ├── app.js                 # Main application file
│   ├── config/                # Database and service configs
│   │   ├── database.js        # PostgreSQL config
│   │   ├── mongodb.js         # MongoDB config
│   │   └── redis.js          # Redis config
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Input validation
│   │   └── rateLimiting.js   # Rate limiting
│   ├── models/               # Database models
│   │   ├── User.js           # User model (MongoDB)
│   │   ├── Call.js           # Call model (MongoDB)
│   │   └── Contact.js        # Contact model (MongoDB)
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Authentication routes
│   │   ├── calls.js          # Call management routes
│   │   ├── contacts.js       # Contact routes
│   │   └── callsManagement.js # Call history/analytics
│   ├── services/             # Business logic services
│   │   ├── authService.js    # Authentication service
│   │   ├── callingService.js # Call management service
│   │   ├── contactService.js # Contact service
│   │   ├── callService.js    # Analytics service
│   │   ├── productionPhoneService.js # SMS & Agora
│   │   ├── websocketService.js # WebSocket service
│   │   └── callTimeoutService.js # Timeout handling
│   └── utils/                # Utility functions
│       ├── validators.js     # Custom validators
│       ├── errors.js         # Error classes
│       └── logger.js         # Logging utilities
├── tests/                    # Test files
├── scripts/                  # Utility scripts
│   ├── migrate.js           # Database migrations
│   ├── test-setup.js        # Test environment setup
│   └── test-teardown.js     # Test cleanup
├── docker-compose.yml        # Development databases
├── Dockerfile               # Container build
├── package.json             # Dependencies and scripts
└── README.md               # Project documentation
```

### Development Workflow

#### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development environment
npm run dev

# Make changes and test
npm test

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

#### 2. Code Quality

**Linting and Formatting:**
```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format code
npm run format
```

**Pre-commit Checklist:**
- [ ] Code passes linting
- [ ] All tests pass
- [ ] Code is formatted
- [ ] Environment variables documented
- [ ] API endpoints documented

#### 3. Adding New Features

**New API Endpoint:**
1. Add route handler in `src/routes/`
2. Add business logic in `src/services/`
3. Add validation middleware
4. Add tests in `tests/`
5. Update API documentation

**New Database Model:**
1. Create model in `src/models/`
2. Add migration script if needed
3. Update service layer
4. Add model tests
5. Update schema documentation

### Debugging

#### Application Debugging
```bash
# Debug mode with inspect
npm run dev -- --inspect

# Debug tests
npm run test:debug

# View logs
docker-compose logs -f app
```

#### Database Debugging
```bash
# PostgreSQL
docker exec -it phone-app-backend_postgres_1 psql -U postgres -d phoneapp

# MongoDB
docker exec -it phone-app-backend_mongodb_1 mongosh phoneapp

# Redis
docker exec -it phone-app-backend_redis_1 redis-cli

# ClickHouse
docker exec -it phone-app-backend_clickhouse_1 clickhouse-client
```

#### Common Debug Commands
```sql
-- PostgreSQL: Check active calls
SELECT * FROM call_sessions WHERE status IN ('initiated', 'ringing', 'active');

-- MongoDB: Find recent calls
db.calls.find().sort({startTime: -1}).limit(10);

-- Redis: Check active sessions
KEYS token:*
KEYS verification:*
KEYS call_room:*
```

### Adding External Services

#### SMS Provider Integration
1. Add configuration variables
2. Implement service in `productionPhoneService.js`
3. Add fallback mechanism
4. Update health checks
5. Add tests

#### Push Notification Service
1. Create new service file
2. Integrate with WebSocket service
3. Add device token management
4. Implement fallback logic
5. Add monitoring

### Performance Optimization

#### Database Optimization
- Use appropriate indexes
- Implement connection pooling
- Add query optimization
- Monitor slow queries

#### Caching Strategy
- Cache frequently accessed data
- Use Redis for session management
- Implement cache invalidation
- Monitor cache hit rates

#### API Optimization
- Implement request compression
- Add response caching headers
- Use pagination for large datasets
- Optimize database queries

## Deployment

### Production Deployment

#### Docker Deployment
```bash
# Build production image
docker build -t phone-app-backend:latest .

# Push to registry
docker tag phone-app-backend:latest your-registry/phone-app-backend:latest
docker push your-registry/phone-app-backend:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: your-registry/phone-app-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - POSTGRES_HOST=${POSTGRES_HOST}
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_HOST=${REDIS_HOST}
    depends_on:
      - postgres
      - redis
      - mongodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

#### Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phone-app-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: phone-app-backend
  template:
    metadata:
      labels:
        app: phone-app-backend
    spec:
      containers:
      - name: app
        image: your-registry/phone-app-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Cloud Deployment Options

#### AWS Deployment
- **ECS/Fargate**: Container orchestration
- **RDS**: PostgreSQL managed database
- **ElastiCache**: Redis managed service
- **DocumentDB**: MongoDB-compatible service
- **Application Load Balancer**: Load balancing
- **CloudWatch**: Monitoring and logging

#### Google Cloud Deployment
- **Cloud Run**: Serverless containers
- **Cloud SQL**: PostgreSQL managed database
- **Memorystore**: Redis managed service
- **MongoDB Atlas**: MongoDB cloud service
- **Cloud Load Balancing**: Load balancing
- **Cloud Monitoring**: Monitoring and logging

#### Azure Deployment
- **Container Instances**: Container hosting
- **Azure Database**: PostgreSQL managed service
- **Azure Cache**: Redis managed service
- **Cosmos DB**: MongoDB-compatible service
- **Application Gateway**: Load balancing
- **Azure Monitor**: Monitoring and logging

### Environment-Specific Configuration

#### Production Environment Variables
```env
# Server
NODE_ENV=production
PORT=3000
JWT_SECRET=complex-production-secret-min-32-chars

# Databases (use managed services)
POSTGRES_HOST=your-rds-endpoint.region.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=phoneapp
POSTGRES_USER=phoneapp_user
POSTGRES_PASSWORD=secure-database-password

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/phoneapp
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# External Services
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

AGORA_APP_ID=your-production-agora-id
AGORA_APP_CERTIFICATE=your-production-agora-certificate

# URLs
FRONTEND_URL=https://your-app.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

#### Staging Environment
```env
NODE_ENV=staging
JWT_SECRET=staging-secret-key

# Use staging databases
POSTGRES_HOST=staging-db.company.com
MONGODB_URI=mongodb://staging-mongo.company.com/phoneapp_staging
REDIS_HOST=staging-redis.company.com

# Use staging external services
FIREBASE_PROJECT_ID=your-staging-project
AGORA_APP_ID=your-staging-agora-id

FRONTEND_URL=https://staging.your-app.com
```

### SSL/TLS Configuration

#### Nginx SSL Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-api.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-api.com;
    return 301 https://$server_name$request_uri;
}
```

### Database Migrations in Production

#### Migration Strategy
```bash
# 1. Backup databases
pg_dump phoneapp > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
NODE_ENV=production npm run migrate

# 3. Verify migration
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"

# 4. Start application
docker-compose up -d app
```

#### Zero-Downtime Deployment
1. **Blue-Green Deployment**: Maintain two identical environments
2. **Rolling Updates**: Gradually replace instances
3. **Database Migrations**: Backward-compatible changes first
4. **Health Checks**: Ensure new version is healthy before switching

### Monitoring Setup

#### Application Monitoring
```javascript
// Integrate monitoring services
import * as Sentry from '@sentry/node';
import newrelic from 'newrelic';

// Initialize error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Add custom metrics
app.use((req, res, next) => {
  newrelic.addCustomAttribute('userId', req.user?.userId);
  next();
});
```

#### Health Check Configuration
```javascript
// Enhanced health check for production
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {}
  };

  // Check database connections
  try {
    await pool.query('SELECT 1');
    health.checks.postgres = 'healthy';
  } catch (error) {
    health.checks.postgres = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Check external services
  const serviceHealth = await productionPhoneService.healthCheck();
  health.checks = { ...health.checks, ...serviceHealth.services };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## Monitoring & Health Checks

### Health Check Endpoints

#### Basic Health Check
```http
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

#### Detailed Service Health
```http
GET /health/services

Response:
{
  "status": "healthy",
  "services": {
    "postgres": { "connected": true, "latency": 5 },
    "mongodb": { "connected": true, "latency": 3 },
    "redis": { "connected": true, "latency": 1 },
    "firebase": { "connected": true },
    "agora": { "configured": true },
    "websocket": { "connectedUsers": 42, "isActive": true },
    "callTimeout": { "activeTimeouts": 5 }
  },
  "statistics": {
    "activeVerifications": 3,
    "activeCallRooms": 2
  },
  "warnings": ["Firebase not configured - using fallback SMS"],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Monitoring Metrics

#### Application Metrics
- **Response Time**: API endpoint response times
- **Throughput**: Requests per second
- **Error Rate**: Failed request percentage
- **Uptime**: Service availability percentage

#### Business Metrics
- **Active Users**: Currently online users
- **Call Volume**: Calls per hour/day
- **Call Success Rate**: Percentage of successful calls
- **Average Call Duration**: Mean call length
- **Verification Success Rate**: SMS verification success

#### Infrastructure Metrics
- **CPU Usage**: Application CPU consumption
- **Memory Usage**: RAM utilization
- **Database Connections**: Active DB connections
- **Cache Hit Rate**: Redis cache efficiency

### Logging Configuration

#### Winston Logger Setup
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'phone-app-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### Structured Logging
```javascript
// Log call events
logger.info('Call initiated', {
  callId: 'uuid',
  fromUserId: 'user-uuid',
  toPhoneNumber: '+15551234567',
  callType: 'voice',
  timestamp: new Date().toISOString()
});

// Log authentication events
logger.info('User authenticated', {
  userId: 'user-uuid',
  phoneNumber: '+15551234567',
  method: 'sms-verification',
  timestamp: new Date().toISOString()
});

// Log errors with context
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  database: 'postgres',
  timestamp: new Date().toISOString()
});
```

### Alerting Rules

#### Critical Alerts
- **Service Down**: Health check fails for > 2 minutes
- **Database Disconnection**: Database unreachable for > 1 minute
- **High Error Rate**: Error rate > 5% for > 5 minutes
- **Memory Usage**: Memory usage > 90% for > 5 minutes

#### Warning Alerts
- **High Response Time**: Average response time > 1s for > 10 minutes
- **Low Cache Hit Rate**: Redis hit rate < 80% for > 15 minutes
- **Failed Calls**: Call failure rate > 10% for > 10 minutes
- **SMS Failures**: SMS verification failure rate > 15%

### Performance Monitoring

#### Database Monitoring
```sql
-- PostgreSQL slow query monitoring
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Connection monitoring
SELECT count(*) as connections,
       usename,
       state
FROM pg_stat_activity
GROUP BY usename, state;
```

#### Redis Monitoring
```bash
# Redis performance metrics
redis-cli info stats
redis-cli info memory
redis-cli slowlog get 10
```

#### Application Performance
```javascript
// Response time middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: PostgreSQL connection refused
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Check if PostgreSQL is running: `docker-compose ps`
2. Verify connection string in `.env`
3. Check network connectivity: `telnet localhost 5432`
4. Review PostgreSQL logs: `docker-compose logs postgres`

**Problem**: MongoDB connection timeout
```bash
Error: MongoNetworkTimeoutError
```

**Solutions:**
1. Check MongoDB status: `docker-compose ps mongodb`
2. Verify MongoDB URI format
3. Check MongoDB logs: `docker-compose logs mongodb`
4. Ensure MongoDB is accepting connections

#### Authentication Issues

**Problem**: JWT token validation fails
```bash
Error: JsonWebTokenError: invalid signature
```

**Solutions:**
1. Verify `JWT_SECRET` environment variable
2. Check token expiration
3. Ensure consistent secret across instances
4. Review token generation logic

**Problem**: SMS verification not working
```bash
Error: Failed to send verification code
```

**Solutions:**
1. Check Firebase configuration
2. Verify phone number format
3. Check rate limiting settings
4. Review SMS service logs
5. Test with demo users

#### Call Management Issues

**Problem**: Agora token generation fails
```bash
Error: Failed to generate calling token
```

**Solutions:**
1. Verify Agora App ID and Certificate
2. Check token expiration settings
3. Ensure user ID is numeric
4. Review Agora service status

**Problem**: WebSocket connections fail
```bash
Error: Authentication failed
```

**Solutions:**
1. Check JWT token in WebSocket auth
2. Verify CORS configuration
3. Check firewall settings for WebSocket
4. Review Socket.IO client configuration

#### Performance Issues

**Problem**: High API response times
**Diagnosis:**
```bash
# Check database performance
docker exec -it postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker exec -it redis redis-cli info stats

# Monitor Node.js process
npm install -g clinic
clinic doctor -- node src/app.js
```

**Solutions:**
1. Add database indexes
2. Implement query optimization
3. Increase cache usage
4. Scale horizontally

### Debug Commands

#### Application Debugging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Check application logs
docker-compose logs -f app

# Monitor real-time metrics
npm install -g pm2
pm2 monit

# Memory leak detection
node --inspect src/app.js
```

#### Database Debugging
```bash
# PostgreSQL debugging
docker exec -it postgres psql -U postgres -d phoneapp

-- Check active connections
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE state = 'active';

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# MongoDB debugging
docker exec -it mongodb mongosh phoneapp

// Check collection stats
db.stats()
db.calls.find().limit(5).pretty()

// Check indexes
db.calls.getIndexes()

# Redis debugging
docker exec -it redis redis-cli

> INFO memory
> KEYS *
> TTL verification:+15551234567
```

#### Network Debugging
```bash
# Check port availability
netstat -tlnp | grep :3000

# Test API endpoints
curl -v http://localhost:3000/health

# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:3000 -H "Authorization: Bearer <token>"

# Monitor network traffic
sudo tcpdump -i any port 3000
```

### Log Analysis

#### Error Patterns
```bash
# Find authentication errors
grep "Authentication failed" logs/error.log

# Find database errors
grep "Database error" logs/combined.log

# Find high-frequency errors
grep "Error:" logs/error.log | sort | uniq -c | sort -nr

# Monitor real-time logs
tail -f logs/combined.log | grep ERROR
```

#### Performance Analysis
```bash
# Find slow requests
grep "duration" logs/combined.log | awk '$8 > 1000' | sort -nr -k8

# Monitor call patterns
grep "Call initiated" logs/combined.log | wc -l

# Check error rates
grep "statusCode.*[45][0-9][0-9]" logs/combined.log | wc -l
```

### Recovery Procedures

#### Service Recovery
```bash
# Restart specific service
docker-compose restart app

# Restart all services
docker-compose down && docker-compose up -d

# Force rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Database Recovery
```bash
# PostgreSQL backup and restore
pg_dump -h localhost -U postgres phoneapp > backup.sql
psql -h localhost -U postgres -d phoneapp_new < backup.sql

# MongoDB backup and restore
mongodump --uri="mongodb://localhost:27017/phoneapp"
mongorestore --uri="mongodb://localhost:27017/phoneapp_new" dump/phoneapp/

# Redis backup
redis-cli --rdb backup.rdb
redis-cli --pipe < backup.rdb
```

#### Configuration Reset
```bash
# Reset to default configuration
cp .env.example .env

# Clear all caches
docker exec -it redis redis-cli FLUSHALL

# Reset database (WARNING: Destructive)
docker-compose down -v
docker-compose up -d
npm run migrate
```

## Contributing

### Development Setup

#### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)

#### Getting Started
```bash
# Fork and clone repository
git clone https://github.com/yourusername/phone-app-backend.git
cd phone-app-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development environment
docker-compose up -d
npm run migrate
npm run dev
```

### Code Standards

#### ESLint Configuration
```javascript
// .eslintrc.json
{
  "env": {
    "es2022": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
    "no-unused-vars": ["error", { "args": "none" }]
  }
}
```

#### Coding Conventions
- Use ES6+ features and modules
- Prefer `async/await` over Promises
- Use descriptive variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use consistent error handling patterns

#### File Naming
- Use camelCase for JavaScript files
- Use kebab-case for routes and utilities
- Use PascalCase for models and classes
- Use lowercase for configuration files

### Git Workflow

#### Branch Naming
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `refactor/component-name` - Code refactoring
- `docs/update-readme` - Documentation updates

#### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add user presence tracking
fix: resolve call timeout race condition
docs: update API documentation
test: add integration tests for calls
refactor: optimize database queries
style: fix linting issues
perf: improve call connection speed
ci: update deployment pipeline
```

#### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation if needed
4. Ensure all tests pass
5. Submit pull request with description
6. Address review feedback
7. Squash and merge when approved

### Testing Guidelines

#### Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('when condition exists', () => {
    test('should behave correctly', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

#### Test Requirements
- Unit tests for all service methods
- Integration tests for API endpoints
- Mock external dependencies
- Test error conditions
- Maintain >80% code coverage

### API Design Guidelines

#### RESTful Conventions
- Use nouns for resource names
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Use consistent URL patterns
- Implement proper status codes
- Support pagination for collections

#### Request/Response Format
```javascript
// Request validation
const schema = {
  phoneNumber: {
    type: 'string',
    pattern: /^\+?[1-9]\d{6,14}$/,
    required: true
  },
  displayName: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
    optional: true
  }
};

// Response format
{
  success: boolean,
  message: string,
  data: object,
  errors: array,
  pagination: object
}
```

#### Error Handling
```javascript
// Standard error response
class APIError extends Error {
  constructor(message, statusCode = 500, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// Usage
throw new APIError('User not found', 404, 'USER_NOT_FOUND');
```

### Database Guidelines

#### Migration Best Practices
- Always backup before migrations
- Write reversible migrations
- Test migrations on staging first
- Use transactions for atomic changes
- Document schema changes

#### Model Design
- Use appropriate data types
- Add proper indexes
- Implement soft deletes where needed
- Use foreign key constraints
- Document model relationships

### Security Guidelines

#### Authentication
- Use strong JWT secrets (32+ characters)
- Implement token rotation
- Add rate limiting to auth endpoints
- Validate all input parameters
- Log security events

#### Data Protection
- Hash sensitive data
- Use HTTPS in production
- Implement proper CORS
- Sanitize database queries
- Validate file uploads

### Documentation Standards

#### Code Documentation
```javascript
/**
 * Initiates a new phone call between users
 * @param {string} fromUserId - ID of the calling user
 * @param {string} toPhoneNumber - Phone number to call
 * @param {string} callType - Type of call ('voice' or 'video')
 * @param {object} metadata - Additional call metadata
 * @returns {Promise<object>} Call initiation result
 * @throws {APIError} When user has active call or validation fails
 */
async function initiateCall(fromUserId, toPhoneNumber, callType, metadata) {
  // Implementation...
}
```

#### API Documentation
- Document all endpoints
- Include request/response examples
- Specify required parameters
- Document error codes
- Provide cURL examples

### Release Process

#### Version Management
Follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

#### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number incremented
- [ ] Changelog updated
- [ ] Security audit completed
- [ ] Performance tested
- [ ] Database migrations verified
- [ ] Deployment scripts tested

#### Deployment Process
1. Create release branch
2. Update version and changelog
3. Deploy to staging
4. Run integration tests
5. Deploy to production
6. Monitor for issues
7. Tag release in Git

---

**Additional Resources:**
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MongoDB Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Redis Documentation](https://redis.io/documentation)
- [Agora SDK Documentation](https://docs.agora.io/en/)
- [Socket.IO Documentation](https://socket.io/docs/)

For questions or support, please open an issue on GitHub or contact the development team.