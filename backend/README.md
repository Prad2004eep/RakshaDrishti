# 🚀 RakshaDrishti Backend API v2.0

Complete Twilio integration for SMS, WhatsApp, Voice, and OTP authentication.

---

## 📋 Features

✅ **OTP Authentication** - Twilio Verify API with SMS fallback
✅ **SMS Alerts** - Emergency SMS with live location
✅ **WhatsApp Alerts** - WhatsApp messages via Twilio sandbox
✅ **Voice Calls** - Automated emergency voice calls
✅ **Multi-Contact SOS** - Send alerts to multiple contacts simultaneously
✅ **Trial Account Support** - Works perfectly with Twilio trial account
✅ **Production Ready** - Modular, scalable architecture

---

## 🏗️ Architecture

```
backend/
├── config/
│   └── twilio.js           # Twilio client configuration
├── services/
│   ├── otpService.js       # OTP generation and verification
│   └── sosService.js       # SOS alerts (SMS, WhatsApp, Voice)
├── controllers/
│   ├── authController.js   # Authentication endpoints
│   └── sosController.js    # SOS emergency endpoints
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   └── sosRoutes.js        # /api/sos routes
├── server.js               # Main Express server
├── .env                    # Environment configuration
├── package.json            # Dependencies
├── test-twilio.js          # Automated test suite
├── TWILIO_SETUP_GUIDE.md   # Setup instructions
├── TESTING_GUIDE.md        # Testing procedures
└── README.md               # This file
```

---

## ⚙️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Twilio credentials:

```env
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Phone Numbers
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Twilio Verify Service (for OTP)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Configuration
PORT=3000
NODE_ENV=development
```

See `TWILIO_SETUP_GUIDE.md` for detailed setup instructions.

### 3. Start Server

```bash
npm start
```

**Expected Output:**
```
🔍 Validating Twilio configuration...
✅ Twilio account validated: Your Account Name
✅ Twilio Verify Service validated: RakshaDrishti OTP

============================================================
🚀 RakshaDrishti Backend Server v2.0
============================================================
✅ Server running on port 3000
📱 Health check: http://localhost:3000/health
```

---

## 📡 API Endpoints

### Health Check

```
GET /health
```

Returns server status and Twilio configuration.

### Authentication

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

### SOS Emergency

#### Send SMS Alert
```
POST /api/sos/sms
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "userName": "John Doe",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### Send WhatsApp Alert
```
POST /api/sos/whatsapp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "userName": "John Doe",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### Make Voice Call
```
POST /api/sos/call
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "userName": "John Doe",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### Send Alerts to Multiple Contacts (Recommended)
```
POST /api/sos/send-alerts
Content-Type: application/json

{
  "userName": "John Doe",
  "userPhone": "+919876543210",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "contacts": [
    {
      "name": "Emergency Contact 1",
      "phone": "+919876543211"
    },
    {
      "name": "Emergency Contact 2",
      "phone": "+919876543212"
    }
  ]
}
```

---

## 🧪 Testing

### Automated Tests

```bash
# Update TEST_PHONE in test-twilio.js first
node test-twilio.js
```

### Manual Testing

See `TESTING_GUIDE.md` for complete testing procedures.

---

## 🔧 Configuration

### Twilio Verify Service (Recommended)

For production-grade OTP:
1. Create Verify Service in Twilio Console
2. Add `TWILIO_VERIFY_SERVICE_SID` to `.env`
3. Restart server

### Fallback Mode

If Verify Service is not configured, the system automatically falls back to manual OTP generation.

---

## 📚 Documentation

- **[TWILIO_SETUP_GUIDE.md](./TWILIO_SETUP_GUIDE.md)** - Complete Twilio setup
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures
- **[API Documentation](./API_DOCS.md)** - Detailed API reference

---

## 🐛 Troubleshooting

See `TESTING_GUIDE.md` → Troubleshooting section.

---

## 📄 License

MIT

---

**Status:** ✅ Production Ready
**Version:** 2.0.0
**Last Updated:** 2024-01-15

