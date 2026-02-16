# 📊 Real-Time Poll Application

A full-stack real-time polling web application where users can create polls, share links, vote, and see results update live without page refresh.

## 🎯 Live Demo

**Frontend:** [Coming after deployment]  
**Backend:** [Coming after deployment]

## ✨ Features

### 1️⃣ Poll Creation
- Users can create polls with a custom question
- Add 2-10 options for voting
- Generates unique shareable link automatically
- Simple and intuitive interface

### 2️⃣ Easy Voting
- No login required - anyone with the link can vote
- Single-choice voting (one vote per user)
- Clean and responsive voting interface

### 3️⃣ Real-Time Updates ⚡
- **Instant results** - see votes update live without refreshing
- Uses **Socket.io WebSockets** for real-time communication
- Live indicator shows connection status
- All users viewing the same poll see updates simultaneously

### 4️⃣ Anti-Cheating Protection 🛡️

This application implements **TWO layers of protection** to prevent fake votes:

#### Protection #1: Browser LocalStorage Tracking
- **What it does:** Marks the browser as "voted" using localStorage
- **How it works:** Saves a flag in browser's localStorage after voting
- **What it prevents:** Prevents multiple votes from the same browser session
- **Limitations:**
  - Users can clear browser data to vote again
  - Doesn't work across different browsers on same device
  - Private/incognito mode resets this protection

#### Protection #2: Rate Limiting (IP-based)
- **What it does:** Limits how frequently votes can be cast from the same IP address
- **How it works:** Tracks vote timestamps per IP address with 60-second cooldown
- **What it prevents:** Prevents rapid-fire mass voting and automated attacks
- **Limitations:**
  - Multiple users on same network share the same public IP
  - Legitimate users from same network must wait 60 seconds between votes
  - VPN/proxy users can potentially bypass by changing IP

#### Combined Protection
Using both methods together provides stronger protection:
- LocalStorage prevents casual repeat voting from same browser
- Rate limiting prevents automated mass voting attacks
- 60-second cooldown window protects against bots without blocking legitimate users
- Together they make voting manipulation significantly harder while remaining user-friendly

### 5️⃣ Data Persistence 💾
- All polls and votes stored in **MongoDB Atlas**
- Polls accessible anytime via shareable link
- Results persist even after server restart
- Reliable cloud database storage

### 6️⃣ Deployment Ready 🚀
- Backend deployed on **Render**
- Frontend deployed on **Vercel**
- Production-ready configuration included

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 - UI framework
- React Router - Client-side routing
- Socket.io Client - Real-time communication
- Axios - HTTP requests
- CSS3 - Styling

**Backend:**
- Node.js - Runtime environment
- Express.js - Web framework
- Socket.io - Real-time WebSocket server
- MongoDB + Mongoose - Database
- nanoid - Unique ID generation

**Database:**
- MongoDB Atlas - Cloud database

**Real-Time Communication:**
- Socket.io (WebSockets with fallback to polling)

### Project Structure

```
applyo/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   └── Poll.js              # Poll schema
│   ├── .env                     # Environment variables
│   ├── .gitignore
│   ├── package.json
│   └── server.js                # Main server file
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── PollResults.js   # Results display component
    │   ├── pages/
    │   │   ├── CreatePoll.js    # Poll creation page
    │   │   └── PollPage.js      # Voting page
    │   ├── App.css              # Global styles
    │   ├── App.js               # Main app component
    │   ├── config.js            # API configuration
    │   ├── index.css
    │   └── index.js
    ├── .gitignore
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (connection string provided)

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd applyo
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (already created with MongoDB connection):
```env
PORT=5000
MONGODB_URI=mongodb+srv://muktharbasha:shaikmuktharbasha@cluster0.t1lt2x8.mongodb.net/applyo
NODE_ENV=development
```

Start backend server:
```bash
npm start
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm start
```

Frontend will open at `http://localhost:3000`

## 🎮 How to Use

### Creating a Poll

1. Visit the home page
2. Enter your poll question (e.g., "What's the best programming language?")
3. Add at least 2 options (e.g., "Python", "JavaScript", "Java")
4. Click "Create Poll"
5. Copy the generated shareable link
6. Share with others!

### Voting on a Poll

1. Open the poll link (e.g., `http://localhost:3000/poll/abc123`)
2. View the question and options
3. Click an option to vote
4. See results update in real-time
5. Watch as others vote (results update automatically!)

### Viewing Results

- Results are visible immediately after voting
- Percentage bars show vote distribution
- Total vote count displayed at bottom
- Live indicator shows real-time connection status
- Results update instantly when others vote

## 🔄 Real-Time Flow

1. **User A creates a poll** → Poll saved to MongoDB
2. **User B opens poll** → Connects to Socket.io, joins poll room
3. **User C opens same poll** → Also joins same poll room
4. **User B votes** → 
   - Vote saved to database
   - Server broadcasts `voteUpdate` to all users in that poll room
5. **User C sees update instantly** → No refresh needed!

## 📡 API Endpoints

