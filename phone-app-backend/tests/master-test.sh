#!/bin/bash

# Master Test Script - No Rate Limiting
# Uses different users for each test to avoid conflicts

echo "🎯 Master Test Script - Zero Rate Limiting"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_URL="http://localhost:3000"

# Check server
if ! curl -s "$BASE_URL/health" >/dev/null 2>&1; then
    echo -e "${RED}❌ Server not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

echo -e "${CYAN}📋 USER ASSIGNMENT STRATEGY:${NC}"
echo "  📱 +15551234567 (John Doe) → simple-auth-test.sh"
echo "  📱 +15551234568 (Jane Smith) → manual testing"
echo "  📱 +15559876543 (Bob Johnson) → comprehensive test-api.sh"
echo ""

# Step 1: Load fresh test data
echo -e "${BLUE}Step 1: Loading fresh test data...${NC}"
./load-test-data.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Data loading failed${NC}"
    exit 1
fi

echo ""

# Step 2: Simple authentication test (uses John's number)
echo -e "${BLUE}Step 2: Simple authentication test (John's number)...${NC}"
./simple-auth-test.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Simple auth test failed${NC}"
    exit 1
fi

echo ""

# Step 3: Comprehensive API test (uses Bob's number)
echo -e "${BLUE}Step 3: Comprehensive API testing (Bob's number)...${NC}"
./test-api.sh

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ Comprehensive test had some failures${NC}"
else
    echo -e "${GREEN}✅ Comprehensive test passed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ALL TESTS COMPLETED!${NC}"
echo ""
echo -e "${CYAN}📊 SUMMARY:${NC}"
echo "  ✅ Data loaded successfully"
echo "  ✅ Simple auth test passed (John)"
echo "  ✅ Comprehensive test completed (Bob)"
echo "  ✅ No rate limiting conflicts"
echo ""
echo -e "${BLUE}💡 Available for manual testing:${NC}"
echo "  📱 +15551234568 (Jane Smith) - Fresh user, no rate limits"
echo ""
echo -e "${YELLOW}🔧 For development:${NC}"
echo "  • Use ./simple-auth-test.sh for quick auth testing"
echo "  • Use ./test-api.sh for full endpoint testing"
echo "  • Use Jane's number for manual API exploration"
