from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Roadmap, Progress
import json
import re
from datetime import timedelta

# 🔥 AI MODULES
from ai_generator import generate_ai_roadmap
from ai_modifier import modify_with_ai
from ai_day_editor import edit_day_with_ai
import os
from dotenv import load_dotenv

load_dotenv()
from groq import Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -------------------------
# INIT APP
# -------------------------
app = Flask(__name__)

# -------------------------
# CONFIG
# -------------------------
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_SECRET_KEY"] = "super-secret-key-12345678901234567890"

app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config["JWT_VERIFY_SUB"] = False

# ✅ Token expiry
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)

# -------------------------
# INIT EXTENSIONS
# -------------------------
db.init_app(app)
jwt = JWTManager(app)

# -------------------------
# CORS
# -------------------------
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

# -------------------------
# CREATE DB
# -------------------------
with app.app_context():
    db.drop_all()   # 🔥 ADD THIS
    db.create_all()

# -------------------------
# JWT ERROR HANDLING
# -------------------------
@jwt.unauthorized_loader
def unauthorized_callback(reason):
    return jsonify({"error": "Missing token"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(reason):
    return jsonify({"error": "Invalid token"}), 401

@jwt.expired_token_loader
def expired_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token expired"}), 401
def adapt_roadmap(roadmap, weak_topics):

    for week in roadmap["weeks"]:
        for day in week["days"]:

            if day["concept"] in weak_topics:
                day["task"] += " + Extra Practice"
                day["subtopics"].append("Advanced problems")

    return roadmap
# -------------------------
# AUTH ROUTES
# -------------------------

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        print("DATA RECEIVED:", data)  # 🔍 DEBUG

        username = data.get("username")
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")

        # ✅ VALIDATION
        if not username or not email or not phone or not password:
            return jsonify({"error": "All fields required"}), 400

        existing = User.query.filter(
            (User.username == username) |
            (User.email == email) |
            (User.phone == phone)
        ).first()

        if existing:
            return jsonify({"error": "User already exists"}), 400

        hashed_password = generate_password_hash(password)

        user = User(
            username=username,
            email=email,
            phone=phone,
            password=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created"})

    except Exception as e:
        print("REGISTER ERROR:", e)   # 🔥 VERY IMPORTANT
        return jsonify({"error": "Server error"}), 500

print("LOGIN ROUTE LOADED")
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    identifier = data.get("username")  # can be username/email/phone
    password = data.get("password")

    user = User.query.filter(
        (User.username == identifier) |
        (User.email == identifier) |
        (User.phone == identifier)
    ).first()

    if not user:
        return {"error": "User not found"}, 404

    if not check_password_hash(user.password, password):
        return {"error": "Invalid credentials"}, 401

    token = create_access_token(identity=str(user.id))

    return {"token": token}

# -------------------------
# GENERATE ROADMAP
# -------------------------
@app.route("/generate-roadmap", methods=["POST"])
@jwt_required()
def generate_roadmap():

    user_id = get_jwt_identity()
    data = request.json

    # 🔥 GET USER PROGRESS
    progress = Progress.query.filter_by(user_id=int(user_id)).first()

    weak_topics = []
    if progress and progress.weak_topics:
        weak_topics = json.loads(progress.weak_topics)

    roadmap = generate_ai_roadmap(
        data.get("topic"),
        data.get("level"),
        data.get("duration"),
        data.get("hours"),
        data.get("description"),
        data.get("weeks")
    )

    # 🔥 APPLY ADAPTATION
    roadmap = adapt_roadmap(roadmap, weak_topics)

    roadmap["topic"] = data.get("topic")
    roadmap["level"] = data.get("level")
    roadmap["duration"] = data.get("duration")

    return jsonify({"roadmap": roadmap})

# -------------------------
# MODIFY ROADMAP (AI)
# -------------------------
@app.route("/modify-roadmap", methods=["POST"])
@jwt_required()
def modify_roadmap():

    data = request.json

    updated = modify_with_ai(
        data.get("roadmap"),
        data.get("prompt")
    )

    return jsonify({"roadmap": updated})

# -------------------------
# EDIT DAY (AI)
# -------------------------
@app.route("/edit-day", methods=["POST"])
@jwt_required()
def edit_day():

    data = request.json

    updated_day = edit_day_with_ai(
        data.get("day"),
        data.get("instruction")
    )

    return jsonify({"day": updated_day})

# -------------------------
# GET ROADMAPS
# -------------------------
@app.route("/get-roadmaps", methods=["GET"])
@jwt_required(optional=True)
def get_roadmaps():

    user_id = get_jwt_identity()

    if not user_id:
        return jsonify([])

    roadmaps = Roadmap.query.filter_by(user_id=int(user_id)).all()

    result = []

    for r in roadmaps:
        result.append({
            "id": r.id,
            "data": json.loads(r.data)
        })

    return jsonify(result)

# -------------------------
# SAVE ROADMAP
# -------------------------
@app.route("/save-roadmap", methods=["POST"])
@jwt_required()
def save_roadmap():

    user_id = get_jwt_identity()
    data = request.json

    roadmap = Roadmap(
        user_id=int(user_id),
        data=json.dumps(data["roadmap"])
    )

    db.session.add(roadmap)
    db.session.commit()

    return {"message": "Saved"}

@app.route("/delete-roadmap/<int:roadmap_id>", methods=["DELETE"])
@jwt_required()
def delete_roadmap(roadmap_id):
    user_id = get_jwt_identity()

    roadmap = Roadmap.query.filter_by(
        id=roadmap_id,
        user_id=int(user_id)
    ).first()

    if not roadmap:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(roadmap)
    db.session.commit()

    return jsonify({"message": "Deleted"})

# -------------------------
# SAVE PROGRESS
# -------------------------
@app.route("/save-progress", methods=["POST"])
@jwt_required()
def save_progress():

    user_id = get_jwt_identity()
    data = request.json

    existing = Progress.query.filter_by(
        user_id=int(user_id),
        roadmap_id=data["roadmap_id"]
    ).first()

    if existing:
        existing.progress_data = json.dumps(data["progress"])
    else:
        progress = Progress(
            user_id=int(user_id),
            roadmap_id=data["roadmap_id"],
            progress_data=json.dumps(data["progress"])
        )
        db.session.add(progress)

    db.session.commit()

    return {"message": "Progress saved"}

# -------------------------
# GET PROGRESS
# -------------------------
@app.route("/get-progress/<int:roadmap_id>", methods=["GET"])
@jwt_required()
def get_progress(roadmap_id):

    user_id = get_jwt_identity()

    progress = Progress.query.filter_by(
        user_id=int(user_id),
        roadmap_id=roadmap_id
    ).first()

    if not progress:
        return jsonify({})

    return jsonify(json.loads(progress.progress_data))

# -------------------------
# AI CHATBOT
# -------------------------
@app.route("/chat", methods=["POST"])
@jwt_required()
def chat():

    data = request.json

    topic = data.get("topic")
    concept = data.get("concept")
    message = data.get("message")

    prompt = f"""
You are an AI mentor.

User is learning:
Topic: {topic}
Current Concept: {concept}

User question:
{message}

Give:
- Clear explanation
- Example
- Short actionable steps
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    reply = response.choices[0].message.content

    return jsonify({"reply": reply})
@app.route("/generate-quiz", methods=["POST"])
@jwt_required()
def generate_quiz():

    data = request.json
    concept = data.get("concept")

    prompt = f"""
Create 15 MCQ questions on {concept}.

Return JSON:
{{
 "questions":[
   {{
     "q":"question",
     "options":["A","B","C","D"],
     "answer":"A"
   }}
 ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content

    try:
        json_text = re.search(r"\{.*\}", text, re.DOTALL).group()
        quiz = json.loads(json_text)
    except:
        quiz = {"questions": []}

    return jsonify(quiz)
# -------------------------
# SHARE ROADMAP
# -------------------------
@app.route("/share-roadmap", methods=["POST"])
@jwt_required()
def share_roadmap():

    import base64

    data = request.json
    roadmap = data.get("roadmap")

    encoded = base64.urlsafe_b64encode(
        json.dumps(roadmap).encode()
    ).decode()

    return jsonify({
        "link": f"http://localhost:5173/shared/{encoded}"
    })


# -------------------------
# GET SHARED
# -------------------------
@app.route("/get-shared/<string:data>", methods=["GET"])
def get_shared(data):

    import base64

    try:
        decoded = base64.urlsafe_b64decode(data.encode()).decode()
        roadmap = json.loads(decoded)
        return jsonify(roadmap)
    except:
        return jsonify({"error": "Invalid link"}), 400
# -------------------------
# HOME
# -------------------------
@app.route("/")
def home():
    return {"message": "Backend running"}

# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)