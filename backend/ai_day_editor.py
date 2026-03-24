import json
import re
import os
from dotenv import load_dotenv

load_dotenv()
from groq import Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def edit_day_with_ai(day, instruction):

    prompt = f"""
Modify this learning day.

Instruction:
{instruction}

Concept: {day['concept']}
Task: {day['task']}

Return JSON:
{{
 "day": {day['day']},
 "concept": "...",
 "study_time": "{day['study_time']}",
 "task": "..."
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )

    text = response.choices[0].message.content

    try:
        json_text = re.search(r"\{.*\}", text, re.DOTALL).group()
        return json.loads(json_text)
    except:
        return day