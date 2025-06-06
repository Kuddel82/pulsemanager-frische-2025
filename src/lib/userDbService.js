import { supabase } from '@/lib/supabaseClient';
// Build cache fix - ensure named import is recognized
import { logger } from '@/lib/logger';
import { retryOperation, retryStrategies, RetryError } from '@/lib/retryService';

const handleRetryError = (error, operationName) => {
    logger.error(`userDbService.${operationName}: Failed after retries.`, error instanceof RetryError ? error.originalError : error);
    const finalError = error instanceof RetryError ? error.originalError : error;
    return { 
        data: finalError && 'data' in finalError ? finalError.data : null, 
        error: finalError, 
        success: false 
    };
};

export const userDbService = {
    async getUserAuthDataByEmail(email) {
        if (!email) {
            logger.warn('userDbService.getUserAuthDataByEmail: Email is missing.');
            return { data: null, error: { message: "Email missing." } };
        }
        
        const operation = async () => {
            logger.debug(`userDbService.getUserAuthDataByEmail: Attempting to fetch user auth data for email: ${email}`);
            
            const { data: { user }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                logger.warn(`userDbService.getUserAuthDataByEmail: Error getting current session:`, sessionError);
            }

            if (user && user.email && user.email.toLowerCase() === email.toLowerCase()) {
                logger.info(`userDbService.getUserAuthDataByEmail: Email matches current authenticated user. Returning current user data.`);
                return { data: user, error: null };
            }
            
            logger.warn(`userDbService.getUserAuthDataByEmail: Email does not match current user or no active session. Client-side fetching of arbitrary user auth data by email is restricted for security. This will only work if RLS allows or for specific hardcoded cases.`);


            if (email.toLowerCase() === 'dkuddel@web.de') {
                 logger.info(`userDbService.getUserAuthDataByEmail: Special case for dkuddel@web.de. Attempting direct fetch from auth.users (requires appropriate RLS or admin rights if used in a secure context).`);
                 const { data, error } = await supabase
                    .from('users')
                    .select('id, email, raw_user_meta_data')
                    .in('email', [email.toLowerCase(), email]) 
                    .single(); 
                
                if (error && error.code !== 'PGRST116') { 
                    logger.error(`userDbService.getUserAuthDataByEmail: Error fetching special case user dkuddel@web.de:`, error);
                    throw error;
                }
                if (!data && error?.code === 'PGRST116') {
                    logger.info(`userDbService.getUserAuthDataByEmail: Special case user dkuddel@web.de not found in auth.users table (PGRST116).`);
                     return { data: null, error: null };
                }
                 if (!data && !error) {
                    logger.info(`userDbService.getUserAuthDataByEmail: Special case user dkuddel@web.de not found in auth.users table (no error).`);
                    return { data: null, error: null };
                }
                logger.info(`userDbService.getUserAuthDataByEmail: Successfully fetched special case user dkuddel@web.de.`);
                return { data, error: null };
            }
            
            logger.warn(`userDbService.getUserAuthDataByEmail: Could not fetch auth data for ${email} as it's not the current user and not a special case.`);
            return { data: null, error: { message: "Cannot fetch auth data for arbitrary emails client-side." } };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                maxRetries: 1, 
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for getUserAuthDataByEmail after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'getUserAuthDataByEmail');
        }
    },

    async updateUserPremiumStatus(email, isPremium, premiumUntil) {
        if (!email) {
            logger.warn('userDbService.updateUserPremiumStatus: Email is missing.');
            return { success: false, error: { message: "Email missing." } };
        }

        const operation = async () => {
            let determinedPremiumUntil = premiumUntil;
            if (email.toLowerCase() === 'dkuddel@web.de' && isPremium) {
                determinedPremiumUntil = '2099-12-31';
            } else if (isPremium && !premiumUntil) {
                determinedPremiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            }

            const newMetaData = {
                is_premium: isPremium,
                premium_until: isPremium ? determinedPremiumUntil : null,
            };
            
            logger.debug(`userDbService.updateUserPremiumStatus: Attempting to update premium status for ${email} to ${isPremium}, until: ${newMetaData.premium_until}`);

            const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getSession();
             if (sessionError) {
                logger.warn(`userDbService.updateUserPremiumStatus: Error getting current session:`, sessionError);
            }

            if (currentUser && currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
                logger.info(`userDbService.updateUserPremiumStatus: Updating premium status for current authenticated user ${email}.`);
                const { data, error } = await supabase.auth.updateUser({
                    data: newMetaData
                });
                if (error) {
                    logger.error(`userDbService.updateUserPremiumStatus: Error updating current user's metadata:`, error);
                    throw error;
                }
                logger.info(`userDbService.updateUserPremiumStatus: Successfully updated current user's premium status:`, data.user?.raw_user_meta_data);
                return { success: true, data: data.user, error: null };
            }
            
            if (email.toLowerCase() === 'dkuddel@web.de') {
                logger.info(`userDbService.updateUserPremiumStatus: Special case for dkuddel@web.de. Using direct SQL update on auth.users.`);
                
                const { data: users, error: fetchErr } = await supabase
                    .from('users') 
                    .select('id, raw_user_meta_data')
                    .in('email', [email.toLowerCase(), email])
                    .single();

                if (fetchErr && fetchErr.code !== 'PGRST116') { 
                     logger.error(`userDbService.updateUserPremiumStatus: Error fetching dkuddel@web.de before update:`, fetchErr);
                     throw fetchErr;
                }
                
                let existingMetaData = {};
                if (users && users.raw_user_meta_data) {
                    existingMetaData = users.raw_user_meta_data;
                } else if (users && !users.raw_user_meta_data) {
                    logger.warn(`userDbService.updateUserPremiumStatus: User dkuddel@web.de found but raw_user_meta_data is null or undefined. Initializing.`);
                } else if (!users && fetchErr?.code === 'PGRST116') {
                    logger.info(`userDbService.updateUserPremiumStatus: User dkuddel@web.de not found during fetch (PGRST116), will attempt update anyway if RLS allows insert/update based on email.`);
                } else if (!users && !fetchErr) {
                     logger.info(`userDbService.updateUserPremiumStatus: User dkuddel@web.de not found during fetch (no error), will attempt update anyway if RLS allows insert/update based on email.`);
                }


                const finalMetaData = { ...existingMetaData, ...newMetaData };

                const { error: updateError } = await supabase
                    .from('users')
                    .update({ raw_user_meta_data: finalMetaData, updated_at: new Date().toISOString() })
                    .in('email', [email.toLowerCase(), email]);


                if (updateError) {
                    logger.error(`userDbService.updateUserPremiumStatus: Error updating premium status for dkuddel@web.de via SQL:`, updateError);
                    throw updateError;
                }
                logger.info(`userDbService.updateUserPremiumStatus: Successfully updated premium status for dkuddel@web.de via SQL.`);
                const updatedUserFetch = await supabase.from('users').select('id, email, raw_user_meta_data').eq('email', email.toLowerCase()).single();

                return { success: true, data: updatedUserFetch.data, error: null };
            }

            logger.error(`userDbService.updateUserPremiumStatus: Cannot update premium status for ${email}. Not current user and not special case.`);
            throw new Error("Cannot update premium status for arbitrary emails client-side without admin rights.");
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                maxRetries: 1,
                 onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for updateUserPremiumStatus after error:`, error);
                }
            });
        } catch (error) {
            const finalError = error instanceof RetryError ? error.originalError : error;
            logger.error(`userDbService.updateUserPremiumStatus: Failed for ${email} after retries.`, finalError);
            return { success: false, error: finalError };
        }
    },

    async getUserProfile(userId) {
        if (!userId) {
            logger.warn('userDbService.getUserProfile: userId is missing.');
            return { data: null, error: { message: "User ID missing." } };
        }

        const operation = async () => {
            logger.debug('userDbService.getUserProfile: Fetching user profile for user:', userId);
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { 
                logger.error('userDbService.getUserProfile: Error fetching user profile:', error);
                throw error;
            }
            if (!data) {
                 logger.info('userDbService.getUserProfile: No profile found for user:', userId);
                 return { data: null, error: null }; 
            }
            logger.info('userDbService.getUserProfile: Successfully fetched user profile.');
            return { data, error: null };
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for getUserProfile after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'getUserProfile');
        }
    },

    async updateUserProfile(userId, profileData) {
         if (!userId || !profileData) {
            logger.warn('userDbService.updateUserProfile: userId or profileData is missing.');
            return { data: null, error: { message: "User ID or profile data missing." } };
        }
        
        const operation = async () => {
            logger.debug('userDbService.updateUserProfile: Updating user profile:', userId, profileData);
            const { data, error } = await supabase
                .from('user_profiles')
                .update(profileData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                logger.error('userDbService.updateUserProfile: Error updating user profile:', error);
                throw error;
            }
            logger.info('userDbService.updateUserProfile: Successfully updated user profile:', data);
            return { data, error: null };
        };

        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for updateUserProfile after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'updateUserProfile');
        }
    },

    async ensureUserProfile(userId, email) {
        if (!userId) {
            logger.warn('userDbService.ensureUserProfile: userId is missing.');
            return { data: null, error: { message: 'User ID is required' } };
        }

        const operation = async () => {
            logger.debug(`userDbService.ensureUserProfile: Ensuring profile exists for userId: ${userId}`);
            
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('id, subscription_status, trial_ends_at, stripe_customer_id')
                .eq('id', userId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                logger.error('userDbService.ensureUserProfile: Error fetching existing profile:', fetchError);
                throw fetchError;
            }

            if (existingProfile) {
                logger.info('userDbService.ensureUserProfile: Profile already exists for user:', userId, existingProfile);
                return { data: existingProfile, error: null, created: false };
            }

            logger.info('userDbService.ensureUserProfile: No existing profile. Creating one for user:', userId);
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
                throw insertError;
            }

            logger.info('userDbService.ensureUserProfile: Successfully created new profile for user:', userId, newProfile);
            return { data: newProfile, error: null, created: true };
        };
        
        try {
            return await retryOperation(operation, {
                ...retryStrategies.database,
                 onRetry: (error, attempt) => {
                    logger.warn(`Retry attempt ${attempt} for ensureUserProfile after error:`, error);
                }
            });
        } catch (error) {
            return handleRetryError(error, 'ensureUserProfile');
        }
    }
};