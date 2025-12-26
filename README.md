# FOOD-SUBSTITUTION-ENGINE

A modern React-based FOOD technology project utilizing the latest frontend technologies and tools for building responsive web application in finding the best alternatives for your liking.

## 🚀 Features

- **React 18** - React version with improved rendering and concurrent features
- **Vite** - Lightning-fast build tool and development server
- **Redux Toolkit** - State management with simplified Redux setup
- **TailwindCSS** - Utility-first CSS framework with extensive customization
- **React Router v6** - Declarative routing for React applications
- **Data Visualization** - Integrated D3.js and Recharts for powerful data visualization
- **Form Management** - React Hook Form for efficient form handling
- **Animation** - Framer Motion for smooth UI animations
- **Testing** - Jest and React Testing Library setup

## 📋 Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
   
2. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## 📁 Project Structure

```
food_alternate/
│
├── 🐍 backend/                  # Python FastAPI Backend
│   ├── routers/
│   │   └── foods.py             # API Endpoints
│   ├── .env                     # Database Credentials
│   ├── database.py              # DB Connection Logic
│   ├── main.py                  # App Entry Point (CORS settings here)
│   ├── models.py                # Database Tables (SQLAlchemy)
│   ├── schemas.py               # Data Validation (Pydantic)
│   └── seed.py                  # ⭐ The Script to populate your DB
│
└── ⚛️ frontend/                 # React + Vite Frontend
    ├── public/
    │   └── assets/
    │       └── images/          # ⭐ SAVE YOUR FOOD PHOTOS HERE
    │           ├── puttu.jpg
    │           ├── biryani.jpg
    │           └── ... (all 100+ images)
    ├── src/
    │   ├── components/
    │   │   ├── ui/
    │   │   │   └── Header.jsx   # The Main Navbar
    │   │   └── AppIcon.jsx      # Icon Helper
    │   ├── pages/               # Main Application Pages
    │   │   ├── landing-page/
    │   │   │   └── index.jsx    # Hero Section & Aurora Background
    │   │   ├── food-search-results/
    │   │   │   └── index.jsx    # Grid View (Fetches from DB)
    │   │   ├── nutrition-explorer-modal/
    │   │   │   └── index.jsx    # Detail View (Shows Large Image)
    │   │   └── food-comparison-tool/
    │   │       └── index.jsx    # Comparison Logic & Search
    │   ├── styles/
    │   │   └── index.css        # Global CSS (Scrollbars & Base)
    │   ├── App.jsx              # Routing Setup
    │   └── main.jsx             # React Entry Point
    ├── index.html
    ├── package.json
    ├── tailwind.config.js       # Custom Colors & Animations
    └── vite.config.js

## 🧩 Adding Routes

To add new routes to the application, update the `Routes.jsx` file:

```jsx
import { useRoutes } from "react-router-dom";
import HomePage from "pages/HomePage";
import AboutPage from "pages/AboutPage";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/about", element: <AboutPage /> },
    // Add more routes as needed
  ]);

  return element;
};
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration includes:

- Forms plugin for form styling
- Typography plugin for text styling
- Aspect ratio plugin for responsive elements
- Container queries for component-specific responsive design
- Fluid typography for responsive text
- Animation utilities

## 📱 Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints.


## 📦 Deployment

Build the application for production:

```bash
npm run build
```

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by React and Vite
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new
