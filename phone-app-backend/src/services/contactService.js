import Contact from '../models/Contact.js';
import redis from '../config/redis.js';

class ContactService {
  async createContact(userId, contactData) {
    try {
      const contact = new Contact({
        userId,
        ...contactData
      });
      
      await contact.save();
      
      // Cache recent contacts
      await this.updateContactCache(userId);
      
      return contact;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Contact already exists');
      }
      throw error;
    }
  }

  async getUserContacts(userId, page = 1, limit = 50) {
    // Check cache first
    const cacheKey = `contacts:${userId}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const skip = (page - 1) * limit;
    const contacts = await Contact.find({ userId })
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Cache for 5 minutes
    await redis.setEx(cacheKey, 300, JSON.stringify(contacts));
    
    return contacts;
  }

  async searchContacts(userId, query) {
    return Contact.find({
      userId,
      $text: { $search: query }
    }).limit(20);
  }

  async updateContact(contactId, updateData) {
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (contact) {
      await this.updateContactCache(contact.userId);
    }
    
    return contact;
  }

  async deleteContact(contactId) {
    const contact = await Contact.findByIdAndDelete(contactId);
    
    if (contact) {
      await this.updateContactCache(contact.userId);
    }
    
    return contact;
  }

  async updateContactCache(userId) {
    // Clear cache for this user
    const pattern = `contacts:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}

export default new ContactService();