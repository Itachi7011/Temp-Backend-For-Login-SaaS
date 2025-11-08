// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const AuthNestClient = require('authnest-server');

const app = express();
const authnest = new AuthNestClient();

// Get all route handlers from the package
const routeHandlers = authnest.getRouteHandlers();

app.use(AuthNestClient.getSecurityMiddlewares()); // ← This should work now
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

// Simplified endpoints using the route handlers from package

// Navigation routes
app.get('/api/registrationLink', routeHandlers.registration);
app.get('/api/loginLink', routeHandlers.login);
app.get('/api/emailVerificationLink', routeHandlers.emailVerification);
app.get('/api/forgotPasswordLink', routeHandlers.forgotPassword);
app.get('/api/generalSettingsLink', routeHandlers.generalSettings);
app.get('/api/securitySettingsLink', routeHandlers.securitySettings);
app.get('/api/notificationsSettingsLink', routeHandlers.notificationsSettings);
app.get('/api/clientDataLink', routeHandlers.clientData);
app.get('/api/userDataLink', routeHandlers.userData);

// Special handlers
app.get('/api/getUserData', routeHandlers.getUserData);

// Modal session endpoint with CORS
app.options('/api/authnest/authenticated-modal-session', authnest.getModalSessionCORS());
app.post('/api/authnest/authenticated-modal-session', routeHandlers.modalSession);

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

// Callback handlers
app.get('/api/auth/modal-callback', routeHandlers.modalCallback);
app.get('/api/auth/user-data-callback', routeHandlers.userDataCallback);
app.get('/api/auth/client-data-callback', routeHandlers.clientDataCallback);
app.get('/api/auth/team-callback', routeHandlers.teamCallback);
app.get('/api/auth/subscription-callback', routeHandlers.subscriptionCallback);
app.get('/api/auth/website-callback', routeHandlers.websiteCallback);

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;