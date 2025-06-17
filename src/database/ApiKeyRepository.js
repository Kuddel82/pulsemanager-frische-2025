/**
 * ApiKeyRepository.js
 * 
 * Repository für API-Key Management mit Datenbankanbindung
 * Unterstützt PostgreSQL und MongoDB mit Caching und Analytics
 * 
 * @author PulseManager Security Team
 * @version 1.0.0
 * @since 2024-06-14
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const NodeCache = require('node-cache');

class ApiKeyRepository {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.cache = new NodeCache({ 
            stdTTL: 3600, // 1 Stunde Cache
            checkperiod: 120 // Check alle 2 Minuten
        });
        this.saltRounds = 12;
    }

    /**
     * Generiert einen neuen API-Key
     * Format: ak_live_[32 chars] oder ak_test_[32 chars]
     */
    generateApiKey(prefix = 'live') {
        const randomPart = crypto.randomBytes(16).toString('hex');
        return `ak_${prefix}_${randomPart}`;
    }

    /**
     * Erstellt einen neuen API-Key in der Datenbank
     */
    async createApiKey(userId, keyName, permissions = ['read'], rateLimit = 100) {
        try {
            const apiKey = this.generateApiKey();
            const hashedKey = await bcrypt.hash(apiKey, this.saltRounds);
            
            const keyData = {
                user_id: userId,
                key_name: keyName,
                key_hash: hashedKey,
                permissions: Array.isArray(permissions) ? permissions : [permissions],
                rate_limit: rateLimit,
                created_at: new Date(),
                last_used: null,
                is_active: true
            };

            if (this.db.type === 'postgresql') {
                const query = `
                    INSERT INTO api_keys (user_id, key_name, key_hash, permissions, rate_limit, created_at, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, created_at;
                `;
                const values = [
                    keyData.user_id,
                    keyData.key_name,
                    keyData.key_hash,
                    JSON.stringify(keyData.permissions),
                    keyData.rate_limit,
                    keyData.created_at,
                    keyData.is_active
                ];
                
                const result = await this.db.query(query, values);
                keyData.id = result.rows[0].id;
            } else if (this.db.type === 'mongodb') {
                const result = await this.db.collection('api_keys').insertOne(keyData);
                keyData.id = result.insertedId;
            }

            console.log(`✅ API-Key erstellt: ${keyName} für User ${userId}`);
            return { ...keyData, api_key: apiKey }; // Nur beim Erstellen den Klartext zurückgeben
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des API-Keys:', error);
            throw new Error('API-Key Erstellung fehlgeschlagen');
        }
    }

    /**
     * Validiert einen API-Key und gibt Benutzerinformationen zurück
     */
    async validateApiKey(apiKey) {
        try {
            // Cache-Check
            const cacheKey = `api_key_${crypto.createHash('sha256').update(apiKey).digest('hex')}`;
            const cached = this.cache.get(cacheKey);
            if (cached) {
                await this.updateLastUsed(cached.id);
                return cached;
            }

            // Datenbankabfrage
            let keyRecord = null;
            
            if (this.db.type === 'postgresql') {
                const query = `
                    SELECT ak.*, u.email, u.subscription_type 
                    FROM api_keys ak 
                    JOIN users u ON ak.user_id = u.id 
                    WHERE ak.is_active = true
                `;
                const result = await this.db.query(query);
                
                for (const row of result.rows) {
                    const isValid = await bcrypt.compare(apiKey, row.key_hash);
                    if (isValid) {
                        keyRecord = {
                            ...row,
                            permissions: typeof row.permissions === 'string' 
                                ? JSON.parse(row.permissions) 
                                : row.permissions
                        };
                        break;
                    }
                }
            } else if (this.db.type === 'mongodb') {
                const keys = await this.db.collection('api_keys').find({ is_active: true }).toArray();
                
                for (const key of keys) {
                    const isValid = await bcrypt.compare(apiKey, key.key_hash);
                    if (isValid) {
                        const user = await this.db.collection('users').findOne({ _id: key.user_id });
                        keyRecord = {
                            ...key,
                            email: user?.email,
                            subscription_type: user?.subscription_type
                        };
                        break;
                    }
                }
            }

            if (!keyRecord) {
                return null;
            }

            // Cache speichern
            this.cache.set(cacheKey, keyRecord, 1800); // 30 Minuten
            
            // Last used aktualisieren
            await this.updateLastUsed(keyRecord.id);
            
            return keyRecord;
        } catch (error) {
            console.error('❌ Fehler bei API-Key Validierung:', error);
            return null;
        }
    }

    /**
     * Aktualisiert den "last_used" Zeitstempel
     */
    async updateLastUsed(keyId) {
        try {
            const now = new Date();
            
            if (this.db.type === 'postgresql') {
                await this.db.query(
                    'UPDATE api_keys SET last_used = $1 WHERE id = $2',
                    [now, keyId]
                );
            } else if (this.db.type === 'mongodb') {
                await this.db.collection('api_keys').updateOne(
                    { _id: keyId },
                    { $set: { last_used: now } }
                );
            }
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren von last_used:', error);
        }
    }

    /**
     * Deaktiviert einen API-Key
     */
    async revokeApiKey(keyId, userId) {
        try {
            if (this.db.type === 'postgresql') {
                const result = await this.db.query(
                    'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
                    [keyId, userId]
                );
                return result.rowCount > 0;
            } else if (this.db.type === 'mongodb') {
                const result = await this.db.collection('api_keys').updateOne(
                    { _id: keyId, user_id: userId },
                    { $set: { is_active: false } }
                );
                return result.modifiedCount > 0;
            }
        } catch (error) {
            console.error('❌ Fehler beim Deaktivieren des API-Keys:', error);
            return false;
        }
    }

    /**
     * Listet alle API-Keys eines Benutzers auf
     */
    async getUserApiKeys(userId) {
        try {
            if (this.db.type === 'postgresql') {
                const result = await this.db.query(
                    `SELECT id, key_name, permissions, rate_limit, created_at, last_used, is_active 
                     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
                    [userId]
                );
                return result.rows.map(row => ({
                    ...row,
                    permissions: typeof row.permissions === 'string' 
                        ? JSON.parse(row.permissions) 
                        : row.permissions
                }));
            } else if (this.db.type === 'mongodb') {
                return await this.db.collection('api_keys')
                    .find(
                        { user_id: userId },
                        { projection: { key_hash: 0 } }
                    )
                    .sort({ created_at: -1 })
                    .toArray();
            }
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der API-Keys:', error);
            return [];
        }
    }

    /**
     * Prüft ob ein Benutzer ein bestimmtes Recht hat
     */
    hasPermission(keyRecord, requiredPermission) {
        if (!keyRecord || !keyRecord.permissions) {
            return false;
        }
        
        return keyRecord.permissions.includes(requiredPermission) || 
               keyRecord.permissions.includes('admin');
    }

    /**
     * Rate Limiting Check
     */
    async checkRateLimit(keyId, requestsPerWindow = null) {
        try {
            const keyRecord = await this.getKeyById(keyId);
            if (!keyRecord) return false;

            const limit = requestsPerWindow || keyRecord.rate_limit || 100;
            const window = 15 * 60 * 1000; // 15 Minuten
            const now = Date.now();
            const windowStart = now - window;

            if (this.db.type === 'postgresql') {
                // Zähle Requests in der aktuellen Zeitspanne
                const countQuery = `
                    SELECT COUNT(*) as request_count 
                    FROM api_usage 
                    WHERE api_key_id = $1 AND timestamp > $2
                `;
                const result = await this.db.query(countQuery, [keyId, new Date(windowStart)]);
                const requestCount = parseInt(result.rows[0].request_count);

                return requestCount < limit;
            } else if (this.db.type === 'mongodb') {
                const requestCount = await this.db.collection('api_usage').countDocuments({
                    api_key_id: keyId,
                    timestamp: { $gt: new Date(windowStart) }
                });

                return requestCount < limit;
            }
        } catch (error) {
            console.error('❌ Fehler beim Rate Limit Check:', error);
            return false;
        }
    }

    /**
     * Holt einen API-Key anhand der ID
     */
    async getKeyById(keyId) {
        try {
            if (this.db.type === 'postgresql') {
                const result = await this.db.query(
                    'SELECT * FROM api_keys WHERE id = $1',
                    [keyId]
                );
                return result.rows[0] || null;
            } else if (this.db.type === 'mongodb') {
                return await this.db.collection('api_keys').findOne({ _id: keyId });
            }
        } catch (error) {
            console.error('❌ Fehler beim Abrufen des API-Keys:', error);
            return null;
        }
    }

    /**
     * Cache leeren
     */
    clearCache() {
        this.cache.flushAll();
        console.log('🗑️ API-Key Cache geleert');
    }

    /**
     * Statistiken abrufen
     */
    async getStats() {
        try {
            const stats = {
                total_keys: 0,
                active_keys: 0,
                inactive_keys: 0,
                cache_hits: this.cache.getStats().hits,
                cache_misses: this.cache.getStats().misses
            };

            if (this.db.type === 'postgresql') {
                const result = await this.db.query(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active,
                        SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) as inactive
                    FROM api_keys
                `);
                
                const row = result.rows[0];
                stats.total_keys = parseInt(row.total);
                stats.active_keys = parseInt(row.active);
                stats.inactive_keys = parseInt(row.inactive);
            } else if (this.db.type === 'mongodb') {
                stats.total_keys = await this.db.collection('api_keys').countDocuments();
                stats.active_keys = await this.db.collection('api_keys').countDocuments({ is_active: true });
                stats.inactive_keys = stats.total_keys - stats.active_keys;
            }

            return stats;
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Statistiken:', error);
            return {};
        }
    }
}

module.exports = ApiKeyRepository; 