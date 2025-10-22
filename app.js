// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const AuthNestClient = require('authnest-client');

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

// For New User Register/Signup
app.get('/api/registrationLink', (req, res) => {
    const redirectUrl = authnest.getRegistrationLink();
    res.redirect(redirectUrl);

});

// For Login (Users that already Registerd / Signup Using Our Authnest System )
app.get('/api/loginLink', (req, res) => {
    const redirectUrl = authnest.getLoginLink();
    res.redirect(redirectUrl);
});

app.get('/api/emailVerificationLink', (req, res) => {
    const redirectUrl = authnest.getEmailVerificationLink();
    res.redirect(redirectUrl);
});

// For Forgot Password
app.get('/api/forgotPasswordLink', (req, res) => {
    const redirectUrl = authnest.getForgotPasswordLink();
    res.redirect(redirectUrl);
});

// For General Settings
app.get('/api/generalSettingsLink', (req, res) => {
    const redirectUrl = authnest.getGeneralSettingsLink();
    res.redirect(redirectUrl);
});

// For Security Settings
app.get('/api/securitySettingsLink', (req, res) => {
    const redirectUrl = authnest.getSecuritySettingsLink();
    res.redirect(redirectUrl);
});

// For Notifications Settings
app.get('/api/notificationsSettingsLink', (req, res) => {
    const redirectUrl = authnest.getNotificationsSettingsLink();
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


// For Fetching Clients Own Data

app.get('/api/clientDataLink', (req, res) => {
    const redirectUrl = authnest.getClientDataLink();
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
    const redirectUrl = authnest.getUserDataLink(filters);
    res.redirect(redirectUrl);
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