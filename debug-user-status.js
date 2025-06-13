// 🔍 DEBUG USER STATUS - Check why dkuddel@web.de shows as basic
console.log('🔍 DEBUG USER STATUS CHECKER');
console.log('='.repeat(50));

// Simuliere die Hook-Logik
function debugUserStatus() {
  // 1. Prüfe ob User eingeloggt ist
  const currentUser = JSON.parse(localStorage.getItem('sb-xlkmobprrnvhpvdnmxgn-auth-token'));
  console.log('🔍 LOCAL STORAGE AUTH:', currentUser ? 'Found' : 'Not found');
  
  if (currentUser && currentUser.user) {
    console.log('👤 USER INFO:', {
      email: currentUser.user.email,
      id: currentUser.user.id,
      created_at: currentUser.user.created_at
    });
  }
  
  // 2. Prüfe Subscription Status Logic
  console.log('\n📊 SUBSCRIPTION LOGIC TEST:');
  
  // Mock different scenarios
  const testScenarios = [
    { status: 'active', daysRemaining: null, expected: 'Premium' },
    { status: 'trial', daysRemaining: 3, expected: 'Trial (3 days)' },
    { status: 'trial', daysRemaining: 0, expected: 'Trial Expired' },
    { status: 'inactive', daysRemaining: 0, expected: 'Basic' },
    { status: null, daysRemaining: null, expected: 'Loading...' }
  ];
  
  testScenarios.forEach(scenario => {
    console.log(`\n🎯 SCENARIO: status=${scenario.status}, days=${scenario.daysRemaining}`);
    
    // Business Logic Test
    if (scenario.status === 'active') {
      console.log('  ✅ Premium Access - All features unlocked');
    } else if (scenario.status === 'trial' && scenario.daysRemaining > 0) {
      console.log(`  🔄 Trial Access - ${scenario.daysRemaining} days remaining`);
    } else if (scenario.status === 'trial' && scenario.daysRemaining <= 0) {
      console.log('  ❌ Trial Expired - Only free features');
    } else if (scenario.status === 'inactive') {
      console.log('  ❌ Basic User - Only free features');
    } else {
      console.log('  ⏳ Loading subscription status...');
    }
    
    console.log(`  Expected: ${scenario.expected}`);
  });
  
  // 3. Feature Access Test
  console.log('\n🎯 FEATURE ACCESS TEST:');
  
  const features = [
    { id: 'dashboard', type: 'FREE' },
    { id: 'wallets', type: 'TRIAL' }, 
    { id: 'roiTracker', type: 'PREMIUM_ONLY' },
    { id: 'taxReport', type: 'PREMIUM_ONLY' }
  ];
  
  const userStates = [
    { name: 'Not Logged In', user: null, status: null, days: null },
    { name: 'Premium User', user: {}, status: 'active', days: null },
    { name: 'Trial Day 1', user: {}, status: 'trial', days: 3 },
    { name: 'Trial Expired', user: {}, status: 'inactive', days: 0 }
  ];
  
  userStates.forEach(userState => {
    console.log(`\n👤 ${userState.name}:`);
    
    features.forEach(feature => {
      let access = false;
      let reason = '';
      
      // FREE features
      if (feature.type === 'FREE') {
        access = true;
        reason = 'free';
      } 
      // Not logged in
      else if (!userState.user) {
        access = false;
        reason = 'registration_required';
      }
      // Premium user
      else if (userState.status === 'active') {
        access = true;
        reason = 'premium';
      }
      // PREMIUM_ONLY features
      else if (feature.type === 'PREMIUM_ONLY') {
        access = false;
        reason = 'premium_required';
      }
      // TRIAL features
      else if (feature.type === 'TRIAL') {
        if (userState.days > 0) {
          access = true;
          reason = 'trial';
        } else {
          access = false;
          reason = 'trial_expired';
        }
      }
      
      const statusIcon = access ? '✅' : '❌';
      console.log(`  ${statusIcon} ${feature.id} (${feature.type}): ${reason}`);
    });
  });
  
  // 4. Check current app state
  console.log('\n🔍 CURRENT APP STATE:');
  try {
    // Try to access React app state (only works if debug is called from browser console)
    if (typeof window !== 'undefined' && window.React) {
      console.log('  📱 React app detected - check DevTools for component state');
    } else {
      console.log('  📱 Not running in browser - cannot access React state');
    }
  } catch (e) {
    console.log('  📱 Cannot access React state:', e.message);
  }
}

// Run debug
debugUserStatus();

console.log('\n💡 TROUBLESHOOTING STEPS:');
console.log('1. Check if dkuddel@web.de is in user_profiles table');
console.log('2. Verify subscription_status = "active"');
console.log('3. Check useStripeSubscription hook is loading correctly');
console.log('4. Verify getFeatureAccess function is working');
console.log('5. Check console for subscription loading errors');

// Browser-only functions
if (typeof window !== 'undefined') {
  window.debugUserStatus = debugUserStatus;
  console.log('\n🔧 Available in browser console:');
  console.log('  window.debugUserStatus() - Run this debug again');
} 