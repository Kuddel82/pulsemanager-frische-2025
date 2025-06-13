/**
 * 🔍 SIDEBAR WGEP DEBUG SCRIPT
 * Findet heraus warum WGEP nicht in der Sidebar angezeigt wird
 */

console.log('🚀 SIDEBAR WGEP DEBUG TEST');
console.log('==========================');

// Simuliere die appConfig Imports
const TRIAL_VIEWS_OBJECT = [
  { id: 'dashboard', icon: 'Home', translationKey: 'dashboardViewTitle', isDefault: true, isSidebarLink: true },
  { id: 'wgep', icon: 'Printer', translationKey: 'wgepViewTitle', isSidebarLink: true },
  { id: 'pulseChainInfo', icon: 'Info', translationKey: 'pulseChainInfoTitle', isSidebarLink: true },
  { id: 'wallets', icon: 'Wallet', translationKey: 'walletViewTitle', isSidebarLink: true },
  { id: 'tokenTrade', icon: 'Repeat', translationKey: 'swapViewTitle', isSidebarLink: true },
  { id: 'bridge', icon: 'Zap', translationKey: 'bridgeViewTitle', isSidebarLink: true },
  { id: 'settings', icon: 'SettingsIcon', translationKey: 'settingsViewTitle', isSidebarLink: true }
];

const PREMIUM_VIEWS_OBJECT = [
  { id: 'roiTracker', icon: 'BarChart2', translationKey: 'roiTrackerTitle', isSidebarLink: true },
  { id: 'taxReport', icon: 'FileText', translationKey: 'taxReportTitle', isSidebarLink: true }
];

const FOOTER_VIEWS = [
  { id: 'termsOfService', icon: 'FileText', translationKey: 'termsOfService', isFooterLink: true, isSidebarLink: false },
  { id: 'privacyPolicy', icon: 'ShieldCheck', translationKey: 'privacyPolicy', isFooterLink: true, isSidebarLink: false },
  { id: 'disclaimer', icon: 'AlertTriangle', translationKey: 'disclaimer', isFooterLink: true, isSidebarLink: false }
];

// Simuliere die View Configs
const protectedViewsConfig = PREMIUM_VIEWS_OBJECT;
const publicViewsConfig = [...TRIAL_VIEWS_OBJECT, ...FOOTER_VIEWS];

console.log('\n📊 VIEW CONFIGS ANALYSIS:');
console.log('========================');
console.log('TRIAL_VIEWS_OBJECT:', TRIAL_VIEWS_OBJECT.map(v => v.id));
console.log('PREMIUM_VIEWS_OBJECT:', PREMIUM_VIEWS_OBJECT.map(v => v.id));
console.log('FOOTER_VIEWS:', FOOTER_VIEWS.map(v => v.id));
console.log('protectedViewsConfig:', protectedViewsConfig.map(v => v.id));
console.log('publicViewsConfig:', publicViewsConfig.map(v => v.id));

// Test: WGEP in Config finden
const wgepInPublic = publicViewsConfig.find(v => v.id === 'wgep');
const wgepInProtected = protectedViewsConfig.find(v => v.id === 'wgep');

console.log('\n🔍 WGEP IN CONFIGS:');
console.log('==================');
console.log('WGEP in publicViewsConfig:', wgepInPublic ? '✅ FOUND' : '❌ NOT FOUND');
console.log('WGEP in protectedViewsConfig:', wgepInProtected ? '✅ FOUND' : '❌ NOT FOUND');

if (wgepInPublic) {
  console.log('WGEP Config Details:', wgepInPublic);
}

// Simuliere die Sidebar Logic
console.log('\n🔄 SIDEBAR LOGIC SIMULATION:');
console.log('============================');

// Schritt 1: allViewsMap erstellen
const allViewsMap = new Map();
publicViewsConfig.forEach(v => allViewsMap.set(v.id, v));
protectedViewsConfig.forEach(v => allViewsMap.set(v.id, v));

console.log('allViewsMap size:', allViewsMap.size);
console.log('allViewsMap keys:', Array.from(allViewsMap.keys()));
console.log('WGEP in allViewsMap:', allViewsMap.has('wgep') ? '✅ YES' : '❌ NO');

