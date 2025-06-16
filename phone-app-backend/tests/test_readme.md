# Phone App Backend - Testing Suite

Complete testing suite for the phone app backend with comprehensive API testing, data loading, and authentication flows.

## 🎯 Quick Start

```bash
# Make all scripts executable
chmod +x *.sh

# Run complete test suite (recommended)
./test-master-script.sh
```

## 📁 Test Scripts Overview

| Script | Purpose | User | Phone Number |
|--------|---------|------|-------------|
| `load-test-data.sh` | Load fresh test data to all databases | - | - |
| `simple-auth-test.sh` | Quick authentication flow test | John Doe | +15551234567 |
| `test-api.sh` | Comprehensive API endpoint testing | Bob Johnson | +15559876543 |
| `test-master-script.sh` | Run all tests in sequence | All | All users |

## 🚀 User Assignment Strategy

**Zero Rate Limiting Approach**: Each script uses a different test user to avoid authentication rate limits.

### Test Users
- **📱 +15551234567 (John Doe)** → `simple-auth-test.sh`
- **📱 +15551234568 (Jane Smith)** → Manual testing & development
- **📱 +15559876543 (Bob Johnson)** → `test-api.sh`

All users use verification code `123456` when pre-loaded, or dynamic codes when using API endpoints.

## 🗄️ Test Data Structure

### PostgreSQL
- **Users**: 3 test users with UUIDs
- **Call Sessions**: Sample call history
- **User Settings**: Notification preferences, FCM tokens

### Redis
- **Verification Codes**: Pre-loaded codes for all test users
- **Call Room Data**: Sample Agora call room configurations

### MongoDB
- **Contacts**: Cross-referenced contacts between users
- **Call Records**: Additional call metadata

## 🧪 Individual Script Usage

### 1. Data Loading
```bash
# Clean all databases and load fresh test data
./load-test-data.sh
```
- **⚠️ WARNING**: Completely wipes all test data
- **Duration**: ~10 seconds
- **Result**: Fresh test environment

### 2. Simple Authentication Test
```bash
# Quick auth flow validation
./simple-auth-test.sh
```
- **Tests**: Phone verification → Login → Token → API calls
- **Duration**: ~5 seconds
- **User**: John Doe (+15551234567)

### 3. Comprehensive API Testing
```bash
# Full endpoint test suite
./test-api.sh
```
- **Tests**: All endpoints, edge cases, error handling
- **Duration**: ~30 seconds
- **User**: Bob Johnson (+15559876543)
- **Coverage**: 15+ test scenarios

## 📊 Expected Results

### Successful Test Run
```
✅ Passed: 15/15 tests
📈 Success Rate: 100%
🎉 All tests passed!
```

### Test Categories
- **Health Endpoints** (2 tests)
- **Authentication Flow** (4 tests)
- **Contacts CRUD** (3 tests)
- **Calls Management** (4 tests)
- **Notifications** (2 tests)
- **Edge Cases & Error Handling** (3+ tests)

## 🔧 Development Workflow

### Daily Development
```bash
# Quick check during development
./simple-auth-test.sh

# Full validation before commits
./test-api.sh
```

### Clean Start
```bash
# Reset everything and run full test suite
./test-master-script.sh
```

### Manual API Testing
Use Jane's number (+15551234568) for manual testing:
```bash
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+15551234568"}'
```

## 🛠️ Requirements

### Running Server
```bash
# Backend must be running on localhost:3000
npm run dev
```

### Database Dependencies
- **PostgreSQL**: Users, call sessions, settings
- **Redis**: Verification codes, call rooms
- **MongoDB**: Contacts, additional call data
- **Firebase**: Verification code generation (dev mode)

### System Tools
- `curl` - API requests
- `jq` - JSON parsing (optional, has fallbacks)
- `redis-cli` - Redis debugging (optional)

## 🐛 Troubleshooting

### Rate Limiting Issues
```
Error: "Please wait 2 minutes before requesting another verification code"
```
**Solution**: Each script uses different phone numbers. If still hitting limits:
1. Wait 2 minutes
2. Use the master script (handles this automatically)
3. Use Jane's number (+15551234568) for manual testing

### Database Connection Issues
```
Error: "Connection failed to PostgreSQL/MongoDB/Redis"
```
**Solution**: 
1. Check if databases are running
2. Verify environment variables in `.env`
3. Ensure server is running on localhost:3000

### Authentication Failures
```
Error: "Invalid verification code"
```
**Solution**: 
1. The scripts extract real verification codes from API responses
2. In development mode, codes are included in the response as `_testCode`
3. Check Redis for stored verification codes: `redis-cli KEYS "verification:*"`

### Missing Dependencies
```
Error: "jq: command not found"
```
**Solution**: 
- Scripts have fallbacks for missing tools
- For better output formatting: `sudo apt install jq` (Ubuntu) or `brew install jq` (macOS)

## 📈 Test Coverage

### API Endpoints Tested
- ✅ Health checks (`/health`, `/health/services`)
- ✅ Authentication (`/api/auth/*`)
- ✅ Contacts (`/api/contacts/*`)
- ✅ Calls (`/api/calls/*`)
- ✅ Notifications (`/api/notifications/*`)
- ✅ Recordings (`/api/recordings/*`)

### Error Scenarios
- ✅ Invalid JSON payloads
- ✅ Missing authentication tokens
- ✅ Invalid phone number formats
- ✅ Non-existent endpoints
- ✅ Rate limiting behavior

### Performance Metrics
- ✅ Response time measurements
- ✅ Database connection health
- ✅ Service availability checks

## 🔐 Security Notes

- **Test Environment Only**: These scripts are for development/testing
- **Sensitive Data**: Uses mock verification codes in development
- **Rate Limiting**: Tests respect production rate limits
- **Token Handling**: Temporary JWT tokens for testing

## 📝 Contributing

When adding new tests:
1. Use the existing user assignment strategy
2. Add new test cases to `test-api.sh`
3. Update this README with new test coverage
4. Ensure tests clean up after themselves

---

**Happy Testing!** 🚀