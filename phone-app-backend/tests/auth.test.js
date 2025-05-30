import request from 'supertest';
import app from '../src/app.js';

describe('Authentication', () => {
  test('POST /api/auth/login - should create user and return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '+1234567890',
        displayName: 'Test User'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.phoneNumber).toBe('+1234567890');
  });

  test('POST /api/auth/login - should validate phone number', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: 'invalid-phone',
        displayName: 'Test User'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});