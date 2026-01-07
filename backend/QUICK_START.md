# ⚡ Quick Start Guide - 15 Minutes Setup

Get RakshaDrishti Twilio integration running in 15 minutes.

---

## 🎯 Goal

By the end of this guide, you'll have:
- ✅ Backend server running
- ✅ Twilio configured
- ✅ OTP authentication working
- ✅ SOS alerts sending to your phone

---

## 📋 Prerequisites

- Twilio account (free trial works)
- Node.js installed
- Your phone number

---

## 🚀 Step 1: Get Twilio Credentials (5 min)

### 1.1 Login to Twilio
Go to https://console.twilio.com/

### 1.2 Copy Credentials
From the dashboard, copy:
- **Account SID** (starts with `AC...`)
- **Auth Token** (click to reveal)

### 1.3 Get Phone Number
- Go to **Phone Numbers** → **Manage** → **Buy a number**
- Select any number with SMS capability
- Copy the number (format: `+1XXXXXXXXXX`)

### 1.4 Verify Your Phone
- Go to **Phone Numbers** → **Verified Caller IDs**
- Click **Add a new Caller ID**
- Enter your phone number
- Complete verification

---

## 🔐 Step 2: Setup Twilio Verify (3 min)

### 2.1 Create Verify Service
1. Go to https://console.twilio.com/us1/develop/verify/services
2. Click **Create new Service**
3. Name: `RakshaDrishti OTP`
4. Click **Create**
5. Copy the **Service SID** (starts with `VA...`)

---

## 💬 Step 3: Join WhatsApp Sandbox (2 min)

### 3.1 Join Sandbox
1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Send the join code from your WhatsApp to `+1 415 523 8886`
3. You'll receive a confirmation

---

## ⚙️ Step 4: Configure Backend (2 min)

### 4.1 Update .env File

Open `backend/.env` and update:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace:
- `ACxxx...` with your Account SID
- `your_auth_token_here` with your Auth Token
- `+1XXXXXXXXXX` with your Twilio phone number
- `VAxxx...` with your Verify Service SID

---

## 🏃 Step 5: Start Backend (1 min)

```bash
cd backend
npm install
npm start
```

**Expected Output:**
```
✅ Twilio account validated: Your Account Name
✅ Twilio Verify Service validated: RakshaDrishti OTP
✅ Server running on port 3000
```

---

## 🧪 Step 6: Test It! (2 min)

### 6.1 Test OTP

Open a new terminal:

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

**Replace `+919876543210` with your verified number**

✅ You should receive an SMS with OTP!

### 6.2 Test SOS Alert

```bash
curl -X POST http://localhost:3000/api/sos/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "userName": "Test User",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

✅ You should receive an SMS with emergency alert and location link!

### 6.3 Test WhatsApp

```bash
curl -X POST http://localhost:3000/api/sos/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "userName": "Test User",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

✅ You should receive a WhatsApp message!

---

## ✅ Success Checklist

- [ ] Twilio account created
- [ ] Phone number obtained
- [ ] Your number verified
- [ ] Verify Service created
- [ ] WhatsApp sandbox joined
- [ ] `.env` file updated
- [ ] Backend server running
- [ ] OTP received
- [ ] SMS alert received
- [ ] WhatsApp alert received

---

## 🎉 You're Done!

Your Twilio integration is now fully functional!

### Next Steps:

1. **Run Full Tests**
   ```bash
   node test-twilio.js
   ```

2. **Read Documentation**
   - `TWILIO_SETUP_GUIDE.md` - Detailed setup
   - `TESTING_GUIDE.md` - Complete testing
   - `README.md` - API reference

3. **Integrate with Frontend**
   - Update `EXPO_PUBLIC_API_BASE_URL` in root `.env`
   - Test from React Native app

---

## 🐛 Troubleshooting

### "Phone number not verified"
→ Verify your number in Twilio Console

### "WhatsApp failed"
→ Make sure you joined the sandbox

### "Invalid Verify Service SID"
→ Check the SID in Twilio Console and `.env`

### "Server won't start"
→ Check all environment variables are set

---

## 📞 Support

- Twilio Docs: https://www.twilio.com/docs
- Issues: Check `TESTING_GUIDE.md` troubleshooting section

---

**Total Time:** ~15 minutes
**Status:** ✅ Ready to Use

