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