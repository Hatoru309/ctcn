# db.py
from datetime import datetime
import uuid
import psycopg2
import json
from psycopg2.extras import RealDictCursor
import os

# PostgreSQL connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_BZLK0Nxye9wT@ep-withered-base-a1ic2cd0-pooler.ap-southeast-1.aws.neon.tech/rescue-db?sslmode=require&channel_binding=require"
)

def get_connection():
    """Get a database connection"""
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Initialize the database table if it doesn't exist"""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id VARCHAR(36) PRIMARY KEY,
                    phone VARCHAR(50),
                    lat DECIMAL(10, 8),
                    lng DECIMAL(11, 8),
                    message TEXT,
                    ts VARCHAR(50),
                    meta JSONB DEFAULT '{}',
                    status VARCHAR(20) DEFAULT 'pending',
                    urgency VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """)
            conn.commit()
    finally:
        conn.close()

# Initialize database on import
init_db()

def create_report(data):
    """Create a new report in the database"""
    new_report = {
        "id": str(uuid.uuid4()),
        "phone": data.get("phone"),
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "message": data.get("message"),
        "ts": data.get("ts"),
        "meta": data.get("meta", {}),
        "status": "pending",
        "urgency": data.get("urgency", "Low"),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO reports (id, phone, lat, lng, message, ts, meta, status, urgency, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                new_report["id"],
                new_report["phone"],
                new_report["lat"],
                new_report["lng"],
                new_report["message"],
                new_report["ts"],
                json.dumps(new_report["meta"]),
                new_report["status"],
                new_report["urgency"],
                datetime.utcnow()
            ))
            conn.commit()
    finally:
        conn.close()
    
    return new_report

def update_report(data):
    """Update an existing report"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build update query dynamically
            updates = []
            params = []
            
            if "message" in data:
                updates.append("message = %s")
                params.append(data["message"])
            if "lat" in data:
                updates.append("lat = %s")
                params.append(data["lat"])
            if "lng" in data:
                updates.append("lng = %s")
                params.append(data["lng"])
            if "meta" in data:
                updates.append("meta = %s")
                params.append(json.dumps(data["meta"]))
            
            updates.append("updated_at = %s")
            params.append(datetime.utcnow())
            
            # Determine WHERE clause
            where_clause = ""
            if "id" in data:
                where_clause = "id = %s"
                params.append(data["id"])
            elif "phone" in data:
                where_clause = "phone = %s"
                params.append(data["phone"])
            else:
                return None
            
            query = f"""
                UPDATE reports 
                SET {', '.join(updates)}
                WHERE {where_clause}
                RETURNING *
            """
            
            cur.execute(query, params)
            result = cur.fetchone()
            conn.commit()
            
            if result:
                report = dict(result)
                # Convert JSONB to dict and format timestamps
                if report.get("meta"):
                    report["meta"] = report["meta"] if isinstance(report["meta"], dict) else json.loads(report["meta"])
                if report.get("created_at"):
                    report["created_at"] = report["created_at"].isoformat() + "Z"
                if report.get("updated_at"):
                    report["updated_at"] = report["updated_at"].isoformat() + "Z"
                return report
            return None
    finally:
        conn.close()

def list_reports():
    """Get all reports from the database"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM reports ORDER BY created_at DESC")
            results = cur.fetchall()
            
            reports = []
            for row in results:
                report = dict(row)
                # Convert JSONB to dict and format timestamps
                if report.get("meta"):
                    report["meta"] = report["meta"] if isinstance(report["meta"], dict) else json.loads(report["meta"])
                if report.get("created_at"):
                    report["created_at"] = report["created_at"].isoformat() + "Z"
                if report.get("updated_at"):
                    report["updated_at"] = report["updated_at"].isoformat() + "Z"
                reports.append(report)
            
            return reports
    finally:
        conn.close()

def update_status(report_id, status):
    """Update the status of a report"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE reports 
                SET status = %s, updated_at = %s
                WHERE id = %s
                RETURNING *
            """, (status, datetime.utcnow(), report_id))
            
            result = cur.fetchone()
            conn.commit()
            
            if result:
                report = dict(result)
                # Convert JSONB to dict and format timestamps
                if report.get("meta"):
                    report["meta"] = report["meta"] if isinstance(report["meta"], dict) else json.loads(report["meta"])
                if report.get("created_at"):
                    report["created_at"] = report["created_at"].isoformat() + "Z"
                if report.get("updated_at"):
                    report["updated_at"] = report["updated_at"].isoformat() + "Z"
                return report
            return None
    finally:
        conn.close()
