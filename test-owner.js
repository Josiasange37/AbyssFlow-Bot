#!/usr/bin/env node

/**
 * Script de test pour vérifier la détection du propriétaire
 * Usage: node test-owner.js
 */

require('dotenv').config();

const CONFIG = {
  owners: process.env.BOT_OWNERS
    ? process.env.BOT_OWNERS.split(',').map((v) => v.trim()).filter(Boolean)
    : [],
};

function normalizeNumber(input) {
  return (input || '').replace(/[^0-9]/g, '');
}

function isOwner(jid) {
  if (!CONFIG.owners.length) {
    console.log('❌ Aucun propriétaire configuré dans BOT_OWNERS');
    return false;
  }
  
  const normalized = normalizeNumber(jid);
  console.log(`\n🔍 Test pour: ${jid}`);
  console.log(`📱 Numéro normalisé: ${normalized}`);
  console.log(`👥 Propriétaires configurés: ${CONFIG.owners.join(', ')}`);

  const isOwnerResult = CONFIG.owners.some((owner) => {
    const ownerNorm = normalizeNumber(owner);
    const match = normalized.includes(ownerNorm) || ownerNorm.includes(normalized) || 
                  normalized.endsWith(ownerNorm) || ownerNorm.endsWith(normalized);
    
    console.log(`  ↳ Test avec ${owner} (${ownerNorm}): ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    return match;
  });

  return isOwnerResult;
}

// Tests
console.log('═══════════════════════════════════════════════════════');
console.log('🧪 TEST DE DÉTECTION DU PROPRIÉTAIRE');
console.log('═══════════════════════════════════════════════════════');

// Test 1: Format WhatsApp complet (comme dans un groupe)
const testCases = [
  '237681752094@s.whatsapp.net',
  '237621708081@s.whatsapp.net',
  '237681752094',
  '237621708081',
  '+237681752094',
  '237999999999@s.whatsapp.net', // Numéro non-propriétaire
];

testCases.forEach((testCase, index) => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Test ${index + 1}/${testCases.length}`);
  const result = isOwner(testCase);
  console.log(`\n📊 Résultat: ${result ? '✅ EST PROPRIÉTAIRE' : '❌ N\'EST PAS PROPRIÉTAIRE'}`);
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ Tests terminés!');
console.log('═══════════════════════════════════════════════════════\n');

// Résumé
console.log('📋 RÉSUMÉ:');
console.log(`   Propriétaires configurés: ${CONFIG.owners.length}`);
CONFIG.owners.forEach((owner, i) => {
  console.log(`   ${i + 1}. ${owner}`);
});
console.log('');
