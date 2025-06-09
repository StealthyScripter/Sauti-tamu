#!/bin/bash

# Complete Phone App Cleanup Script
# This script stops ALL Docker containers, system services, and Node.js processes
# Run this when you're done working to ensure a clean slate next time

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}🧹 Complete Phone App Project Cleanup${NC}"
echo "======================================"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "$(printf '=%.0s' {1..40})"
}

# Function to stop Docker containers
cleanup_docker() {
    print_section "🐳 Stopping Docker Containers"
    
    # Stop all running containers
    local running_containers=$(docker ps -q)
    if [ -n "$running_containers" ]; then
        echo -e "${YELLOW}Stopping all running Docker containers...${NC}"
        docker stop $running_containers
        echo -e "${GREEN}✅ All Docker containers stopped${NC}"
    else
        echo -e "${GREEN}✅ No Docker containers are running${NC}"
    fi
    
    # Remove project-specific containers
    echo -e "${YELLOW}Removing phone-app containers...${NC}"
    docker-compose down 2>/dev/null || true
    
    # Clean up Docker system (optional - removes unused containers, networks, images)
    echo -e "${YELLOW}Cleaning up Docker system...${NC}"
    docker system prune -f >/dev/null 2>&1 || true
    
    echo -e "${GREEN}✅ Docker cleanup complete${NC}"
}

# Function to stop system database services
cleanup_system_services() {
    print_section "🛑 Stopping System Database Services"
    
    local services=("postgresql" "postgres" "redis-server" "redis" "mongod" "mongodb" "mysql" "mariadb")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $service...${NC}"
            sudo systemctl stop "$service" 2>/dev/null || true
            sudo systemctl disable "$service" 2>/dev/null || true
            echo -e "${GREEN}✅ $service stopped${NC}"
        elif service "$service" status >/dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service (via service command)...${NC}"
            sudo service "$service" stop 2>/dev/null || true
            echo -e "${GREEN}✅ $service stopped${NC}"
        fi
    done
}

# Function to kill database processes
cleanup_database_processes() {
    print_section "💀 Killing Database Processes"
    
    local processes=("postgres" "redis-server" "mongod" "mysqld" "clickhouse-server")
    
    for process in "${processes[@]}"; do
        local pids=$(pgrep -f "$process" 2>/dev/null)
        if [ -n "$pids" ]; then
            echo -e "${YELLOW}Killing $process processes (PIDs: $pids)...${NC}"
            sudo pkill -TERM -f "$process" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            sudo pkill -KILL -f "$process" 2>/dev/null || true
            echo -e "${GREEN}✅ $process processes killed${NC}"
        fi
    done
}

# Function to stop Node.js processes
cleanup_node_processes() {
    print_section "📱 Stopping Node.js Processes"
    
    # Find Node.js processes related to our project
    local node_pids=$(pgrep -f "node.*phone-app\|node.*expo\|nodemon" 2>/dev/null)
    
    if [ -n "$node_pids" ]; then
        echo -e "${YELLOW}Stopping Node.js project processes...${NC}"
        echo "PIDs: $node_pids"
        
        # Graceful shutdown first
        kill -TERM $node_pids 2>/dev/null || true
        sleep 3
        
        # Force kill if still running
        kill -KILL $node_pids 2>/dev/null || true
        echo -e "${GREEN}✅ Node.js processes stopped${NC}"
    else
        echo -e "${GREEN}✅ No Node.js project processes found${NC}"
    fi
    
    # Also stop any Expo processes
    local expo_pids=$(pgrep -f "expo\|metro" 2>/dev/null)
    if [ -n "$expo_pids" ]; then
        echo -e "${YELLOW}Stopping Expo/Metro processes...${NC}"
        kill -TERM $expo_pids 2>/dev/null || true
        sleep 2
        kill -KILL $expo_pids 2>/dev/null || true
        echo -e "${GREEN}✅ Expo processes stopped${NC}"
    fi
}

# Function to clean up ports
cleanup_ports() {
    print_section "🔌 Checking Port Usage"
    
    local ports=(3000 5432 6379 27017 8123 9000 19000 19001 19002 19006)
    
    for port in "${ports[@]}"; do
        local process=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$process" ]; then
            echo -e "${YELLOW}Port $port is in use by PID $process - killing...${NC}"
            kill -9 $process 2>/dev/null || true
            echo -e "${GREEN}✅ Port $port freed${NC}"
        else
            echo -e "${GREEN}✅ Port $port is free${NC}"
        fi
    done
}

# Function to clean up temporary files
cleanup_temp_files() {
    print_section "🗑️  Cleaning Temporary Files"
    
    # Clean up node_modules/.cache if it exists
    if [ -d "node_modules/.cache" ]; then
        echo -e "${YELLOW}Cleaning node_modules cache...${NC}"
        rm -rf node_modules/.cache
        echo -e "${GREEN}✅ Node modules cache cleared${NC}"
    fi
    
    # Clean up Expo cache
    if command -v expo >/dev/null 2>&1; then
        echo -e "${YELLOW}Clearing Expo cache...${NC}"
        npx expo r -c >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Expo cache cleared${NC}"
    fi
    
    # Clean up any log files
    if [ -d "logs" ]; then
        echo -e "${YELLOW}Cleaning log files...${NC}"
        rm -rf logs/*
        echo -e "${GREEN}✅ Log files cleared${NC}"
    fi
}

# Function to show final status
show_final_status() {
    print_section "📊 Final Status Report"
    
    echo -e "${CYAN}Docker Containers:${NC}"
    if [ -n "$(docker ps -q)" ]; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${GREEN}✅ No containers running${NC}"
    fi
    
    echo -e "\n${CYAN}Port Usage:${NC}"
    local important_ports=(3000 5432 6379 27017)
    for port in "${important_ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            echo -e "${RED}❌ Port $port is in use${NC}"
        else
            echo -e "${GREEN}✅ Port $port is free${NC}"
        fi
    done
    
    echo -e "\n${CYAN}System Services:${NC}"
    for service in postgresql redis-server mongod; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "${RED}❌ $service is running${NC}"
        else
            echo -e "${GREEN}✅ $service is stopped${NC}"
        fi
    done
}

# Main execution
main() {
    echo -e "${CYAN}Starting complete cleanup process...${NC}"
    
    # Change to project directory if not already there
    if [ ! -f "package.json" ] && [ -d "phone-app-backend" ]; then
        cd phone-app-backend
    fi
    
    cleanup_docker
    cleanup_system_services
    cleanup_database_processes
    cleanup_node_processes
    cleanup_ports
    cleanup_temp_files
    show_final_status
    
    echo -e "\n${GREEN}🎉 Cleanup Complete!${NC}"
    echo -e "${BLUE}💡 You can now start fresh with: ./start-full-app.sh${NC}"
    echo -e "${YELLOW}📝 To restart system services later: ./restart_system_services.sh${NC}"
}

# Run with confirmation
echo -e "${YELLOW}⚠️  This will stop ALL Docker containers and database services!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    main
else
    echo -e "${CYAN}Cleanup cancelled.${NC}"
    exit 0
fi
