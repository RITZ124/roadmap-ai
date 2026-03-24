import requests
import time
github_cache = {}
def build_query(topic, concept, subtopics):

    query_parts = [topic, concept]

    if subtopics:
        query_parts.extend(subtopics[:2])

    return " ".join(query_parts)


# -------------------------
# YouTube Search
# -------------------------

def search_youtube(topic, concept, subtopics):

    query = build_query(topic, concept, subtopics)

    return f"https://www.youtube.com/results?search_query={query.replace(' ','+')}"


# -------------------------
# GitHub Search
# -------------------------

def search_github(topic, concept, subtopics):

    query_parts = [topic, concept]

    if subtopics:
        query_parts.extend(subtopics[:2])

    query = " ".join(query_parts)

    return {
        "name": f"Search: {query}",
        "url": f"https://github.com/search?q={query.replace(' ','+')}&type=repositories",
        "stars": ""
    }

# -------------------------
# Dataset Search
# -------------------------

def search_dataset(topic, concept, subtopics):

    query = build_query(topic, concept, subtopics)

    kaggle = f"https://www.kaggle.com/search?q={query.replace(' ','+')}"

    huggingface = f"https://huggingface.co/datasets?search={query.replace(' ','+')}"

    return {
        "kaggle": kaggle,
        "huggingface": huggingface
    }