import json
import re
import os
from dotenv import load_dotenv

load_dotenv()
from groq import Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def modify_with_ai(roadmap, edit_prompt):

    topic = roadmap.get("topic", "")
    level = roadmap.get("level", "")
    duration = roadmap.get("duration", "")
    weeks_count = len(roadmap.get("weeks", []))

    prompt = f"""
You are an AI roadmap editor.

Modify the roadmap WITHOUT changing structure.

STRICT RULES:
- KEEP SAME duration: {duration}
- KEEP SAME number of weeks: {weeks_count}
- KEEP EXACTLY 7 days per week
- DO NOT reduce or increase weeks
- DO NOT remove days
- ONLY improve content

User request:
{edit_prompt}

Return JSON ONLY in SAME structure:

{{
 "weeks":[
  {{
    "week":1,
    "days":[
      {{
        "day":1,
        "concept":"...",
        "study_time":"...",
        "task":"..."
      }}
    ]
  }}
 ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5  # more controlled
    )

    text = response.choices[0].message.content

    try:
        json_text = re.search(r"\{.*\}", text, re.DOTALL).group()
        new_data = json.loads(json_text)

        # ✅ SAFETY CHECK (CRITICAL)
        if len(new_data.get("weeks", [])) != weeks_count:
            print("⚠️ AI changed structure — fallback to original")
            return roadmap

        return new_data

    except Exception as e:
        print("Modify parsing error:", e)
        return roadmap