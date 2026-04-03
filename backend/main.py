import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.analytics import router as analytics_router
from routes.payments import router as payments_router

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(__file__)
UPLOADS_PATH = os.path.join(BASE_DIR, "uploads")

app.mount("/static", StaticFiles(directory=UPLOADS_PATH), name="static")

app.include_router(auth_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(analytics_router)
app.include_router(payments_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled server error")
    return JSONResponse(status_code=500, content={"detail": f"Server error: {exc}"})


@app.get("/")
def root():
    return {"message": "Furniture API running"}