// Schritt 2: mainMenuItems
const mainMenuItems = [
  'dashboard',     // Portfolio - 3-TAGE TRIAL → Premium
  'wallets',       // Wallets - 3-TAGE TRIAL → Premium
  'roiTracker',    // ROI Tracker - PREMIUM ONLY
  'taxReport',     // Tax Report - PREMIUM ONLY
  'tokenTrade',    // Token Trade - 3-TAGE TRIAL → Premium
  'bridge',        // Bridge - 3-TAGE TRIAL → Premium
  'wgep',          // WGEP - 3-TAGE TRIAL → Premium
  'settings'       // Settings - 3-TAGE TRIAL → Premium
];

console.log('\nmainMenuItems:', mainMenuItems);
console.log('WGEP position in mainMenuItems:', mainMenuItems.indexOf('wgep'));

// Schritt 3: sidebarViewConfigs erstellen
const sidebarViewConfigs = mainMenuItems
  .map(id => {
    const view = allViewsMap.get(id);
    if (!view) {
      console.warn(`⚠️ SIDEBAR: View '${id}' not found in config`);
      return null;
    }
    return view;
  })
  .filter(Boolean);

console.log('\nsidebarViewConfigs:', sidebarViewConfigs.map(v => ({ id: v.id, translationKey: v.translationKey })));

// Prüfe jedes mainMenuItem einzeln
console.log('\n🔍 DETAILED MAINMENU ANALYSIS:');
console.log('==============================');
mainMenuItems.forEach((id, index) => {
  const view = allViewsMap.get(id);
  const status = view ? '✅ FOUND' : '❌ MISSING';
  console.log(`${index + 1}. ${id}: ${status}`);
  if (view) {
    console.log(`   - icon: ${view.icon}`);
    console.log(`   - translationKey: ${view.translationKey}`);
    console.log(`   - isSidebarLink: ${view.isSidebarLink}`);
  }
});

// Test: WGEP spezifische Prüfung
console.log('\n🎯 WGEP SPECIFIC TEST:');
console.log('=====================');
const wgepView = allViewsMap.get('wgep');
if (wgepView) {
  console.log('✅ WGEP view found in allViewsMap');
  console.log('WGEP details:', wgepView);
  
  // Prüfe alle Eigenschaften
  console.log('Has id:', !!wgepView.id);
  console.log('Has icon:', !!wgepView.icon);
  console.log('Has translationKey:', !!wgepView.translationKey);
  console.log('isSidebarLink:', wgepView.isSidebarLink);
  
  // Simuliere die Sidebar Filter-Logik
  const isValid = wgepView && wgepView.id && wgepView.icon && wgepView.translationKey;
  console.log('Would pass Sidebar validation:', isValid ? '✅ YES' : '❌ NO');
  
} else {
  console.log('❌ WGEP view NOT found in allViewsMap');
  console.log('Available views:', Array.from(allViewsMap.keys()));
}

// Final Test: Überprüfe Translation
console.log('\n📝 TRANSLATION TEST:');
console.log('===================');
const translations = {
  wgepViewTitle: 'WGEP Token',
  dashboardViewTitle: 'Dashboard',
  walletViewTitle: 'Wallets',
  // etc...
};

if (wgepView) {
  const translationKey = wgepView.translationKey;
  const translation = translations[translationKey];
  console.log('Translation key:', translationKey);
  console.log('Translation value:', translation);
  console.log('Translation exists:', !!translation);
}

console.log('\n🎯 CONCLUSION:');
console.log('==============');
if (wgepView && allViewsMap.has('wgep')) {
  console.log('✅ WGEP should appear in sidebar');
  console.log('❓ If not visible, check:');
  console.log('   1. Console for warnings');
  console.log('   2. User authentication state');
  console.log('   3. Feature access logic');
  console.log('   4. CSS display issues');
} else {
  console.log('❌ WGEP will NOT appear - config problem');
  console.log('🔧 Need to fix view configuration');
}

console.log('\n🔚 SIDEBAR WGEP DEBUG COMPLETE'); 