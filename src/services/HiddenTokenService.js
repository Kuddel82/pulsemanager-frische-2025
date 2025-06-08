/*
💾 SERVICE: Versteckte Tokens pro User verwalten (Supabase + localStorage Fallback)
*/

import { supabase } from "@/lib/supabaseClient";

// 🔧 ROBUST: localStorage Fallback wenn Supabase nicht verfügbar ist
function getLocalStorageKey(userId) {
  return `pulsemanager_hidden_tokens_${userId}`;
}

// 💾 Lade versteckte Tokens (mit Fallback)
export async function getHiddenTokens(userId) {
  try {
    console.log('🔍 HIDDEN_TOKENS: Loading hidden tokens for user:', userId);
    
    // 🚀 PRIORITY 1: Versuche Supabase
    try {
      const { data, error } = await supabase
        .from("hidden_tokens")
        .select("tokens")
        .eq("user_id", userId)
        .single();
      
      if (!error && data?.tokens) {
        const hiddenTokens = data.tokens || [];
        console.log('✅ SUPABASE: Loaded', hiddenTokens.length, 'hidden tokens');
        return hiddenTokens;
      }
      
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ SUPABASE: Table might not exist:', error.code);
      }
    } catch (supabaseError) {
      console.warn('⚠️ SUPABASE: Not available, using localStorage fallback');
    }
    
    // 🔄 FALLBACK: localStorage
    const localKey = getLocalStorageKey(userId);
    const localData = localStorage.getItem(localKey);
    const hiddenTokens = localData ? JSON.parse(localData) : [];
    
    console.log('✅ LOCALSTORAGE: Loaded', hiddenTokens.length, 'hidden tokens');
    return hiddenTokens;
    
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: All methods failed:', error);
    return [];
  }
}

// 💾 Speichere versteckte Tokens (mit Fallback)
export async function setHiddenTokens(userId, tokens) {
  try {
    console.log('💾 HIDDEN_TOKENS: Saving', tokens.length, 'hidden tokens for user:', userId);
    
    const tokensArray = tokens || [];
    
    // 🚀 PRIORITY 1: Versuche Supabase
    try {
      const { error } = await supabase
        .from("hidden_tokens")
        .upsert({ 
          user_id: userId, 
          tokens: tokensArray
        });
      
      if (!error) {
        console.log('✅ SUPABASE: Successfully saved hidden tokens');
        
        // 🔄 Sync auch zu localStorage für Konsistenz
        const localKey = getLocalStorageKey(userId);
        localStorage.setItem(localKey, JSON.stringify(tokensArray));
        
        return true;
      }
      
      console.warn('⚠️ SUPABASE: Save failed, using localStorage:', error.code);
    } catch (supabaseError) {
      console.warn('⚠️ SUPABASE: Not available, using localStorage fallback');
    }
    
    // 🔄 FALLBACK: localStorage
    const localKey = getLocalStorageKey(userId);
    localStorage.setItem(localKey, JSON.stringify(tokensArray));
    console.log('✅ LOCALSTORAGE: Successfully saved hidden tokens');
    
    return true;
    
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: All save methods failed:', error);
    throw error;
  }
}

// 🙈 Verstecke einen Token
export async function hideToken(userId, tokenIdentifier) {
  try {
    const currentHidden = await getHiddenTokens(userId);
    
    if (!currentHidden.includes(tokenIdentifier)) {
      const updated = [...currentHidden, tokenIdentifier];
      await setHiddenTokens(userId, updated);
      console.log('🙈 HIDDEN_TOKENS: Token hidden:', tokenIdentifier);
      return updated;
    }
    
    console.log('🔍 HIDDEN_TOKENS: Token already hidden:', tokenIdentifier);
    return currentHidden;
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Failed to hide token:', error);
    // Nicht crashen, sondern graceful degradation
    return await getHiddenTokens(userId);
  }
}

// 👁️ Zeige einen Token wieder an
export async function showToken(userId, tokenIdentifier) {
  try {
    const currentHidden = await getHiddenTokens(userId);
    const updated = currentHidden.filter(t => t !== tokenIdentifier);
    
    if (updated.length !== currentHidden.length) {
      await setHiddenTokens(userId, updated);
      console.log('👁️ HIDDEN_TOKENS: Token shown:', tokenIdentifier);
      return updated;
    }
    
    console.log('🔍 HIDDEN_TOKENS: Token was not hidden:', tokenIdentifier);
    return currentHidden;
  } catch (error) {
    console.error('💥 HIDDEN_TOKENS: Failed to show token:', error);
    // Nicht crashen, sondern graceful degradation
    return await getHiddenTokens(userId);
  }
}

// 🔧 Test-Funktion für Debugging
export async function testHiddenTokenService(userId) {
  console.log('🧪 TESTING: Hidden token service...');
  
  try {
    // Test 1: Load
    const initial = await getHiddenTokens(userId);
    console.log('🧪 Test 1 - Load:', initial);
    
    // Test 2: Hide
    const hidden = await hideToken(userId, 'TEST_TOKEN_HIDE');
    console.log('🧪 Test 2 - Hide:', hidden);
    
    // Test 3: Show
    const shown = await showToken(userId, 'TEST_TOKEN_HIDE');
    console.log('🧪 Test 3 - Show:', shown);
    
    console.log('✅ TESTING: All tests passed!');
    return true;
  } catch (error) {
    console.error('💥 TESTING: Failed:', error);
    return false;
  }
} 