// 🔧 CHATGPT DEBUG PATCHES
// Integration der Debug-Patches für Portfolio, ROI und Transaction Handling

/**
 * 📦 PORTFOLIO DEBUG PATCH
 * Validiert Portfolio-Daten und filtert fehlerhafte Einträge
 */
export function debugPortfolioData(data) {
  console.log("📦 DEBUG: PortfolioData Raw:", data);
  if (!Array.isArray(data)) {
    console.error("❌ PortfolioData ist kein Array!");
    return [];
  }
  return data.filter(entry => entry?.symbol && entry?.usdValue !== undefined);
}

/**
 * 📈 ROI DEBUG HOTFIX
 * Validiert ROI-Daten und filtert fehlerhafte Einträge
 */
export function debugRoiData(data) {
  console.log("📈 DEBUG: ROI Data Raw:", data);
  if (!Array.isArray(data)) {
    console.error("❌ ROI Data ist kein Array!");
    return [];
  }
  return data.filter(entry => entry?.token && entry?.gainPercent !== undefined);
}

/**
 * 📄 TAX CURSOR LOOP PATCH  
 * Holt alle Transaktionen mit Pagination-Cursor
 */
export async function fetchAllTransactions(apiCall) {
  let allResults = [];
  let cursor = null;

  do {
    const result = await apiCall({ cursor });
    console.log("📄 DEBUG: Fetched batch with", result.result.length, "entries");
    allResults.push(...result.result);
    cursor = result.pagination?.cursor;
  } while (cursor);

  console.log("✅ DEBUG: All transactions fetched:", allResults.length);
  return allResults;
}

/**
 * 🔍 ENHANCED WALLET DEBUG
 * Erweiterte Wallet-Loading Debug-Funktionen
 */
export function debugWalletLoad(wallets, userId) {
  console.log("🔍 WALLET DEBUG START:", {
    userId,
    walletsCount: wallets?.length || 0,
    walletsType: Array.isArray(wallets) ? 'array' : typeof wallets,
    firstWallet: wallets?.[0] ? {
      address: wallets[0].address?.slice(0, 8) + '...',
      chainId: wallets[0].chain_id,
      isActive: wallets[0].is_active
    } : null
  });

  if (!Array.isArray(wallets)) {
    console.error("❌ WALLET DEBUG: Wallets ist kein Array!");
    return [];
  }

  const validWallets = wallets.filter(wallet => {
    const isValid = wallet?.address && wallet?.user_id === userId && wallet?.is_active;
    if (!isValid) {
      console.warn("⚠️ WALLET DEBUG: Invalid wallet filtered out:", {
        hasAddress: !!wallet?.address,
        userIdMatch: wallet?.user_id === userId,
        isActive: wallet?.is_active
      });
    }
    return isValid;
  });

  console.log("✅ WALLET DEBUG RESULT:", {
    inputCount: wallets.length,
    validCount: validWallets.length,
    filteredOut: wallets.length - validWallets.length
  });

  return validWallets;
}

/**
 * 🎯 TOKEN BALANCE DEBUG
 * Debug-Funktionen für Token-Balance-Probleme
 */
export function debugTokenBalance(token, index) {
  console.log(`🪙 TOKEN DEBUG [${index}]:`, {
    symbol: token.symbol,
    hasBalance: !!token.balance,
    balanceType: typeof token.balance,
    balanceValue: token.balance,
    hasPrice: !!token.price,
    priceValue: token.price,
    hasValue: !!token.value,
    calculatedValue: token.value,
    contractAddress: token.contractAddress?.slice(0, 8) + '...'
  });

  // Validiere Token-Daten
  const issues = [];
  
  if (!token.symbol) issues.push("Missing symbol");
  if (!token.balance && token.balance !== 0) issues.push("Missing balance");
  if (!token.contractAddress) issues.push("Missing contract address");
  if (typeof token.balance === 'string' && token.balance.includes('NaN')) issues.push("NaN in balance");
  
  if (issues.length > 0) {
    console.warn(`⚠️ TOKEN DEBUG ISSUES [${token.symbol}]:`, issues);
  }

  return issues.length === 0;
}

/**
 * 💾 CACHE DEBUG HELPER
 * Debug-Funktionen für Cache-Probleme
 */
export function debugCacheData(cacheResult, source) {
  console.log(`💾 CACHE DEBUG [${source}]:`, {
    success: cacheResult.success,
    fromCache: cacheResult.fromCache,
    hasData: !!cacheResult.data,
    dataType: typeof cacheResult.data,
    reason: cacheResult.reason,
    lastUpdate: cacheResult.lastUpdate,
    totalValue: cacheResult.data?.totalValue,
    tokenCount: cacheResult.data?.tokenCount,
    walletCount: cacheResult.data?.walletCount
  });

  if (cacheResult.success && cacheResult.data) {
    const data = cacheResult.data;
    
    // Validiere Cache-Daten-Struktur
    const cacheIssues = [];
    
    if (!data.totalValue && data.totalValue !== 0) cacheIssues.push("Missing totalValue");
    if (!data.tokens || !Array.isArray(data.tokens)) cacheIssues.push("Invalid tokens array");
    if (!data.wallets || !Array.isArray(data.wallets)) cacheIssues.push("Invalid wallets array");
    
    if (cacheIssues.length > 0) {
      console.warn(`⚠️ CACHE DEBUG ISSUES [${source}]:`, cacheIssues);
    }
    
    return cacheIssues.length === 0;
  }
  
  return false;
}

/**
 * 🔄 MORALIS API DEBUG
 * Debug-Funktionen für Moralis API Probleme
 */
export function debugMoralisResponse(response, endpoint, wallet) {
  console.log(`🔄 MORALIS DEBUG [${endpoint}] [${wallet?.slice(0, 8)}...]:`, {
    hasResult: !!response.result,
    resultType: Array.isArray(response.result) ? 'array' : typeof response.result,
    resultLength: Array.isArray(response.result) ? response.result.length : 'N/A',
    hasError: !!response.error,
    hasStatus: !!response.status,
    status: response.status,
    hasCursor: !!response.cursor,
    hasJsonResponse: !!response.jsonResponse
  });

  // Check for common Moralis response issues
  const moralisIssues = [];
  
  if (!response.result && !response.error) moralisIssues.push("No result or error in response");
  if (response.status === '0' || response.status === 'NOTOK') moralisIssues.push("API returned error status");
  if (response.result && Array.isArray(response.result) && response.result.length === 0) moralisIssues.push("Empty result array");
  
  if (moralisIssues.length > 0) {
    console.warn(`⚠️ MORALIS DEBUG ISSUES [${endpoint}]:`, moralisIssues);
  }
  
  return moralisIssues.length === 0;
} 