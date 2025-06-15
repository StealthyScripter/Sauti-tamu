#!/bin/bash

# Simple Authentication Test
# Tests the actual authentication flow with dynamically generated codes

echo "🔐 Simple Authentication Test (Uses John's Number)"
echo "================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3000"
TEST_PHONE="+15551234567"
TEST_NAME="John Doe"

# Check server
if ! curl -s "$BASE_URL/health" >/dev/null 2>&1; then
    echo -e "${RED}❌ Server not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Step 1: Request verification code
echo -e "${BLUE}1. Requesting verification code for $TEST_PHONE...${NC}"
verification_response=$(curl -s -X POST "$BASE_URL/api/auth/verify-phone" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\":\"$TEST_PHONE\"}")

echo "Response: $verification_response"

if echo "$verification_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Verification code request successful${NC}"
    
    # Try to extract the test code from response (development mode)
    if command -v jq >/dev/null 2>&1; then
        TEST_CODE=$(echo "$verification_response" | jq -r '.data._testCode // empty')
    else
        TEST_CODE=$(echo "$verification_response" | grep -o '"_testCode":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -n "$TEST_CODE" ] && [ "$TEST_CODE" != "null" ]; then
        echo -e "${GREEN}📱 Found test code in response: $TEST_CODE${NC}"
    else
        echo -e "${YELLOW}⚠️ No test code in response. Checking Redis directly...${NC}"
        
        # Try to get the code directly from Redis
        redis_code=$(redis-cli GET "verification:$TEST_PHONE" 2>/dev/null | jq -r '.code // empty' 2>/dev/null)
        if [ -n "$redis_code" ] && [ "$redis_code" != "null" ]; then
            TEST_CODE="$redis_code"
            echo -e "${GREEN}📱 Found code in Redis: $TEST_CODE${NC}"
        else
            echo -e "${RED}❌ Could not find verification code${NC}"
            echo "Debugging: Redis keys matching verification:"
            redis-cli KEYS "verification:*" 2>/dev/null || echo "Could not access Redis"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Verification code request failed${NC}"
    exit 1
fi

echo ""

# Step 2: Login with the code
echo -e "${BLUE}2. Logging in with code: $TEST_CODE...${NC}"
login_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phoneNumber\":\"$TEST_PHONE\",\"verificationCode\":\"$TEST_CODE\",\"displayName\":\"$TEST_NAME\"}")

echo "Response: $login_response"

if echo "$login_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Login successful${NC}"
    
    # Extract token
    if command -v jq >/dev/null 2>&1; then
        AUTH_TOKEN=$(echo "$login_response" | jq -r '.data.token')
        USER_ID=$(echo "$login_response" | jq -r '.data.user.id')
    else
        AUTH_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        USER_ID=$(echo "$login_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    fi
    
    echo -e "${GREEN}🎫 Token: ${AUTH_TOKEN:0:30}...${NC}"
    echo -e "${GREEN}👤 User ID: $USER_ID${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    
    # Debug information
    echo ""
    echo -e "${YELLOW}🔍 Debugging verification code storage:${NC}"
    echo "Checking Redis for verification codes..."
    redis-cli KEYS "verification:*" | while read key; do
        if [ -n "$key" ]; then
            value=$(redis-cli GET "$key")
            echo "  $key: $value"
        fi
    done
    exit 1
fi

echo ""

# Step 3: Test an authenticated endpoint
echo -e "${BLUE}3. Testing authenticated endpoint...${NC}"
contacts_response=$(curl -s -X GET "$BASE_URL/api/contacts" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$contacts_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Contacts endpoint working${NC}"
    
    # Show contacts if any
    if command -v jq >/dev/null 2>&1; then
        contact_count=$(echo "$contacts_response" | jq '.data | length')
        echo "   Found $contact_count contacts"
    fi
else
    echo -e "${RED}❌ Contacts endpoint failed${NC}"
    echo "Response: $contacts_response"
fi

echo ""

# Step 4: Test call initiation
echo -e "${BLUE}4. Testing call initiation...${NC}"
call_response=$(curl -s -X POST "$BASE_URL/api/calls/initiate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{"toPhoneNumber":"+15551234568","callType":"voice","metadata":{"fromDisplayName":"John Doe"}}')

if echo "$call_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Call initiation working${NC}"
    
    if command -v jq >/dev/null 2>&1; then
        CALL_ID=$(echo "$call_response" | jq -r '.data.callId')
        echo "   Call ID: $CALL_ID"
        
        # End the call immediately
        echo "   Ending call..."
        end_response=$(curl -s -X POST "$BASE_URL/api/calls/$CALL_ID/end" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d '{"qualityScore":5}')
        
        if echo "$end_response" | grep -q '"success":true'; then
            echo -e "${GREEN}   ✅ Call ended successfully${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Call initiation failed${NC}"
    echo "Response: $call_response"
fi

echo ""
echo -e "${GREEN}🎉 Authentication test completed!${NC}"
echo ""
echo -e "${BLUE}📋 Test Summary:${NC}"
echo "  📱 Phone: $TEST_PHONE"
echo "  🔐 Verification Code: $TEST_CODE"
echo "  🎫 Auth Token: ${AUTH_TOKEN:0:50}..."
echo "  👤 User ID: $USER_ID"
echo ""
echo "You can now use this auth token for manual API testing!"