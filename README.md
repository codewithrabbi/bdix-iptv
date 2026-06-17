# 📺 BDIX IPTV - Live TV Streaming

A modern, fast, and feature-rich Web-based IPTV streaming application. Built with vanilla JavaScript, Tailwind CSS, and Firebase. This platform allows users to stream HLS (`.m3u8`) channels seamlessly, while offering a complete real-time Admin Panel for managing channels and categories.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)

---

## 🌟 Features

### 🖥️ User Interface (Frontend)
- **Modern & Responsive Design**: Built with Tailwind CSS and sleek Glassmorphism elements.
- **Adaptive HLS Video Player**: Powered by `hls.js`, supporting multiple resolutions with a manual Quality Selector (Auto, 1080p, 720p, etc.).
- **Live Search & Filtering**: Instantly search for channels or filter them by category without page reloads.
- **Real-Time Updates**: Channels appear instantly via Firebase's real-time listeners.

### 🛡️ Admin Panel
- **Secure Authentication**: Protected by Firebase Email/Password Auth.
- **Full CRUD Support**: Add, Edit, and Delete live TV channels and categories.
- **Bulk Operations**: Select multiple channels and delete them with a single click.
- **Custom UI System**: Beautiful Toast notifications and Modal confirmations instead of native browser alerts.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (via CDN)
- **Video Player**: HLS.js
- **Backend & Database**: Google Firebase (Firestore & Firebase Auth)
- **Deployment**: Ready for Vercel, Netlify, GitHub Pages, or Firebase Hosting.

---

## 🚀 Getting Started

### Prerequisites
You will need a Firebase account to configure the database and authentication.

### 1. Installation
Simply clone or download the repository to your local machine:
```bash
git clone https://github.com/your-username/bdix-iptv.git
cd bdix-iptv
```

### 2. Configure Firebase
1. Create a project on the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Email/Password method).
3. Set your Firestore rules to allow read/write access for authenticated users.
4. Copy your Firebase Config object and paste it in `js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Run Locally
Since this is a fully static site, you can run it via VS Code's **Live Server** extension, or use a simple python HTTP server:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

---

## 🔒 Admin Panel Access
- Navigate to `/admin.html`
- Log in using your Firebase Authentication credentials to access the dashboard.
- From there, you can manage your `.m3u8` streams and categories.

---

## 🌐 Deployment
This project is 100% static. You can easily deploy the folder directly to **Vercel** or **Netlify** by dragging and dropping it, or connect your GitHub repository for continuous deployment.

---

## 📝 License
This project is licensed under the MIT License. Feel free to modify and use it for your personal projects.
