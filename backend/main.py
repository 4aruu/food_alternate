from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- Import this
from database import Base, engine
from routers import foods

app = FastAPI()

# --- ENABLE CORS (Allow Frontend to talk to Backend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from ANY website (including localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],
)
# -------------------------------------------------------

Base.metadata.create_all(bind=engine)

app.include_router(foods.router)

@app.get("/")
def home():
    return {"message": "Backend is running!"}

