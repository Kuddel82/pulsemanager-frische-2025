// Cache invalidation - 2024-03-19
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { retryOperation, retryStrategies, RetryError } from '@/lib/retryService';
import { userDbService } from './userDbService';

const handleRetryError = (error, operationName) => {
    logger.error(`dbService.${operationName}: Failed after retries.`, error instanceof RetryError ? error.originalError : error);
    const finalError = error instanceof RetryError ? error.originalError : error;
    return { 
        data: finalError && 'data' in finalError ? finalError.data : null, 
        error: finalError, 
        success: false 
    };
};

export const dbService = {
    
    getUserAuthDataByEmail: userDbService.getUserAuthDataByEmail,
    updateUserPremiumStatus: userDbService.updateUserPremiumStatus,
    getUserProfile: userDbService.getUserProfile,
    updateUserProfile: userDbService.updateUserProfile,
    ensureUserProfile: userDbService.ensureUserProfile,

    async syncRoiEntries(userId, entries) {
        if (!userId || !entries || entries.length === 0) {
            logger.warn('dbService.syncRoiEntries: userId or entries are missing or empty.');
            return { data: null, error: { message: "User ID or entries missing." } };
        }
        
        const operation = async () => {
            const preparedEntries = entries.map(entry => ({
                ...entry, 
                user_id: userId,
                symbol: entry.symbol || entry.asset_symbol, 
                name: entry.name || entry.asset_name,
                quantity: entry.quantity || entry.current_balance,
                purchase_date: entry.purchase_date || entry.transaction_date,
                purchase_price: entry.purchase_price,
                current_value: entry.current_value || entry.current_value_usd,
                wallet_address: entry.wallet_address,
                source: entry.source || 'manual' 
            }));
            
            logger.debug('dbService.syncRoiEntries: Upserting entries to investments table:', preparedEntries);
            const { data, error } = await supabase
                .from('investments')
                .upsert(preparedEntries, {
                    onConflict: 'user_id,symbol,wallet_address', 
                    ignoreDuplicates: false
                })
                .select();

            if (error) {
                logger.error('dbService.syncRoiEntries: Error upserting ROI entries:', error);
                throw error;
            }
            logger.info('dbService.syncRoiEntries: Successfully upserted ROI entries. Count:', data?.length);
            return { data, error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for syncRoiEntries after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'syncRoiEntries');
        }
    },

    async getRoiEntries(userId) {
        if (!userId) {
            logger.warn('dbService.getRoiEntries: userId is missing.');
            return { data: [], error: { message: "User ID missing." } };
        }

        const operation = async () => {
            logger.debug('dbService.getRoiEntries: Fetching ROI entries for user:', userId);
            const { data, error } = await supabase
                .from('investments')
                .select('*')
                .eq('user_id', userId)
                .order('purchase_date', { ascending: false });

            if (error) {
                logger.error('dbService.getRoiEntries: Error fetching ROI entries:', error);
                throw error;
            }
            logger.info('dbService.getRoiEntries: Successfully fetched ROI entries. Count:', data?.length);
            return { data: data || [], error: null };
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for getRoiEntries after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'getRoiEntries');
        }
    },

    async addRoiEntry(userId, entry) {
        if (!userId || !entry) {
            logger.warn('dbService.addRoiEntry: userId or entry is missing.');
            return { data: null, error: { message: "User ID or entry missing." } };
        }
        
        const operation = async () => {
            const preparedEntry = {
                ...entry,
                user_id: userId,
                symbol: entry.symbol || entry.asset_symbol,
                name: entry.name || entry.asset_name,
                quantity: entry.quantity,
                purchase_date: entry.purchase_date,
                purchase_price: entry.purchase_price,
                current_value: entry.current_value,
                wallet_address: entry.wallet_address || null,
                source: entry.source || 'manual'
            };
            logger.debug('dbService.addRoiEntry: Inserting new ROI entry:', preparedEntry);
            const { data, error } = await supabase
                .from('investments')
                .insert(preparedEntry)
                .select();
            
            if (error) {
                 logger.error('dbService.addRoiEntry: Error inserting ROI entry:', error);
                throw error;
            }
            logger.info('dbService.addRoiEntry: Successfully added ROI entry:', data);
            return { data: data?.[0], error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for addRoiEntry after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'addRoiEntry');
        }
    },

    async updateRoiEntry(userId, entryId, entry) {
        if (!userId || !entryId || !entry) {
            logger.warn('dbService.updateRoiEntry: userId, entryId, or entry is missing.');
            return { data: null, error: { message: "User ID, entry ID, or entry data missing." } };
        }
        
        const operation = async () => {
            const preparedEntry = { ...entry };
            delete preparedEntry.id; 
            delete preparedEntry.user_id; 
            delete preparedEntry.created_at;
            
            logger.debug('dbService.updateRoiEntry: Updating ROI entry:', entryId, preparedEntry);
            const { data, error } = await supabase
                .from('investments')
                .update(preparedEntry)
                .eq('id', entryId)
                .eq('user_id', userId)
                .select();

            if (error) {
                logger.error('dbService.updateRoiEntry: Error updating ROI entry:', error);
                throw error;
            }
            logger.info('dbService.updateRoiEntry: Successfully updated ROI entry:', data);
            return { data: data?.[0], error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for updateRoiEntry after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'updateRoiEntry');
        }
    },

    async syncTaxEntries(userId, entries) {
        if (!userId || !entries || entries.length === 0) {
            logger.warn('dbService.syncTaxEntries: userId or entries are missing or empty.');
            return { data: null, error: { message: "User ID or entries missing." } };
        }
        
        const operation = async () => {
            const preparedEntries = entries.map(entry => ({
                ...entry,
                user_id: userId
            }));
            logger.debug('dbService.syncTaxEntries: Upserting tax entries:', preparedEntries);
            const { data, error } = await supabase
                .from('tax_entries')
                .upsert(preparedEntries, {
                    onConflict: 'user_id,asset_symbol,transaction_date,transaction_type,amount,price_usd'
                })
                .select();

            if (error) {
                logger.error('dbService.syncTaxEntries: Error upserting tax entries:', error);
                throw error;
            }
            logger.info('dbService.syncTaxEntries: Successfully upserted tax entries. Count:', data?.length);
            return { data, error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for syncTaxEntries after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'syncTaxEntries');
        }
    },

    async getTaxEntries(userId, startDate, endDate) {
        if (!userId) {
            logger.warn('dbService.getTaxEntries: userId is missing.');
            return { data: [], error: { message: "User ID missing." } };
        }
        
        const operation = async () => {
            logger.debug(`dbService.getTaxEntries: Fetching tax entries for user: ${userId}, startDate: ${startDate}, endDate: ${endDate}`);
            let query = supabase
                .from('tax_entries')
                .select('*')
                .eq('user_id', userId);

            if (startDate) {
                query = query.gte('transaction_date', startDate);
            }
            if (endDate) {
                query = query.lte('transaction_date', endDate);
            }

            const { data, error } = await query.order('transaction_date', { ascending: false });

            if (error) {
                logger.error('dbService.getTaxEntries: Error fetching tax entries:', error);
                throw error;
            }
            logger.info('dbService.getTaxEntries: Successfully fetched tax entries. Count:', data?.length);
            return { data: data || [], error: null };
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for getTaxEntries after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'getTaxEntries');
        }
    },

    async deleteEntries(userId, type, entryIds) {
        if (!userId || !type || !entryIds || entryIds.length === 0) {
            logger.warn('dbService.deleteEntries: userId, type, or entryIds are missing or empty.');
            return { success: false, error: { message: "User ID, type, or entry IDs missing." } };
        }
        
        const operation = async () => {
            const table = type === 'roi' ? 'investments' : 'tax_entries';
            logger.debug(`dbService.deleteEntries: Deleting entries from table ${table}, IDs:`, entryIds);
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', userId)
                .in('id', entryIds);

            if (error) {
                logger.error(`dbService.deleteEntries: Error deleting ${type} entries:`, error);
                throw error;
            }
            logger.info(`dbService.deleteEntries: Successfully deleted ${type} entries.`);
            return { success: true, error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for deleteEntries (${type}) after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, `deleteEntries (${type})`);
        }
    },

    async batchSync(userId, { roiEntries, taxEntries }) {
        const operation = async () => {
            const promises = [];
            if (roiEntries && roiEntries.length > 0) {
                promises.push(dbService.syncRoiEntries(userId, roiEntries));
            }
            if (taxEntries && taxEntries.length > 0) {
                promises.push(dbService.syncTaxEntries(userId, taxEntries));
            }

            if (promises.length === 0) {
                logger.info("dbService.batchSync: No entries to sync.");
                return { roiResult: { data: [], error: null }, taxResult: { data: [], error: null }, errors: [] };
            }
            
            const results = await Promise.allSettled(promises);

            const overallErrors = [];
            let roiResult = { data: null, error: null };
            let taxResult = { data: null, error: null };
            let promiseIndex = 0;

            if (roiEntries && roiEntries.length > 0) {
                if (results[promiseIndex].status === 'fulfilled') {
                    roiResult = results[promiseIndex].value;
                    if(roiResult.error) overallErrors.push({ type: 'roi', error: roiResult.error});
                } else {
                    overallErrors.push({ type: 'roi', error: results[promiseIndex].reason });
                    roiResult.error = results[promiseIndex].reason;
                }
                promiseIndex++;
            }

            if (taxEntries && taxEntries.length > 0) {
                 if (results[promiseIndex].status === 'fulfilled') {
                    taxResult = results[promiseIndex].value;
                    if(taxResult.error) overallErrors.push({ type: 'tax', error: taxResult.error});
                } else {
                    overallErrors.push({ type: 'tax', error: results[promiseIndex].reason });
                    taxResult.error = results[promiseIndex].reason;
                }
            }
            
            if (overallErrors.length > 0) {
                const errorMessages = overallErrors.map(e => `Type ${e.type}: ${(e.error?.message || String(e.error))}`).join('; ');
                logger.error(`dbService.batchSync: Batch synchronization failed with errors: ${errorMessages}`, overallErrors);
                throw new Error(`Batch synchronization failed: ${errorMessages}`);
            }

            logger.info("dbService.batchSync: Batch synchronization successful.");
            return { roiResult, taxResult, errors: [] };
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                maxRetries: 2, 
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for batchSync after error:`, error);
                }
            });
        } catch (error) {
             logger.error('dbService.batchSync: Failed after retries.', error);
             return { 
                roiResult: { data: null, error: error.message.includes("roi") ? error : null }, 
                taxResult: { data: null, error: error.message.includes("tax") ? error : null },
                errors: [error.originalError || error] 
            };
        }
    },

    async getRoiEntries(userId) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('user_id', userId)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entries:', error);
            return { data: null, error };
        }
    },

    async addRoiEntry(userId, investment) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .insert([
                    {
                        user_id: userId,
                        name: investment.name,
                        symbol: investment.symbol,
                        quantity: investment.quantity,
                        purchase_date: investment.purchase_date,
                        purchase_price: investment.purchase_price,
                        current_value: investment.current_value,
                        wallet_address: investment.wallet_address,
                        source: investment.source
                    }
                ])
                .select();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error adding ROI entry:', error);
            return { data: null, error };
        }
    },

    async updateRoiEntry(entryId, investment) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .update({
                    name: investment.name,
                    symbol: investment.symbol,
                    quantity: investment.quantity,
                    purchase_date: investment.purchase_date,
                    purchase_price: investment.purchase_price,
                    current_value: investment.current_value,
                    wallet_address: investment.wallet_address,
                    source: investment.source,
                    updated_at: new Date().toISOString()
                })
                .eq('id', entryId)
                .select();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error updating ROI entry:', error);
            return { data: null, error };
        }
    },

    async deleteRoiEntry(entryId) {
        try {
            const { error } = await supabase
                .from('roi_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            logger.error('Error deleting ROI entry:', error);
            return { error };
        }
    },

    async getRoiEntryById(entryId) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('id', entryId)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entry by ID:', error);
            return { data: null, error };
        }
    },

    async getRoiEntriesBySymbol(userId, symbol) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('user_id', userId)
                .eq('symbol', symbol)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entries by symbol:', error);
            return { data: null, error };
        }
    },

    async getRoiEntriesByDateRange(userId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('purchase_date', startDate)
                .lte('purchase_date', endDate)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entries by date range:', error);
            return { data: null, error };
        }
    },

    async getRoiEntriesByWalletAddress(userId, walletAddress) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('user_id', userId)
                .eq('wallet_address', walletAddress)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entries by wallet address:', error);
            return { data: null, error };
        }
    },

    async getRoiEntriesBySource(userId, source) {
        try {
            const { data, error } = await supabase
                .from('roi_entries')
                .select('*')
                .eq('user_id', userId)
                .eq('source', source)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error fetching ROI entries by source:', error);
            return { data: null, error };
        }
    },

    async updateCurrentValues(userId, priceUpdates) {
        try {
            const updates = Object.entries(priceUpdates).map(([symbol, price]) => ({
                symbol,
                current_value: price
            }));

            const { data, error } = await supabase
                .from('roi_entries')
                .update(updates)
                .eq('user_id', userId)
                .select();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            logger.error('Error updating current values:', error);
            return { data: null, error };
        }
    }
};
