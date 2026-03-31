import os
from datetime import datetime, timedelta
import json
import urllib.request
from fastapi import APIRouter, Depends, Request, HTTPException

from utils.db import get_db
from utils.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _lookup_country(ip: str) -> str:
    # Free, no-key lookup. If it fails, return Unknown.
    try:
        with urllib.request.urlopen(f"https://ipapi.co/{ip}/json/", timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("country_name") or "Unknown"
    except Exception:
        return "Unknown"


@router.post("/visit")
def track_visit(request: Request):
    db = get_db()
    ip = _get_client_ip(request)
    country = _lookup_country(ip) if ip != "unknown" else "Unknown"
    user_agent = request.headers.get("user-agent", "")
    platform = request.headers.get("x-platform", "Unknown")

    db.visits.insert_one(
        {
            "ip": ip,
            "country": country,
            "platform": platform,
            "user_agent": user_agent,
            "created_at": datetime.utcnow().isoformat(),
        }
    )
    return {"ok": True}


@router.get("/summary")
def get_summary(user=Depends(get_current_user)):
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = get_db()
    total_visits = db.visits.count_documents({})
    # last 7 days visits
    now = datetime.utcnow()
    days = []
    for i in range(6, -1, -1):
        day = (now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i))
        days.append(day)
    counts = {day.strftime("%Y-%m-%d"): 0 for day in days}
    cursor = db.visits.find({"created_at": {"$exists": True}})
    for v in cursor:
        try:
            day_key = v["created_at"][:10]
            if day_key in counts:
                counts[day_key] += 1
        except Exception:
            pass
    visits_by_day = [{"date": k, "count": counts[k]} for k in counts]

    countries = list(
        db.visits.aggregate(
            [
                {"$group": {"_id": "$country", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
    )
    platforms = list(
        db.visits.aggregate(
            [
                {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ]
        )
    )

    return {
        "total_visits": total_visits,
        "countries": countries,
        "platforms": platforms,
        "visits_by_day": visits_by_day,
    }
