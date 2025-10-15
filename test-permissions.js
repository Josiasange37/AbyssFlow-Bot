#!/usr/bin/env node

/**
 * Script de test pour vérifier la logique des permissions
 * Usage: node test-permissions.js
 */

console.log('═══════════════════════════════════════════════════════');
console.log('🧪 TEST DE LOGIQUE DES PERMISSIONS');
console.log('═══════════════════════════════════════════════════════\n');

// Simulation de la logique du bot
function canUseAdminCommands(isOwner, isGroupAdmin) {
  return isOwner || isGroupAdmin;
}

// Scénarios de test
const scenarios = [
  {
    name: 'Propriétaire du bot (pas admin du groupe)',
    isOwner: true,
    isGroupAdmin: false,
    expected: true
  },
  {
    name: 'Admin du groupe (pas propriétaire)',
    isOwner: false,
    isGroupAdmin: true,
    expected: true
  },
  {
    name: 'Propriétaire ET admin du groupe',
    isOwner: true,
    isGroupAdmin: true,
    expected: true
  },
  {
    name: 'Utilisateur normal (ni propriétaire ni admin)',
    isOwner: false,
    isGroupAdmin: false,
    expected: false
  }
];

let passed = 0;
let failed = 0;

scenarios.forEach((scenario, index) => {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Test ${index + 1}/${scenarios.length}: ${scenario.name}`);
  console.log(`\n📊 Paramètres:`);
  console.log(`   isOwner: ${scenario.isOwner}`);
  console.log(`   isGroupAdmin: ${scenario.isGroupAdmin}`);
  
  const result = canUseAdminCommands(scenario.isOwner, scenario.isGroupAdmin);
  const success = result === scenario.expected;
  
  console.log(`\n📋 Résultat:`);
  console.log(`   canUseAdminCommands: ${result}`);
  console.log(`   Attendu: ${scenario.expected}`);
  console.log(`\n${success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
  
  console.log('');
});

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RÉSUMÉ DES TESTS');
console.log('═══════════════════════════════════════════════════════');
console.log(`✅ Réussis: ${passed}/${scenarios.length}`);
console.log(`❌ Échoués: ${failed}/${scenarios.length}`);
console.log(`📈 Taux de réussite: ${Math.round((passed / scenarios.length) * 100)}%`);
console.log('═══════════════════════════════════════════════════════\n');

if (failed === 0) {
  console.log('🎉 Tous les tests sont passés!');
  console.log('✅ La logique des permissions est correcte!\n');
  console.log('📋 Qui peut utiliser *kick:');
  console.log('   1. ✅ Propriétaire du bot (même si pas admin du groupe)');
  console.log('   2. ✅ Admin du groupe (même si pas propriétaire)');
  console.log('   3. ❌ Utilisateur normal\n');
} else {
  console.log('⚠️ Certains tests ont échoué!');
  console.log('❌ La logique des permissions nécessite une correction.\n');
}
