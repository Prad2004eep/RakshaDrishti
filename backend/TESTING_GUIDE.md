# 🧪 Testing Guide - Twilio Integration

Complete testing procedures for OTP, SMS, WhatsApp, and Voice features.

---

## 📋 Prerequisites

- Backend server running (`npm start`)
- Twilio configured (see `TWILIO_SETUP_GUIDE.md`)
- Phone numbers verified in Twilio Console
- WhatsApp sandbox joined

---

## 🔐 Test 1: OTP Authentication

### 1.1 Send OTP

**Endpoint:** `POST /api/auth/send-otp`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phone": "+919876543210",
  "method": "verify",
  "expiresIn": 300,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Check:**
- ✅ SMS received on phone
- ✅ OTP is 6 digits
- ✅ Message mentions RakshaDrishti

### 1.2 Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "otp": "123456"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "phone": "+919876543210",
  "verified": true,
  "method": "verify",
  "timestamp": "2024-01-15T10:31:00.000Z"
}
```

**Expected Response (Invalid OTP):**
```json
{
  "success": false,
  "error": "Invalid OTP code",
  "code": "INVALID_OTP"
}
```

---

## 📱 Test 2: SMS Alert

### 2.1 Send SMS with Location

**Endpoint:** `POST /api/sos/sms`

**Request:**
```bash
curl -X POST http://localhost:3000/api/sos/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "userName": "John Doe",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "type": "sms",
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+919876543210",
  "timestamp": "2024-01-15T10:32:00.000Z"
}
```

**Check:**
- ✅ SMS received
- ✅ Contains user name
- ✅ Contains Google Maps link
- ✅ Link opens correct location

---

## 💬 Test 3: WhatsApp Alert

### 3.1 Send WhatsApp with Location

**Endpoint:** `POST /api/sos/whatsapp`

**Request:**
```bash
curl -X POST http://localhost:3000/api/sos/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "userName": "John Doe",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "type": "whatsapp",
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+919876543210",
  "timestamp": "2024-01-15T10:33:00.000Z"
}
```

**Check:**
- ✅ WhatsApp message received
- ✅ From Twilio sandbox number
- ✅ Contains emergency alert
- ✅ Contains location link

---

## 📞 Test 4: Voice Call

### 4.1 Make Emergency Call

**Endpoint:** `POST /api/sos/call`

**Request:**
```bash
curl -X POST http://localhost:3000/api/sos/call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "userName": "John Doe",
    "latitude": 12.9716,
    "longitude": 77.5946
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "type": "voice",
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued",
  "to": "+919876543210",
  "timestamp": "2024-01-15T10:34:00.000Z"
}
```

**Check:**
- ✅ Phone call received
- ✅ Voice message plays
- ✅ Mentions emergency alert
- ✅ Mentions user name

---

## 🚨 Test 5: Combined SOS Alerts

### 5.1 Send to Multiple Contacts

**Endpoint:** `POST /api/sos/send-alerts`

**Request:**
```bash
curl -X POST http://localhost:3000/api/sos/send-alerts \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": {
    "sms": [
      {
        "name": "Emergency Contact 1",
        "success": true,
        "type": "sms",
        "messageSid": "SMxxx...",
        "status": "queued",
        "to": "+919876543211"
      }
    ],
    "whatsapp": [
      {
        "name": "Emergency Contact 1",
        "success": true,
        "type": "whatsapp",
        "messageSid": "SMxxx...",
        "status": "queued",
        "to": "+919876543211"
      }
    ],
    "voice": [],
    "failed": []
  },
  "summary": {
    "totalContacts": 2,
    "smsSent": 2,
    "whatsappSent": 2,
    "voiceCalls": 0,
    "failed": 0
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

**Check:**
- ✅ All contacts receive SMS
- ✅ All contacts receive WhatsApp (if joined sandbox)
- ✅ Summary shows correct counts
- ✅ No failures

---

## ✅ Complete Test Checklist

- [ ] Backend server starts without errors
- [ ] Twilio configuration validated
- [ ] OTP send works
- [ ] OTP verify works
- [ ] SMS alert received
- [ ] WhatsApp alert received
- [ ] Voice call received
- [ ] Multiple contacts receive alerts
- [ ] Location links work correctly
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "Phone number not verified"
**Solution:** Verify the number in Twilio Console → Verified Caller IDs

### Issue: "WhatsApp message failed"
**Solution:** Join WhatsApp sandbox by sending join code to +1 415 523 8886

### Issue: "Invalid Verify Service SID"
**Solution:** Create Verify Service in Twilio Console and update `.env`

### Issue: "OTP not received"
**Solution:** Check Twilio logs at https://console.twilio.com/us1/monitor/logs/sms

### Issue: "Network request failed"
**Solution:** Ensure backend is running on http://localhost:3000

---

## 📊 Expected Success Rates

**Trial Account:**
- OTP to verified numbers: 100%
- SMS to verified numbers: 100%
- WhatsApp to sandbox-joined numbers: 100%
- Voice to verified numbers: 100%

**Production Account:**
- All features to any number: 99%+

---

**Status:** ✅ Ready for Testing

