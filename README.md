<div align="center">

# 🥗 NutriAI — Smart Food Alternatives Finder

**Discover healthier, culturally-validated food alternatives powered by a medically-grounded recommendation engine.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deployed%20With-Docker-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Hosting-Render-46E3B7?style=for-the-badge&logo=render)](https://render.com/)

</div>

---

## 📖 Table of Contents

- [What Is This?](#-what-is-this)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started — Local Development](#-getting-started--local-development)
  - [Prerequisites](#prerequisites)
  - [Option A: Running with Docker (Recommended)](#option-a-running-with-docker-recommended)
  - [Option B: Running Manually (Without Docker)](#option-b-running-manually-without-docker)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [API Reference](#-api-reference)
- [Application Pages & Routes](#-application-pages--routes)
- [Security Architecture](#-security-architecture)
- [Deployment on Render](#-deployment-on-render)
- [Contributing](#-contributing)

---

## 🧠 What Is This?

**NutriAI** is a full-stack web application that helps users find healthier food alternatives based on:

- 🏥 **Medical health goals** (diabetic, heart health, weight loss, muscle gain, kidney care, cholesterol)
- 🌿 **Allergen avoidance** (dairy, gluten, nuts, soy, eggs, shellfish)
- 🌍 **Cultural relevance** (Kerala native dishes, Arabic, Chinese, Continental, Fast Food, and more)
- ♻️ **Sustainability** (carbon footprint, water usage, land use scores)

The recommendation engine is validated against **ICMR/NIN dietary guidelines**, **FSSAI Eat Right India** standards, and **Ayurvedic food pairing** principles — making it far more sophisticated than a simple calorie tracker.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Smart Food Search** | Case-insensitive search by name or category across the full food database |
| 🔄 **Intelligent Alternatives Engine** | Suggests up to 5 swaps with a multi-tier fallback system (strict → relaxed → broad) |
| 🩺 **Health Goal Filtering** | 6 medically-validated goals with clinically-backed nutritional thresholds |
| 🚫 **Allergen Safety** | Strict allergen exclusion — never relaxed, even in fallback queries |
| ⚖️ **Side-by-Side Comparison** | Compare any two foods on calories, protein, fat, fiber, sodium, and sustainability |
| 📊 **Nutrition Explorer** | Detailed nutritional breakdown with visual progress bars |
| 🧬 **Swap Explanation Engine** | Multi-factor, medically-sourced explanation of *why* the alternative is better |
| 🌱 **Sustainability Scoring** | Carbon footprint, water usage, and land use data per food item |
| 📱 **Fully Responsive** | Mobile-first design, touch-friendly navigation |
| 🔒 **Production-Ready Security** | CORS, rate limiting, security headers, input validation, SQL injection prevention |

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) |
| ORM | [SQLAlchemy](https://www.sqlalchemy.org/) |
| Database | [PostgreSQL 16](https://www.postgresql.org/) |
| Validation | [Pydantic v2](https://docs.pydantic.dev/) |
| Rate Limiting | [SlowAPI](https://github.com/laurentS/slowapi) |
| ASGI Server | [Uvicorn](https://www.uvicorn.org/) |
| Env Management | [python-dotenv](https://github.com/theskumar/python-dotenv) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) |
| State Management | [Redux Toolkit](https://redux-toolkit.js.org/) |
| Routing | [React Router DOM v6](https://reactrouter.com/) |
| Styling | [Tailwind CSS v3](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer-motion.com/) |
| Charts | [Recharts](https://recharts.org/) + [D3.js](https://d3js.org/) |
| HTTP Client | [Axios](https://axios-http.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Forms | [React Hook Form](https://react-hook-form.com/) |

### Infrastructure
| Layer | Technology |
|---|---|
| Containerisation | [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/) |
| Reverse Proxy | [Nginx](https://nginx.org/) |
| Hosting (Backend) | [Render](https://render.com/) (Docker Web Service) |
| Hosting (Frontend) | [Render](https://render.com/) (Static Site) |
| Database (Cloud) | [Aiven for PostgreSQL](https://aiven.io/) |

---

## 📁 Project Structure

```
food_alternate/
│
├── backend/                        # FastAPI application
│   ├── routers/
│   │   └── foods.py                # All API endpoints (6 routes)
│   ├── database.py                 # SQLAlchemy engine & session
│   ├── models.py                   # ORM models: Food, Nutrition, Allergen, Sustainability
│   ├── schemas.py                  # Pydantic v2 schemas for I/O validation
│   ├── seed.py                     # Database seeding script (pre-populated food data)
│   ├── check_db.py                 # Utility to verify DB connectivity
│   ├── main.py                     # FastAPI app with all middleware
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Backend Docker image
│   ├── .env.example                # Environment variable template
│   └── .dockerignore
│
├── frontend/                       # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── landing-page/       # Home / hero page
│   │   │   ├── food-search-results/# Food search grid
│   │   │   ├── food-comparison-tool/ # Side-by-side comparison
│   │   │   ├── nutrition-explorer-modal/ # Detailed nutrition view
│   │   │   ├── user-dashboard/     # Personalised user dashboard
│   │   │   ├── user-login/         # Sign-in page
│   │   │   └── user-registration/  # Registration page
│   │   ├── components/             # Shared UI components (ErrorBoundary, UserMenu, etc.)
│   │   ├── styles/                 # Global CSS & Tailwind base styles
│   │   └── utils/                  # Utility helpers
│   ├── public/                     # Static assets
│   ├── nginx.conf                  # Nginx config for production container
│   ├── Dockerfile                  # Frontend Docker image (multi-stage build)
│   ├── vite.config.mjs             # Vite configuration
│   ├── tailwind.config.js          # Tailwind theme customisation
│   └── .env.example                # Frontend environment variable template
│
├── docker-compose.yml              # Local full-stack orchestration
├── render.yaml                     # Render.com deployment configuration
├── SECURITY.md                     # Security controls & OWASP coverage
└── .env.docker                     # Docker-specific env template
```

---

## 🚀 Getting Started — Local Development

### Prerequisites

Make sure the following are installed on your system:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended for easiest setup)
- **OR**, for manual setup:
  - [Python 3.11+](https://www.python.org/downloads/) + `pip`
  - [Node.js 18+](https://nodejs.org/) + `npm`
  - [PostgreSQL 15+](https://www.postgresql.org/download/) running locally

---

### Option A: Running with Docker (Recommended)

This spins up the PostgreSQL database, FastAPI backend, and React frontend (served by Nginx) in isolated containers with a single command.

**1. Clone the repository**
```bash
git clone https://github.com/your-username/food_alternate.git
cd food_alternate
```

**2. Create the environment file**

Copy the Docker environment template and fill in your values:
```bash
cp .env.docker .env
```

Open `.env` and set:
```env
DB_USER=postgres
DB_PASS=your_secure_password
DB_NAME=food_finder
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:4028
ALLOWED_HOSTS=localhost,127.0.0.1
```

**3. Build and start all services**
```bash
docker compose up --build
```

This will:
- Start a **PostgreSQL 16** database container
- Build and start the **FastAPI backend** (waits for DB health check)
- Build and start the **React frontend** via Nginx on port `4028`

**4. Seed the database**

In a separate terminal, run the seeding script to populate the food database:
```bash
docker compose exec backend python seed.py
```

**5. Open the app**

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:4028 |
| ⚙️ API (via Nginx proxy) | http://localhost:4028/api/foods |
| 📖 API Docs (dev only) | http://localhost:8000/docs *(if backend port is exposed)* |

---

### Option B: Running Manually (Without Docker)

#### Step 1 — Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Copy and configure the backend `.env`:
```bash
cp .env.example .env
```

```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=food_finder
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
ALLOWED_HOSTS=localhost,127.0.0.1
```

Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

Seed the database (first time only):
```bash
python seed.py
```

#### Step 2 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

Copy and configure the frontend `.env`:
```bash
cp .env.example .env
```

```env
# frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:
```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ | — | PostgreSQL hostname |
| `DB_PORT` | ✅ | `5432` | PostgreSQL port |
| `DB_USER` | ✅ | — | PostgreSQL username |
| `DB_PASS` | ✅ | — | PostgreSQL password |
| `DB_NAME` | ✅ | `food_finder` | PostgreSQL database name |
| `DATABASE_URL` | 🌐 Cloud | — | Full DSN — overrides all `DB_*` vars (used with Aiven/Render) |
| `ENVIRONMENT` | ✅ | `development` | Set to `production` to disable API docs |
| `ALLOWED_ORIGINS` | ✅ | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `ALLOWED_HOSTS` | ✅ | `localhost,127.0.0.1` | Comma-separated valid Host header values |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ (dev) | Backend API base URL. Leave **empty** in Docker (same-origin `/api` proxy). |

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`. Use `.env.example` / `.env.docker` as templates only.

---

## 🌱 Database Seeding

The `seed.py` script populates the database with a comprehensive set of foods covering Kerala native dishes, Indian staples, international cuisines, snacks, beverages, desserts, and more — each with:

- Full nutritional data (calories, protein, fat, carbs, fiber, sugar, sodium)
- Allergen profile (dairy, gluten, nuts, soy, eggs, shellfish)
- Sustainability data (carbon footprint, water usage, land use)
- Nutrition & sustainability scores
- Pre-linked healthy alternative recommendations

```bash
# Docker
docker compose exec backend python seed.py

# Manual
cd backend && python seed.py
```

You can verify the database connection independently:
```bash
python check_db.py
```

---

## 📡 API Reference

Base URL (local): `http://localhost:8000`
Base URL (Docker): `http://localhost:4028/api` *(proxied by Nginx)*

All endpoints are under the `/foods` prefix.

---

### `GET /foods/`
Returns all foods with complete nutrition, allergen, and sustainability data.

**Rate limit:** 30 req/min

**Response:** `200 OK` — Array of `FoodSchema`

---

### `GET /foods/search?q={query}`
Search foods by name or category (case-insensitive, partial match).

**Rate limit:** 10 req/min

| Query Param | Type | Required | Description |
|---|---|---|---|
| `q` | `string` | ✅ | Search term (1–100 characters) |

**Response:** `200 OK` — Array of `FoodSchema` (empty array if no results)

**Error responses:**
- `400 Bad Request` — empty or invalid query

---

### `GET /foods/{food_id}`
Get detailed information for a single food item by its ID.

**Rate limit:** 30 req/min

| Path Param | Type | Required | Description |
|---|---|---|---|
| `food_id` | `integer` | ✅ | Must be a positive integer |

**Response:** `200 OK` — Single `FoodSchema`

**Error responses:**
- `400 Bad Request` — non-positive ID
- `404 Not Found` — food not found

---

### `GET /foods/{food_id}/alternatives`
The core feature — returns up to 5 smart alternative foods.

**Rate limit:** 20 req/min

| Parameter | Type | Required | Options | Description |
|---|---|---|---|---|
| `food_id` | path `int` | ✅ | — | ID of the food to find alternatives for |
| `health_goal` | query `string` | ❌ | `diabetic`, `heart`, `weight`, `muscle`, `kidney`, `cholesterol` | Filter by medical goal |
| `avoid` | query `string[]` | ❌ | `dairy`, `gluten`, `nuts`, `soy`, `eggs`, `shellfish`, `fish` | Allergens to strictly exclude |

**Health Goal Thresholds (ICMR/FSSAI validated):**

| Goal | Threshold |
|---|---|
| `diabetic` | Sugar < 5g, Fiber > 2g, sorted by ascending sugar |
| `heart` | Sodium < 400mg, Fat < 10g |
| `weight` | Calories < 400 kcal, high-protein sorted |
| `muscle` | Protein > 10g, sorted descending |
| `kidney` | Sodium < 300mg, Protein < 20g |
| `cholesterol` | Fat < 8g, low sodium |

**Fallback behaviour:**
1. If strict thresholds return 0 results → relax numeric filters but keep allergen safety
2. If still 0 results → broaden category scope (allergen safety always maintained)

**Response:** `200 OK` — Array of `FoodSchema`

---

### `GET /foods/meta/health-goals`
Returns all valid health goals with their medical descriptions.

**Response:**
```json
{
  "goals": [
    { "key": "diabetic", "description": "Low sugar (<5g), high fiber (>2g), low GI foods. Based on ICMR diabetes guidelines." },
    ...
  ]
}
```

---

### `POST /foods/explain-swap`
Generates a medically-validated, multi-factor explanation for why one food is a better choice than another.

**Rate limit:** 10 req/min

**Request Body:**
```json
{
  "original": "Porotta",
  "alternative": "Chapati"
}
```

| Field | Type | Constraints |
|---|---|---|
| `original` | `string` | Required, non-empty, max 200 chars |
| `alternative` | `string` | Required, non-empty, max 200 chars |

**Factors checked:** sugar reduction, calorie savings (with contextual comparison), protein increase, sodium reduction, fat reduction, fiber increase, sustainability score improvement.

**Response:**
```json
{
  "explanation": "Saves 550 calories per serving — equivalent to a full meal's worth of energy.",
  "all_benefits": [
    "Saves 550 calories...",
    "Contains 300mg less sodium...",
    "Adds 10g more dietary fiber..."
  ],
  "benefit_count": 3
}
```

---

### `FoodSchema` — Response Object Shape

```json
{
  "id": 1,
  "name": "Malabar Chicken Biryani",
  "brand": null,
  "category": "Kerala Native",
  "image": "https://...",
  "description": "...",
  "serving_size": "1 Portion",
  "price_range": "₹150–₹300",
  "nutrition_score": 72,
  "sustainability_score": 58,
  "nutrition": {
    "calories": 720,
    "protein": 38,
    "fat": 28,
    "carbohydrates": 75,
    "fiber": 4,
    "sugar": 3,
    "sodium": 850
  },
  "allergens": {
    "dairy": false,
    "nuts": true,
    "gluten": true,
    "soy": false,
    "eggs": false,
    "shellfish": false
  },
  "sustainability": {
    "carbon_footprint": 3.5,
    "water_usage": 1200,
    "land_use": 2.1,
    "sustainability_score": 58
  }
}
```

---

## 🗺 Application Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero section, animated laptop demo, feature highlights |
| `/food-search-results` | Food Search | Browse and search the full food catalog |
| `/food-comparison-tool` | Comparison Tool | Side-by-side nutritional comparison of two foods |
| `/nutrition-explorer-modal` | Nutrition Explorer | Deep-dive modal with charts and allergen tags |
| `/dashboard` | User Dashboard | Personalized saved foods and recommendations |
| `/user-registration` | Register | Account creation form |
| `/sign-in` | Login | Authentication form |
| `*` | 404 Not Found | Custom not-found page |

---

## 🔐 Security Architecture

This application implements a comprehensive, defense-in-depth security model. See [SECURITY.md](./SECURITY.md) for the full breakdown.

**Summary of controls:**

| Layer | Control |
|---|---|
| **API** | CORS (no wildcard), Rate limiting (per-endpoint), TrustedHostMiddleware, 1MB body limit |
| **Input** | Pydantic v2 schema validation, SQL wildcard sanitisation, allergen whitelist validation |
| **Database** | SQLAlchemy ORM parameterized queries — zero raw SQL |
| **Logging** | Exception types logged only — never the full exception (prevents DSN/credential leakage) |
| **Headers** | HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy |
| **Fingerprinting** | `Server` header removed from all API responses; Nginx `server_tokens off` |
| **API Docs** | `/docs`, `/redoc`, `/openapi.json` disabled when `ENVIRONMENT=production` |
| **Docker** | DB and backend ports NOT exposed to host — internal bridge network only |
| **Secrets** | All credentials via environment variables, never hardcoded |

**OWASP Top 10:** All 10 risks are explicitly mitigated. See [SECURITY.md](./SECURITY.md#owasp-top-10-coverage).

---

## ☁️ Deployment on Render

This project is configured for zero-downtime deployment on [Render](https://render.com/) using `render.yaml`.

### Architecture on Render

```
Browser → Render CDN (Frontend Static Site)
              ↓ API calls to →
         Render Web Service (Backend Docker)
              ↓ connects to →
         Aiven Managed PostgreSQL (SSL required)
```

### Steps

**1. Push to GitHub**
Ensure your repository is pushed to GitHub (Render deploys from Git).

**2. Create Aiven PostgreSQL**
- Sign up at [aiven.io](https://aiven.io/), create a free PostgreSQL service
- Copy the connection string (format: `postgres://user:pass@host:port/db?sslmode=require`)

**3. Deploy via Render Dashboard**
- Go to [render.com](https://render.com/) → **New** → **Blueprint** → connect your GitHub repo
- Render will detect `render.yaml` automatically

**4. Set Environment Variables in Render Dashboard**

For the **backend** service, set:
| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Aiven PostgreSQL connection string |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | Your frontend Render URL (e.g. `https://food-alternate-frontend.onrender.com`) |
| `ALLOWED_HOSTS` | Your backend Render domain (e.g. `food-alternate-backend.onrender.com`) |

For the **frontend** service, set:
| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your backend Render URL (e.g. `https://food-alternate-backend.onrender.com`) |

**5. Seed the production database**

After the backend is live, run the seed script via Render's shell:
```bash
python seed.py
```

> 💡 **Tip:** On Render's free tier, services spin down after inactivity. The first request may take ~30 seconds to cold-start. Consider upgrading to a paid plan for production traffic.

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: describe your change"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

### Development Guidelines

- **Backend:** Follow existing router patterns. Use `safe_db_query()` for all DB calls. Never log exception objects verbatim.
- **Frontend:** Keep components focused and reusable. Use Tailwind for all styling.
- **Security:** Never relax allergen safety in any new query path. Always validate inputs via Pydantic.
- **Data:** New food items should include complete nutrition, allergen, and sustainability data.

---

## 📄 License

This project is for educational and portfolio purposes.

---

<div align="center">

Built with ❤️ and a lot of 🥗

**FastAPI · React · PostgreSQL · Docker · Render**

</div>
