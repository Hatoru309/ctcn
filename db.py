# db.py
from datetime import datetime
import uuid

REPORTS = []

def create_report(data):
    new_report = {
        "id": str(uuid.uuid4()),
        "phone": data.get("phone"),
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "message": data.get("message"),
        "ts": data.get("ts"),
        "meta": data.get("meta", {}),
        "status": "pending",  # default
        "created_at": datetime.utcnow().isoformat()
    }
    REPORTS.append(new_report)
    return new_report

def update_report(data):
    for r in REPORTS:
        if r["id"] == data.get("id") or r["phone"] == data.get("phone"):
            r["message"] = data.get("message", r["message"])
            r["lat"] = data.get("lat", r["lat"])
            r["lng"] = data.get("lng", r["lng"])
            r["meta"] = data.get("meta", r["meta"])
            return r
    return None

def list_reports():
    return REPORTS

def update_status(report_id, status):
    for r in REPORTS:
        if r["id"] == report_id:
            r["status"] = status
            return r
    return None
