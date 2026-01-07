# 🛡️ RakshaDrishti - An AI Powered Women's Safety & Emergency Response Application

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.18-black.svg)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Android mobile application focused on women's safety, empowerment, and emergency response. Built with React Native (Expo) with partially offline functionality, battery-optimized operations, and multilingual support.

----

## 📋 Quick Links

- **[📖 Complete Documentation](PROJECT_DOCUMENTATION.md)** - Comprehensive project documentation with diagrams, flowcharts, and technical details
- **[🚀 Quick Start](#quick-start)** - Get started in 5 minutes
- **[✨ Features](#features)** - Key features overview
- **[🛠️ Tech Stack](#tech-stack)** - Technologies used

---

## ✨ Features

### 🚨 Emergency SOS System
- One-tap SOS activation with prominent red button
- **Silent triggers:** Power button (×5), shake gesture
- Automatic location sharing with trusted contacts
- Real-time alert notifications via SMS, WhatsApp, and push notifications

### 📍 Live Location Tracking
- Real-time GPS tracking with 5-second intervals
- Background tracking with battery optimization
- Location history and sharing with trusted contacts

### 👥 Trusted Contacts Management
- Add up to 5 trusted emergency contacts
- Quick contact management interface
- Automatic SOS alerts to all contacts

### 🗺️ Safe Routes Navigation
- Find nearby safe locations (police stations, hospitals, cafes)
- Danger zone alerts and warnings
- Share routes with trusted contacts

### 🌐 Community Safety Feed
- Real-time safety updates from community
- Post safety alerts and warnings
- Upvote/downvote functionality
- Admin moderation and posting

### 🌍 Multilingual Support
- **10+ Indian languages:** English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Punjabi, Gujarati
- Language preference persistence
- Seamless language switching

### 🔒 Privacy & Security
- App lock with fingerprint/face/PIN
- Panic delete functionality
- Encrypted data storage
- Strict Firebase security rules

### 🤖 AI-Powered Analytics
- **Groq AI integration** (LLaMA 3.3 70B)
- Incident pattern analysis
- Risk assessment and recommendations
- Beautiful charts and visualizations
- PDF report generation

### 👮 Admin Dashboard
- Monitor all SOS alerts in real-time
- Live notification banner for new alerts
- AI-powered analytics and insights
- Manage safety feeds
- Export reports as PDF
- Profile editing and updates
- Emergency contact information

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React Native | 0.81.5 |
| | Expo | 54.0.18 |
| | React Navigation | 6.x |
| | i18next | 23.x |
| **Backend** | Node.js | 18+ |
| | Express.js | 4.x |
| | Twilio SDK | Latest |
| **Database** | Firebase Firestore | Latest |
| | Firebase Auth | Latest |
| **AI** | Groq API | Latest |
| | LLaMA 3.3 70B | Latest |
| **Maps** | Google Maps API | Latest |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for emulator) or Expo Go app

### Installation

```bash
# 1. Clone repository_9715
git clone <repository-url>
cd RakshaDrishti
1
# 2. Install dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..

# 4. Configure environment variables
# Create .env file (see PROJECT_DOCUMENTATION.md for details)

# 5. Start frontend
npm start

# 6. Start backend (in new terminal)
cd backend
npm start
```

### Run on Device
- **Physical Device:** Install Expo Go, scan QR code
- **Emulator:** Press `a` in Expo terminal

**📖 For detailed setup instructions, see [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md#setup--deployment)**

---

## 📂 Project Structure

```
RakshaDrishti/
├── src/
│   ├── components/          # Reusable UI components
│   ├── config/              # Firebase, colors, constants
│   ├── navigation/          # Navigation setup
│   ├── screens/             # All screen components
│   │   ├── admin/           # Admin dashboard screens
│   │   ├── auth/            # Login, signup, onboarding
│   │   ├── sos/             # SOS emergency screens
│   │   ├── feed/            # Community safety feed
│   │   └── ...
│   ├── services/            # Business logic & API calls
│   └── translations/        # i18n language files
├── backend/
│   ├── controllers/         # API request handlers
│   ├── routes/              # Express routes
│   ├── services/            # Backend business logic
│   └── server.js            # Express server entry
├── assets/                  # Images, fonts, icons
├── .env                     # Environment variables
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── README.md                # This file
└── PROJECT_DOCUMENTATION.md # Complete documentation
```

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Total Features** | 10+ major features |
| **Supported Languages** | 10+ Indian languages |
| **Test Coverage** | 100% (30/30 tests passed) |
| **Security Rules** | Firestore rules implemented |
| **API Endpoints** | 6 REST endpoints |
| **Database Collections** | 5 main collections |
| **Real-time Features** | SOS alerts, Safety feeds |

---

## 🔐 Security Features

- ✅ Firebase Authentication with email/password
- ✅ Firestore security rules for data access control
- ✅ App lock with biometric authentication
- ✅ Encrypted data storage
- ✅ HTTPS for all API communications
- ✅ Location privacy controls
- ✅ Panic delete functionality
- ✅ GDPR compliant data handling

---

## 📱 Screenshots

*(Screenshots will be added here)*

---

## 🌍 Supported Languages

🇬🇧 English | 🇮🇳 Hindi | 🇮🇳 Tamil | 🇮🇳 Telugu | 🇮🇳 Kannada | 🇮🇳 Malayalam | 🇮🇳 Bengali | 🇮🇳 Marathi | 🇮🇳 Punjabi | 🇮🇳 Gujarati

---

## 📖 Documentation

For comprehensive documentation including:
- 🏗️ System Architecture Diagrams
- 📊 Database Schema & ER Diagrams
- 🔄 Data Flow Diagrams
- 📋 Use Case Diagrams
- 🔀 Sequence Diagrams
- 🧪 Complete Test Cases
- 📡 API Documentation
- 🚀 Deployment Guide

**👉 See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

- **Email:** supprakshadrishti@gmail.com
- **GitHub Issues:** [Report a bug](https://github.com/yourusername/RakshaDrishti/issues)
- **Documentation:** [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

---

## 🙏 Acknowledgments

- **Firebase** - Backend infrastructure
- **Expo** - Development platform
- **Twilio** - Communication services
- **Groq** - AI inference
- **Google Maps** - Location services
- **React Native Community** - Open source libraries

---

<div align="center">

**Made with ❤️ for women's safety**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/RakshaDrishti?style=social)](https://github.com/yourusername/RakshaDrishti)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/RakshaDrishti?style=social)](https://github.com/yourusername/RakshaDrishti)

</div>
