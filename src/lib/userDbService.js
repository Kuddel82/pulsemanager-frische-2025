import { supabase } from './supabaseClient';
import { logger } from '@/lib/logger';

export const userDbService = {
    async getUserAuthDataByEmail(email) {
        if (!email) {
            logger.warn('userDbService.getUserAuthDataByEmail: Email is missing');
            return { data: null, error: { message: "Email missing" } };
        }
        
        try {
            // Check current session first
            const { data: { user }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                logger.warn('userDbService.getUserAuthDataByEmail: Session error:', sessionError);
            }

            if (user && user.email && user.email.toLowerCase() === email.toLowerCase()) {
                logger.info('userDbService.getUserAuthDataByEmail: Email matches current user');
                return { data: user, error: null };
            }
            
            // Special case for owner
            if (email.toLowerCase() === 'dkuddel@web.de') {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, email, raw_user_meta_data')
                    .in('email', [email.toLowerCase(), email]) 
                    .single(); 
                
                if (error && error.code !== 'PGRST116') {
                    logger.error('userDbService.getUserAuthDataByEmail: Error fetching owner:', error);
                    return { data: null, error };
                }

                logger.info('userDbService.getUserAuthDataByEmail: Successfully fetched owner data');
                return { data, error: null };
            }
            
            logger.warn('userDbService.getUserAuthDataByEmail: Cannot fetch auth data for arbitrary emails');
            return { data: null, error: { message: "Cannot fetch auth data for arbitrary emails" } };
        } catch (error) {
            logger.error('userDbService.getUserAuthDataByEmail: Unexpected error:', error);
            return { data: null, error };
        }
    },

    async updateUserPremiumStatus(email, isPremium, premiumUntil) {
        if (!email) {
            logger.warn('userDbService.updateUserPremiumStatus: Email is missing');
            return { success: false, error: { message: "Email missing" } };
        }

        try {
            // Set premium duration
            let determinedPremiumUntil = premiumUntil;
            if (email.toLowerCase() === 'dkuddel@web.de' && isPremium) {
                determinedPremiumUntil = '2099-12-31'; // Owner gets permanent premium
            } else if (isPremium && !premiumUntil) {
                determinedPremiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            const newMetaData = {
                is_premium: isPremium,
                premium_until: isPremium ? determinedPremiumUntil : null,
            };
            
            logger.debug(`userDbService.updateUserPremiumStatus: Updating ${email} to premium: ${isPremium}`);

            // Check if current user
            const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                logger.warn('userDbService.updateUserPremiumStatus: Session error:', sessionError);
            }

            if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
                const { data, error } = await supabase.auth.updateUser({
                    data: newMetaData
                });
                
                if (error) {
                    logger.error('userDbService.updateUserPremiumStatus: Error updating current user:', error);
                    return { success: false, error };
                }

                logger.info('userDbService.updateUserPremiumStatus: Successfully updated current user premium status');
                return { success: true, data: data.user, error: null };
            }
            
            // Special case for owner
            if (email.toLowerCase() === 'dkuddel@web.de') {
                const { data: users, error: fetchErr } = await supabase
                    .from('users') 
                    .select('id, raw_user_meta_data')
                    .in('email', [email.toLowerCase(), email])
                    .single();

                let existingMetaData = {};
                if (users && users.raw_user_meta_data) {
                    existingMetaData = users.raw_user_meta_data;
                }

                const finalMetaData = { ...existingMetaData, ...newMetaData };

                const { error: updateError } = await supabase
                    .from('users')
                    .update({ 
                        raw_user_meta_data: finalMetaData, 
                        updated_at: new Date().toISOString() 
                    })
                    .in('email', [email.toLowerCase(), email]);

                if (updateError) {
                    logger.error('userDbService.updateUserPremiumStatus: Error updating owner via SQL:', updateError);
                    return { success: false, error: updateError };
                }

                logger.info('userDbService.updateUserPremiumStatus: Successfully updated owner premium status');
                return { success: true, data: { email, ...finalMetaData }, error: null };
            }

            logger.error('userDbService.updateUserPremiumStatus: Cannot update arbitrary users');
            return { success: false, error: { message: "Cannot update arbitrary users" } };
        } catch (error) {
            logger.error('userDbService.updateUserPremiumStatus: Unexpected error:', error);
            return { success: false, error };
        }
    },

    async getUserProfile(userId) {
        if (!userId) {
            logger.warn('userDbService.getUserProfile: userId is missing');
            return { data: null, error: { message: "User ID missing" } };
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                logger.error('userDbService.getUserProfile: Error fetching profile:', error);
                return { data: null, error };
            }

            if (!data) {
                logger.info('userDbService.getUserProfile: No profile found for user:', userId);
                return { data: null, error: null }; 
            }

            logger.info('userDbService.getUserProfile: Successfully fetched user profile');
            return { data, error: null };
        } catch (error) {
            logger.error('userDbService.getUserProfile: Unexpected error:', error);
            return { data: null, error };
        }
    },

    async updateUserProfile(userId, profileData) {
        if (!userId || !profileData) {
            logger.warn('userDbService.updateUserProfile: Missing userId or profileData');
            return { data: null, error: { message: "User ID or profile data missing" } };
        }
        
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .update(profileData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                logger.error('userDbService.updateUserProfile: Error updating profile:', error);
                return { data: null, error };
            }

            logger.info('userDbService.updateUserProfile: Successfully updated user profile');
            return { data, error: null };
        } catch (error) {
            logger.error('userDbService.updateUserProfile: Unexpected error:', error);
            return { data: null, error };
        }
    },

    async ensureUserProfile(userId, email) {
        if (!userId) {
            logger.warn('userDbService.ensureUserProfile: userId is missing');
            return { data: null, error: { message: 'User ID is required' } };
        }

        try {
            // Check if profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('id, subscription_status, trial_ends_at, stripe_customer_id')
                .eq('id', userId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                logger.error('userDbService.ensureUserProfile: Error fetching existing profile:', fetchError);
                return { data: null, error: fetchError };
            }

            if (existingProfile) {
                logger.info('userDbService.ensureUserProfile: Profile already exists');
                return { data: existingProfile, error: null, created: false };
            }

            // Create new profile
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 7);

            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    email: email, 
                    subscription_status: 'trialing',
                    trial_ends_at: trialEndDate.toISOString(),
                })
                .select()
                .single();
            
            if (insertError) {
                logger.error('userDbService.ensureUserProfile: Error creating new profile:', insertError);
                return { data: null, error: insertError };
            }

            logger.info('userDbService.ensureUserProfile: Successfully created new profile');
            return { data: newProfile, error: null, created: true };
        } catch (error) {
            logger.error('userDbService.ensureUserProfile: Unexpected error:', error);
            return { data: null, error };
        }
    }
};