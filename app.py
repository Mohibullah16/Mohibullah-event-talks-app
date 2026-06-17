from flask import Flask, jsonify, render_template
import feedparser
import requests
import re
from datetime import datetime

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def get_releases():
    try:
        # Fetch with timeout to prevent hanging
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        
        releases = []
        for entry in feed.entries:
            # Try to get published date
            pub_date = ""
            if hasattr(entry, "published"):
                pub_date = entry.published
            elif hasattr(entry, "updated"):
                pub_date = entry.updated
            
            # Format date for cleaner display if possible
            formatted_date = pub_date
            try:
                # BigQuery release feeds typically use ISO format or similar, e.g. 2026-06-16T18:00:00Z
                dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                formatted_date = dt.strftime("%B %d, %Y")
            except Exception:
                pass

            # Extract title and description
            title = getattr(entry, "title", "BigQuery Update")
            content = ""
            if hasattr(entry, "content"):
                content = entry.content[0].value
            elif hasattr(entry, "summary"):
                content = entry.summary
            
            # Determine type of release (Feature, Changed, Deprecated, Fixed, etc.)
            # Often Google release notes have headers or tags in description
            category = "General"
            content_lower = content.lower()
            if "feature" in content_lower or "new" in content_lower:
                category = "Feature"
            elif "deprecat" in content_lower:
                category = "Deprecated"
            elif "fix" in content_lower or "bug" in content_lower:
                category = "Fixed"
            elif "change" in content_lower or "updat" in content_lower:
                category = "Changed"
            
            # Create a plain-text version for Twitter sharing
            # Strip HTML tags
            plain_text = re.sub(r'<[^>]+>', '', content)
            plain_text = re.sub(r'\s+', ' ', plain_text).strip()
            
            # Shorten for tweet preview (Twitter character limit is 280)
            tweet_text = f"BigQuery Update ({formatted_date}): {title} - "
            remaining_len = 280 - len(tweet_text) - 4 # 4 for "..."
            if len(plain_text) > remaining_len:
                tweet_text += plain_text[:remaining_len] + "..."
            else:
                tweet_text += plain_text

            releases.append({
                "id": getattr(entry, "id", entry.link if hasattr(entry, "link") else title),
                "title": title,
                "date": formatted_date,
                "raw_date": pub_date,
                "content": content,
                "link": getattr(entry, "link", "https://cloud.google.com/bigquery/docs/release-notes"),
                "category": category,
                "tweet_text": tweet_text
            })
            
        return jsonify({"success": True, "releases": releases})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
