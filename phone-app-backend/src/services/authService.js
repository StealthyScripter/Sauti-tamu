import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'phoneapp',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
});

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Utility method to normalize phone numbers
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, assume it's a US number and add +1
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  async getUserByPhone(phoneNumber) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const result = await pool.query(
        'SELECT id, phone_number, display_name, created_at FROM users WHERE phone_number = $1',
        [normalizedPhone]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      throw new Error('Database error');
    }
  }

  async getUserById(userId) {
    try {
      const result = await pool.query(
        'SELECT id, phone_number, display_name, created_at FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Database error');
    }
  }

  async createUser(phoneNumber, displayName = null) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const result = await pool.query(
        `INSERT INTO users (phone_number, display_name, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW()) 
         RETURNING id, phone_number, display_name, created_at`,
        [normalizedPhone, displayName]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.displayName !== undefined) {
        setClause.push(`display_name = $${paramIndex++}`);
        values.push(updates.displayName);
      }

      if (updates.avatar !== undefined) {
        setClause.push(`avatar_url = $${paramIndex++}`);
        values.push(updates.avatar);
      }

      if (setClause.length === 0) {
        throw new Error('No valid updates provided');
      }

      setClause.push('updated_at = NOW()');
      values.push(userId);

      const result = await pool.query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramIndex} 
         RETURNING id, phone_number, display_name, avatar_url, created_at, updated_at`,
        values
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  generateToken(userId) {
    try {
      return jwt.sign(
        { 
          userId: userId,
          type: 'access',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate token');
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check if user still exists
      const user = await this.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: decoded.userId,
        user: user
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  async refreshToken(oldToken) {
    try {
      const decoded = jwt.verify(oldToken, this.jwtSecret, { ignoreExpiration: true });
      const user = await this.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateToken(user.id);
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }

  async revokeToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, { ignoreExpiration: true });
      // In a real app, you might want to store revoked tokens in Redis or database
      // For now, we'll just validate that the token was valid
      return { userId: decoded.userId };
    } catch (error) {
      throw new Error('Invalid token for revocation');
    }
  }

  // Hash password (if you decide to use passwords later)
  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  // Verify password (if you decide to use passwords later)
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Failed to verify password');
    }
  }
}

// Export a singleton instance
const authService = new AuthService();
export default authService;