#!/usr/bin/env node
/**
 * Set admin custom claim for a Firebase Auth user.
 *
 * USAGE:
 *   1. Install Firebase Admin SDK:  npm install firebase-admin
 *   2. Download service account key from Firebase Console:
 *        Settings → Service accounts → Generate new private key
 *        Save as: scripts/service-account.json (this file is gitignored)
 *   3. Run:  node scripts/set-admin-claim.js <email>
 *        e.g.  node scripts/set-admin-claim.js shahzod@navoi.gov.uz
 *
 * To REVOKE admin:  node scripts/set-admin-claim.js <email> --revoke
 *
 * After running, the user must SIGN OUT and SIGN IN again
 * (or call window.fbRefreshClaims() in the browser) for the
 * claim to take effect.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, 'service-account.json');
if(!fs.existsSync(SA_PATH)){
  console.error('❌ service-account.json not found at:', SA_PATH);
  console.error('   Download from Firebase Console → Settings → Service accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(SA_PATH))
});

const args = process.argv.slice(2);
const email = args[0];
const revoke = args.includes('--revoke');

if(!email){
  console.error('Usage: node set-admin-claim.js <email> [--revoke]');
  process.exit(1);
}

(async function(){
  try {
    const user = await admin.auth().getUserByEmail(email);
    const newClaim = revoke ? { admin: false } : { admin: true };
    await admin.auth().setCustomUserClaims(user.uid, newClaim);
    console.log(
      (revoke ? '✅ Admin REVOKED from ' : '✅ Admin GRANTED to ') + email
    );
    console.log('   UID: ' + user.uid);
    console.log('   User must sign out and back in for changes to take effect');
  } catch(err){
    console.error('❌ Error:', err.message);
    if(err.code === 'auth/user-not-found'){
      console.error('   Create the user first via Firebase Console → Authentication');
    }
    process.exit(1);
  }
})();
