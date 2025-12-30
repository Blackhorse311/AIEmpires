"""
AIEmpires AI Service

FastAPI application providing LLM-powered faction AI for BattleTech.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers (to be implemented)
# from api.routes import router

app = FastAPI(
    title="AIEmpires AI Service",
    description="LLM-powered faction AI for BattleTech",
    version="0.1.0",
)

# CORS middleware for Electron app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to launcher origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - service info."""
    return {
        "service": "AIEmpires AI Service",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# TODO: Include API routers
# app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
