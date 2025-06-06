import AWS from 'aws-sdk';
import pkg from 'uuid';
import redis from '../config/redis.js';

const { v4: uuidv4 } = pkg;

class CallRecordingService {
  constructor() {
    this.initialized = false;
    this.agoraCloudRecording = null;
    this.s3 = null;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize AWS S3 for storage
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1'
        });
        console.log('✅ AWS S3 initialized for call recordings');
      } else {
        console.warn('⚠️  AWS credentials not configured - using local storage');
      }

      // Initialize Agora Cloud Recording
      if (process.env.AGORA_APP_ID && process.env.AGORA_CUSTOMER_ID && process.env.AGORA_CUSTOMER_SECRET) {
        this.agoraCustomerId = process.env.AGORA_CUSTOMER_ID;
        this.agoraCustomerSecret = process.env.AGORA_CUSTOMER_SECRET;
        this.agoraAppId = process.env.AGORA_APP_ID;
        this.initialized = true;
        console.log('✅ Agora Cloud Recording initialized');
      } else {
        console.warn('⚠️  Agora Cloud Recording credentials not configured');
        this.initialized = false;
      }

    } catch (error) {
      console.error('❌ Call recording service initialization failed:', error);
      this.initialized = false;
    }
  }

  // Start recording a call
  async startRecording(callId, channelName, userId, options = {}) {
    if (!this.initialized) {
      console.log('🎙️ Call recording not available - service not initialized');
      return { success: false, reason: 'service_not_initialized' };
    }

    try {
      const recordingId = uuidv4();
      const resourceId = await this.acquireResource(channelName);
      
      if (!resourceId) {
        throw new Error('Failed to acquire Agora recording resource');
      }

      const recordingConfig = {
        channelType: 0, // Communication channel
        transcodingConfig: {
          height: options.videoEnabled ? 640 : 0,
          width: options.videoEnabled ? 360 : 0,
          bitrate: options.videoEnabled ? 500 : 0,
          fps: options.videoEnabled ? 15 : 0,
          mixedVideoLayout: 1, // Floating layout
          backgroundColor: '#000000'
        },
        recordingConfig: {
          maxIdleTime: 30, // Stop recording after 30s of no users
          streamTypes: options.videoEnabled ? 2 : 0, // 0: audio only, 2: audio and video
          channelType: 0,
          videoStreamType: 0, // High stream
          subscribeVideoUids: options.subscribedUsers || [],
          subscribeAudioUids: options.subscribedUsers || [],
          subscribeUidGroup: 0
        },
        storageConfig: {
          vendor: this.s3 ? 1 : 0, // 1: AWS S3, 0: Agora's storage
          region: this.s3 ? this.getS3Region() : 0,
          bucket: process.env.AWS_S3_BUCKET || 'phone-app-recordings',
          accessKey: process.env.AWS_ACCESS_KEY_ID || '',
          secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          fileNamePrefix: [`recordings/${callId}`, recordingId]
        }
      };

      const startResponse = await this.makeAgoraRequest('start', {
        resourceid: resourceId,
        cname: channelName,
        uid: userId,
        clientRequest: recordingConfig
      });

      if (startResponse.success) {
        // Store recording info in Redis
        const recordingInfo = {
          recordingId,
          resourceId,
          sid: startResponse.sid,
          callId,
          channelName,
          userId,
          startTime: new Date().toISOString(),
          status: 'recording',
          config: recordingConfig
        };

        await redis.setEx(
          `recording:${recordingId}`, 
          7200, // 2 hours
          JSON.stringify(recordingInfo)
        );

        console.log(`🎙️ Started recording for call ${callId}, recording ID: ${recordingId}`);

        return {
          success: true,
          recordingId,
          resourceId,
          sid: startResponse.sid,
          message: 'Recording started successfully'
        };
      } else {
        throw new Error(`Agora recording start failed: ${startResponse.message}`);
      }

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop recording a call
  async stopRecording(recordingId, userId) {
    try {
      const recordingInfo = await this.getRecordingInfo(recordingId);
      
      if (!recordingInfo) {
        return { success: false, reason: 'recording_not_found' };
      }

      if (recordingInfo.status !== 'recording') {
        return { success: false, reason: 'recording_not_active' };
      }

      const stopResponse = await this.makeAgoraRequest('stop', {
        resourceid: recordingInfo.resourceId,
        sid: recordingInfo.sid,
        cname: recordingInfo.channelName,
        uid: userId,
        clientRequest: {}
      });

      if (stopResponse.success) {
        // Update recording info
        recordingInfo.endTime = new Date().toISOString();
        recordingInfo.status = 'stopped';
        recordingInfo.duration = Math.floor(
          (new Date(recordingInfo.endTime) - new Date(recordingInfo.startTime)) / 1000
        );

        await redis.setEx(
          `recording:${recordingId}`, 
          86400, // Keep for 24 hours after stopping
          JSON.stringify(recordingInfo)
        );

        // Store in database for permanent record
        await this.saveRecordingToDatabase(recordingInfo, stopResponse.serverResponse);

        console.log(`🎙️ Stopped recording ${recordingId}, duration: ${recordingInfo.duration}s`);

        return {
          success: true,
          recordingId,
          duration: recordingInfo.duration,
          fileList: stopResponse.serverResponse?.fileList || [],
          message: 'Recording stopped successfully'
        };
      } else {
        throw new Error(`Agora recording stop failed: ${stopResponse.message}`);
      }

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Query recording status
  async getRecordingStatus(recordingId) {
    try {
      const recordingInfo = await this.getRecordingInfo(recordingId);
      
      if (!recordingInfo) {
        return { success: false, reason: 'recording_not_found' };
      }

      if (recordingInfo.status === 'recording') {
        // Query Agora for current status
        const queryResponse = await this.makeAgoraRequest('query', {
          resourceid: recordingInfo.resourceId,
          sid: recordingInfo.sid
        });

        if (queryResponse.success) {
          recordingInfo.agoraStatus = queryResponse.serverResponse;
        }
      }

      return {
        success: true,
        recordingInfo,
        isActive: recordingInfo.status === 'recording'
      };

    } catch (error) {
      console.error('❌ Failed to get recording status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's call recordings
  async getUserRecordings(userId, page = 1, limit = 20) {
    try {
      const pool = (await import('../config/database.js')).default;
      
      const offset = (page - 1) * limit;
      const result = await pool.query(`
        SELECT 
          recording_id,
          call_id,
          start_time,
          end_time,
          duration_seconds,
          file_size_bytes,
          file_urls,
          status,
          created_at
        FROM call_recordings 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return {
        success: true,
        recordings: result.rows,
        pagination: { page, limit, total: result.rowCount }
      };

    } catch (error) {
      console.error('❌ Failed to get user recordings:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete recording
  async deleteRecording(recordingId, userId) {
    try {
      const pool = (await import('../config/database.js')).default;
      
      // Get recording info
      const result = await pool.query(`
        SELECT recording_id, file_urls, user_id 
        FROM call_recordings 
        WHERE recording_id = $1 AND user_id = $2
      `, [recordingId, userId]);

      if (result.rows.length === 0) {
        return { success: false, reason: 'recording_not_found' };
      }

      const recording = result.rows[0];

      // Delete files from S3 if configured
      if (this.s3 && recording.file_urls) {
        try {
          const fileUrls = Array.isArray(recording.file_urls) ? recording.file_urls : [recording.file_urls];
          
          for (const url of fileUrls) {
            const key = this.extractS3KeyFromUrl(url);
            if (key) {
              await this.s3.deleteObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key
              }).promise();
            }
          }
          console.log(`🗑️ Deleted ${fileUrls.length} recording files from S3`);
        } catch (s3Error) {
          console.warn('⚠️ Failed to delete some files from S3:', s3Error.message);
        }
      }

      // Delete from database
      await pool.query(`
        DELETE FROM call_recordings 
        WHERE recording_id = $1 AND user_id = $2
      `, [recordingId, userId]);

      // Remove from Redis cache
      await redis.del(`recording:${recordingId}`);

      console.log(`🗑️ Deleted recording ${recordingId}`);

      return {
        success: true,
        message: 'Recording deleted successfully'
      };

    } catch (error) {
      console.error('❌ Failed to delete recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods

  async acquireResource(channelName) {
    try {
      const response = await this.makeAgoraRequest('acquire', {
        cname: channelName,
        uid: '0',
        clientRequest: {
          resourceExpiredHour: 24,
          scene: 0 // Live broadcast scenario
        }
      });

      return response.success ? response.resourceId : null;
    } catch (error) {
      console.error('❌ Failed to acquire Agora resource:', error);
      return null;
    }
  }

  async makeAgoraRequest(action, data) {
    try {
      const fetch = (await import('node-fetch')).default;
      const credentials = Buffer.from(`${this.agoraCustomerId}:${this.agoraCustomerSecret}`).toString('base64');
      
      const url = `https://api.agora.io/v1/apps/${this.agoraAppId}/cloud_recording/${action}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      return {
        success: response.ok,
        ...result
      };

    } catch (error) {
      console.error(`❌ Agora ${action} request failed:`, error);
      return { success: false, message: error.message };
    }
  }

  async getRecordingInfo(recordingId) {
    try {
      const data = await redis.get(`recording:${recordingId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Failed to get recording info from Redis:', error);
      return null;
    }
  }

  async saveRecordingToDatabase(recordingInfo, serverResponse) {
    try {
      const pool = (await import('../config/database.js')).default;
      
      const fileUrls = serverResponse?.fileList?.map(file => file.filename) || [];
      const totalSize = serverResponse?.fileList?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
      
      await pool.query(`
        INSERT INTO call_recordings (
          recording_id, call_id, user_id, start_time, end_time,
          duration_seconds, file_size_bytes, file_urls, 
          agora_response, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (recording_id) 
        DO UPDATE SET 
          end_time = $5, duration_seconds = $6, file_size_bytes = $7,
          file_urls = $8, agora_response = $9, status = $10
      `, [
        recordingInfo.recordingId,
        recordingInfo.callId,
        recordingInfo.userId,
        recordingInfo.startTime,
        recordingInfo.endTime,
        recordingInfo.duration,
        totalSize,
        JSON.stringify(fileUrls),
        JSON.stringify(serverResponse),
        recordingInfo.status
      ]);

      console.log(`💾 Saved recording ${recordingInfo.recordingId} to database`);
    } catch (error) {
      console.error('❌ Failed to save recording to database:', error);
    }
  }

  getS3Region() {
    const region = process.env.AWS_REGION || 'us-east-1';
    const regionMap = {
      'us-east-1': 0,
      'us-east-2': 1,
      'us-west-1': 2,
      'us-west-2': 3,
      'eu-west-1': 4,
      'eu-central-1': 5,
      'ap-southeast-1': 6,
      'ap-northeast-1': 7,
      'ap-south-1': 8
    };
    return regionMap[region] || 0;
  }

  extractS3KeyFromUrl(url) {
    try {
      const match = url.match(/amazonaws\.com\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Get service stats
  getStats() {
    return {
      initialized: this.initialized,
      s3Configured: !!this.s3,
      agoraConfigured: !!(this.agoraCustomerId && this.agoraCustomerSecret)
    };
  }
}

export default new CallRecordingService();