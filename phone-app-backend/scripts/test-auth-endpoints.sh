#!/bin/bash
# Test authenticated endpoints

# Your token from the login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDg5ZmIzNy02MjZlLTQ2NmYtYjQ4NS00OGFlODRkNTAxOTEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzUwMjQxNTY0LCJleHAiOjE3NTAzMjc5NjR9.dBIkljxR4JNJkMgdMH_Yr7ZAZLd2EgM0JilU_ndQfdI"

echo "🧪 Testing Authenticated Endpoints..."
echo "========================================="

echo ""
echo "1. Test Contacts endpoint:"
curl -X GET http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "2. Test Calls endpoint:"
curl -X GET http://localhost:3000/api/calls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "3. Test Agora token generation:"
curl -X POST http://localhost:3000/api/calls/agora-token \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channelName": "test-call-123", "role": "publisher"}'

echo ""
echo ""
echo "4. Test user profile:"
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "5. Test logout:"
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "✅ Authentication testing complete!"
