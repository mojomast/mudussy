#!/usr/bin/env node

/**
 * Test script for username prompting functionality
 * Tests the UsernameValidator and basic authentication flow
 */

const { UsernameValidator } = require('./engine/modules/networking/username-validator.js');

// Test cases for username validation
const testCases = [
  // Valid usernames
  { username: 'player1', expected: true, description: 'Valid username with numbers' },
  { username: 'test_user', expected: true, description: 'Valid username with underscore' },
  { username: 'my-character', expected: true, description: 'Valid username with hyphen' },
  { username: 'abc', expected: true, description: 'Minimum length username' },
  { username: 'abcdefghijklmnopqrst', expected: true, description: 'Maximum length username' },

  // Invalid usernames
  { username: '', expected: false, description: 'Empty username' },
  { username: 'ab', expected: false, description: 'Too short username' },
  { username: 'abcdefghijklmnopqrstu', expected: false, description: 'Too long username' },
  { username: 'user name', expected: false, description: 'Username with spaces' },
  { username: 'user@name', expected: false, description: 'Username with special characters' },
  { username: 'admin', expected: false, description: 'Reserved username' },
  { username: 'Admin', expected: false, description: 'Reserved username (case insensitive)' },
  { username: 'fuck', expected: false, description: 'Inappropriate content' },
  { username: '1user', expected: true, description: 'Starting with number (valid but warned)' },
];

console.log('🧪 Testing UsernameValidator...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = UsernameValidator.validateUsername(testCase.username);
  const success = result.valid === testCase.expected;

  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result.valid}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      console.log(`   Warnings: ${result.warnings.join(', ')}`);
    }
    failed++;
  }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

// Test validation rules display
console.log('\n📋 Username Validation Rules:');
console.log(UsernameValidator.getValidationRules());

// Test sanitization
console.log('\n🧹 Username Sanitization:');
const dirtyUsernames = ['  UserName  ', 'test@user', 'normal_user'];
dirtyUsernames.forEach(username => {
  const sanitized = UsernameValidator.sanitizeUsername(username);
  console.log(`   '${username}' -> '${sanitized}'`);
});

if (failed === 0) {
  console.log('\n🎉 All tests passed! Username prompting functionality is ready.');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} tests failed. Please review the implementation.`);
  process.exit(1);
}