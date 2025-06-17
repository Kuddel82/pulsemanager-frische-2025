/**
 * UsageAnalyticsRepository.js
 * 
 * Repository für API Usage Analytics und Batch-Logging
 * Verfolgt API-Nutzung, generiert Reports und analysiert Patterns
 * 
 * @author PulseManager Security Team
 * @version 1.0.0
 * @since 2024-06-14
 */

class UsageAnalyticsRepository {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.batchQueue = [];
        this.batchSize = 100;
        this.flushInterval = 30000; // 30 Sekunden
        
        // Starte automatischen Batch-Flush
        this.startBatchProcessor();
    }

    /**
     * Startet den automatischen Batch-Processor
     */
    startBatchProcessor() {
        setInterval(() => {
            this.flushBatch();
        }, this.flushInterval);
    }

    /**
     * Loggt eine API-Anfrage (asynchron via Batch)
     */
    async logApiRequest(requestData) {
        const logEntry = {
            api_key_id: requestData.apiKeyId,
            endpoint: requestData.endpoint,
            method: requestData.method,
            status_code: requestData.statusCode,
            response_time_ms: requestData.responseTime,
            ip_address: requestData.ipAddress,
            user_agent: requestData.userAgent,
            payload_size: requestData.payloadSize || 0,
            timestamp: new Date(),
            error_message: requestData.error || null
        };

        this.batchQueue.push(logEntry);

        // Sofort flushen wenn Batch voll ist
        if (this.batchQueue.length >= this.batchSize) {
            await this.flushBatch();
        }
    }

    /**
     * Schreibt den Batch in die Datenbank
     */
    async flushBatch() {
        if (this.batchQueue.length === 0) return;

        const batch = [...this.batchQueue];
        this.batchQueue = [];

        try {
            if (this.db.type === 'postgresql') {
                await this.flushBatchPostgreSQL(batch);
            } else if (this.db.type === 'mongodb') {
                await this.flushBatchMongoDB(batch);
            }
            
            console.log(`📊 ${batch.length} API-Anfragen geloggt`);
        } catch (error) {
            console.error('❌ Fehler beim Batch-Flush:', error);
            // Re-queue bei Fehler
            this.batchQueue.unshift(...batch);
        }
    }

    /**
     * PostgreSQL Batch Insert
     */
    async flushBatchPostgreSQL(batch) {
        const values = [];
        const placeholders = [];
        let paramCounter = 1;

        batch.forEach(entry => {
            placeholders.push(
                `($${paramCounter}, $${paramCounter + 1}, $${paramCounter + 2}, $${paramCounter + 3}, $${paramCounter + 4}, $${paramCounter + 5}, $${paramCounter + 6}, $${paramCounter + 7}, $${paramCounter + 8}, $${paramCounter + 9})`
            );
            values.push(
                entry.api_key_id,
                entry.endpoint,
                entry.method,
                entry.status_code,
                entry.response_time_ms,
                entry.ip_address,
                entry.user_agent,
                entry.payload_size,
                entry.timestamp,
                entry.error_message
            );
            paramCounter += 10;
        });

        const query = `
            INSERT INTO api_usage (
                api_key_id, endpoint, method, status_code, response_time_ms,
                ip_address, user_agent, payload_size, timestamp, error_message
            ) VALUES ${placeholders.join(', ')}
        `;

        await this.db.query(query, values);
    }

    /**
     * MongoDB Batch Insert
     */
    async flushBatchMongoDB(batch) {
        await this.db.collection('api_usage').insertMany(batch);
    }

    /**
     * Generiert Usage-Report für einen API-Key
     */
    async getUsageReport(apiKeyId, timeRange = '24h') {
        const timeRanges = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const millisBack = timeRanges[timeRange] || timeRanges['24h'];
        const since = new Date(Date.now() - millisBack);

        try {
            if (this.db.type === 'postgresql') {
                return await this.getUsageReportPostgreSQL(apiKeyId, since);
            } else if (this.db.type === 'mongodb') {
                return await this.getUsageReportMongoDB(apiKeyId, since);
            }
        } catch (error) {
            console.error('❌ Fehler beim Generieren des Usage-Reports:', error);
            return null;
        }
    }

    /**
     * PostgreSQL Usage Report
     */
    async getUsageReportPostgreSQL(apiKeyId, since) {
        // Basis-Statistiken
        const statsQuery = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN status_code < 400 THEN 1 END) as successful_requests,
                COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
                AVG(response_time_ms) as avg_response_time,
                MAX(response_time_ms) as max_response_time,
                SUM(payload_size) as total_data_transferred
            FROM api_usage 
            WHERE api_key_id = $1 AND timestamp > $2
        `;
        const statsResult = await this.db.query(statsQuery, [apiKeyId, since]);
        const stats = statsResult.rows[0];

        // Endpoint-Statistiken
        const endpointsQuery = `
            SELECT 
                endpoint,
                COUNT(*) as request_count,
                AVG(response_time_ms) as avg_response_time
            FROM api_usage 
            WHERE api_key_id = $1 AND timestamp > $2
            GROUP BY endpoint
            ORDER BY request_count DESC
            LIMIT 10
        `;
        const endpointsResult = await this.db.query(endpointsQuery, [apiKeyId, since]);

        // Stündliche Verteilung
        const hourlyQuery = `
            SELECT 
                DATE_TRUNC('hour', timestamp) as hour,
                COUNT(*) as request_count
            FROM api_usage 
            WHERE api_key_id = $1 AND timestamp > $2
            GROUP BY hour
            ORDER BY hour
        `;
        const hourlyResult = await this.db.query(hourlyQuery, [apiKeyId, since]);

        // Error-Analyse
        const errorsQuery = `
            SELECT 
                status_code,
                COUNT(*) as error_count,
                error_message
            FROM api_usage 
            WHERE api_key_id = $1 AND timestamp > $2 AND status_code >= 400
            GROUP BY status_code, error_message
            ORDER BY error_count DESC
            LIMIT 5
        `;
        const errorsResult = await this.db.query(errorsQuery, [apiKeyId, since]);

        return {
            summary: {
                total_requests: parseInt(stats.total_requests),
                successful_requests: parseInt(stats.successful_requests),
                failed_requests: parseInt(stats.failed_requests),
                success_rate: (parseInt(stats.successful_requests) / parseInt(stats.total_requests) * 100).toFixed(2),
                avg_response_time: parseFloat(stats.avg_response_time).toFixed(2),
                max_response_time: parseInt(stats.max_response_time),
                total_data_transferred: parseInt(stats.total_data_transferred)
            },
            top_endpoints: endpointsResult.rows,
            hourly_distribution: hourlyResult.rows,
            error_analysis: errorsResult.rows
        };
    }

    /**
     * MongoDB Usage Report
     */
    async getUsageReportMongoDB(apiKeyId, since) {
        const matchStage = {
            api_key_id: apiKeyId,
            timestamp: { $gt: since }
        };

        // Basis-Statistiken
        const statsAggregation = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    total_requests: { $sum: 1 },
                    successful_requests: {
                        $sum: { $cond: [{ $lt: ['$status_code', 400] }, 1, 0] }
                    },
                    failed_requests: {
                        $sum: { $cond: [{ $gte: ['$status_code', 400] }, 1, 0] }
                    },
                    avg_response_time: { $avg: '$response_time_ms' },
                    max_response_time: { $max: '$response_time_ms' },
                    total_data_transferred: { $sum: '$payload_size' }
                }
            }
        ];

        const [statsResult] = await this.db.collection('api_usage').aggregate(statsAggregation).toArray();
        
        // Endpoint-Statistiken
        const endpointsAggregation = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$endpoint',
                    request_count: { $sum: 1 },
                    avg_response_time: { $avg: '$response_time_ms' }
                }
            },
            { $sort: { request_count: -1 } },
            { $limit: 10 },
            {
                $project: {
                    endpoint: '$_id',
                    request_count: 1,
                    avg_response_time: 1,
                    _id: 0
                }
            }
        ];

        const endpointsResult = await this.db.collection('api_usage').aggregate(endpointsAggregation).toArray();

        // Stündliche Verteilung
        const hourlyAggregation = [
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d %H:00:00',
                            date: '$timestamp'
                        }
                    },
                    request_count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    hour: '$_id',
                    request_count: 1,
                    _id: 0
                }
            }
        ];

        const hourlyResult = await this.db.collection('api_usage').aggregate(hourlyAggregation).toArray();

        // Error-Analyse
        const errorsAggregation = [
            { 
                $match: { 
                    ...matchStage, 
                    status_code: { $gte: 400 } 
                } 
            },
            {
                $group: {
                    _id: {
                        status_code: '$status_code',
                        error_message: '$error_message'
                    },
                    error_count: { $sum: 1 }
                }
            },
            { $sort: { error_count: -1 } },
            { $limit: 5 },
            {
                $project: {
                    status_code: '$_id.status_code',
                    error_message: '$_id.error_message',
                    error_count: 1,
                    _id: 0
                }
            }
        ];

        const errorsResult = await this.db.collection('api_usage').aggregate(errorsAggregation).toArray();

        return {
            summary: {
                total_requests: statsResult?.total_requests || 0,
                successful_requests: statsResult?.successful_requests || 0,
                failed_requests: statsResult?.failed_requests || 0,
                success_rate: statsResult ? 
                    (statsResult.successful_requests / statsResult.total_requests * 100).toFixed(2) : '0',
                avg_response_time: statsResult?.avg_response_time?.toFixed(2) || '0',
                max_response_time: statsResult?.max_response_time || 0,
                total_data_transferred: statsResult?.total_data_transferred || 0
            },
            top_endpoints: endpointsResult,
            hourly_distribution: hourlyResult,
            error_analysis: errorsResult
        };
    }

    /**
     * Holt Top-User nach API-Nutzung
     */
    async getTopUsers(timeRange = '24h', limit = 10) {
        const timeRanges = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };

        const millisBack = timeRanges[timeRange] || timeRanges['24h'];
        const since = new Date(Date.now() - millisBack);

        try {
            if (this.db.type === 'postgresql') {
                const query = `
                    SELECT 
                        ak.user_id,
                        u.email,
                        COUNT(au.*) as request_count,
                        AVG(au.response_time_ms) as avg_response_time
                    FROM api_usage au
                    JOIN api_keys ak ON au.api_key_id = ak.id
                    JOIN users u ON ak.user_id = u.id
                    WHERE au.timestamp > $1
                    GROUP BY ak.user_id, u.email
                    ORDER BY request_count DESC
                    LIMIT $2
                `;
                const result = await this.db.query(query, [since, limit]);
                return result.rows;
            } else if (this.db.type === 'mongodb') {
                // MongoDB Implementierung würde hier folgen
                // Für Vereinfachung nur PostgreSQL implementiert
                return [];
            }
        } catch (error) {
            console.error('❌ Fehler beim Abrufen der Top-User:', error);
            return [];
        }
    }

    /**
     * Anomalie-Erkennung für ungewöhnliche API-Patterns
     */
    async detectAnomalies(apiKeyId = null) {
        const anomalies = [];
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Letzte 24h

        try {
            // Hohe Error-Rate erkennen
            const errorRateQuery = apiKeyId 
                ? `SELECT api_key_id, 
                     COUNT(*) as total_requests,
                     COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests
                   FROM api_usage 
                   WHERE timestamp > $1 AND api_key_id = $2
                   GROUP BY api_key_id`
                : `SELECT api_key_id, 
                     COUNT(*) as total_requests,
                     COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests
                   FROM api_usage 
                   WHERE timestamp > $1
                   GROUP BY api_key_id`;

            const params = apiKeyId ? [since, apiKeyId] : [since];
            const errorResult = await this.db.query(errorRateQuery, params);

            errorResult.rows.forEach(row => {
                const errorRate = (row.error_requests / row.total_requests) * 100;
                if (errorRate > 50) { // Mehr als 50% Fehler
                    anomalies.push({
                        type: 'HIGH_ERROR_RATE',
                        api_key_id: row.api_key_id,
                        severity: errorRate > 80 ? 'CRITICAL' : 'WARNING',
                        details: {
                            error_rate: errorRate.toFixed(2),
                            total_requests: row.total_requests,
                            error_requests: row.error_requests
                        }
                    });
                }
            });

            // Ungewöhnlich hohe Request-Anzahl
            const highVolumeQuery = apiKeyId
                ? `SELECT api_key_id, COUNT(*) as request_count
                   FROM api_usage 
                   WHERE timestamp > $1 AND api_key_id = $2
                   GROUP BY api_key_id`
                : `SELECT api_key_id, COUNT(*) as request_count
                   FROM api_usage 
                   WHERE timestamp > $1
                   GROUP BY api_key_id
                   HAVING COUNT(*) > 1000`; // Mehr als 1000 Requests in 24h

            const volumeResult = await this.db.query(highVolumeQuery, params);

            volumeResult.rows.forEach(row => {
                if (row.request_count > 5000) { // Sehr hohes Volumen
                    anomalies.push({
                        type: 'HIGH_VOLUME',
                        api_key_id: row.api_key_id,
                        severity: row.request_count > 10000 ? 'CRITICAL' : 'WARNING',
                        details: {
                            request_count: row.request_count,
                            period: '24h'
                        }
                    });
                }
            });

        } catch (error) {
            console.error('❌ Fehler bei Anomalie-Erkennung:', error);
        }

        return anomalies;
    }

    /**
     * Cleanup alter Logs (Data Retention)
     */
    async cleanupOldLogs(retentionDays = 90) {
        const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        try {
            if (this.db.type === 'postgresql') {
                const result = await this.db.query(
                    'DELETE FROM api_usage WHERE timestamp < $1',
                    [cutoffDate]
                );
                console.log(`🗑️ ${result.rowCount} alte API-Logs gelöscht (älter als ${retentionDays} Tage)`);
                return result.rowCount;
            } else if (this.db.type === 'mongodb') {
                const result = await this.db.collection('api_usage').deleteMany({
                    timestamp: { $lt: cutoffDate }
                });
                console.log(`🗑️ ${result.deletedCount} alte API-Logs gelöscht (älter als ${retentionDays} Tage)`);
                return result.deletedCount;
            }
        } catch (error) {
            console.error('❌ Fehler beim Cleanup alter Logs:', error);
            return 0;
        }
    }

    /**
     * Forciert das Flushen des aktuellen Batches
     */
    async forceFlush() {
        await this.flushBatch();
    }

    /**
     * Gibt aktuelle Batch-Statistiken zurück
     */
    getBatchStats() {
        return {
            queue_size: this.batchQueue.length,
            batch_size: this.batchSize,
            flush_interval_ms: this.flushInterval
        };
    }
}

module.exports = UsageAnalyticsRepository; 