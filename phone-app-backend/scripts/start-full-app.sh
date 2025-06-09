#!/bin/bash

# Complete Phone App Setup Script
# This script starts both backend and frontend without code changes

echo "🚀 Starting Phone App - Full Stack Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    echo "⏳ Waiting for $1 to be ready..."
    while ! curl -s $2 > /dev/null; do
        sleep 2
        echo "   Still waiting for $1..."
    done
    echo "✅ $1 is ready!"
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed!${NC}"

# Step 1: Start Backend Databases
echo -e "\n${BLUE}🗄️  Starting backend databases...${NC}"
cd phone-app-backend

# Start databases with Docker Compose
echo "Starting PostgreSQL, Redis, MongoDB, and ClickHouse..."
docker-compose up -d

# Wait for databases to be ready
wait_for_service "PostgreSQL" "http://localhost:5432"
wait_for_service "Redis" "http://localhost:6379"
wait_for_service "MongoDB" "http://localhost:27017"
wait_for_service "ClickHouse" "http://localhost:8123/ping"

# Step 2: Install Backend Dependencies
echo -e "\n${BLUE}📦 Installing backend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Step 3: Run Database Migrations
echo -e "\n${BLUE}🗃️  Running database migrations...${NC}"
npm run migrate

# Step 4: Start Backend Server
echo -e "\n${BLUE}🖥️  Starting backend server...${NC}"
# Start backend in background
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
wait_for_service "Backend API" "http://localhost:3000/health"

# Step 5: Start Frontend
echo -e "\n${BLUE}📱 Starting frontend application...${NC}"
cd ../

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Start Expo development server
echo "🚀 Starting Expo development server..."
npx expo start --clear

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    
    # Kill backend process
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # Stop Docker containers
    cd phone-app-backend
    docker-compose down
    
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "${BLUE}📱 Scan the QR code with Expo Go to test the app${NC}"
echo -e "${BLUE}🌐 Backend API: http://localhost:3000${NC}"
echo -e "${BLUE}🔍 Health Check: http://localhost:3000/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to stop
wait