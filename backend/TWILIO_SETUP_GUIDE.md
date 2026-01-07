# 🔧 Twilio Setup Guide for RakshaDrishti

Complete guide to configure Twilio for SMS, WhatsApp, and OTP authentication.

---

## 📋 Prerequisites

- Twilio Account (Free Trial works perfectly)
- Verified phone numbers in Twilio Console
- $13+ trial credits available

---

## 🔑 Step 1: Get Twilio Credentials

### 1.1 Account SID and Auth Token

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find **Account SID** and **Auth Token** on the dashboard
3. Copy both values

### 1.2 Get a Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select a number with **SMS** and **Voice** capabilities
3. For trial accounts, you get one free number
4. Copy the phone number (format: `+1XXXXXXXXXX`)

---

## 📱 Step 2: Verify Phone Numbers (Trial Account)

**IMPORTANT:** Trial accounts can only send to verified numbers.

1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter the phone number you want to send alerts to
4. Complete the verification process (you'll receive a call/SMS)
5. Repeat for all trusted contacts

---

## 💬 Step 3: Setup WhatsApp Sandbox

### 3.1 Join WhatsApp Sandbox

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number: `+1 415 523 8886`
3. Send the join code from your WhatsApp to this number
   - Example: `join <your-code>`
4. You'll receive a confirmation message
5. **Repeat for all trusted contacts** who should receive WhatsApp alerts

### 3.2 WhatsApp Number Format

- Sandbox number: `whatsapp:+14155238886`
- This is already configured in your `.env` file

---

## 🔐 Step 4: Setup Twilio Verify (for OTP)

### 4.1 Create Verify Service

1. Go to [Twilio Verify Services](https://console.twilio.com/us1/develop/verify/services)
2. Click **Create new Service**
3. Enter a friendly name: `RakshaDrishti OTP`
4. Click **Create**
5. Copy the **Service SID** (starts with `VA...`)

### 4.2 Configure Verify Service

1. In your Verify Service settings:
   - **Code Length:** 6 digits (default)
   - **Code Expiration:** 5 minutes (default)
   - **Max Attempts:** 3 (default)
2. Save settings

---

## ⚙️ Step 5: Configure Backend Environment

### 5.1 Update `backend/.env`

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

### 5.2 Replace Placeholders

- `TWILIO_ACCOUNT_SID`: Your Account SID from Step 1.1
- `TWILIO_AUTH_TOKEN`: Your Auth Token from Step 1.1
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number from Step 1.2
- `TWILIO_VERIFY_SERVICE_SID`: Your Verify Service SID from Step 4.1

---

## ✅ Step 6: Verify Configuration

### 6.1 Start Backend Server

```bash
cd backend
npm install
npm start
```

### 6.2 Expected Output

```
🔍 Validating Twilio configuration...
✅ Twilio account validated: Your Account Name
   Account Status: active
   Account Type: Trial
✅ Twilio Verify Service validated: RakshaDrishti OTP

============================================================
🚀 RakshaDrishti Backend Server v2.0
============================================================
✅ Server running on port 3000
📱 Health check: http://localhost:3000/health

📞 Twilio Configuration:
   SMS Number: +1XXXXXXXXXX
   WhatsApp: whatsapp:+14155238886
   Verify Service: ✅ Enabled

🔐 Authentication Endpoints:
   POST /api/auth/send-otp
   POST /api/auth/verify-otp

🚨 SOS Emergency Endpoints:
   POST /api/sos/send-alerts (recommended)
   POST /api/sos/sms
   POST /api/sos/whatsapp
   POST /api/sos/call
============================================================
```

---

## 🧪 Step 7: Test the Integration

See `TESTING_GUIDE.md` for complete testing instructions.

---

## ⚠️ Trial Account Limitations

### What Works:
✅ Send SMS to verified numbers
✅ Send WhatsApp to sandbox-joined numbers
✅ Make voice calls to verified numbers
✅ Twilio Verify OTP to verified numbers
✅ All features work perfectly within these limits

### What Doesn't Work:
❌ Send to unverified numbers
❌ Send WhatsApp to non-sandbox numbers
❌ Remove "Sent from your Twilio trial account" prefix

### Solution:
- Verify all trusted contact numbers
- Have all contacts join WhatsApp sandbox
- Or upgrade to paid account ($20 minimum)

---

## 🚀 Production Deployment

When ready for production:

1. **Upgrade Twilio Account**
   - Add $20+ credit
   - Account automatically upgrades

2. **Remove Trial Restrictions**
   - Can send to any number
   - No verification needed
   - No trial message prefix

3. **WhatsApp Business API**
   - Apply for WhatsApp Business API
   - Get your own WhatsApp number
   - Update `TWILIO_WHATSAPP_NUMBER` in `.env`

---

## 📞 Support

- Twilio Docs: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com
- RakshaDrishti Issues: Contact your development team

---

**Status:** ✅ Ready for Development and Testing

