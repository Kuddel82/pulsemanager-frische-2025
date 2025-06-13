import { userDbService } from './userDbService'; 
import { logger } from './logger';

export const checkPremiumStatus = async (email) => {
  if (!email) {
    logger.warn('checkPremiumStatus: Email is required.');
    return false;
  }

  try {
    
    const { data: userData, error: userError } = await userDbService.getUserAuthDataByEmail(email);

    if (userError) {
      logger.error(`checkPremiumStatus: Error fetching user data for ${email}:`, userError);
      return false; 
    }
    
    if (!userData) {
      logger.info(`checkPremiumStatus: No user found for email ${email}.`);
      if (email.toLowerCase() === 'dkuddel@web.de' || email.toLowerCase() === 'phi_bel@yahoo.de') {
        logger.info(`checkPremiumStatus: Special case for premium user ${email}, attempting to grant premium.`);
        
        const { success, error: updateError } = await userDbService.updateUserPremiumStatus(email, true, '2099-12-31');
        if (updateError) {
          logger.error(`checkPremiumStatus: Failed to grant premium to ${email} (user initially not found):`, updateError);
          return false;
        }
        return success;
      }
      return false;
    }

    const userMetaData = userData.raw_user_meta_data || userData.user_metadata || {};
    const isCurrentlyPremium = userMetaData.is_premium === true;
    const premiumUntilDate = userMetaData.premium_until ? new Date(userMetaData.premium_until) : null;
    const isSubscriptionValid = premiumUntilDate && premiumUntilDate > new Date();

    let finalPremiumStatus = isCurrentlyPremium && isSubscriptionValid;
    
    logger.debug(`checkPremiumStatus for ${email}: MetaData:`, userMetaData, `IsCurrentlyPremium: ${isCurrentlyPremium}, PremiumUntil: ${premiumUntilDate}, IsSubscriptionValid: ${isSubscriptionValid}, FinalInitialStatus: ${finalPremiumStatus}`);

    if (!finalPremiumStatus && (email.toLowerCase() === 'dkuddel@web.de' || email.toLowerCase() === 'phi_bel@yahoo.de')) {
      logger.info(`checkPremiumStatus: Special case for premium user ${email}. Current status is non-premium or expired. Granting/extending premium.`);
      
      const { success, error: updateError } = await userDbService.updateUserPremiumStatus(email, true, '2099-12-31');
      if (updateError) {
        logger.error(`checkPremiumStatus: Failed to grant/extend premium to ${email}:`, updateError);
        return false; 
      }
      logger.info(`checkPremiumStatus: Successfully granted/extended premium to ${email}. New status: ${success}`);
      return success;
    }

    logger.info(`checkPremiumStatus for ${email}: Final premium status is ${finalPremiumStatus}`);
    return finalPremiumStatus;

  } catch (error) {
    logger.error(`checkPremiumStatus: Unexpected error for email ${email}:`, error);
    return false;
  }
};
