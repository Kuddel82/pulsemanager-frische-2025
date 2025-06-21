import React, { useState, useEffect, useRef } from 'react';
import { FileText, AlertTriangle, Info, Download, Wallet, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

// 🔥🔥🔥 COMPONENT LOADED TEST 🔥🔥🔥
console.log("🔥🔥🔥 TAX REPORT COMPONENT LOADED! 🔥🔥🔥");

// 🧪 EMERGENCY TEST FUNCTION - ENHANCED
window.testDirectAPI = async () => {
  console.log('🧪 Testing german-tax-report API with explicit address...');
  
  const address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';
  
  try {
    // TEST 1: GET Request
    console.log('🧪 Test 1: GET Request');
    const getResponse = await fetch(`/api/german-tax-report?address=${address}`);
    const getData = await getResponse.json();
    
    console.log('📊 GET Response:', {
      status: getResponse.status,
      success: getData.success,
      transactionCount: getData.taxReport?.transactions?.length || 0,
      error: getData.error
    });
    
    // TEST 2: POST Request
    console.log('🧪 Test 2: POST Request');
    const postResponse = await fetch('/api/german-tax-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ address })
    });
    const postData = await postResponse.json();
    
    console.log('📊 POST Response:', {
      status: postResponse.status,
      success: postData.success,
      transactionCount: postData.taxReport?.transactions?.length || 0,
      error: postData.error
    });
    
    return { getData, postData };
    
  } catch (error) {
    console.error('❌ Direct API Test failed:', error);
  }
};

// 🧪 AUTO-TEST BEIM LOAD
if (typeof window !== 'undefined') {
  console.log('🧪 Enhanced test function loaded. Call: testDirectAPI()');
}

// 🔥 FIXED API CALL FUNCTION
const fixedApiCall = async (address) => {
  console.log('🔥 Making API call with address:', address);
  
  const response = await fetch('/api/german-tax-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      address: address,
      limit: 300000,
      format: 'json'
    })
  });
  
  const data = await response.json();
  console.log('📊 API Response:', data);
  
  return data;
};

// 🧪 EXPORT FÜR TESTING
if (typeof window !== 'undefined') {
  window.fixedApiCall = fixedApiCall;
  console.log('🔥 Fixed API call function loaded. Call: fixedApiCall("0x...")');
}

