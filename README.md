# WebChat - Real-Time Chat Application

> A modern, secure, and feature-rich real-time chat application built with Next.js, Firebase, and TypeScript.

**Created by:** [Viraj Sawant](https://github.com/Virajr7123)

---

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- **Real-Time Messaging** - Instant message delivery using Firebase Realtime Database
- **User Authentication** - Secure email/password authentication with Firebase Auth
- **User Profiles** - Customizable user profiles with avatars and status
- **Contact Management** - Add, remove, and manage contacts
- **Message History** - Persistent message storage and retrieval
- **Typing Indicators** - See when contacts are typing
- **Online Status** - Real-time presence detection
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Mode Support** - Eye-friendly dark theme
- **Email Validation** - Server-side email validation for security
- **Account Management** - Secure account termination and data handling

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- A **Firebase Project** (free tier available at [.consolefirebase.google.com](https://console.firebase.google.com/u/0/))

---

## 🚀 Installation

### Step 1: Clone the Repository

\`\`\`bash
git clone https://github.com/virajsawant/webchat.git
cd webchat
\`\`\`

### Step 2: Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory (this file is **NOT** tracked by git for security):

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit `.env.local` and add your actual credentials (see [Environment Setup](#environment-setup) section below).

---

## 🔐 Environment Setup

### Firebase Configuration

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a new project"
   - Follow the setup wizard

2. **Get Your Firebase Credentials:**
   - In Firebase Console, go to Project Settings
   - Under "Your apps", click the web icon
   - Copy your Firebase config values

3. **Enable Authentication:**
   - In Firebase Console, go to Authentication
   - Click "Get started"
   - Enable "Email/Password" sign-in method

4. **Enable Realtime Database:**
   - In Firebase Console, go to Realtime Database
   - Click "Create Database"
   - Start in test mode (or configure security rules)

### Update `.env.local`

\`\`\`env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email Validation API (AbstractAPI)
EMAIL_VALIDATION_API_KEY=your_abstractapi_key_here
\`\`\`

**⚠️ Important Security Notes:**
- **Never commit `.env.local`** to version control
- The `.env.local` file is listed in `.gitignore` for your protection
- Only `NEXT_PUBLIC_*` variables are exposed to the client
- Sensitive API keys remain on the server only

---

## 🎯 Getting Started

### Development Mode

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

The application will be available at `http://localhost:3000`

### Production Build

\`\`\`bash
npm run build
npm run start
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

---

## 📁 Project Structure

\`\`\`
webchat/
├── app/
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── auth-screen.tsx      # Authentication UI
│   ├── chat-interface.tsx   # Main chat interface
│   ├── contact-list.tsx     # Contacts sidebar
│   ├── message-list.tsx     # Message display
│   └── ...                  # Other UI components
├── contexts/
│   ├── auth-context.tsx     # Authentication state
│   └── chat-context.tsx     # Chat state management
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── email-validation.ts  # Server-side email validation
│   └── utils.ts             # Utility functions
├── hooks/
│   ├── use-auth.ts          # Authentication hook
│   └── use-chat.ts          # Chat functionality hook
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
└── README.md                # This file
\`\`\`

---

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Firebase** | Backend, authentication, and database |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Context** | State management |
| **SWR** | Data fetching and caching |

---

## 🔒 Security Features

### Implemented Security Measures:

✅ **Environment Variables** - All sensitive data stored securely
✅ **Server-Side Validation** - Email validation happens on the server
✅ **Firebase Security Rules** - Database access controlled by rules
✅ **No Hardcoded Secrets** - Safe for public GitHub repositories
✅ **HTTPS Only** - Secure communication in production
✅ **Input Sanitization** - Protection against XSS attacks
✅ **Authentication** - Firebase Auth with email/password

### Best Practices:

- Never share your `.env.local` file
- Rotate API keys regularly
- Use strong passwords for Firebase accounts
- Review Firebase Security Rules in production
- Keep dependencies updated: `npm audit fix`

---

## 📖 How to Use

### 1. **Sign Up**
   - Click "Sign Up" on the login screen
   - Enter your email and password
   - Verify your email (if required)

### 2. **Create Your Profile**
   - Add a display name
   - Upload a profile picture (optional)
   - Set your status message

### 3. **Add Contacts**
   - Click "Add Contact"
   - Enter the contact's email address
   - Send a contact request

### 4. **Start Chatting**
   - Select a contact from your list
   - Type your message in the input field
   - Press Enter or click Send
   - See real-time message delivery

### 5. **Manage Account**
   - Access settings from the menu
   - Update profile information
   - Change password
   - Manage privacy settings
   - Delete account (if needed)

---

## 🐛 Troubleshooting

### Issue: "Firebase configuration is missing"
**Solution:** Ensure `.env.local` is created and contains all required Firebase variables.

### Issue: "Cannot send messages"
**Solution:** Check Firebase Realtime Database rules and ensure authentication is working.

### Issue: "Email validation failing"
**Solution:** Verify `EMAIL_VALIDATION_API_KEY` is correct and your AbstractAPI account is active.

### Issue: "Port 3000 already in use"
**Solution:** Use a different port: `npm run dev -- -p 3001`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature`
3. **Commit changes:** `git commit -m 'Add your feature'`
4. **Push to branch:** `git push origin feature/your-feature`
5. **Open a Pull Request**

### Code Style:
- Use TypeScript for type safety
- Follow existing code patterns
- Add comments for complex logic
- Test your changes before submitting

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Creator

**Viraj Sawant**

- GitHub: [@Virajr7123 ](https://github.com/Virajr7123)
- Email: sawantviraj976@gmail.com
- Portfolio: [https://virajr7123-portfolio-me.netlify.app/](https://virajr7123-portfolio-me.netlify.app/)

---

## 📞 Support

If you encounter any issues or have questions:

1. Review [Firebase Documentation](https://firebase.google.com/docs)
2. Open an issue on GitHub
3. Contact the creator

---

## 🎉 Acknowledgments

- Firebase for backend services
- Next.js team for the amazing framework
- Tailwind CSS for styling utilities
- All contributors and users

---

**Last Updated:** October 2025

**Version:** 10.0.0

---

> Made by Viraj Sawant
