import { supabase } from './supabase';
import { userDbService } from './userDbService';
import { checkPremiumStatus } from './userService'; 
import { logger } from './logger';

export const authService = {
  async signIn(email, password) {
    logger.info(`authService.signIn: Attempting login for ${email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error(`authService.signIn: Supabase auth error for ${email}:`, error);
        throw error;
      }

      if (data.user) {
        logger.info(`authService.signIn: Login successful for ${email}. User ID: ${data.user.id}. Ensuring user profile.`);
        await userDbService.ensureUserProfile(data.user.id, data.user.email);
        
        logger.info(`authService.signIn: Checking and potentially updating premium status for ${email}.`);
        const isPremium = await checkPremiumStatus(email);
        logger.info(`authService.signIn: Premium status for ${email} after check/update: ${isPremium}`);
        
        const { data: userProfileData, error: profileError } = await userDbService.getUserProfile(data.user.id);
        if (profileError) {
            logger.warn(`authService.signIn: Could not fetch user profile for ${data.user.id} after sign in:`, profileError);
        }

        const combinedUser = { 
            ...data.user, 
            is_premium: isPremium, 
            premium_until: (email.toLowerCase() === 'dkuddel@web.de' && isPremium) ? '2099-12-31' : (data.user?.user_metadata?.premium_until || data.user?.raw_user_meta_data?.premium_until),
            profile: userProfileData 
        };
        return { user: combinedUser, session: data.session };

      } else {
        logger.warn(`authService.signIn: Login successful for ${email} but no user data returned in 'data.user'. This case should be investigated.`);
        return data; 
      }

    } catch (error) {
      logger.error(`authService.signIn: Catch-all error during login for ${email}:`, error);
      throw error;
    }
  },

  async signUp(email, password) {
    logger.info(`authService.signUp: Attempting registration for ${email}`);
    try {
      const options = {};
      if (email.toLowerCase() === 'dkuddel@web.de') {
        logger.info(`authService.signUp: Special registration for ${email}. Setting premium status in user metadata.`);
        options.data = {
          is_premium: true,
          premium_until: '2099-12-31',
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });

      if (error) {
        logger.error(`authService.signUp: Supabase auth error during registration for ${email}:`, error);
        throw error;
      }

      if (data.user) {
        logger.info(`authService.signUp: Registration successful for ${email}. User ID: ${data.user.id}. Ensuring user profile.`);
        const { data: profileData, error: profileError, created } = await userDbService.ensureUserProfile(data.user.id, email);
        if (profileError) {
          logger.error(`authService.signUp: Failed to ensure user profile for ${data.user.id} after sign up:`, profileError);
        } else {
          logger.info(`authService.signUp: User profile ensured for ${data.user.id}. Created: ${created}`);
        }
         
        const combinedUser = {
            ...data.user,
            is_premium: data.user?.user_metadata?.is_premium || data.user?.raw_user_meta_data?.is_premium,
            premium_until: data.user?.user_metadata?.premium_until || data.user?.raw_user_meta_data?.premium_until,
            profile: profileData
        };
        return { user: combinedUser, session: data.session };
      } else {
         logger.warn(`authService.signUp: Registration successful for ${email} but no user data returned. This should be investigated.`);
         return data; 
      }

    } catch (error) {
      logger.error(`authService.signUp: Catch-all error during registration for ${email}:`, error);
      throw error;
    }
  },

  async signOut() {
    logger.info('authService.signOut: Attempting logout.');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('authService.signOut: Supabase auth error during logout:', error);
        throw error;
      }
      logger.info('authService.signOut: Logout successful.');
    } catch (error) {
      logger.error('authService.signOut: Catch-all error during logout:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    logger.debug('authService.getCurrentUser: Attempting to get current user.');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        logger.error('authService.getCurrentUser: Error getting session:', sessionError);
        throw sessionError;
      }

      if (!session || !session.user) {
        logger.info('authService.getCurrentUser: No active session or user in session.');
        return null;
      }
      
      const user = session.user;
      logger.info(`authService.getCurrentUser: Active session found for user ID: ${user.id}, Email: ${user.email}`);

      const { data: userProfileData, error: profileError } = await userDbService.getUserProfile(user.id);
      if (profileError) {
        logger.warn(`authService.getCurrentUser: Could not fetch user profile for ${user.id}:`, profileError);
      }
      
      const isPremium = await checkPremiumStatus(user.email);
      logger.info(`authService.getCurrentUser: Premium status for ${user.email} is ${isPremium}.`);
      
      const combinedUser = {
        ...user,
        is_premium: isPremium,
        premium_until: user.user_metadata?.premium_until || user.raw_user_meta_data?.premium_until, 
        profile: userProfileData || null,
      };
      
      logger.debug('authService.getCurrentUser: Returning combined user data:', { id: combinedUser.id, email: combinedUser.email, is_premium: combinedUser.is_premium, profile_id: combinedUser.profile?.id });
      return combinedUser;

    } catch (error) {
      logger.error('authService.getCurrentUser: Catch-all error:', error);
      throw error;
    }
  },

  async onAuthStateChange(callback) {
    logger.debug('authService.onAuthStateChange: Subscribing to auth state changes.');
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info(`authService.onAuthStateChange: Auth event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        logger.info(`authService.onAuthStateChange: User SIGNED_IN. User ID: ${session.user.id}. Ensuring profile and checking premium.`);
        await userDbService.ensureUserProfile(session.user.id, session.user.email);
        const isPremium = await checkPremiumStatus(session.user.email);
        
        const { data: userProfileData, error: profileError } = await userDbService.getUserProfile(session.user.id);
        if (profileError) logger.warn(`authService.onAuthStateChange (SIGNED_IN): Could not fetch profile for ${session.user.id}:`, profileError);

        const userWithPremium = { 
            ...session.user, 
            is_premium: isPremium, 
            premium_until: session.user.user_metadata?.premium_until || session.user.raw_user_meta_data?.premium_until,
            profile: userProfileData
        };
        callback(event, { ...session, user: userWithPremium });

      } else if (event === 'SIGNED_OUT') {
        logger.info('authService.onAuthStateChange: User SIGNED_OUT.');
        callback(event, null);
      } else if (event === 'USER_UPDATED' && session?.user) {
        logger.info(`authService.onAuthStateChange: User USER_UPDATED. User ID: ${session.user.id}. Re-checking premium.`);
        const isPremium = await checkPremiumStatus(session.user.email);

        const { data: userProfileData, error: profileError } = await userDbService.getUserProfile(session.user.id);
        if (profileError) logger.warn(`authService.onAuthStateChange (USER_UPDATED): Could not fetch profile for ${session.user.id}:`, profileError);
        
        const userWithPremium = { 
            ...session.user, 
            is_premium: isPremium, 
            premium_until: session.user.user_metadata?.premium_until || session.user.raw_user_meta_data?.premium_until,
            profile: userProfileData
        };
        callback(event, { ...session, user: userWithPremium });
      } else if (event === 'PASSWORD_RECOVERY') {
        logger.info('authService.onAuthStateChange: PASSWORD_RECOVERY event.');
         callback(event, session);
      } else if (event === 'TOKEN_REFRESHED') {
         logger.info('authService.onAuthStateChange: TOKEN_REFRESHED event.');
         callback(event, session);
      } else {
        logger.debug(`authService.onAuthStateChange: Unhandled event '${event}' or no session/user. Passing through.`);
        callback(event, session);
      }
    });
    return () => {
      logger.debug('authService.onAuthStateChange: Unsubscribing from auth state changes.');
      authListener.subscription.unsubscribe();
    };
  }
};