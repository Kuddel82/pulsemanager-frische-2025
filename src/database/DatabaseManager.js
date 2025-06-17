// =============================================================================
// 🗄️ DATABASE INTEGRATION - API KEY MANAGEMENT
// =============================================================================

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// =============================================================================
// 📊 DATABASE SCHEMAS & MIGRATIONS
// =============================================================================

class DatabaseSchemas {
  // PostgreSQL Schema
  static getPostgreSQLSchema() {
    return `
      -- Users Tabelle
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- API Keys Tabelle
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        key_id VARCHAR(50) UNIQUE NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        permissions TEXT[] DEFAULT '{}',
        rate_limit INTEGER DEFAULT 1000,
        is_active BOOLEAN DEFAULT true,
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes für Performance
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_id ON api_keys(key_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

      -- Usage Analytics Tabelle
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        ip_address INET,
        user_agent TEXT,
        request_size INTEGER DEFAULT 0,
        response_size INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Partitionierung nach Datum für Performance
      CREATE INDEX IF NOT EXISTS idx_usage_created_at ON api_usage(created_at);
      CREATE INDEX IF NOT EXISTS idx_usage_api_key ON api_usage(api_key_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON api_usage(endpoint, created_at);

      -- Rate Limiting Cache Tabelle
      CREATE TABLE IF NOT EXISTS rate_limit_cache (
        id VARCHAR(255) PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1,
        window_start TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON rate_limit_cache(expires_at);

      -- Triggers für updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
      CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;
  }

  // MongoDB Schema (als Mongoose Models)
  static getMongoDBSchema() {
    return {
      User: {
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      },

      ApiKey: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        keyId: { type: String, required: true, unique: true },
        keyHash: { type: String, required: true },
        name: { type: String, required: true },
        permissions: [{ type: String }],
        rateLimit: { type: Number, default: 1000 },
        isActive: { type: Boolean, default: true },
        lastUsedAt: { type: Date },
        expiresAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      },

      ApiUsage: {
        apiKeyId: { type: 'ObjectId', ref: 'ApiKey', required: true },
        endpoint: { type: String, required: true },
        method: { type: String, required: true },
        statusCode: { type: Number, required: true },
        responseTime: { type: Number, required: true },
        ipAddress: { type: String },
        userAgent: { type: String },
        requestSize: { type: Number, default: 0 },
        responseSize: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now, index: true }
      }
    };
  }
}

// =============================================================================
// 🔌 DATABASE CONNECTION MANAGER
// =============================================================================

class DatabaseManager {
  constructor(config = {}) {
    this.config = {
      type: config.type || 'postgresql', // postgresql, mysql, mongodb
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'security_db',
      username: config.username || 'postgres',
      password: config.password || '',
      ssl: config.ssl || false,
      poolSize: config.poolSize || 20,
      ...config
    };
    
    this.pool = null;
    this.isConnected = false;
  }

  // PostgreSQL Connection
  async connectPostgreSQL() {
    const { Pool } = require('pg');
    
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      max: this.config.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Connection Test
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      console.log('✅ PostgreSQL verbunden');
    } catch (error) {
      console.error('❌ PostgreSQL Verbindungsfehler:', error.message);
      throw error;
    }
  }

  // MongoDB Connection  
  async connectMongoDB() {
    const mongoose = require('mongoose');
    
    const connectionString = `mongodb://${this.config.host}:${this.config.port}/${this.config.database}`;
    
    try {
      await mongoose.connect(connectionString, {
        maxPoolSize: this.config.poolSize,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      this.isConnected = true;
      console.log('✅ MongoDB verbunden');
    } catch (error) {
      console.error('❌ MongoDB Verbindungsfehler:', error.message);
      throw error;
    }
  }

  // Universal Connect Method
  async connect() {
    switch (this.config.type) {
      case 'postgresql':
        await this.connectPostgreSQL();
        break;
      case 'mongodb':
        await this.connectMongoDB();
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  // Query Execution
  async query(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    if (this.config.type === 'postgresql') {
      const client = await this.pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    }
    
    throw new Error('Query method only available for SQL databases');
  }

  // Health Check
  async healthCheck() {
    try {
      if (this.config.type === 'postgresql') {
        await this.query('SELECT 1');
      } else if (this.config.type === 'mongodb') {
        const mongoose = require('mongoose');
        await mongoose.connection.db.admin().ping();
      }
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  // Graceful Shutdown
  async disconnect() {
    if (this.config.type === 'postgresql' && this.pool) {
      await this.pool.end();
    } else if (this.config.type === 'mongodb') {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
    }
    
    this.isConnected = false;
    console.log('🔌 Database getrennt');
  }
}

// =============================================================================
// 🔑 API KEY REPOSITORY
// =============================================================================

class ApiKeyRepository {
  constructor(dbManager) {
    this.db = dbManager;
    this.cache = new Map(); // In-Memory Cache für Performance
    this.cacheTimeout = 5 * 60 * 1000; // 5 Minuten
  }

  // API Key generieren
  generateApiKey(prefix = 'ak_live') {
    const randomBytes = crypto.randomBytes(32);
    const keyId = `${prefix}_${randomBytes.toString('hex')}`;
    return keyId;
  }

  // API Key Hash erstellen
  async hashApiKey(apiKey) {
    return await bcrypt.hash(apiKey, 12);
  }

  // API Key erstellen
  async createApiKey(userId, name, permissions = ['read'], rateLimit = 1000, expiresIn = null) {
    const keyId = this.generateApiKey();
    const keyHash = await this.hashApiKey(keyId);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;

    if (this.db.config.type === 'postgresql') {
      const result = await this.db.query(`
        INSERT INTO api_keys (user_id, key_id, key_hash, name, permissions, rate_limit, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, key_id, name, permissions, rate_limit, is_active, created_at
      `, [userId, keyId, keyHash, name, permissions, rateLimit, expiresAt]);

      return {
        ...result[0],
        apiKey: keyId, // Nur beim Erstellen zurückgeben!
        masked: this.maskApiKey(keyId)
      };
    }

    throw new Error('MongoDB implementation needed');
  }

  // API Key validieren
  async validateApiKey(apiKey) {
    // Cache Check
    const cacheKey = `validate_${this.maskApiKey(apiKey)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    if (this.db.config.type === 'postgresql') {
      // Key laden
      const keyResults = await this.db.query(`
        SELECT ak.*, u.email, u.username, u.is_active as user_active
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_id = $1 AND ak.is_active = true
      `, [apiKey]);

      if (keyResults.length === 0) {
        return null;
      }

      const keyData = keyResults[0];

      // Expiry Check
      if (keyData.expires_at && new Date() > new Date(keyData.expires_at)) {
        return null;
      }

      // User Active Check
      if (!keyData.user_active) {
        return null;
      }

      // Last Used Update (async)
      this.updateLastUsed(keyData.id).catch(console.error);

      const result = {
        id: keyData.id,
        userId: keyData.user_id,
        name: keyData.name,
        permissions: keyData.permissions,
        rateLimit: keyData.rate_limit,
        user: {
          email: keyData.email,
          username: keyData.username
        }
      };

      // Cache Result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    throw new Error('MongoDB implementation needed');
  }

  // Last Used Timestamp updaten
  async updateLastUsed(apiKeyId) {
    if (this.db.config.type === 'postgresql') {
      await this.db.query(`
        UPDATE api_keys 
        SET last_used_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [apiKeyId]);
    }
  }

  // API Keys für User auflisten
  async getUserApiKeys(userId) {
    if (this.db.config.type === 'postgresql') {
      const results = await this.db.query(`
        SELECT id, key_id, name, permissions, rate_limit, is_active, 
               last_used_at, expires_at, created_at
        FROM api_keys 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);

      return results.map(key => ({
        ...key,
        keyId: this.maskApiKey(key.key_id)
      }));
    }

    throw new Error('MongoDB implementation needed');
  }

  // API Key deaktivieren
  async deactivateApiKey(keyId, userId) {
    if (this.db.config.type === 'postgresql') {
      const result = await this.db.query(`
        UPDATE api_keys 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE key_id = $1 AND user_id = $2
        RETURNING id, name
      `, [keyId, userId]);

      // Cache invalidieren
      this.invalidateCache(keyId);

      return result[0] || null;
    }

    throw new Error('MongoDB implementation needed');
  }

  // API Key maskieren für Anzeige
  maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) return '***';
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  // Cache invalidieren
  invalidateCache(apiKey) {
    const cacheKey = `validate_${this.maskApiKey(apiKey)}`;
    this.cache.delete(cacheKey);
  }

  // Cache Statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cache.keys())
    };
  }
}

// =============================================================================
// 📊 USAGE ANALYTICS REPOSITORY  
// =============================================================================

class UsageAnalyticsRepository {
  constructor(dbManager) {
    this.db = dbManager;
    this.batchSize = 100;
    this.pendingLogs = [];
    this.setupBatchInsert();
  }

  // Usage Event loggen
  async logUsage(apiKeyId, endpoint, method, statusCode, responseTime, metadata = {}) {
    const logEntry = {
      api_key_id: apiKeyId,
      endpoint: endpoint,
      method: method,
      status_code: statusCode,
      response_time: responseTime,
      ip_address: metadata.ip,
      user_agent: metadata.userAgent,
      request_size: metadata.requestSize || 0,
      response_size: metadata.responseSize || 0,
      created_at: new Date()
    };

    // Batch Insert für Performance
    this.pendingLogs.push(logEntry);
    
    if (this.pendingLogs.length >= this.batchSize) {
      await this.flushLogs();
    }
  }

  // Batch Insert Setup
  setupBatchInsert() {
    // Flush Logs alle 30 Sekunden
    setInterval(() => {
      if (this.pendingLogs.length > 0) {
        this.flushLogs().catch(console.error);
      }
    }, 30000);
  }

  // Pending Logs in DB schreiben
  async flushLogs() {
    if (this.pendingLogs.length === 0) return;

    const logs = [...this.pendingLogs];
    this.pendingLogs = [];

    if (this.db.config.type === 'postgresql') {
      const values = logs.map((log, index) => {
        const offset = index * 10;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`;
      }).join(', ');

      const params = logs.flatMap(log => [
        log.api_key_id, log.endpoint, log.method, log.status_code, 
        log.response_time, log.ip_address, log.user_agent, 
        log.request_size, log.response_size, log.created_at
      ]);

      await this.db.query(`
        INSERT INTO api_usage (api_key_id, endpoint, method, status_code, response_time, 
                              ip_address, user_agent, request_size, response_size, created_at)
        VALUES ${values}
      `, params);

      console.log(`📊 ${logs.length} Usage-Logs gespeichert`);
    }
  }

  // Usage Analytics für API Key
  async getUsageAnalytics(apiKeyId, timeframe = '24h') {
    const timeCondition = this.getTimeCondition(timeframe);
    
    if (this.db.config.type === 'postgresql') {
      const [stats, endpoints, timeline] = await Promise.all([
        // Basis Statistiken
        this.db.query(`
          SELECT 
            COUNT(*) as total_requests,
            COUNT(DISTINCT DATE_TRUNC('hour', created_at)) as active_hours,
            AVG(response_time) as avg_response_time,
            COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
            SUM(request_size) as total_request_size,
            SUM(response_size) as total_response_size
          FROM api_usage 
          WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '${timeframe}'
        `, [apiKeyId]),

        // Top Endpoints
        this.db.query(`
          SELECT endpoint, method, COUNT(*) as count, AVG(response_time) as avg_time
          FROM api_usage 
          WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '${timeframe}'
          GROUP BY endpoint, method 
          ORDER BY count DESC 
          LIMIT 10
        `, [apiKeyId]),

        // Timeline Data
        this.db.query(`
          SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as requests,
            AVG(response_time) as avg_response_time
          FROM api_usage 
          WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '${timeframe}'
          GROUP BY hour 
          ORDER BY hour
        `, [apiKeyId])
      ]);

      return {
        timeframe,
        stats: stats[0],
        topEndpoints: endpoints,
        timeline: timeline
      };
    }

    throw new Error('MongoDB implementation needed');
  }

  getTimeCondition(timeframe) {
    const intervals = {
      '1h': '1 hour',
      '24h': '24 hours', 
      '7d': '7 days',
      '30d': '30 days'
    };
    return intervals[timeframe] || '24 hours';
  }
}

// =============================================================================
// 🎯 ENHANCED AUTHENTICATION MANAGER
// =============================================================================

class EnhancedAuthenticationManager {
  constructor(dbManager) {
    this.db = dbManager;
    this.apiKeyRepo = new ApiKeyRepository(dbManager);
    this.analyticsRepo = new UsageAnalyticsRepository(dbManager);
  }

  // Enhanced API Key Validation mit Analytics
  validateApiKey() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      try {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey) {
          return res.status(401).json({
            error: 'API Key erforderlich',
            message: 'Bitte geben Sie einen gültigen API Key im X-API-Key Header an'
          });
        }

        const keyData = await this.apiKeyRepo.validateApiKey(apiKey);
        
        if (!keyData) {
          // Analytics: Failed Authentication
          await this.analyticsRepo.logUsage(null, req.path, req.method, 401, Date.now() - startTime, {
            ip: req.ip,
            userAgent: req.headers['user-agent']
          });
          
          return res.status(401).json({
            error: 'Ungültiger API Key',
            message: 'Der angegebene API Key ist nicht gültig oder abgelaufen'
          });
        }

        // Request Data anhängen
        req.user = keyData;
        req.apiKeyId = keyData.id;

        // Analytics Logger für Response
        res.on('finish', async () => {
          await this.analyticsRepo.logUsage(
            keyData.id,
            req.path,
            req.method,
            res.statusCode,
            Date.now() - startTime,
            {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              requestSize: req.headers['content-length'] || 0,
              responseSize: res.get('content-length') || 0
            }
          );
        });

        next();
      } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).json({
          error: 'Authentication Service Error',
          message: 'Temporärer Fehler bei der Authentifizierung'
        });
      }
    };
  }

  // Permission Check
  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required'
        });
      }

      if (!req.user.permissions.includes(permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          available: req.user.permissions
        });
      }

      next();
    };
  }

  // API Key Management Endpoints
  async createUserApiKey(userId, name, permissions, rateLimit) {
    return await this.apiKeyRepo.createApiKey(userId, name, permissions, rateLimit);
  }

  async getUserApiKeys(userId) {
    return await this.apiKeyRepo.getUserApiKeys(userId);
  }

  async deactivateApiKey(keyId, userId) {
    return await this.apiKeyRepo.deactivateApiKey(keyId, userId);
  }

  async getUsageAnalytics(apiKeyId, timeframe) {
    return await this.analyticsRepo.getUsageAnalytics(apiKeyId, timeframe);
  }
}

// =============================================================================
// 🚀 COMPLETE DATABASE SETUP
// =============================================================================

async function setupDatabase() {
  // Database Config
  const dbConfig = {
    type: process.env.DB_TYPE || 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'security_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 20
  };

  // Database Manager initialisieren
  const dbManager = new DatabaseManager(dbConfig);
  await dbManager.connect();

  // Schema erstellen (Development)
  if (process.env.NODE_ENV === 'development') {
    const schema = DatabaseSchemas.getPostgreSQLSchema();
    await dbManager.query(schema);
    console.log('📊 Database Schema erstellt');
  }

  // Enhanced Auth Manager
  const authManager = new EnhancedAuthenticationManager(dbManager);

  return { dbManager, authManager };
}

// Export
module.exports = {
  DatabaseManager,
  ApiKeyRepository,
  UsageAnalyticsRepository,
  EnhancedAuthenticationManager,
  DatabaseSchemas,
  setupDatabase
}; 