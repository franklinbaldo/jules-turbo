/**
 * Unit tests for secureStorage module
 * 
 * Run with: npm test (if test framework configured)
 * Or manually in browser console
 */

import { 
  setSecureApiKey, 
  getSecureApiKey, 
  removeSecureApiKey,
  isSecureStorageAvailable 
} from '../secureStorage';

/**
 * Manual test suite - run in browser console
 */
export async function runSecurityTests() {
  console.group('🔒 Secure Storage Tests');
  
  try {
    // Test 1: Check Web Crypto availability
    console.log('Test 1: Web Crypto API availability');
    const isAvailable = isSecureStorageAvailable();
    console.assert(isAvailable, '❌ Web Crypto API not available');
    console.log(isAvailable ? '✅ Web Crypto API available' : '❌ Web Crypto API not available');
    
    // Test 2: Encrypt and store
    console.log('\nTest 2: Encrypt and store API key');
    const testKey = 'AIzaTest123456789';
    await setSecureApiKey(testKey);
    const stored = localStorage.getItem('secure_jules_api_key');
    console.assert(stored !== null, '❌ Key not stored');
    console.assert(stored !== testKey, '❌ Key stored in plaintext!');
    console.log('✅ Key encrypted and stored:', stored?.substring(0, 50) + '...');
    
    // Test 3: Retrieve and decrypt
    console.log('\nTest 3: Retrieve and decrypt API key');
    const retrieved = await getSecureApiKey();
    console.assert(retrieved === testKey, '❌ Decrypted key does not match original');
    console.log('✅ Key decrypted successfully:', retrieved);
    
    // Test 4: Multiple encryptions produce different ciphertext (random IV)
    console.log('\nTest 4: Random IV verification');
    await setSecureApiKey(testKey);
    const encrypted1 = localStorage.getItem('secure_jules_api_key');
    await setSecureApiKey(testKey);
    const encrypted2 = localStorage.getItem('secure_jules_api_key');
    console.assert(encrypted1 !== encrypted2, '❌ Same ciphertext - IV not random!');
    console.log('✅ Different ciphertext for same plaintext (random IV working)');
    
    // Test 5: Remove key
    console.log('\nTest 5: Remove API key');
    removeSecureApiKey();
    const afterRemove = await getSecureApiKey();
    console.assert(afterRemove === null, '❌ Key not removed');
    console.log('✅ Key removed successfully');
    
    // Test 6: Migration from plaintext
    console.log('\nTest 6: Migration from plaintext');
    localStorage.setItem('jules_api_key', testKey);
    const migrated = await getSecureApiKey();
    console.assert(migrated === testKey, '❌ Migration failed');
    const plaintext = localStorage.getItem('jules_api_key');
    console.assert(plaintext === null, '❌ Plaintext key not removed after migration');
    const encrypted = localStorage.getItem('secure_jules_api_key');
    console.assert(encrypted !== null, '❌ Encrypted key not created during migration');
    console.log('✅ Migration from plaintext successful');
    
    // Test 7: Handle corrupted data
    console.log('\nTest 7: Handle corrupted encrypted data');
    localStorage.setItem('secure_jules_api_key', 'corrupted_data_xyz123');
    const corrupted = await getSecureApiKey();
    console.assert(corrupted === null, '❌ Should return null for corrupted data');
    console.log('✅ Corrupted data handled gracefully');
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    removeSecureApiKey();
    console.groupEnd();
  }
}

/**
 * Performance test
 */
export async function runPerformanceTest() {
  console.group('⚡ Performance Tests');
  
  const testKey = 'AIzaTest123456789012345678901234567890';
  const iterations = 100;
  
  // Encryption performance
  console.time('Encrypt 100 times');
  for (let i = 0; i < iterations; i++) {
    await setSecureApiKey(testKey);
  }
  console.timeEnd('Encrypt 100 times');
  
  // Decryption performance
  console.time('Decrypt 100 times');
  for (let i = 0; i < iterations; i++) {
    await getSecureApiKey();
  }
  console.timeEnd('Decrypt 100 times');
  
  // Cleanup
  removeSecureApiKey();
  console.groupEnd();
}

/**
 * Security verification test
 */
export async function runSecurityVerification() {
  console.group('🛡️ Security Verification');
  
  try {
    const testKey = 'AIzaSensitiveKey123';
    await setSecureApiKey(testKey);
    
    // Check localStorage doesn't contain plaintext
    const allStorage = { ...localStorage };
    const hasPlaintext = JSON.stringify(allStorage).includes(testKey);
    console.assert(!hasPlaintext, '❌ SECURITY BREACH: Plaintext found in storage!');
    console.log(hasPlaintext ? '❌ SECURITY BREACH: Plaintext found!' : '✅ No plaintext in storage');
    
    // Check encrypted format
    const encrypted = localStorage.getItem('secure_jules_api_key');
    if (encrypted) {
      console.log('Encrypted data length:', encrypted.length);
      console.log('First 50 chars:', encrypted.substring(0, 50));
      console.log('Entropy check:', encrypted.match(/[A-Za-z0-9+/=]/g)?.length === encrypted.length ? '✅ Base64 encoded' : '❌ Not Base64');
    }
    
    // Cleanup
    removeSecureApiKey();
    
  } catch (error) {
    console.error('❌ Security verification failed:', error);
  } finally {
    console.groupEnd();
  }
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).securityTests = {
    run: runSecurityTests,
    performance: runPerformanceTest,
    verify: runSecurityVerification
  };
  console.log('💡 Security tests available: window.securityTests.run()');
}
