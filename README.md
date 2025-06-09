# 📞 SmartConnect AI - Calling App

An intelligent, AI-powered calling application with cost-optimized routing, built with React Native (Expo) frontend and Node.js backend.

## 🎯 **What This App Does**

- 📱 **Smart Dialing**: Phone-based authentication with AI route optimization
- 👥 **Contact Management**: Add, edit, and organize contacts with real-time sync
- 📞 **Intelligent Calling**: AI-powered route selection for cost savings (up to 70%)
- 📊 **Call Analytics**: Track call history, duration, and savings
- 🔐 **Secure Auth**: Phone verification with SMS codes (no passwords)
- 💰 **Cost Tracking**: Real-time savings display and monthly reports

## 🏗️ **Architecture**

```
SmartConnect AI/
├── phone-app-backend/          # Node.js API Server
│   ├── src/                    # Express.js routes and services
│   ├── scripts/                # Database utilities
│   └── docker-compose.yml      # Database services
├── phone-app-frontend/         # React Native (Expo) App
│   ├── app/                    # Expo Router screens
│   ├── components/             # Reusable UI components
│   └── services/               # API client
└── scripts/                    # Project management utilities
```

## 🛠️ **Tech Stack**

### **Backend**
- **Runtime**: Node.js 18+ with Express.js
- **Databases**: PostgreSQL, MongoDB, Redis, ClickHouse
- **Authentication**: JWT with phone verification
- **Real-time**: Socket.IO for live updates
- **Voice/Video**: Agora SDK integration
- **Containerization**: Docker & Docker Compose

### **Frontend** 
- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router v5
- **State**: React Context + AsyncStorage
- **Styling**: Custom mobile-first responsive design
- **Development**: TypeScript + ESLint

## 📋 **Prerequisites**

Make sure you have these installed:

