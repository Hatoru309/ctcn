# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import create_report, update_report, list_reports, update_status

app = Flask(__name__)
CORS(app)

# -------------------------------
# 1. POST /api/report — gửi báo cứu hộ
# -------------------------------
@app.route('/api/report', methods=['POST'])
def report_create():
    data = request.get_json()
    required = ["phone", "lat", "lng", "message"]
    for field in required:
        if field not in data:
            return jsonify({"ok": False, "error": f"{field} is required"}), 400
    created = create_report(data)
    return jsonify({"ok": True, "report": created}), 201

# -------------------------------
# 2. PUT /api/report/update — cập nhật báo
# -------------------------------
@app.route('/api/report/update', methods=['PUT'])
def report_update():
    data = request.get_json()
    if "id" not in data and "phone" not in data:
        return jsonify({"ok": False, "error": "id or phone is required"}), 400
    updated = update_report(data)
    if updated is None:
        return jsonify({"ok": False, "error": "report not found"}), 404
    return jsonify({"ok": True, "report": updated})

# -------------------------------
# 3. GET /api/rescue/list — danh sách báo cứu hộ
# -------------------------------
@app.route('/api/rescue/list', methods=['GET'])
def rescue_list():
    reports = list_reports()
    return jsonify({"ok": True, "reports": reports})

# -------------------------------
# 4. PUT /api/rescue/update-status — đổi trạng thái
# -------------------------------
@app.route('/api/rescue/update-status', methods=['PUT'])
def rescue_update_status():
    data = request.get_json()
    report_id = data.get("id")
    status = data.get("status")
    allowed_status = ["pending", "processing", "done", "holding"]
    if status not in allowed_status:
        return jsonify({"ok": False, "error": "Invalid status"}), 400
    updated = update_status(report_id, status)
    if updated is None:
        return jsonify({"ok": False, "error": "report not found"}), 404
    return jsonify({"ok": True, "report": updated})

# -------------------------------
# Healthcheck
# -------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# -------------------------------
# Run server
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
