// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const AuthNestClient = require('authnest-server');

const app = express();
const authnest = new AuthNestClient();

app.use(AuthNestClient.getSecurityMiddlewares());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Simplified endpoints using the AuthNestClient package

app.get('/api/registrationLink', (req, res) => {
    const sessionId = req.query.session_id;
    const redirectUrl = authnest.getRegistrationLink(null, null, sessionId, req);
    console.log('Registration redirect with session:', sessionId);
    res.redirect(redirectUrl);
});

app.get('/api/loginLink', (req, res) => {
    const sessionId = req.query.session_id;
    const redirectUrl = authnest.getLoginLink(null, null, sessionId, req);
    res.redirect(redirectUrl);
});

// Simple route that uses your existing npm package
app.get('/api/getUserData', async (req, res) => {
    try {
        const sessionId = req.query.session_id;

        console.log('🔐 GetUserData - session_id received:', sessionId);

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        // Use your existing getUserDataBySession method WITH req parameter
        const redirectUrl = authnest.getUserDataBySession(sessionId, {}, req);

        console.log('🔐 Redirecting to SaaS:', redirectUrl);
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Error in getUserData route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data'
        });
    }
});

app.get('/api/emailVerificationLink', (req, res) => {
    const redirectUrl = authnest.getEmailVerificationLink(null, null, null, req);
    res.redirect(redirectUrl);
});

// For Forgot Password
app.get('/api/forgotPasswordLink', (req, res) => {
    const redirectUrl = authnest.getForgotPasswordLink(null, null, req);
    res.redirect(redirectUrl);
});

app.get('/api/generalSettingsLink', (req, res) => {
    const sessionId = req.query.session_id;
    const redirectUrl = authnest.getGeneralSettingsLink(null, null, sessionId, req);
    res.redirect(redirectUrl);
});

app.get('/api/securitySettingsLink', (req, res) => {
    const sessionId = req.query.session_id;
    const redirectUrl = authnest.getSecuritySettingsLink(null, null, sessionId, req);
    res.redirect(redirectUrl);
});

app.get('/api/notificationsSettingsLink', (req, res) => {
    const sessionId = req.query.session_id;
    const redirectUrl = authnest.getNotificationsSettingsLink(null, null, sessionId, req);
    res.redirect(redirectUrl);
});

// For Fetching Clients Own Data
app.get('/api/clientDataLink', (req, res) => {
    const redirectUrl = authnest.getClientDataLink(null, req);
    res.redirect(redirectUrl);
});

// For Fetching Existing User's Data On Authnest System
app.get('/api/userDataLink', (req, res) => {
    const filters = {
        userId: req.query.userId,
        email: req.query.email,
        page: req.query.page,
        limit: req.query.limit
    };
    const redirectUrl = authnest.getUserDataLink(filters, null, req);
    res.redirect(redirectUrl);
});

// Add this before the POST route
// Add this before the POST route
app.options('/api/authnest/authenticated-modal-session', (req, res) => {
    console.log('🔧 Handling OPTIONS for authenticated-modal-session');
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Website-ID');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
});

// Fix the authenticated modal session endpoint in your client backend
app.post('/api/authnest/authenticated-modal-session', async (req, res) => {
  console.log('🚀 START: /api/authnest/authenticated-modal-session');
  console.log('📦 Request headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    'content-type': req.headers['content-type']
  });
  console.log('📦 Request body:', req.body);

  try {
    const { modalType, modalId, userToken, userContext, parentUrl } = req.body;

    console.log('🔍 Parsed request data:', {
      modalType,
      modalId,
      userTokenLength: userToken ? userToken.length : 0,
      userTokenPreview: userToken ? `${userToken.substring(0, 20)}...` : 'none',
      userContext: userContext ? 'present' : 'none',
      parentUrl
    });

    // Set CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Website-ID');
    res.removeHeader('X-Frame-Options');
    res.header('Content-Security-Policy', `frame-ancestors ${req.headers.origin} http://localhost:3000 https://temp-backend-for-login-saas.onrender.com`);

    if (!userToken) {
      console.log('❌ ERROR: No user token provided');
      throw new Error('User token is required');
    }

    console.log('📡 Calling authnest.getAuthenticatedModalSession...');
    
    const session = await authnest.getAuthenticatedModalSession(
      modalType,
      userToken,
      {
        userContext,
        parentUrl,
        modalId,
        redirect_uri: '/api/auth/modal-callback'
      }
    );

    console.log('✅ authnest.getAuthenticatedModalSession response:', {
      iframeUrl: session.iframeUrl,
      sessionId: session.sessionId,
      modalId: session.modalId,
      hasUser: !!session.user
    });

    // CRITICAL: Check the iframe URL
    if (session.iframeUrl.includes('localhost:5000')) {
      console.error('🚨 CRITICAL: iframeUrl contains localhost:5000!');
      console.error('🚨 This should NOT happen with hardcoded URL');
      console.error('🚨 Actual iframeUrl:', session.iframeUrl);
    } else {
      console.log('✅ iframeUrl looks correct:', session.iframeUrl);
    }

    const response = {
      success: true,
      modalId: session.modalId,
      iframeUrl: session.iframeUrl,
      sessionId: session.sessionId,
      user: session.user
    };

    console.log('📤 Sending response:', response);
    console.log('🏁 END: /api/authnest/authenticated-modal-session - SUCCESS');

    res.json(response);

  } catch (error) {
    console.error('💥 ERROR in /api/authnest/authenticated-modal-session:', error);
    console.error('💥 Error stack:', error.stack);

    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.removeHeader('X-Frame-Options');

    const errorResponse = {
      success: false,
      error: 'Authentication failed',
      message: error.message
    };

    console.log('📤 Sending error response:', errorResponse);
    console.log('🏁 END: /api/authnest/authenticated-modal-session - ERROR');

    res.status(401).json(errorResponse);
  }
});

// New modal session endpoint
app.post('/authnest/modal-session', (req, res) => {
    const { modalType, modalId, userContext, parentUrl } = req.body;

    const session = authnest.get2FAModalSession({
        userContext,
        parentUrl,
        redirect_uri: '/api/auth/modal-callback'
    });

    res.json({
        modalId,
        iframeUrl: session.iframeUrl,
        sessionId: session.sessionId
    });
});

// Modal callback (existing pattern)
app.get('/api/auth/modal-callback', (req, res) => {
    authnest.handleModalCallback(req, res);
});

// Callback handlers For Existing User's Data On Authnest System
app.get('/api/auth/user-data-callback', (req, res) => {
    authnest.handleUserDataCallback(req, res);
});

// Callback handlers
app.get('/api/auth/client-data-callback', (req, res) => {
    authnest.handleClientDataCallback(req, res);
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;