- **Node.js 18+**: [Download here](https://nodejs.org/)
- **npm 8+**: Comes with Node.js
- **Docker & Docker Compose**: [Get Docker](https://docs.docker.com/get-docker/)
- **Git**: For cloning the repository

### **For Mobile Development**
- **iOS**: Xcode (Mac only) or iOS Simulator
- **Android**: Android Studio or Android Emulator
- **Physical Device**: Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

## 🚀 **Quick Start (Recommended)**

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd CallingApp

# Install all dependencies
npm install

# One-time setup (databases + migrations)
npm run setup
```

### **2. Start Development Environment**
```bash
# Start both backend and frontend
npm run dev
```

This single command will:
- ✅ Start PostgreSQL, Redis, MongoDB, ClickHouse
- ✅ Launch the backend API server
- ✅ Start the Expo development server
- ✅ Open QR code for mobile testing

### **3. Test the App**

#### **On Mobile Device**
1. Install **Expo Go** app on your phone
2. Scan the QR code from terminal
3. Use test phone number: `+15551234567`
4. Use verification code: `123456`

#### **On Computer**
- Press `w` in terminal to open web version
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 📖 **Manual Setup (Step by Step)**

If you prefer to understand each step:

### **Step 1: Install Dependencies**
```bash
# Root level dependencies
npm install

# Backend dependencies
cd phone-app-backend
npm install

# Frontend dependencies  
cd ../phone-app-frontend
npm install
cd ..
```

### **Step 2: Start Database Services**
```bash
# Start all databases with Docker
npm run db:start

# Wait for databases to be ready (30-60 seconds)
# Check status: docker ps
```

### **Step 3: Setup Database**
```bash
# Run database migrations
npm run db:migrate

# Optional: Add test data
cd phone-app-backend
node scripts/add-test-contacts.js
cd ..
```

### **Step 4: Start Backend**
```bash
# In one terminal - start backend
npm run backend:dev

# Backend will be available at http://localhost:3000
# Wait for "✅ Server running on port 3000"
```

### **Step 5: Start Frontend**
```bash
# In another terminal - start frontend  
npm run frontend:start

# Wait for QR code to appear
# Use Expo Go app to scan and test
```

## 📱 **Testing the App**

### **Demo User Credentials**
```bash
Phone Numbers: +15551234567, +15551234568, +1234567890
Verification Code: 123456 (development mode)
Display Names: John Doe, Jane Smith, Test User
```

### **Test Call Flow**
1. **Login**: Use demo phone number → Enter `123456` → Login
2. **Add Contact**: Use another demo number or any number
3. **Make Call**: Tap call button → See "active call" simulation  
4. **View History**: Check Recent tab for call logs
5. **Settings**: Explore AI routing and preferences

### **API Testing**
```bash
# Test backend health
curl http://localhost:3000/health

# Test database connections
curl http://localhost:3000/health/services

# Test authentication (manual)
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'
```

## 🔧 **Available Commands**

### **Development**
```bash
npm run dev              # Start both backend and frontend
npm run backend:dev      # Start only backend
npm run frontend:start   # Start only frontend
```

### **Database Management**
```bash
npm run db:start         # Start all databases (Docker)
npm run db:stop          # Stop all databases
npm run db:migrate       # Run database migrations
```

### **Testing & Health**
```bash
npm run health           # Check all services status
npm run test:connection  # Test frontend-backend connection
npm run test             # Run health check + connection test
```

### **Maintenance**
```bash
npm run stop             # Stop all services
npm run reset            # Complete project reset
npm run clean            # Remove all node_modules
```

## 🐛 **Troubleshooting**

### **Frontend Issues**

#### **App Flickering/White Screen**
```bash
# Clear Expo cache
cd phone-app-frontend
npx expo start --clear

# Or manual cache clear
rm -rf .expo node_modules/.cache dist web-build
npx expo start
```

#### **"Network Request Failed"**
- ✅ Check backend is running: `curl http://localhost:3000/health`
- ✅ For Android emulator, backend should use `http://10.0.2.2:3000`
- ✅ For iOS simulator, use `http://localhost:3000`
- ✅ Check `phone-app-frontend/api-config.js` settings

#### **QR Code Not Working**
```bash
# Try tunnel mode for network issues
cd phone-app-frontend  
npx expo start --tunnel

# Or use specific IP
npx expo start --lan
```

### **Backend Issues**

#### **Port 3000 Already in Use**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
cd phone-app-backend
PORT=3001 npm run dev
```

#### **Database Connection Errors**
```bash
# Check if containers are running
docker ps

# Restart databases
npm run db:stop
npm run db:start

# Check container logs
cd phone-app-backend
docker-compose logs postgres
docker-compose logs redis
docker-compose logs mongodb
```

#### **"Cannot connect to Redis/PostgreSQL"**
```bash
# Wait longer for databases to initialize
npm run health    # Check status

# Manual database check
docker exec -it phone-app-backend_postgres_1 pg_isready -U postgres
docker exec -it phone-app-backend_redis_1 redis-cli ping
```

### **Common Issues**

#### **Node.js Version Problems**
```bash
# Check Node version (must be 18+)
node --version

# Use Node Version Manager if needed
nvm install 18
nvm use 18
```

#### **Docker Issues**
```bash
# Check Docker is running
docker --version
docker ps

# Reset Docker if needed
docker system prune -a
```

#### **Permission Errors (Linux/Mac)**
```bash
# Don't use sudo with npm
# Fix npm permissions:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## 🌍 **Network Configuration**

### **Development URLs**
| Service | Local URL | Container URL | Purpose |
|---------|-----------|---------------|---------|
| Backend API | http://localhost:3000 | - | Main API server |
| PostgreSQL | localhost:5432 | postgres:5432 | User data |
| Redis | localhost:6379 | redis:6379 | Sessions/cache |
| MongoDB | localhost:27017 | mongodb:27017 | Documents |
| ClickHouse | localhost:8123 | clickhouse:8123 | Analytics |
| Frontend Dev | http://localhost:19006 | - | Expo dev server |

### **Mobile Device Access**
- **Same WiFi**: Use computer's IP address instead of localhost
- **Different Network**: Use `npx expo start --tunnel`
- **Corporate Network**: May need VPN or network configuration

## 🏭 **Production Deployment**

### **Backend Deployment**
```bash
# Environment variables needed:
NODE_ENV=production
JWT_SECRET=your-secret-key-here
POSTGRES_HOST=your-rds-endpoint
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/phoneapp
REDIS_HOST=your-elasticache-endpoint

# Optional: External service credentials
FIREBASE_PROJECT_ID=your-firebase-project
AGORA_APP_ID=your-agora-app-id
AWS_ACCESS_KEY_ID=your-aws-key
```

### **Frontend Deployment**
```bash
# Build for production
cd phone-app-frontend
npx expo build

# Or build APK/IPA
eas build --platform android
eas build --platform ios
```

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/awesome-feature`
3. **Test** your changes: `npm run test`
4. **Commit** changes: `git commit -m 'Add awesome feature'`
5. **Push** to branch: `git push origin feature/awesome-feature`
6. **Create** a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Issues**: Open a GitHub issue for bugs
- **Questions**: Check existing issues or create new one
- **Email**: support@smartconnect.ai
- **Documentation**: See individual README files in backend/frontend folders

## 🎉 **Success Criteria**

You know everything is working when:
- ✅ `npm run dev` starts both services without errors
- ✅ Backend health check returns status "OK": http://localhost:3000/health
- ✅ Frontend shows QR code and loads on mobile device
- ✅ You can login with demo credentials: `+15551234567` / `123456`
- ✅ You can make a test call and see it in call history
- ✅ Contact management works (add/edit/delete)

**Happy Calling!** 📞✨