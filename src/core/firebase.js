const admin = require('firebase-admin');
const { log } = require('../utils/logger');

// IMPORTANT: Requires environment variables set in the dashboard (Render/Vercel)
const initializeFirebase = () => {
    try {
        if (!admin.apps.length) {
            const serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped newlines for compatibility
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };

            if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                log.info('🔥 Firebase Admin initialized successfully');
            } else {
                log.warn('⚠️ Firebase credentials missing. Running without cloud auth.');
            }
        }
    } catch (error) {
        log.error('❌ Firebase initialization error:', error.message);
    }
};

initializeFirebase();

module.exports = admin;
