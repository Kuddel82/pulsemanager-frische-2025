import { supabase } from '@/lib/supabaseClient';

export interface PremiumUser {
  email: string;
  is_premium: boolean;
  premium_until: string | null;
  special_access: boolean;
}

class PremiumService {
  private static instance: PremiumService;
  private specialUsers = new Set(['dkuddel@web.de']);

  private constructor() {}

  static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  async initializePremiumAccess(): Promise<void> {
    try {
      // Spezielle Benutzer mit unbegrenztem Premium-Zugang
      for (const email of this.specialUsers) {
        const { data: user } = await supabase.auth.admin.getUserByEmail(email);
        if (user) {
          await this.setPremiumAccess(user.id, true, null, true);
        }
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren des Premium-Zugangs:', error);
      throw error;
    }
  }

  async setPremiumAccess(
    userId: string,
    isPremium: boolean,
    premiumUntil: string | null,
    specialAccess: boolean = false
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          is_premium: isPremium,
          premium_until: premiumUntil,
          special_access: specialAccess,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Setzen des Premium-Zugangs:', error);
      throw error;
    }
  }

  async getPremiumStatus(userId: string): Promise<PremiumUser | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Fehler beim Abrufen des Premium-Status:', error);
      throw error;
    }
  }

  isSpecialUser(email: string): boolean {
    return this.specialUsers.has(email);
  }
}

export const premiumService = PremiumService.getInstance(); 