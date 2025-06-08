# 📱 Phone App - Manual Setup Guide

## Prerequisites

- **Docker & Docker Compose** (for databases)
- **Node.js 18+** and **npm**
- **Expo CLI** (`npm install -g @expo/cli`)

## Backend Setup

### 1. Start Database Services
```bash
cd phone-app-backend
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Create `.env` file in `phone-app-backend/` with the configuration provided above.

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Start Backend Server
```bash
npm run dev
```

**✅ Backend should be running on: http://localhost:3000**

## Frontend Setup

### 1. Install Dependencies
```bash
# In the root directory (where your React Native app is)
npm install
```

### 2. Add API Configuration
Create `api-config.js` in your app root with the configuration provided above.

### 3. Start Frontend Development Server
```bash
npx expo start --clear
```

### 4. Test on Device/Emulator
- **iOS**: Use iOS Simulator or scan QR code with Camera app
- **Android**: Use Android Emulator or scan QR code with Expo Go
- **Web**: Press `w` to open in web browser

## Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-12-09T...",
  "uptime": 123.456
}
```

### 2. Check Database Connections
```bash
curl http://localhost:3000/health/services
```

### 3. Test Authentication API
```bash
# Send verification code
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'

# Login with code (use code from backend logs)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15551234567",
    "verificationCode": "123456",
    "displayName": "Test User"
  }'
```

## Troubleshooting

### Backend Issues

**Database Connection Errors:**
```bash
# Check if containers are running
docker ps

# Restart databases
docker-compose down && docker-compose up -d

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

**Port 3000 Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Frontend Issues

**Metro Bundler Issues:**
```bash
npx expo start --clear
# or
npm start -- --reset-cache
```

**Network Connection Issues (Android Emulator):**
- Backend URL should be `http://10.0.2.2:3000` for Android emulator
- Backend URL should be `http://localhost:3000` for iOS simulator

**Expo Go Scanning Issues:**
- Make sure both devices are on the same network
- Try running with tunnel: `npx expo start --tunnel`

### API Connection Issues

**CORS Errors:**
- Backend has CORS configured for `http://localhost:3000`
- If frontend runs on different port, update `FRONTEND_URL` in backend `.env`

**Network Request Failed:**
- Check if backend is running: `curl http://localhost:3000/health`
- Verify API_CONFIG.BASE_URL in frontend matches backend URL
- For physical device testing, use your computer's IP address instead of localhost

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:3000 | Main API server |
| PostgreSQL | localhost:5432 | User data, call sessions |
| MongoDB | localhost:27017 | Call metadata, contacts |
| Redis | localhost:6379 | Caching, sessions |
| ClickHouse | localhost:8123 | Analytics, call logs |
| Frontend Dev | http://localhost:19006 | Expo dev server |

## Demo Users

The backend includes demo users for testing:
- `+15551234567` (John Doe)
- `+15551234568` (Jane Smith)  
- `+1234567890` (Test User)

Verification codes are logged in the backend console during development.

## Next Steps

1. **Test Core Features:**
   - Phone verification and login
   - Contact management
   - Call initiation (mock without Agora)

2. **Add External Services (Optional):**
   - Configure Firebase for SMS and push notifications
   - Configure Agora for real voice/video calling
   - Configure AWS for call recordings

3. **Deploy to Production:**
   - Update environment variables for production
   - Deploy backend to cloud provider
   - Build and distribute mobile app

## Support

If you encounter issues:
1. Check backend logs: `docker-compose logs -f`
2. Check frontend Metro logs in terminal
3. Verify all services are running: `docker ps`
4. Test API endpoints with curl/Postman