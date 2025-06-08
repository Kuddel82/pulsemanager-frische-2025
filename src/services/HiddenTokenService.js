/*
💾 SERVICE: Supabase-Daten für versteckte Tokens pro User verwalten
*/

import { supabase } from "@/lib/supabaseClient";

export async function getHiddenTokens(userId) {
  try {
    console.log('🔍 HIDDEN_TOKENS: Loading hidden tokens for user:', userId);
    
    const { data, error } = await supabase
      .from("hidden_tokens")
      .select("tokens")
      .eq("user_id", userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
      console.error('❌ HIDDEN_TOKENS: Error loading:', error);
      return [];
    }
    
    const hiddenTokens = data?.tokens || [];
    console.log('✅ HIDDEN_TOKENS: Loaded', hiddenTokens.length, 'hidden tokens');
    return hiddenTokens;
    
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Unexpected error:', error);
    return [];
  }
}

export async function setHiddenTokens(userId, tokens) {
  try {
    console.log('💾 HIDDEN_TOKENS: Saving', tokens.length, 'hidden tokens for user:', userId);
    
    const { error } = await supabase
      .from("hidden_tokens")
      .upsert({ 
        user_id: userId, 
        tokens: tokens || []
      });
    
    if (error) {
      console.error('❌ HIDDEN_TOKENS: Error saving:', error);
      throw error;
    }
    
    console.log('✅ HIDDEN_TOKENS: Successfully saved hidden tokens');
    return true;
    
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Failed to save:', error);
    throw error;
  }
}

export async function hideToken(userId, tokenIdentifier) {
  try {
    const currentHidden = await getHiddenTokens(userId);
    
    if (!currentHidden.includes(tokenIdentifier)) {
      const updated = [...currentHidden, tokenIdentifier];
      await setHiddenTokens(userId, updated);
      console.log('🙈 HIDDEN_TOKENS: Token hidden:', tokenIdentifier);
      return updated;
    }
    
    return currentHidden;
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Failed to hide token:', error);
    throw error;
  }
}

export async function showToken(userId, tokenIdentifier) {
  try {
    const currentHidden = await getHiddenTokens(userId);
    const updated = currentHidden.filter(t => t !== tokenIdentifier);
    
    if (updated.length !== currentHidden.length) {
      await setHiddenTokens(userId, updated);
      console.log('👁️ HIDDEN_TOKENS: Token shown:', tokenIdentifier);
    }
    
    return updated;
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Failed to show token:', error);
    throw error;
  }
} 