### Create Poll
```http
POST /api/polls
Content-Type: application/json

{
  "question": "What's the best programming language?",
  "options": ["Python", "JavaScript", "Java"]
}

Response:
{
  "success": true,
  "pollId": "abc123",
  "message": "Poll created successfully"
}
```

### Get Poll
```http
GET /api/polls/:pollId

Response:
{
  "success": true,
  "poll": {
    "pollId": "abc123",
    "question": "What's the best programming language?",
    "options": [...],
    "totalVotes": 10,
    "hasVoted": false
  }
}
```

### Vote on Poll
```http
POST /api/polls/:pollId/vote
Content-Type: application/json

{
  "optionIndex": 0
}

Response:
{
  "success": true,
  "message": "Vote recorded successfully",
  "poll": {...}
}
```

## 🌐 Deployment Guide

### Backend Deployment (Render)

1. **Create a Render account** at [render.com](https://render.com)

2. **Create New Web Service**
   - Connect your GitHub repository
   - Select the `backend` folder
   - Choose **Node** environment

3. **Configure Settings**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `MONGODB_URI`: Your MongoDB connection string
     - `NODE_ENV`: `production`
     - `FRONTEND_URL`: Your Vercel frontend URL (add after frontend deployment)

4. **Deploy** - Render will build and deploy automatically

5. **Get your backend URL** (e.g., `https://your-app.onrender.com`)

### Frontend Deployment (Vercel)

1. **Create a Vercel account** at [vercel.com](https://vercel.com)

2. **Import Git Repository**
   - Connect your GitHub repository
   - Select the `frontend` folder as root directory

3. **Configure Build Settings**
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   
4. **Environment Variables**
   - `REACT_APP_API_URL`: Your Render backend URL
   - `REACT_APP_SOCKET_URL`: Your Render backend URL

5. **Deploy** - Vercel will build and deploy automatically

6. **Get your frontend URL** (e.g., `https://your-app.vercel.app`)

### Post-Deployment Configuration

1. Update backend's `FRONTEND_URL` environment variable on Render with your Vercel URL
2. Test the application:
   - Create a poll
   - Open poll link in multiple browser windows
   - Vote and watch real-time updates work

## 🧪 Testing the Application

### Manual Testing Checklist

- [ ] Create a poll with 2 options
- [ ] Verify unique link is generated
- [ ] Open poll link in new tab
- [ ] Vote on an option
- [ ] Verify vote is recorded
- [ ] Try to vote again (should be blocked)
- [ ] Open same poll in another browser/incognito
- [ ] Vote in second browser
- [ ] Verify first browser shows update in real-time
- [ ] Refresh page - verify votes persist
- [ ] Test with 10 options
- [ ] Test empty question/options validation

### Anti-Cheating Tests

- [ ] Vote once, try to vote again from same browser (blocked by localStorage)
- [ ] Vote once, try to vote again from same IP (blocked by server)
- [ ] Clear localStorage and try to vote (blocked by IP)
- [ ] Use VPN to change IP (can vote again - expected limitation)

## 📚 Key Learning Points

This project demonstrates:

1. **Full-Stack Development** - Frontend + Backend + Database
2. **Real-Time Communication** - WebSockets with Socket.io
3. **RESTful API Design** - CRUD operations
4. **Database Modeling** - MongoDB schemas
5. **State Management** - React hooks and state
6. **Security Considerations** - Anti-cheating mechanisms
7. **Deployment** - Production deployment to cloud platforms

## 🔧 Troubleshooting

### Common Issues

**Socket.io not connecting:**
- Check backend is running
- Verify CORS settings in server.js
- Check browser console for errors
- Ensure Socket.io versions match in frontend and backend

**Database connection failed:**
- Verify MongoDB connection string in .env
- Check MongoDB Atlas allows connections from your IP
- Ensure database user has proper permissions

**Votes not updating in real-time:**
- Verify Socket.io connection (check live indicator)
- Check browser console for errors
- Ensure both frontend and backend are running

**Cannot vote (already voted error):**
- This is expected behavior after voting once
- Clear localStorage to test again: Browser DevTools > Application > Local Storage > Clear
- Or use different browser/device

## 🎓 What This Project Tests

### Technical Skills
- Full-stack JavaScript development
- Real-time communication protocols
- Database design and queries
- API development
- Frontend state management
- Deployment and DevOps

### Concepts
- WebSocket technology
- Event-driven architecture
- Client-server communication
- Data persistence
- Security best practices
- User experience design

## 📝 License

MIT License - Feel free to use this project for learning purposes.

## 👨‍💻 Author

Built as a real-time polling assignment to demonstrate full-stack development skills.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- MongoDB Atlas for database hosting
- Render and Vercel for deployment platforms

---

**Note:** This is a demonstration project for educational purposes. For production use, consider adding:
- User authentication
- Poll expiration dates
- More robust anti-cheating (CAPTCHA, device fingerprinting)
- Analytics dashboard
- Poll editing/deletion
- Rate limiting
- Input sanitization
- Security headers
