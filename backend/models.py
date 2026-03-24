from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)

    password = db.Column(db.String(120), nullable=False)


class Roadmap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    data = db.Column(db.Text)


# models.py

class Progress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    roadmap_id = db.Column(db.Integer)

    progress_data = db.Column(db.Text)

    # 🔥 NEW
    weak_topics = db.Column(db.Text, default="[]")
    strong_topics = db.Column(db.Text, default="[]")