// 🧪 API PARAMETER DISCOVERY FUNCTION
window.discoverWorkingAPI = async () => {
  console.log('🧪 DISCOVERING WORKING MORALIS-V2 API PARAMETERS...');
  
  const address = '0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a';
  const baseUrl = '/api/moralis-v2';
  
  // 🎯 PARAMETER COMBINATIONS TO TEST
  const testCombinations = [
    // Known working patterns (based on your existing API)
    { chain: 'eth', type: 'balance', description: 'ETH Balance' },
    { chain: 'pls', type: 'balance', description: 'PLS Balance' },
    { chain: 'eth', type: 'erc20', description: 'ETH ERC20 Tokens' },
    { chain: 'pls', type: 'erc20', description: 'PLS ERC20 Tokens' },
    
    // Try variations
    { chain: 'eth', endpoint: 'balance', description: 'ETH Balance (endpoint param)' },
    { chain: 'pls', endpoint: 'balance', description: 'PLS Balance (endpoint param)' },
    { chain: 'eth', endpoint: 'erc20', description: 'ETH ERC20 (endpoint param)' },
    { chain: 'pls', endpoint: 'erc20', description: 'PLS ERC20 (endpoint param)' },
    
    // Try transactions
    { chain: 'eth', type: 'transactions', description: 'ETH Transactions' },
    { chain: 'pls', type: 'transactions', description: 'PLS Transactions' },
    { chain: 'eth', endpoint: 'transactions', description: 'ETH Transactions (endpoint)' },
    { chain: 'pls', endpoint: 'transactions', description: 'PLS Transactions (endpoint)' },
    
    // Try transfers
    { chain: 'eth', type: 'transfers', description: 'ETH Transfers' },
    { chain: 'pls', type: 'transfers', description: 'PLS Transfers' },
    { chain: 'eth', endpoint: 'transfers', description: 'ETH Transfers (endpoint)' },
    { chain: 'pls', endpoint: 'transfers', description: 'PLS Transfers (endpoint)' },
    
    // Try without specific type/endpoint
    { chain: 'eth', description: 'ETH Default' },
    { chain: 'pls', description: 'PLS Default' },
    
    // Try different chain formats
    { chain: '0x1', type: 'erc20', description: 'ETH Hex Chain ERC20' },
    { chain: '0x171', type: 'erc20', description: 'PLS Hex Chain ERC20' },
  ];
  
  const results = [];
  
  for (const combo of testCombinations) {
    try {
      // Build URL
      const params = new URLSearchParams({ address });
      if (combo.chain) params.append('chain', combo.chain);
      if (combo.type) params.append('type', combo.type);
      if (combo.endpoint) params.append('endpoint', combo.endpoint);
      
      const url = `${baseUrl}?${params.toString()}`;
      
      console.log(`🧪 Testing: ${combo.description}`);
      console.log(`📡 URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      const result = {
        description: combo.description,
        params: combo,
        status: response.status,
        success: data?.success || false,
        resultCount: data?.result?.length || 0,
        hasResult: !!data?.result,
        error: data?.error || null,
        sampleData: data?.result?.[0] || null
      };
      
      results.push(result);
      
      // Log result
      const status = response.status === 200 ? '✅' : '❌';
      console.log(`${status} ${combo.description}: ${response.status} - ${result.resultCount} items`);
      
      if (result.resultCount > 0) {
        console.log(`🎯 SUCCESS! ${combo.description} returned ${result.resultCount} items`);
        console.log('📊 Sample data:', result.sampleData);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error testing ${combo.description}:`, error);
      results.push({
        description: combo.description,
        params: combo,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // SUMMARY
  console.log('\n🎯 DISCOVERY RESULTS SUMMARY:');
  console.log('==============================');
  
  const working = results.filter(r => r.status === 200 && r.resultCount > 0);
  const partial = results.filter(r => r.status === 200 && r.resultCount === 0);
  const failed = results.filter(r => r.status !== 200);
  
  console.log(`✅ WORKING ENDPOINTS (${working.length}):`, working.map(r => r.description));
  console.log(`⚠️ EMPTY RESPONSES (${partial.length}):`, partial.map(r => r.description));
  console.log(`❌ FAILED ENDPOINTS (${failed.length}):`, failed.map(r => r.description));
  
  if (working.length > 0) {
    console.log('\n🔥 WORKING PARAMETER PATTERNS:');
    working.forEach(w => {
      console.log(`- ${w.description}: ${JSON.stringify(w.params)} → ${w.resultCount} items`);
    });
  }
  
  return { working, partial, failed, all: results };
};

console.log('🧪 API Parameter Discovery loaded!');
console.log('📋 To discover working parameters: discoverWorkingAPI()');
console.log('🎯 This will test all possible parameter combinations and show which ones work!');

const SimpleTaxTracker = () => {
  const { user } = useAuth();
  
  // 🔥🔥🔥 COMPONENT RENDER TEST 🔥🔥🔥
  console.log("🔥🔥🔥 TAX REPORT COMPONENT RENDERED! 🔥🔥🔥");
  
  // 🚨 NUCLEAR OPTION: Automatischer Hard-Refresh bei Template-Literalen
  useEffect(() => {
    const checkForTemplateLiterals = () => {
      const elements = document.querySelectorAll('.pulse-stat-value');
      let hasTemplateLiterals = false;
      
      elements.forEach(el => {
        const text = el.textContent || el.innerText;
        if (text.includes('{taxData.summary') || text.includes('{formatCurrency')) {
          hasTemplateLiterals = true;
          console.log('🚨 TEMPLATE LITERAL ERKANNT:', text);
        }
      });
      
      if (hasTemplateLiterals) {
        console.log('🚨 NUCLEAR OPTION: Template-Literale erkannt - Hard-Refresh...');
        // Hard-Refresh mit Cache-Busting
        window.location.reload(true);
      }
    };
    
    // Prüfe nach 2 Sekunden (nach dem Rendering)
    setTimeout(checkForTemplateLiterals, 2000);
  }, []);
  
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);
  const [error, setError] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [dbWallets, setDbWallets] = useState([]);
  const [reportGenerated, setReportGenerated] = useState(false);

  // 🔥 VERHINDERE MEHRFACHE API-CALLS - ERWEITERT
  const abortControllerRef = useRef(null);
  const isRequestInProgressRef = useRef(false);
  const currentRequestTokenRef = useRef(null);

  // 🎯 WALLET INTEGRATION: Lade Wallets direkt aus Datenbank
  const loadWalletsFromDatabase = async () => {
    if (!user?.id) return;
    
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Wallet-Abfrage Fehler:', error);
        return;
      }

      setDbWallets(wallets || []);
      
      // Automatisch erste Wallet setzen (OHNE API-Aufruf!)
      if (wallets && wallets.length > 0 && !walletAddress) {
        const firstWallet = wallets[0].address;
        setWalletAddress(firstWallet);
        console.log('✅ Wallet automatisch geladen:', firstWallet.slice(0, 8) + '...');
        // KEIN AUTOMATISCHER API-AUFRUF MEHR!
      }
      
    } catch (error) {
      console.error('💥 Fehler beim Laden der Wallets:', error);
    }
  };

  // Lade Wallets beim Start
  useEffect(() => {
    console.log("🔥🔥🔥 USE EFFECT TRIGGERED! 🔥🔥🔥");
    if (user?.id) {
      loadWalletsFromDatabase();
    }
  }, [user?.id]);

  // 🔥🔥🔥 TAX DATA USE EFFECT 🔥🔥🔥
  useEffect(() => {
    console.log("🔥 USE EFFECT TRIGGERED! taxReport:", !!taxData);
    if (taxData) {
      console.log("🚨🚨🚨 FRONTEND API RESPONSE:", taxData);
      console.log("🚨 ERSTE TRANSAKTION:", taxData.transactions?.[0]);
      console.log("🚨 ERSTE VALUE:", taxData.transactions?.[0]?.valueFormatted);
      console.log("🚨 ERSTE VALUE RAW:", taxData.transactions?.[0]?.value);
      console.log("🚨 ERSTE TOKEN SYMBOL:", taxData.transactions?.[0]?.tokenSymbol);
    }
  }, [taxData]);

  const hasConnectedWallets = dbWallets.length > 0;
  const connectedWallets = dbWallets.map(w => w.address);

  const handleWalletSelect = (address) => {
    setWalletAddress(address);
    // Reset report data when wallet changes
    setTaxData(null);
    setReportGenerated(false);
    setError(null);
  };

  // 🔥 EMERGENCY CACHE BUSTING - VERHINDERT STATUS 304
  const clearAllCaches = async () => {
    try {
      console.log('🧹 STARTE CACHE BUSTING...');
      
      // Browser Cache leeren
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🧹 Browser Cache geleert:', cacheNames);
      }
      
      // Service Worker Cache leeren
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('🧹 Service Worker Cache geleert');
      }
      
      // Local Storage für Tax-Report leeren
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('tax') || key.includes('report')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Local Storage Tax-Daten geleert');
      
      // ✅ SUCCESS MESSAGE - BESSER ALS ALERT
      console.log('✅ Cache erfolgreich geleert!');
      
      // Zeige Erfolg in Console und setze einen visuellen Indikator
      const successDiv = document.createElement('div');
      successDiv.innerHTML = '✅ Cache erfolgreich geleert!';
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(successDiv);
      
      // Entferne nach 3 Sekunden
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 3000);
      
    } catch (error) {
      console.error('❌ Cache-Busting Fehler:', error);
      
      // Zeige Fehler als Toast-Nachricht
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `❌ Fehler beim Cache leeren: ${error.message}`;
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
      `;
      document.body.appendChild(errorDiv);
      
      // Entferne nach 5 Sekunden
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    }
  };

  const handleGenerateReport = async () => {
    if (!walletAddress.trim()) {
      setError('Bitte geben Sie eine Wallet-Adresse ein.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTaxData(null);

    // 🔑 UNIQUE REQUEST TOKEN FÜR CACHE BUSTING - AUSSERHALB TRY BLOCK
    const requestToken = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔑 REQUEST TOKEN: ${requestToken}`);
    
    // 🔑 SETZE CURRENT REQUEST TOKEN REF
    currentRequestTokenRef.current = requestToken;
    
    // 🔥 SETZE REQUEST IN PROGRESS
    isRequestInProgressRef.current = true;

    try {
      // 🔥 EMERGENCY CACHE BUSTING VOR API CALL
      await clearAllCaches();
      
      // 🚨 ABORT CONTROLLER FÜR TIMEOUT
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      console.log('🔥🔥🔥 STEUERREPORT: NEUE WALLET HISTORY API 🔥🔥🔥');
      console.log(`🔍 DEBUG: Processing wallet address: ${walletAddress}`);
      console.log(`🌐 API ENDPOINT: /api/german-tax-report`);
      console.log(`🔑 REQUEST TOKEN: ${requestToken}`);
      console.log(`⏰ TIMESTAMP: ${new Date().toISOString()}`);
      console.log(`🧹 CACHE STATUS: Browser Cache geleert vor API Call`);
      
      // 🇩🇪 NEUE WALLET HISTORY API - BESSERE PERFORMANCE
      const response = await fetch('/api/german-tax-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          address: walletAddress,
          limit: 300000, // 🔥 ERHÖHT: 300.000 Transaktionen für große Wallets!
          requestToken: requestToken // 🔑 REQUEST TOKEN FÜR DEDUPLICATION
        }),
        signal: abortControllerRef.current.signal, // 🔥 ABORT SIGNAL
        cache: 'no-cache' // 🔥 VERHINDERE CACHING
      });

      // 🔥 RESPONSE DEBUG - PRÜFE CACHING
      console.log(`📡 RESPONSE STATUS: ${response.status}`);
      console.log(`📡 RESPONSE HEADERS:`, Object.fromEntries(response.headers.entries()));
      console.log(`📡 CACHE STATUS: ${response.headers.get('cache-control') || 'kein cache-control header'}`);
      
      if (response.status === 304) {
        console.error('🚨 STATUS 304 DETECTED - CACHED RESPONSE!');
        throw new Error('Cached Response - Bitte Cache leeren und erneut versuchen');
      }

      // 🔑 PRÜFE OB DIESER REQUEST NOCH AKTUELL IST
      if (currentRequestTokenRef.current !== requestToken) {
        console.log('🚫 Request wurde durch neueren Request ersetzt, ignoriere...');
        return;
      }

      const data = await response.json();
      
      // 🔥🔥🔥 API RESPONSE DEBUG 🔥🔥🔥
      console.log("🚨🚨🚨 API RESPONSE RECEIVED:", data);
      console.log("🚨 DATA TYPE:", typeof data);
      console.log("🚨 TAX REPORT TYPE:", typeof data.taxReport);
      console.log("🚨 TAX REPORT KEYS:", data.taxReport ? Object.keys(data.taxReport) : 'N/A');
      console.log("🚨 SUMMARY TYPE:", typeof data.taxReport?.summary);
      console.log("🚨 SUMMARY KEYS:", data.taxReport?.summary ? Object.keys(data.taxReport.summary) : 'N/A');
      console.log("🚨 SUMMARY VALUES:", data.taxReport?.summary);
      console.log("🚨 TRANSACTIONS TYPE:", typeof data.taxReport?.transactions);
      console.log("🚨 TRANSACTIONS LENGTH:", data.taxReport?.transactions?.length);
      console.log("🚨 FIRST TRANSACTION:", data.taxReport?.transactions?.[0]);
      
      // 🔥 HANDLE NULL RESPONSES - KRITISCHER FIX!
      if (data.taxReport === null) {
        console.log("🚨 API returned null - deduplicated request!");
        setError("API-Request wurde dedupliziert. Bitte warte einen Moment und versuche es erneut.");
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Laden der Steuerdaten');
      }

      // 🔥🔥🔥 DETAILLIERTER API DEBUG 🔥🔥🔥
      console.log("🚨 API SUCCESS:", data.success);
      console.log("🚨 TAX REPORT EXISTS:", !!data.taxReport);
      console.log("🚨 TAX REPORT TYPE:", typeof data.taxReport);
      console.log("🚨 TAX REPORT KEYS:", data.taxReport ? Object.keys(data.taxReport) : 'N/A');
      console.log("🚨 TRANSACTIONS EXISTS:", !!data.taxReport?.transactions);
      console.log("🚨 TRANSACTIONS LENGTH:", data.taxReport?.transactions?.length);
      console.log("🚨 FIRST TRANSACTION:", data.taxReport?.transactions?.[0]);
      
      console.log("🚨 ERSTE TRANSAKTION:", data.taxReport?.transactions?.[0]);
      console.log("🚨 ERSTE VALUE:", data.taxReport?.transactions?.[0]?.valueFormatted);
      console.log("🚨 ERSTE VALUE RAW:", data.taxReport?.transactions?.[0]?.value);
      console.log("🚨 ERSTE AMOUNT:", data.taxReport?.transactions?.[0]?.amount);
      console.log("🚨 ERSTE TOKEN:", data.taxReport?.transactions?.[0]?.tokenSymbol);
      
      console.log('✅ Neue Wallet History API erfolgreich geladen:', data.taxReport);
      
      // 🚨 EMERGENCY DEBUG: Was kommt von der API?
      console.log("🚨🚨🚨 FRONTEND API RESPONSE DEBUG 🚨🚨🚨");
      console.log("🚨 Full API Response:", data);
      console.log("🚨 taxReport received:", data.taxReport?.summary);
      console.log("🚨 transactions count:", data.taxReport?.transactions?.length);
      console.log("🚨 first 3 transactions:", data.taxReport?.transactions?.slice(0, 3));
      
      // 🚨 SPEZIFISCHER DEBUG: ETH-Werte
      const ethTransactions = data.taxReport?.transactions?.filter(tx => 
        tx.tokenSymbol === 'ETH' || tx.tokenSymbol === 'NATIVE'
      ).slice(0, 5);
      console.log("🚨 ETH Transactions (first 5):", ethTransactions);
      
      // 🚨 GLOBAL DEBUG: Speichere für Browser Console
      window.lastTaxReport = data.taxReport;
      window.lastTaxReportRaw = data;
      console.log("🚨 Tax Report saved to window.lastTaxReport");
      
      setTaxData(data.taxReport);
      setReportGenerated(true);

    } catch (error) {
      // 🔥 IGNORIERE ABORT ERRORS
      if (error.name === 'AbortError') {
        console.log('🚫 Request wurde abgebrochen');
        return;
      }
      
      console.error('❌ Fehler:', error);
      setError(`Fehler: ${error.message}`);
    } finally {
      // 🔑 NUR CLEANUP WENN DIESER REQUEST NOCH AKTUELL IST
      if (currentRequestTokenRef.current === requestToken) {
        setIsLoading(false);
        isRequestInProgressRef.current = false;
      }
    }
  };

  // Manueller PDF Download
  const handleDownloadPDF = async () => {
    if (!taxData) {
      alert('Keine Steuerdaten verfügbar');
      return;
    }

    try {
      console.log('📄 Generiere PDF für Steuerreport...');
      
      // 🔥 EINFACHE HTML ZU PDF LÖSUNG
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const walletShort = walletAddress.slice(0, 8);
      
      // HTML Content erstellen
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>PulseManager Steuerreport</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .stats { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .stat { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .legal { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🇩🇪 PulseManager Steuerreport</h1>
            <p>Wallet: ${walletAddress}</p>
            <p>Generiert am: ${today.toLocaleDateString('de-DE')}</p>
          </div>
          
          <div class="section">
            <h2>📊 Steuer-Übersicht</h2>
            <div class="stats">
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {taxData.summary?.totalTransactions || taxData.transactions?.length || 0}
                </div>
                <div className="pulse-stat-label">Transaktionen</div>
              </div>
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {taxData.summary?.roiCount || 0}
                </div>
                <div className="pulse-stat-label">Steuer-Events</div>
              </div>
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.summary?.totalROIValueEUR || 0)}
                </div>
                <div className="pulse-stat-label">Gesamte Gewinne</div>
              </div>
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {formatCurrency(taxData.summary?.totalTaxEUR || 0)}
                </div>
                <div className="pulse-stat-label">Grobe Steuerlast</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>📋 Transaktionen (${taxData.transactions.length} von ${taxData.transactions.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Chain</th>
                  <th>Token</th>
                  <th>Typ</th>
                  <th>Richtung</th>
                  <th>Wert</th>
                </tr>
              </thead>
              <tbody>
                ${taxData.transactions.map((tx, index) => {
                  const date = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('de-DE') : 'N/A';
                  const chain = tx.sourceChainShort || (tx.sourceChain === 'Ethereum' ? 'ETH' : tx.sourceChain === 'PulseChain' ? 'PLS' : 'UNK');
                  const token = tx.tokenSymbol || 'N/A';
                  const direction = tx.directionIcon || (tx.direction === 'in' ? '📥 IN' : '📤 OUT');
                  const value = tx.formattedValue || (tx.value ? (Number(parseFloat(tx.value) / Math.pow(10, tx.tokenDecimal || 18)) || 0).toFixed(6) : '0');
                  return `
                    <tr>
                      <td>${date}</td>
                      <td>${chain}</td>
                      <td>${token}</td>
                      <td>${tx.isPrinter ? (
                        <span className="text-green-400 font-bold">
                          🎯 {tx.taxCategory}
                        </span>
                      ) : (
                        tx.taxCategory || 'N/A'
                      )}</td>
                      <td>${direction}</td>
                      <td>${value}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="legal">
            <h3>⚖️ Rechtlicher Hinweis</h3>
            <p>Dieser Steuerreport dient nur zu Informationszwecken und stellt keine Steuerberatung dar.</p>
            <p>Für Ihre finale Steuererklärung müssen Sie einen qualifizierten Steuerberater konsultieren.</p>
            <p>Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.</p>
            <p><strong>Generiert von PulseManager</strong></p>
          </div>
        </body>
        </html>
      `;
      
      // 📁 AUTOMATISCH IN DOWNLOADS-ORDNER SPEICHERN
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseManager_Steuerreport_${walletShort}_${dateStr}.html`;
      
      // 🎯 AUTOMATISCH KLICKEN UND SPEICHERN
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('📄 HTML-Report erfolgreich generiert:', a.download);
      alert(`✅ Steuerreport erfolgreich heruntergeladen!\n📁 Datei: ${a.download}\n📂 Ort: Downloads-Ordner\n💡 Öffnen Sie die HTML-Datei und drucken Sie sie als PDF!`);
      
    } catch (error) {
      console.error('❌ Report-Generierung Fehler:', error);
      alert(`❌ Fehler bei Report-Generierung: ${error.message}`);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen pulse-bg p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header - Richtiges PulseChain Style */}
        <div className="text-center mb-8">
          <h1 className="pulse-title mb-4">
            🇩🇪 Steuer-Tracker
          </h1>
          <p className="pulse-subtitle">
            Echte Blockchain-Daten für deine Steuererklärung
          </p>
        </div>

        {/* Wichtiger Disclaimer - PulseChain Style */}
        <div className="pulse-card mb-6 border-l-4" style={{borderLeftColor: 'var(--accent-green)'}}>
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 mr-3 mt-0.5" style={{color: 'var(--accent-green)'}} />
            <div>
              <h3 className="text-lg font-semibold pulse-text mb-2">
                ⚠️ Wichtiger Hinweis
              </h3>
              <p className="pulse-text-secondary">
                <strong>Diese Berechnung ist nur eine grobe Orientierung!</strong><br/>
                Für deine finale Steuererklärung MUSST du einen Steuerberater konsultieren. 
                Wir übernehmen keine Verantwortung für steuerliche Entscheidungen.
              </p>
            </div>
          </div>
        </div>

        {/* Main Card - PulseChain Style */}
        <div className="pulse-card mb-6">
          
          {/* 🎯 WALLET AUSWAHL: Einfach und sauber */}
          <div className="mb-6 space-y-4">
            
            {/* Verbundene Wallets anzeigen */}
            {hasConnectedWallets && (
              <div>
                <label className="block text-sm font-medium pulse-text mb-2 flex items-center">
                  <Wallet className="h-4 w-4 mr-2" style={{color: 'var(--accent-green)'}} />
                  Deine Wallets ({connectedWallets.length})
                </label>
                
                {/* Einzelne Wallet - Automatisch ausgewählt */}
                {connectedWallets.length === 1 && (
                  <div className="p-3 rounded-lg border-2" style={{
                    backgroundColor: 'rgba(0, 255, 85, 0.1)',
                    borderColor: 'var(--accent-green)'
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm pulse-text">
                          {formatAddress(connectedWallets[0])}
                        </div>
                        <div className="text-xs pulse-text-secondary">
                          ✅ Automatisch geladen
                        </div>
                      </div>
                      <div className="text-green-500">✓</div>
                    </div>
                  </div>
                )}
                
                {/* Mehrere Wallets - Auswahl */}
                {connectedWallets.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {connectedWallets.map((address, index) => (
                      <button
                        key={index}
                        onClick={() => handleWalletSelect(address)}
                        className="p-3 rounded-lg text-left transition-all border-2"
                        style={{
                          backgroundColor: walletAddress === address ? 'rgba(0, 255, 85, 0.1)' : 'var(--bg-secondary)',
                          borderColor: walletAddress === address ? 'var(--accent-green)' : 'var(--border-color)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm pulse-text">
                              {formatAddress(address)}
                            </div>
                            <div className="text-xs pulse-text-secondary">
                              Wallet #{index + 1}
                            </div>
                          </div>
                          {walletAddress === address && (
                            <div className="text-green-500">✓</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Keine Wallets - Einfacher Hinweis */}
            {!hasConnectedWallets && (
              <div className="p-4 rounded-lg border-2 border-dashed" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}>
                <div className="text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2" style={{color: 'var(--accent-green)'}} />
                  <p className="pulse-text mb-3">
                    <strong>Keine Wallet gefunden</strong><br/>
                    Gehe zum Dashboard und verbinde deine Wallet
                  </p>
                </div>
              </div>
            )}
            
            {/* Manuelle Eingabe - Immer verfügbar */}
            <div>
              <label className="block text-sm font-medium pulse-text mb-2">
                {hasConnectedWallets ? 'Andere Wallet verwenden:' : 'Wallet-Adresse eingeben:'}
              </label>
              <input 
                type="text" 
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x308e77281612bdc267d5feaf4599f2759cb3ed85"
                className="w-full px-4 py-3 rounded-lg text-lg transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-green)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 255, 85, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Generate Button - PulseChain Style */}
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={handleGenerateReport}
              disabled={isLoading || !walletAddress.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Lade Steuerdaten...
                </>
              ) : (
                <>
                  📊 Steuerbericht generieren
                </>
              )}
            </Button>
            
            {/* 🔥 EMERGENCY CACHE CLEAR BUTTON */}
            <Button 
              onClick={async () => {
                const button = event.target;
                const originalText = button.innerHTML;
                button.innerHTML = '🧹 Leere Cache...';
                button.disabled = true;
                
                try {
                  await clearAllCaches();
                  button.innerHTML = '✅ Cache geleert!';
                  setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                } catch (error) {
                  button.innerHTML = '❌ Fehler!';
                  setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
              title="Cache komplett leeren (Emergency Fix)"
            >
              🧹 Cache leeren
            </Button>
          </div>

          {/* What happens info - PulseChain Style */}
          <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5" style={{color: 'var(--accent-green)'}} />
              <div className="text-sm pulse-text-secondary">
                <strong>Was passiert:</strong> Wir laden alle deine Transaktionen von Moralis & anderen APIs, 
                berechnen grob die steuerlichen Auswirkungen nach deutschem Recht und erstellen einen PDF-Report.
              </div>
            </div>
          </div>
        </div>

        {/* Error Display - PulseChain Style */}
        {error && (
          <div className="pulse-card mb-6 border-l-4" style={{borderLeftColor: 'var(--accent-pink)'}}>
            <div className="flex">
              <div style={{color: 'var(--accent-pink)'}}>❌</div>
              <div className="ml-3 pulse-text">{error}</div>
            </div>
          </div>
        )}

        {/* Results - PulseChain Style */}
        {taxData && (
          <div className="pulse-card">
            {/* 🔥🔥🔥 RENDERING DEBUG 🔥🔥🔥 */}
            {(() => {
              console.log("🚨 TAX REPORT RENDERING - taxData exists:", !!taxData);
              console.log("🚨 TAX REPORT RENDERING - transactions count:", taxData.transactions?.length);
              console.log("🚨 TAX REPORT RENDERING - summary exists:", !!taxData.summary);
              return null;
            })()}
            
            <h2 className="text-2xl font-bold pulse-text-gradient mb-6 text-center">
              📊 Deine Steuer-Übersicht
            </h2>
            
            {/* Stats Grid - NUCLEAR OPTION - KOMPLETT NEU */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {/* ECHTE DATEN STATT TEMPLATE LITERALS */}
                  {taxData.summary?.totalTransactions || taxData.transactions?.length || 0}
                </div>
                <div className="pulse-stat-label">Transaktionen</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {/* ECHTE DATEN STATT TEMPLATE LITERALS */}
                  {taxData.summary?.roiCount || 0}
                </div>
                <div className="pulse-stat-label">Steuer-Events</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {/* ECHTE DATEN STATT TEMPLATE LITERALS */}
                  {formatCurrency(taxData.summary?.totalROIValueEUR || 0)}
                </div>
                <div className="pulse-stat-label">Gesamte Gewinne</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {/* ECHTE DATEN STATT TEMPLATE LITERALS */}
                  {formatCurrency(taxData.summary?.totalTaxEUR || 0)}
                </div>
                <div className="pulse-stat-label">Grobe Steuerlast</div>
              </div>
              
              <div className="pulse-stat">
                <div className="pulse-stat-value">
                  {taxData.transactions?.filter(tx => tx.isPrinter).length || 0}
                </div>
                <div className="pulse-stat-label">🎯 Printer ROI</div>
              </div>
            </div>

            {/* 🇩🇪 GERMAN TAX SYSTEM - ERWEITERTE STEUERBERECHNUNG */}
            {taxData.germanTaxReport && (
              <div className="mb-8 p-6 rounded-lg border-l-4" style={{backgroundColor: 'var(--bg-secondary)', borderLeftColor: 'var(--accent-blue)'}}>
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">🇩🇪</span>
                  <h3 className="text-xl font-bold pulse-text-gradient">
                    Deutsches Steuerrecht - FIFO Berechnung
                  </h3>
                </div>
                
                {/* German Tax Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="pulse-stat">
                    <div className="pulse-stat-value">
                      {formatCurrency(taxData.germanTaxReport.summary?.totalGainLossEUR || 0)}
                    </div>
                    <div className="pulse-stat-label">FIFO Gewinne/Verluste</div>
                  </div>
                  
                  <div className="pulse-stat">
                    <div className="pulse-stat-value">
                      {formatCurrency(taxData.germanTaxReport.summary?.totalTaxAmountEUR || 0)}
                    </div>
                    <div className="pulse-stat-label">Geschätzte Steuer</div>
                  </div>
                  
                  <div className="pulse-stat">
                    <div className="pulse-stat-value">
                      {taxData.germanTaxReport.taxCategories?.spekulationsgeschaefte || 0}
                    </div>
                    <div className="pulse-stat-label">§23 Spekulationsgeschäfte</div>
                  </div>
                  
                  <div className="pulse-stat">
                    <div className="pulse-stat-value">
                      {taxData.germanTaxReport.taxCategories?.steuerfreieGewinne || 0}
                    </div>
                    <div className="pulse-stat-label">Steuerfreie Gewinne</div>
                  </div>
                </div>

                {/* German Tax Compliance Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">⚖️ Deutsche Steuerkonformität</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• <strong>Methode:</strong> {taxData.germanTaxReport.compliance?.method}</div>
                    <div>• <strong>Haltefrist:</strong> {taxData.germanTaxReport.compliance?.halteFrist}</div>
                    <div>• <strong>Freigrenze:</strong> {taxData.germanTaxReport.compliance?.freigrenze}</div>
                    <div>• <strong>Steuersatz:</strong> {taxData.germanTaxReport.compliance?.steuersatz}</div>
                  </div>
                </div>

                {/* Yearly Breakdown */}
                {taxData.germanTaxReport.yearlyBreakdown && Object.keys(taxData.germanTaxReport.yearlyBreakdown).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold pulse-text mb-3">📅 Jährliche Aufschlüsselung</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead style={{background: 'var(--pulse-gradient-primary)'}}>
                          <tr>
                            <th className="px-3 py-2 text-left text-black font-semibold">Jahr</th>
                            <th className="px-3 py-2 text-left text-black font-semibold">§23 Gewinne</th>
                            <th className="px-3 py-2 text-left text-black font-semibold">Freigrenze</th>
                            <th className="px-3 py-2 text-left text-black font-semibold">Steuerpflichtig</th>
                            <th className="px-3 py-2 text-left text-black font-semibold">Geschätzte Steuer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(taxData.germanTaxReport.yearlyBreakdown).map(([year, data]) => (
                            <tr key={year} style={{backgroundColor: 'var(--bg-card)'}}>
                              <td className="px-3 py-2 font-medium pulse-text">{year}</td>
                              <td className="px-3 py-2 pulse-text-secondary">
                                {formatCurrency(data.paragraph23GainLoss || 0)}
                              </td>
                              <td className="px-3 py-2 pulse-text-secondary">
                                {formatCurrency(data.exemptionUsed || 0)}
                              </td>
                              <td className="px-3 py-2 pulse-text-secondary">
                                {formatCurrency(data.taxableGain || 0)}
                              </td>
                              <td className="px-3 py-2 font-bold pulse-text-gradient">
                                {formatCurrency(data.taxAmount || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Events Table - PulseChain Style */}
            {taxData.transactions && taxData.transactions.length > 0 && (
              <div className="overflow-x-auto mb-6">
                <h3 className="text-xl font-semibold pulse-text mb-4">
                  📋 Transaktionen ({taxData.transactions.length} von {taxData.transactions.length})
                </h3>
                <table className="w-full rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <thead style={{background: 'var(--pulse-gradient-primary)'}}>
                    <tr>
                      <th className="px-4 py-3 text-left text-black font-semibold">Datum</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Chain</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Token</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Typ</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Richtung</th>
                      <th className="px-4 py-3 text-left text-black font-semibold">Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.transactions.map((tx, index) => {
                      // 🔥🔥🔥 RENDERING DEBUG 🔥🔥🔥
                      if (index === 0) {
                        console.log("🚨 RENDERING ERSTE ZEILE:", tx);
                        console.log("🚨 VALUE BEIM RENDERN:", tx.valueFormatted);
                        console.log("🚨 AMOUNT BEIM RENDERN:", tx.amount);
                        console.log("🚨 VALUE RAW BEIM RENDERN:", tx.value);
                      }
                      
                      return (
                        <tr key={index} style={{backgroundColor: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}}>
                          <td className="px-4 py-3 text-sm pulse-text-secondary">
                            {tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleDateString('de-DE') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm pulse-text-secondary">
                            {tx.chain || 'ETH'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium pulse-text">
                            {tx.token_symbol || tx.tokenSymbol || 'UNKNOWN'}
                          </td>
                          <td className="px-4 py-3 text-sm pulse-text-secondary">
                            {tx.isPrinter ? (
                              <span className="text-green-400 font-bold">
                                🎯 {tx.taxCategory}
                              </span>
                            ) : (
                              tx.taxCategory || 'N/A'
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm pulse-text">
                            <span className={`px-2 py-1 rounded text-xs ${
                              tx.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.directionIcon || (tx.direction === 'in' ? '📥' : '📤')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold pulse-text-gradient">
                            {tx.amount ? (Number(tx.amount) || 0).toFixed(6) : (tx.value ? (Number(parseFloat(tx.value) / Math.pow(10, tx.token_decimals || 18)) || 0).toFixed(6) : '0.000000')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* PDF Download Button - Manuell */}
            <div className="mt-6 p-4 rounded-lg text-center border-l-4" style={{backgroundColor: 'var(--bg-secondary)', borderLeftColor: 'var(--accent-green)'}}>
              <div className="pulse-text mb-4">
                ✅ <strong>Steuerreport erfolgreich erstellt!</strong><br/>
                📁 Klicke um den HTML-Report in deinen <strong>Downloads-Ordner</strong> zu speichern.
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={!taxData}
                className={`pulse-btn ${!taxData ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                <Download className="h-5 w-5 mr-2" />
                📂 In Downloads-Ordner speichern
              </button>
              <div className="mt-2 text-xs pulse-text-secondary">
                💡 Dateiname: PulseManager_Steuerreport_{formatAddress(walletAddress)}_{new Date().toISOString().split('T')[0]}.html
              </div>
            </div>
          </div>
        )}

        {/* Bottom Disclaimer - PulseChain Style */}
        <div className="mt-8 text-center pulse-text-secondary text-sm">
          <p>
            🔒 Deine Wallet-Adresse wird nicht gespeichert.<br/>
            📊 Berechnung basiert auf echten Blockchain-Daten von Moralis & Co.<br/>
            ⚖️ Für finale Steuerberatung konsultiere einen Experten.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleTaxTracker; 