# InstaClone Frontend

A full-stack Instagram clone built with Next.js, React, and Tailwind CSS.

## Tech Stack
- Framework: Next.js (App Router) / React.js
- Styling: Tailwind CSS
- HTTP Client: Axios
- Real-time: Socket.io Client
- Icons: React Icons

## Features
- User authentication (signup, login with email or username)
- Password show/hide toggle
- Dynamic feed with all users' posts
- Post creation with image upload and caption
- Like / Unlike posts with real-time count
- Comment system (add, view, delete)
- Follow / Unfollow users, with followers/following list modal
- Save / Bookmark posts (dedicated Saved page)
- Edit profile (name, username, bio, profile photo)
- Real-time notifications (likes and comments) via Socket.io
- Dark mode / Light mode toggle
- Instagram-inspired responsive UI (mobile + desktop)

## Setup Instructions
1. Clone the repo and install dependencies: git clone repo-url, cd frontend, npm install
2. Create a .env.local file with: NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
3. Run the development server: npm run dev
4. Open http://localhost:3000

## Pages
/login - Login page (email or username)
/signup - Signup page
/ - Home feed
/create - Create a new post
/profile/[id] - User profile page
/saved - Saved/bookmarked posts
/notifications - Real-time notifications

## Live Deployment
Frontend is deployed on Vercel: https://instaclone-frontend-rose.vercel.app

## Notes
- The app is fully responsive and works on both desktop and mobile.
- Dark mode preference is applied across all pages.