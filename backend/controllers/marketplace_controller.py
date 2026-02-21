import sqlite3
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from flask import Blueprint, request, jsonify

marketplace_bp = Blueprint("marketplace", __name__)

DB_PATH = Path(__file__).resolve().parent / "marketplace.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS marketplace_models (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                tags_json TEXT NOT NULL,
                author_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                architecture_json TEXT NOT NULL
            )
        ''')
        conn.commit()

# Initialize DB on import
init_db()

def _error_response(message, status=400):
    return jsonify({"error": message}), status

@marketplace_bp.route("/api/marketplace/models", methods=["POST"])
def publish_model():
    if not request.is_json:
        return _error_response("Expected JSON payload.", status=415)
        
    try:
        payload = request.get_json(force=True)
    except Exception:
        return _error_response("Malformed JSON payload.")

    name = payload.get("name")
    description = payload.get("description")
    tags = payload.get("tags")
    author_name = payload.get("authorName")
    architecture = payload.get("architecture")

    if not all([name, description, isinstance(tags, list), author_name, isinstance(architecture, dict)]):
        return _error_response("Missing required fields or invalid types.", status=400)

    model_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    tags_json = json.dumps(tags)
    architecture_json = json.dumps(architecture)

    try:
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO marketplace_models 
                (id, name, description, tags_json, author_name, created_at, architecture_json) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (model_id, name, description, tags_json, author_name, created_at, architecture_json)
            )
            conn.commit()
    except sqlite3.Error as e:
        return _error_response(f"Database error: {str(e)}", status=500)

    return jsonify({"id": model_id}), 201

@marketplace_bp.route("/api/marketplace/models", methods=["GET"])
def list_models():
    try:
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT id, name, description, tags_json, author_name, created_at 
                FROM marketplace_models 
                ORDER BY created_at DESC
                """
            )
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                results.append({
                    "id": row["id"],
                    "name": row["name"],
                    "description": row["description"],
                    "tags": json.loads(row["tags_json"]),
                    "authorName": row["author_name"],
                    "createdAt": row["created_at"]
                })
            return jsonify(results), 200
    except sqlite3.Error as e:
        return _error_response(f"Database error: {str(e)}", status=500)

@marketplace_bp.route("/api/marketplace/models/<model_id>", methods=["GET"])
def get_model(model_id):
    try:
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT id, name, description, tags_json, author_name, created_at, architecture_json 
                FROM marketplace_models 
                WHERE id = ?
                """,
                (model_id,)
            )
            row = cursor.fetchone()
            
            if row is None:
                return _error_response("Model not found.", status=404)

            return jsonify({
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "tags": json.loads(row["tags_json"]),
                "authorName": row["author_name"],
                "createdAt": row["created_at"],
                "architecture": json.loads(row["architecture_json"])
            }), 200
    except sqlite3.Error as e:
        return _error_response(f"Database error: {str(e)}", status=500)
