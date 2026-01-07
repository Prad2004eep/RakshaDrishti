/**
 * RakshaDrishti Backend Server
 * Twilio SMS, WhatsApp, and OTP Integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import configuration and routes
const { twilioConfig, validateTwilioConfig } = require('./config/twilio');
const authRoutes = require('./routes/authRoutes');
const sosRoutes = require('./routes/sosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RakshaDrishti Backend API is running',
    twilio: {
      configured: true,
      phoneNumber: twilioConfig.phoneNumber,
      whatsappNumber: twilioConfig.whatsappNumber,
      verifyEnabled: twilioConfig.hasVerifyService
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RakshaDrishti Backend API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      auth: {
        sendOTP: 'POST /api/auth/send-otp',
        verifyOTP: 'POST /api/auth/verify-otp'
      },
      sos: {
        sendSMS: 'POST /api/sos/sms',
        sendWhatsApp: 'POST /api/sos/whatsapp',
        makeCall: 'POST /api/sos/call',
        sendAlerts: 'POST /api/sos/send-alerts'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================
async function startServer() {
  try {
    // Validate Twilio configuration
    const isValid = await validateTwilioConfig();

    if (!isValid) {
      console.error('❌ Server startup aborted due to invalid Twilio configuration');
      process.exit(1);
    }

    // Start Express server on all network interfaces (0.0.0.0)
    // This allows connections from phone/other devices on the same network
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 RakshaDrishti Backend Server v2.0');
      console.log('='.repeat(70));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📱 Local: http://localhost:${PORT}/health`);
      console.log(`📱 Network: http://192.168.1.7:${PORT}/health`);
      console.log('');
      console.log('📞 Twilio Configuration:');
      console.log(`   SMS Number: ${twilioConfig.phoneNumber}`);
      console.log(`   WhatsApp: ${twilioConfig.whatsappNumber}`);
      console.log(`   Verify Service: ${twilioConfig.hasVerifyService ? '✅ Enabled' : '⚠️  Disabled (using fallback)'}`);
      console.log('');
      console.log('🔐 Authentication Endpoints:');
      console.log(`   POST /api/auth/send-otp`);
      console.log(`   POST /api/auth/verify-otp`);
      console.log('');
      console.log('🚨 SOS Emergency Endpoints:');
      console.log(`   POST /api/sos/send-alerts (recommended)`);
      console.log(`   POST /api/sos/sms`);
      console.log(`   POST /api/sos/whatsapp`);
      console.log(`   POST /api/sos/call`);
      console.log('='.repeat(70) + '\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;

