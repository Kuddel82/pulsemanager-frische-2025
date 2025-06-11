import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

// 🔑 DEINE MORALIS API CONFIGURATION
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjNiYjEyNDQ0LWVkYmUtNDQyNi1hOThlLWFlNzBjZTAzZGRhNCIsIm9yZ0lkIjoiNDUxOTc4IiwidXNlcklkIjoiNDY1MDQ5IiwidHlwZUlkIjoiY2JhYzQ1ZTctODk4Ni00ZGFlLWE4NTUtMDA3ZmFlNjM4ZDgyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDk0MzkxNzEsImV4cCI6NDkwNTE5OTE3MX0.nTFPzga8CQX4Yxryvu2zCkCVHsJp5VDoIy_CthTrOvc";
const address = "0x3f020b5bcfdfa9b5970b1b22bba6da6387d0ea7a"; // Deine Wallet

async function debugMoralisAPI() {
  console.log('🚀 MORALIS API DEBUG TOOL - OFFIZIELLE SDK VERSION');
  console.log('='.repeat(60));
  
  try {
    // Initialize Moralis
    await Moralis.start({
      apiKey: MORALIS_API_KEY,
    });
    
    console.log('✅ Moralis SDK initialized successfully');
    console.log(`📱 Testing wallet: ${address}`);
    console.log('');

    // 🔵 TEST 1: ETHEREUM MAINNET
    console.log('🔵 TEST 1: ETHEREUM MAINNET');
    console.log('-'.repeat(40));
    
    try {
      const ethTokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain: EvmChain.ETHEREUM,
      });
      
      console.log('✅ ETHEREUM SUCCESS:');
      console.log('📊 Response Structure:', {
        hasResult: !!ethTokenBalances.result,
        resultType: ethTokenBalances.result ? typeof ethTokenBalances.result : 'null',
        isArray: Array.isArray(ethTokenBalances.result),
        length: ethTokenBalances.result ? ethTokenBalances.result.length : 0,
        fullResponseKeys: Object.keys(ethTokenBalances)
      });
      
      if (ethTokenBalances.result && ethTokenBalances.result.length > 0) {
        console.log('🔍 Sample Token (ETH):');
        const sampleToken = ethTokenBalances.result[0];
        console.log('  - Raw Object:', sampleToken);
        console.log('  - Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(sampleToken)));
        console.log('  - .display():', sampleToken.display());
        console.log('  - .format():', sampleToken.format());
      } else {
        console.log('📭 No tokens found on Ethereum');
      }
      
    } catch (ethError) {
      console.log('❌ ETHEREUM ERROR:', ethError.message);
    }
    
    console.log('');

    // 🟣 TEST 2: PULSECHAIN (wenn unterstützt)
    console.log('🟣 TEST 2: PULSECHAIN EXPERIMENTAL');
    console.log('-'.repeat(40));
    
    try {
      // Try to create PulseChain chain object
      const pulseChain = EvmChain.PULSECHAIN || '0x171';
      console.log('🔍 Using chain:', pulseChain);
      
      const pulseTokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain: pulseChain,
      });
      
      console.log('✅ PULSECHAIN SUCCESS:');
      console.log('📊 Response Structure:', {
        hasResult: !!pulseTokenBalances.result,
        resultType: pulseTokenBalances.result ? typeof pulseTokenBalances.result : 'null',
        isArray: Array.isArray(pulseTokenBalances.result),
        length: pulseTokenBalances.result ? pulseTokenBalances.result.length : 0,
        fullResponseKeys: Object.keys(pulseTokenBalances)
      });
      
      if (pulseTokenBalances.result && pulseTokenBalances.result.length > 0) {
        console.log('🔍 Sample Token (PLS):');
        const sampleToken = pulseTokenBalances.result[0];
        console.log('  - Raw Object:', sampleToken);
        console.log('  - .display():', sampleToken.display());
      } else {
        console.log('📭 No tokens found on PulseChain');
      }
      
    } catch (pulseError) {
      console.log('❌ PULSECHAIN ERROR:', pulseError.message);
      console.log('💡 This likely means PulseChain is not supported by Moralis yet');
    }
    
    console.log('');

    // 🔵 TEST 3: NATIVE BALANCE
    console.log('🔵 TEST 3: NATIVE BALANCE');
    console.log('-'.repeat(40));
    
    try {
      const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
        address,
        chain: EvmChain.ETHEREUM,
      });
      
      console.log('✅ NATIVE BALANCE SUCCESS:');
      console.log('📊 Balance Object:', nativeBalance.result);
      console.log('💰 Balance in ETH:', nativeBalance.result.balance.ether);
      console.log('💰 Balance in Wei:', nativeBalance.result.balance.wei);
      
    } catch (nativeError) {
      console.log('❌ NATIVE BALANCE ERROR:', nativeError.message);
    }

    console.log('');
    console.log('🎯 DEBUGGING COMPLETE!');
    console.log('='.repeat(60));
    
  } catch (initError) {
    console.error('💥 MORALIS INITIALIZATION ERROR:', initError.message);
    console.log('💡 Check your MORALIS_API_KEY environment variable');
  }
}

// Run the debug
debugMoralisAPI().catch(console.error); 