// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');

// const clientRoutes = require('./routes/clients');

const app = express();


app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5000',
        'https://login-system-testing.netlify.app',
        'https://userloginauthenticationmicroservice.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "https:", "data:"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Note: 'unsafe-inline' is for development ease
                styleSrc: ["'self'", "'unsafe-inline'"], // Note: 'unsafe-inline' is for development ease
                connectSrc: ["'self'", "https://userloginauthenticationmicroservice.onrender.com",
                    'http://localhost:5000'
                ],
                // Add other directives as needed for your app
            },
        },
        // Other Helmet settings can go here
    })
);


// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// Routes
// app.use('/api/clients', clientRoutes);

// 404 handler
// app.all('/:id', (req, res) => {
//     res.status(404).json({
//         status: 'error',
//         message: `Can't find ${req.originalUrl} on this server!`
//     });
// });

// Global error handler
// app.use((err, req, res, next) => {
//     console.error(err.stack);

//     res.status(err.statusCode || 500).json({
//         status: 'error',
//         message: err.message || 'Internal Server Error'
//     });
// });


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});




app.get('/api/registrationLink', async (req, res, next) => {
    try {
        const authnestClientApiKey = process.env.CLIENT_AUTHNEST_API_KEY;
        const authnestClientSecretKey = process.env.CLIENT_AUTHNEST_SECRET_KEY;
        const state = crypto.randomBytes(12).toString('hex');

        // Instead of making a fetch request, construct the redirect URL directly
        let redirectUrl;
        if (process.env.NODE_ENV == "production") {
            redirectUrl = `https://userloginauthenticationmicroservice.onrender.com/api/registration-forms/grabApiKeys?client_api_key=${authnestClientApiKey}&client_secret_key=${authnestClientSecretKey}&state=${state}&redirect_uri=${encodeURIComponent('/api/auth/callback')}`;
        } else {
            redirectUrl = `http://localhost:5000/api/registration-forms/grabApiKeys?client_api_key=${authnestClientApiKey}&client_secret_key=${authnestClientSecretKey}&state=${state}&redirect_uri=${encodeURIComponent('/api/auth/callback')}`;
        }


        // Redirect the client directly to the authentication service
        res.redirect(redirectUrl);

    } catch (error) {
        next(error);
    }
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


module.exports = app;