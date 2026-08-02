# 🚀 GitHub AI Assistant

An AI-powered GitHub-inspired repository management platform built with the **MERN Stack** and **Google Gemini AI**. The application enables users to securely manage repositories, track issues, and leverage AI to generate README files, repository summaries, and development assistance.

---

## 🌐 Live Demo

### Frontend (Vercel)
**https://github-ai-assistant-steel.vercel.app**

### Backend (Render)
**https://github-ai-assistant-lawa.onrender.com**

---

# ✨ Features

## 🔐 Authentication

- Secure User Signup
- User Login
- JWT Authentication
- Protected Routes
- Persistent User Sessions

---

## 📂 Repository Management

- Create Repository
- View Repository
- Update Repository
- Delete Repository
- Public / Private Repository Support

---

## 🤖 AI Features (Google Gemini)

- AI README Generator
- AI Repository Summary
- AI Description Generator
- AI Coding Assistant

---

## 📝 Issue Management

- Create Issues
- View Issues
- Update Issues
- Delete Issues

---

## 👤 User Dashboard

- Repository Statistics
- User Profile
- Repository Ownership
- Contribution Overview

---

# 🛠 Tech Stack

### Frontend

- React.js
- React Router DOM
- Axios
- Tailwind CSS
- React Hot Toast
- Lucide React

### Backend

- Node.js
- Express.js
- JWT Authentication
- Mongoose
- MongoDB Driver

### Database

- MongoDB Atlas

### AI Integration

- Google Gemini API

### Deployment

- Vercel
- Render

---

# 📂 Project Structure

```
github-ai-assistant
│
├── frontend-main
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── Routes.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── backend-main
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/OmPrasad1433/github-ai-assistant.git
```

---

## Backend Setup

```bash
cd backend-main
npm install
npm start
```

---

## Frontend Setup

```bash
cd frontend-main
npm install
npm run dev
```

---

# 🔑 Environment Variables

### Backend (.env)

```env
PORT=3002

MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

JWT_SECRET_KEY=YOUR_SECRET_KEY

CLIENT_URL=http://localhost:5173

AI_PROVIDER=gemini

GEMINI_MODEL=gemini-3.5-flash

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3002
```

---

# 🚀 Future Improvements

- GitHub OAuth Authentication
- Repository Search
- Pull Requests
- Repository Collaborators
- Notifications
- Markdown Editor
- File Upload Support
- Dark / Light Theme

---

# 🐛 Production Debugging Experience

During deployment, an issue occurred because **MongoClient** and **Mongoose** were connected to different MongoDB databases. This caused repository creation to fail with an **Owner not found** error.

The issue was resolved by unifying both database clients to use the same database specified in the MongoDB connection string, ensuring consistent data access throughout the application.

---

# 📚 Learning Outcomes

This project provided hands-on experience in:

- Full Stack MERN Development
- REST API Design
- JWT Authentication
- MongoDB Atlas
- Mongoose ODM
- Google Gemini AI Integration
- Production Deployment
- Environment Variable Management
- CORS Configuration
- Git & GitHub Workflow
- Production Debugging

---

# 👨‍💻 Author

**Om Prasad Sahoo**

B.Tech – Information Technology

Odisha University of Technology and Research (OUTR)

GitHub:
https://github.com/OmPrasad1433

---

# ⭐ Support

If you found this project helpful, please consider giving it a ⭐ on GitHub.
