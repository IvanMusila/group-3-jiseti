# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from math import ceil
from datetime import datetime

app = Flask(__name__)

# Allow your frontend origins during development (CRA=3000, Vite=5173)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}})

def now_iso():
    return datetime.utcnow().isoformat() + "Z"

# ---- Seed data so the frontend list isn't empty on first load ----
_reports = [
    {
        "id": 1,
        "type": "red-flag",
        "title": "Procurement fraud",
        "description": "Suspicious tender award",
        "location": {"lat": -1.30, "lng": 36.82},
        "status": "under-investigation",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "createdBy": 9
    },
    {
        "id": 2,
        "type": "intervention",
        "title": "Bridge repair",
        "description": "Cracks on the main span",
        "location": {"lat": -1.29, "lng": 36.82},
        "status": "pending",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "createdBy": 7
    },
]
_next_id = 3
# -----------------------------------------------------------------

@app.get("/")
def health():
    return jsonify({"status": "ok"}), 200

@app.get("/reports")
def list_reports():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    start = (page - 1) * limit
    items = _reports[start:start + limit]
    total_items = len(_reports)
    total_pages = max(1, ceil(total_items / limit)) if limit else 1
    return jsonify({
        "items": items,
        "page": page,
        "totalPages": total_pages,
        "totalItems": total_items
    }), 200

@app.post("/reports")
def create_report():
    global _next_id
    data = request.get_json() or {}
    new_item = {
        "id": _next_id,
        "type": data.get("type", "red-flag"),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "location": data.get("location"),
        "status": "pending",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "createdBy": 7  # replace with authenticated user later
    }
    _next_id += 1
    _reports.insert(0, new_item)
    return jsonify(new_item), 201

@app.put("/reports/<int:rid>")
def update_report(rid):
    patch = request.get_json() or {}
    for i, r in enumerate(_reports):
        if r["id"] == rid:
            if r["status"] != "pending":
                return jsonify({"error": "INVALID_STATUS"}), 400
            updated = {**r, **patch, "updatedAt": now_iso()}
            _reports[i] = updated
            return jsonify(updated), 200
    return jsonify({"error": "NOT_FOUND"}), 404

@app.delete("/reports/<int:rid>")
def delete_report(rid):
    global _reports
    for r in _reports:
        if r["id"] == rid:
            if r["status"] != "pending":
                return jsonify({"error": "INVALID_STATUS"}), 400
            _reports = [x for x in _reports if x["id"] != rid]
            return ("", 204)
    return jsonify({"error": "NOT_FOUND"}), 404

if __name__ == "__main__":
    app.run(port=5000, debug=True)