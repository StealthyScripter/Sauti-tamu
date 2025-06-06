# Phone App Backend

A production-ready Node.js backend API for a phone calling application with voice/video calling, real-time communication, and contact management.

## ✨ Features

- 📞 **Voice & Video Calling** via Agora SDK
- 🔐 **Phone Authentication** with SMS verification
- 👥 **Contact Management** with search capabilities
- 🔌 **Real-time Notifications** via WebSocket
- 📊 **Call Analytics** and history tracking
- 🛡️ **Enterprise Security** with rate limiting
- 📱 **Multi-platform Support** for mobile and web

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone <repository-url>
cd phone-app-backend

# Start databases
docker-compose up -d

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Authentication**: JWT, Firebase Auth
- **Real-time**: Socket.IO, Agora SDK
- **Databases**: PostgreSQL, MongoDB, Redis, ClickHouse
- **Testing**: Jest, Supertest
- **DevOps**: Docker, Docker Compose

## 📡 API Overview

### Authentication
```bash
# Send verification code
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'

# Login with code
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15551234567",
    "verificationCode": "123456",
    "displayName": "John Doe"
  }'
```

### Call Management
```bash
# Initiate call
curl -X POST http://localhost:3000/api/calls/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toPhoneNumber": "+15551234568",
    "callType": "voice"
  }'

# Accept call
curl -X POST http://localhost:3000/api/calls/{callId}/accept \
  -H "Authorization: Bearer <token>"

# End call
curl -X POST http://localhost:3000/api/calls/{callId}/end \
  -H "Authorization: Bearer <token>" \
  -d '{"qualityScore": 5}'
```

### Contacts
```bash
# List contacts
curl -X GET http://localhost:3000/api/contacts \
  -H "Authorization: Bearer <token>"

# Add contact
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15551234568",
    "displayName": "Jane Smith"
  }'
```

## 🗂️ Project Structure

```
phone-app-backend/
├── src/
│   ├── app.js              # Main application
│   ├── config/             # Database configs
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utilities
├── tests/                  # Test files
├── scripts/                # Database migrations
├── docker-compose.yml      # Development environment
└── package.json
```

## ⚙️ Configuration

Create `.env` file with:

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key

# Databases
POSTGRES_HOST=localhost
POSTGRES_DB=phoneapp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
MONGODB_URI=mongodb://localhost:27017/phoneapp
REDIS_HOST=localhost

# External Services (Optional)
FIREBASE_PROJECT_ID=your-firebase-project
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-certificate
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm run test:auth
npm run test:calls
npm run test:contacts
```

## 📊 Architecture

### Multi-Database Design
- **PostgreSQL**: Core user data and call sessions
- **MongoDB**: Flexible documents (call metadata, contacts)
- **Redis**: Caching and session management
- **ClickHouse**: Analytics and call logs

### Key Services
- **AuthService**: Authentication and user management
- **CallingService**: Call lifecycle management
- **WebSocketService**: Real-time notifications
- **ProductionPhoneService**: SMS and Agora integration

## 🚀 Deployment

### Docker Production
```bash
# Build and deploy
docker build -t phone-app-backend .
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)
```env
NODE_ENV=production
JWT_SECRET=complex-production-secret

# Use managed database services
POSTGRES_HOST=your-rds-endpoint
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/phoneapp
REDIS_HOST=your-elasticache-endpoint

# Production external services
FIREBASE_PROJECT_ID=your-production-project
AGORA_APP_ID=your-production-agora-id
```

## 📋 Available Scripts

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm test             # Run tests
npm run migrate      # Run database migrations
npm run lint         # Check code style
npm run format       # Format code
```

## 🔍 Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed service health
curl http://localhost:3000/health/services
```

## 🛠️ Development

### Adding New Features
1. Create feature branch: `git checkout -b feature/feature-name`
2. Add tests for new functionality
3. Update API documentation
4. Submit pull request

### Code Style
- Use ESLint configuration
- Follow conventional commits
- Add JSDoc comments for public APIs
- Maintain test coverage >80%

## 🔒 Security

- Phone-based authentication (no passwords)
- JWT token management with Redis
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS and security headers

## 📖 Documentation

- **API Reference**: Complete endpoint documentation
- **Database Schema**: All table/collection structures  
- **Deployment Guide**: Production setup instructions
- **Development Guide**: Contributing and coding standards

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Check the documentation
- Contact the development team

---

**Built with ❤️ using Node.js and modern web technologies**