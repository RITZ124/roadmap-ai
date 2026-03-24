import json
import re
from groq import Groq

from resource_engine import (
    search_youtube,
    search_github,
    search_dataset
)

import os
from dotenv import load_dotenv

load_dotenv()
from groq import Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# -------------------------
# 🔥 OPTIONAL: AI SUBTOPICS (kept but NOT used to avoid rate limits)
# -------------------------
def generate_subtopics(topic, concept):
    prompt = f"""
Generate 3-5 subtopics for learning.

Topic: {topic}
Concept: {concept}

Return JSON:
{{
 "subtopics": ["point1", "point2", "point3"]
}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )

        text = response.choices[0].message.content
        json_text = re.search(r"\{.*\}", text, re.DOTALL).group()
        data = json.loads(json_text)

        return data.get("subtopics", [])

    except:
        return ["Basics", "Implementation", "Examples"]


# -------------------------
# 🔥 MAIN FUNCTION
# -------------------------
def generate_ai_roadmap(topic, level, duration, hours, description, weeks):

    prompt = f"""
Create a learning roadmap.

Topic: {topic}
Level: {level}
Duration: {duration}

Focus:
{description}

Return JSON ONLY.

Format:
{{
 "weeks":[
  {{
    "week":1,
    "topics":["topic1","topic2","topic3","topic4","topic5"]
  }}
 ]
}}

Rules:
- EXACTLY 5 topics per week
- Topics must be progressive (not random)
- 5 days learning + 2 days revision

Generate exactly {weeks} weeks.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    text = response.choices[0].message.content

    try:
        json_text = re.search(r"\{.*\}", text, re.DOTALL).group()
        data = json.loads(json_text)
    except:
        data = {"weeks": []}

    roadmap = {"weeks": []}

    for week in data["weeks"]:

        topics = week.get("topics", [])[:5]  # ✅ max 5 topics

        days = []

        # -------------------------
        # 🔥 5 STUDY DAYS
        # -------------------------
        for idx, topic_item in enumerate(topics):

            youtube = search_youtube(topic, topic_item, [])
            github = search_github(topic, topic_item, []) or {}
            dataset = search_dataset(topic, topic_item, []) or {}

            github_url = github.get("url", "")
            dataset_url = dataset.get("kaggle", "")

            # ✅ SAFE SUBTOPICS (no API spam)
            subtopics = [
                f"Basics of {topic_item}",
                f"Core concepts of {topic_item}",
                f"Implementation of {topic_item}",
                f"Real-world examples of {topic_item}"
            ]

            days.append({
                "day": idx + 1,  # ✅ FIXED DAY NUMBER
                "concept": topic_item,
                "subtopics": subtopics,
                "study_time": f"{hours} hours",

                "practice": subtopics,

                "task": f"Learn {topic_item} + practice",

                "youtube_link": youtube,
                "github_link": github_url,
                "dataset_kaggle": dataset_url
            })

        # -------------------------
        # 🔥 DAY 6 → REVISION
        # -------------------------
        days.append({
            "day": 6,
            "concept": "Revision",

            "subtopics": [
                "Revise all 5 topics",
                "Review notes",
                "Identify weak areas"
            ],

            "study_time": f"{hours} hours",

            "practice": [
                "Revise concepts",
                "Revisit mistakes"
            ],

            "task": "Revision Day",

            "youtube_link": search_youtube(topic, "revision", []),
            "github_link": (search_github(topic, "revision", []) or {}).get("url", ""),
            "dataset_kaggle": (search_dataset(topic, "revision", []) or {}).get("kaggle", "")
        })

        # -------------------------
        # 🔥 DAY 7 → PRACTICE
        # -------------------------
        days.append({
            "day": 7,
            "concept": "Practice",

            "subtopics": [
                "Solve problems",
                "Build mini project",
                "Apply concepts"
            ],

            "study_time": f"{hours} hours",

            "practice": [
                "Coding practice",
                "Mini project"
            ],

            "task": "Practice Day",

            "youtube_link": search_youtube(topic, "practice", []),
            "github_link": (search_github(topic, "practice", []) or {}).get("url", ""),
            "dataset_kaggle": (search_dataset(topic, "practice", []) or {}).get("kaggle", "")
        })

        roadmap["weeks"].append({
            "week": week.get("week", 1),
            "days": days
        })

    return roadmap