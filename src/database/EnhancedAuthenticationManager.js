/**
 * EnhancedAuthenticationManager.js
 * 
 * Erweiterte Authentifizierung mit Datenbank-Integration
 * Kombiniert SecurityMiddleware mit Database-backed Authentication
 * 
 * @author PulseManager Security Team
 * @version 1.0.0
 * @since 2024-06-14
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiKeyRepository = require('./ApiKeyRepository');
const UsageAnalyticsRepository = require('./UsageAnalyticsRepository');

class EnhancedAuthenticationManager {
    constructor(databaseManager, jwtSecret = null) {
        this.db = databaseManager;
        this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
        this.apiKeyRepo = new ApiKeyRepository(databaseManager);
        this.analyticsRepo = new UsageAnalyticsRepository(databaseManager);
        
        // Hardcoded Keys für Fallback (Development/Testing)
        this.fallbackKeys = {
            'ak_live_abc123def456': {
                id: 'hardcoded_1',
                user_id: 'system_admin',
                email: 'admin@pulsemanager.vip',
                permissions: ['read', 'write', 'admin'],
                rate_limit: 1000,
                subscription_type: 'premium',
                is_active: true
            },
            'ak_test_xyz789uvw123': {
                id: 'hardcoded_2',
                user_id: 'test_user',
                email: 'test@pulsemanager.vip',
                permissions: ['read'],
                rate_limit: 100,
                subscription_type: 'free',
                is_active: true
            }
        };
    }

    /**
     * Haupt-Authentifizierungsmethode
     * Prüft sowohl Database-Keys als auch Fallback-Keys
     */
    async authenticateRequest(apiKey, requestData = {}) {
        try {
            const startTime = Date.now();
            let keyRecord = null;
            let authSource = 'unknown';

            // 1. Versuche Database-Authentifizierung
            try {
                if (this.db.isConnected()) {
                    keyRecord = await this.apiKeyRepo.validateApiKey(apiKey);
                    if (keyRecord) {
                        authSource = 'database';
                    }
                }
            } catch (dbError) {
                console.warn('⚠️ Database Auth fehlgeschlagen, verwende Fallback:', dbError.message);
            }

            // 2. Fallback zu hardcodierten Keys
            if (!keyRecord && this.fallbackKeys[apiKey]) {
                keyRecord = this.fallbackKeys[apiKey];
                authSource = 'fallback';
            }

            // 3. Authentifizierung fehlgeschlagen
            if (!keyRecord || !keyRecord.is_active) {
                await this.logFailedAuth(apiKey, requestData, 'INVALID_KEY');
                return {
                    success: false,
                    error: 'Ungültiger oder inaktiver API-Key',
                    errorCode: 'AUTH_FAILED'
                };
            }

            // 4. Rate Limiting prüfen
            const rateLimitCheck = await this.checkRateLimit(keyRecord, requestData);
            if (!rateLimitCheck.allowed) {
                await this.logFailedAuth(apiKey, requestData, 'RATE_LIMIT_EXCEEDED');
                return {
                    success: false,
                    error: 'Rate Limit überschritten',
                    errorCode: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: rateLimitCheck.retryAfter
                };
            }

            // 5. Berechtigungen prüfen
            if (requestData.requiredPermission) {
                const hasPermission = this.apiKeyRepo.hasPermission(keyRecord, requestData.requiredPermission);
                if (!hasPermission) {
                    await this.logFailedAuth(apiKey, requestData, 'INSUFFICIENT_PERMISSIONS');
                    return {
                        success: false,
                        error: 'Unzureichende Berechtigungen',
                        errorCode: 'PERMISSION_DENIED'
                    };
                }
            }

            // 6. JWT Token generieren
            const token = this.generateJwtToken(keyRecord);

            // 7. Erfolgreiche Authentifizierung loggen
            const responseTime = Date.now() - startTime;
            await this.logSuccessfulAuth(keyRecord, requestData, authSource, responseTime);

            return {
                success: true,
                user: {
                    id: keyRecord.user_id,
                    email: keyRecord.email,
                    subscription_type: keyRecord.subscription_type,
                    permissions: keyRecord.permissions
                },
                token: token,
                authSource: authSource,
                rateLimitRemaining: rateLimitCheck.remaining
            };

        } catch (error) {
            console.error('❌ Authentifizierungsfehler:', error);
            return {
                success: false,
                error: 'Interner Authentifizierungsfehler',
                errorCode: 'AUTH_ERROR'
            };
        }
    }

    /**
     * Rate Limiting mit intelligenter Logik
     */
    async checkRateLimit(keyRecord, requestData) {
        try {
            // Basis Rate Limit aus Key-Record
            let rateLimit = keyRecord.rate_limit || 100;
            
            // Dynamische Anpassung basierend auf Subscription
            if (keyRecord.subscription_type === 'premium') {
                rateLimit *= 10; // Premium: 10x mehr Requests
            } else if (keyRecord.subscription_type === 'enterprise') {
                rateLimit *= 50; // Enterprise: 50x mehr Requests
            }

            // Spezielle Limits für verschiedene Endpoints
            if (requestData.endpoint) {
                if (requestData.endpoint.includes('/admin/')) {
                    rateLimit = Math.min(rateLimit, 50); // Admin Endpoints begrenzt
                } else if (requestData.endpoint.includes('/export/')) {
                    rateLimit = Math.min(rateLimit, 20); // Export Endpoints stark begrenzt
                }
            }

            // Database-backed Rate Limiting
            if (this.db.isConnected() && keyRecord.id && !keyRecord.id.startsWith('hardcoded_')) {
                const allowed = await this.apiKeyRepo.checkRateLimit(keyRecord.id, rateLimit);
                return {
                    allowed: allowed,
                    remaining: allowed ? rateLimit - 1 : 0,
                    retryAfter: allowed ? null : 900 // 15 Minuten
                };
            }

            // Fallback: Memory-based Rate Limiting
            return this.checkMemoryRateLimit(keyRecord.user_id, rateLimit);

        } catch (error) {
            console.error('❌ Rate Limit Check Fehler:', error);
            // Bei Fehler: Erlaube Request (fail-open)
            return { allowed: true, remaining: 100, retryAfter: null };
        }
    }

    /**
     * Memory-basiertes Rate Limiting als Fallback
     */
    checkMemoryRateLimit(userId, limit) {
        if (!this.memoryRateLimiter) {
            this.memoryRateLimiter = new Map();
        }

        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 Minuten
        const userKey = `rate_limit_${userId}`;
        
        let userLimit = this.memoryRateLimiter.get(userKey);
        
        if (!userLimit) {
            userLimit = {
                count: 0,
                resetTime: now + windowMs
            };
        }

        // Reset wenn Window abgelaufen
        if (now > userLimit.resetTime) {
            userLimit = {
                count: 0,
                resetTime: now + windowMs
            };
        }

        // Check ob Limit überschritten
        if (userLimit.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            };
        }

        // Increment Counter
        userLimit.count++;
        this.memoryRateLimiter.set(userKey, userLimit);

        return {
            allowed: true,
            remaining: limit - userLimit.count,
            retryAfter: null
        };
    }

    /**
     * JWT Token generieren
     */
    generateJwtToken(keyRecord) {
        const payload = {
            userId: keyRecord.user_id,
            email: keyRecord.email,
            permissions: keyRecord.permissions,
            subscription: keyRecord.subscription_type,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 Stunden
        };

        return jwt.sign(payload, this.jwtSecret);
    }

    /**
     * JWT Token validieren
     */
    validateJwtToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            return {
                valid: true,
                payload: decoded
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Erfolgreiche Authentifizierung loggen
     */
    async logSuccessfulAuth(keyRecord, requestData, authSource, responseTime) {
        try {
            const logData = {
                apiKeyId: keyRecord.id,
                endpoint: requestData.endpoint || 'unknown',
                method: requestData.method || 'unknown',
                statusCode: 200,
                responseTime: responseTime,
                ipAddress: requestData.ipAddress || 'unknown',
                userAgent: requestData.userAgent || 'unknown',
                payloadSize: requestData.payloadSize || 0
            };

            // Log zu Analytics Repository
            if (this.db.isConnected() && !keyRecord.id.startsWith('hardcoded_')) {
                await this.analyticsRepo.logApiRequest(logData);
            }

            // Console Log für Monitoring
            console.log(`✅ Auth erfolgreich: ${keyRecord.email} via ${authSource} (${responseTime}ms)`);

        } catch (error) {
            console.error('❌ Fehler beim Loggen der erfolgreichen Auth:', error);
        }
    }

    /**
     * Fehlgeschlagene Authentifizierung loggen
     */
    async logFailedAuth(apiKey, requestData, reason) {
        try {
            const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 8);
            
            const logData = {
                apiKeyId: `failed_${hashedKey}`,
                endpoint: requestData.endpoint || 'unknown',
                method: requestData.method || 'unknown',
                statusCode: 401,
                responseTime: 0,
                ipAddress: requestData.ipAddress || 'unknown',
                userAgent: requestData.userAgent || 'unknown',
                payloadSize: 0,
                error: reason
            };

            // Log zu Analytics Repository (wenn DB verfügbar)
            if (this.db.isConnected()) {
                await this.analyticsRepo.logApiRequest(logData);
            }

            // Console Log für Security Monitoring
            console.warn(`🚫 Auth fehlgeschlagen: ${reason} von IP ${requestData.ipAddress} (Key: ***${apiKey.slice(-4)})`);

        } catch (error) {
            console.error('❌ Fehler beim Loggen der fehlgeschlagenen Auth:', error);
        }
    }

    /**
     * Neuen API-Key für User erstellen
     */
    async createApiKeyForUser(userId, keyName, permissions = ['read'], rateLimit = 100) {
        try {
            if (!this.db.isConnected()) {
                throw new Error('Datenbank nicht verfügbar');
            }

            const newKey = await this.apiKeyRepo.createApiKey(userId, keyName, permissions, rateLimit);
            
            console.log(`🔑 Neuer API-Key erstellt: ${keyName} für User ${userId}`);
            return newKey;

        } catch (error) {
            console.error('❌ Fehler beim Erstellen des API-Keys:', error);
            throw error;
        }
    }

    /**
     * API-Key deaktivieren
     */
    async revokeApiKey(keyId, userId) {
        try {
            if (!this.db.isConnected()) {
                throw new Error('Datenbank nicht verfügbar');
            }

            const success = await this.apiKeyRepo.revokeApiKey(keyId, userId);
            
            if (success) {
                console.log(`🗑️ API-Key ${keyId} deaktiviert für User ${userId}`);
                // Cache leeren
                this.apiKeyRepo.clearCache();
            }

            return success;

        } catch (error) {
            console.error('❌ Fehler beim Deaktivieren des API-Keys:', error);
            return false;
        }
    }

    /**
     * User API-Keys abrufen
     */
    async getUserApiKeys(userId) {
        try {
            if (!this.db.isConnected()) {
                throw new Error('Datenbank nicht verfügbar');
            }

            return await this.apiKeyRepo.getUserApiKeys(userId);

        } catch (error) {
            console.error('❌ Fehler beim Abrufen der User API-Keys:', error);
            return [];
        }
    }

    /**
     * Usage Report für User generieren
     */
    async getUserUsageReport(userId, timeRange = '24h') {
        try {
            if (!this.db.isConnected()) {
                return { error: 'Database nicht verfügbar' };
            }

            // Alle API-Keys des Users holen
            const userKeys = await this.apiKeyRepo.getUserApiKeys(userId);
            
            if (userKeys.length === 0) {
                return { summary: { total_requests: 0 }, top_endpoints: [], hourly_distribution: [], error_analysis: [] };
            }

            // Reports für alle Keys kombinieren
            let combinedReport = {
                summary: { total_requests: 0, successful_requests: 0, failed_requests: 0, total_data_transferred: 0 },
                top_endpoints: {},
                hourly_distribution: {},
                error_analysis: {}
            };

            for (const key of userKeys) {
                const report = await this.analyticsRepo.getUsageReport(key.id, timeRange);
                if (report) {
                    // Summaries kombinieren
                    combinedReport.summary.total_requests += report.summary.total_requests;
                    combinedReport.summary.successful_requests += report.summary.successful_requests;
                    combinedReport.summary.failed_requests += report.summary.failed_requests;
                    combinedReport.summary.total_data_transferred += report.summary.total_data_transferred;

                    // Endpoints kombinieren
                    report.top_endpoints.forEach(endpoint => {
                        if (!combinedReport.top_endpoints[endpoint.endpoint]) {
                            combinedReport.top_endpoints[endpoint.endpoint] = 0;
                        }
                        combinedReport.top_endpoints[endpoint.endpoint] += endpoint.request_count;
                    });
                }
            }

            // Success Rate berechnen
            if (combinedReport.summary.total_requests > 0) {
                combinedReport.summary.success_rate = 
                    (combinedReport.summary.successful_requests / combinedReport.summary.total_requests * 100).toFixed(2);
            } else {
                combinedReport.summary.success_rate = '0';
            }

            // Top Endpoints sortieren
            combinedReport.top_endpoints = Object.entries(combinedReport.top_endpoints)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([endpoint, count]) => ({ endpoint, request_count: count }));

            return combinedReport;

        } catch (error) {
            console.error('❌ Fehler beim Generieren des User Usage Reports:', error);
            return { error: error.message };
        }
    }

    /**
     * System-weite Sicherheitsstatistiken
     */
    async getSecurityStats() {
        try {
            const stats = {
                timestamp: new Date().toISOString(),
                database_connected: this.db.isConnected(),
                api_keys: await this.apiKeyRepo.getStats(),
                usage_analytics: this.analyticsRepo.getBatchStats(),
                recent_anomalies: []
            };

            // Aktuelle Anomalien prüfen
            if (this.db.isConnected()) {
                stats.recent_anomalies = await this.analyticsRepo.detectAnomalies();
            }

            return stats;

        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Security Stats:', error);
            return { error: error.message, timestamp: new Date().toISOString() };
        }
    }

    /**
     * Cache und Memory Cleanup
     */
    cleanup() {
        try {
            // API Key Cache leeren
            this.apiKeyRepo.clearCache();
            
            // Memory Rate Limiter leeren
            if (this.memoryRateLimiter) {
                this.memoryRateLimiter.clear();
            }

            // Analytics Batch forcieren
            this.analyticsRepo.forceFlush();

            console.log('🧹 Enhanced Authentication Manager cleanup abgeschlossen');

        } catch (error) {
            console.error('❌ Fehler beim Cleanup:', error);
        }
    }

    /**
     * Graceful Shutdown
     */
    async shutdown() {
        try {
            console.log('🔄 Enhanced Authentication Manager wird heruntergefahren...');
            
            // Finale Logs flushen
            await this.analyticsRepo.forceFlush();
            
            // Cleanup
            this.cleanup();
            
            console.log('✅ Enhanced Authentication Manager shutdown abgeschlossen');

        } catch (error) {
            console.error('❌ Fehler beim Shutdown:', error);
        }
    }
}

module.exports = EnhancedAuthenticationManager; 