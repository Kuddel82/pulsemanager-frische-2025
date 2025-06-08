// Cache invalidation - 2024-03-19
import { supabase } from './supabaseClient';
import { logger } from '@/lib/logger';
import { userDbService } from './userDbService';

export const dbService = {
    
    // 👤 User services
    getUserAuthDataByEmail: userDbService.getUserAuthDataByEmail,
    updateUserPremiumStatus: userDbService.updateUserPremiumStatus,
    getUserProfile: userDbService.getUserProfile,
    updateUserProfile: userDbService.updateUserProfile,
    ensureUserProfile: userDbService.ensureUserProfile,

    // 💰 ROI/Investment entries
    async getRoiEntries(userId) {
        if (!userId) {
            logger.warn('dbService.getRoiEntries: userId is missing');
            return { data: [], error: { message: "User ID missing" } };
        }

        try {
            const { data, error } = await supabase
                .from('investments')
                .select('*')
                .eq('user_id', userId)
                .order('purchase_date', { ascending: false });

            if (error) {
                logger.error('dbService.getRoiEntries: Error fetching entries:', error);
                return { data: [], error };
            }

            logger.info(`dbService.getRoiEntries: Fetched ${data?.length || 0} entries`);
            return { data: data || [], error: null };
        } catch (error) {
            logger.error('dbService.getRoiEntries: Unexpected error:', error);
            return { data: [], error };
        }
    },

    async addRoiEntry(userId, entry) {
        if (!userId || !entry) {
            logger.warn('dbService.addRoiEntry: Missing userId or entry');
            return { data: null, error: { message: "User ID or entry missing" } };
        }
        
        try {
            const preparedEntry = {
                user_id: userId,
                symbol: entry.symbol,
                name: entry.name,
                quantity: entry.quantity,
                purchase_date: entry.purchase_date,
                purchase_price: entry.purchase_price,
                current_value: entry.current_value,
                wallet_address: entry.wallet_address || null,
                source: entry.source || 'manual'
            };

            const { data, error } = await supabase
                .from('investments')
                .insert(preparedEntry)
                .select()
                .single();
            
            if (error) {
                logger.error('dbService.addRoiEntry: Error inserting entry:', error);
                return { data: null, error };
            }

            logger.info('dbService.addRoiEntry: Successfully added entry');
            return { data, error: null };
        } catch (error) {
            logger.error('dbService.addRoiEntry: Unexpected error:', error);
            return { data: null, error };
        }
    },

    async updateRoiEntry(userId, entryId, entry) {
        if (!userId || !entryId || !entry) {
            logger.warn('dbService.updateRoiEntry: Missing parameters');
            return { data: null, error: { message: "Missing required parameters" } };
        }
        
        try {
            const updateData = { ...entry };
            delete updateData.id;
            delete updateData.user_id;
            delete updateData.created_at;
            
            const { data, error } = await supabase
                .from('investments')
                .update(updateData)
                .eq('id', entryId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                logger.error('dbService.updateRoiEntry: Error updating entry:', error);
                return { data: null, error };
            }

            logger.info('dbService.updateRoiEntry: Successfully updated entry');
            return { data, error: null };
        } catch (error) {
            logger.error('dbService.updateRoiEntry: Unexpected error:', error);
            return { data: null, error };
        }
    },

    async deleteRoiEntry(userId, entryId) {
        if (!userId || !entryId) {
            logger.warn('dbService.deleteRoiEntry: Missing userId or entryId');
            return { error: { message: "User ID or entry ID missing" } };
        }

        try {
            const { error } = await supabase
                .from('investments')
                .delete()
                .eq('id', entryId)
                .eq('user_id', userId);

            if (error) {
                logger.error('dbService.deleteRoiEntry: Error deleting entry:', error);
                return { error };
            }

            logger.info('dbService.deleteRoiEntry: Successfully deleted entry');
            return { error: null };
        } catch (error) {
            logger.error('dbService.deleteRoiEntry: Unexpected error:', error);
            return { error };
        }
    },

    // 🔄 Sync operations
    async syncRoiEntries(userId, entries) {
        if (!userId || !entries || entries.length === 0) {
            logger.warn('dbService.syncRoiEntries: Missing parameters or empty entries');
            return { data: null, error: { message: "User ID or entries missing" } };
        }
        
        try {
            const preparedEntries = entries.map(entry => ({
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
            
            const { data, error } = await supabase
                .from('investments')
                .upsert(preparedEntries, {
                    onConflict: 'user_id,symbol,wallet_address'
                })
                .select();

            if (error) {
                logger.error('dbService.syncRoiEntries: Error upserting entries:', error);
                return { data: null, error };
            }

            logger.info(`dbService.syncRoiEntries: Successfully synced ${data?.length || 0} entries`);
            return { data, error: null };
        } catch (error) {
            logger.error('dbService.syncRoiEntries: Unexpected error:', error);
            return { data: null, error };
        }
    },

    // 📊 Tax entries
    async getTaxEntries(userId, startDate = null, endDate = null) {
        if (!userId) {
            logger.warn('dbService.getTaxEntries: userId is missing');
            return { data: [], error: { message: "User ID missing" } };
        }
        
        try {
            let query = supabase
                .from('tax_entries')
                .select('*')
                .eq('user_id', userId);

            if (startDate) query = query.gte('transaction_date', startDate);
            if (endDate) query = query.lte('transaction_date', endDate);

            const { data, error } = await query.order('transaction_date', { ascending: false });

            if (error) {
                logger.error('dbService.getTaxEntries: Error fetching entries:', error);
                return { data: [], error };
            }

            logger.info(`dbService.getTaxEntries: Fetched ${data?.length || 0} tax entries`);
            return { data: data || [], error: null };
        } catch (error) {
            logger.error('dbService.getTaxEntries: Unexpected error:', error);
            return { data: [], error };
        }
    },

    async syncTaxEntries(userId, entries) {
        if (!userId || !entries || entries.length === 0) {
            logger.warn('dbService.syncTaxEntries: Missing parameters or empty entries');
            return { data: null, error: { message: "User ID or entries missing" } };
        }
        
        try {
            const preparedEntries = entries.map(entry => ({
                ...entry,
                user_id: userId
            }));

            const { data, error } = await supabase
                .from('tax_entries')
                .upsert(preparedEntries, {
                    onConflict: 'user_id,asset_symbol,transaction_date,transaction_type,amount,price_usd'
                })
                .select();

            if (error) {
                logger.error('dbService.syncTaxEntries: Error upserting tax entries:', error);
                return { data: null, error };
            }

            logger.info(`dbService.syncTaxEntries: Successfully synced ${data?.length || 0} tax entries`);
            return { data, error: null };
        } catch (error) {
            logger.error('dbService.syncTaxEntries: Unexpected error:', error);
            return { data: null, error };
        }
    }
};
