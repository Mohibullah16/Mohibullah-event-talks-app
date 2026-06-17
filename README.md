# BigQuery Release Notes Dashboard

A modern, responsive, and aesthetic web application built with Python Flask, vanilla CSS, JavaScript, and HTML. The dashboard fetches real-time BigQuery release notes from the Google Cloud XML feed, auto-categorizes updates, and enables instant sharing to X/Twitter with preformatted text fitting within the 280-character limit.

---

## 🚀 Features

* **Real-time Feeds**: Retrieves and parses RSS/Atom XML directly from Google.
* **Auto-Categorization**: Intelligently tags entries into `Features`, `Changed`, `Deprecated`, or `Fixed` using server-side analysis.
* **Instant Filtering & Live Search**: Client-side query search matches headlines and body contents instantly.
* **Sleek Premium Design**: Crafted with dark modes, glassmorphism card layouts, distinct category highlights, and micro-interactions.
* **X/Twitter Composer Integration**: Includes a custom popup modal with a live character countdown linking to X/Twitter Web Intent.

---

## 🛠️ Tech Stack

* **Backend**: Python, Flask, `requests`, `feedparser`
* **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Modern variables & transitions)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mohibullah16/Mohibullah-event-talks-app.git
   cd Mohibullah-event-talks-app
   ```

2. **Install dependencies**:
   ```bash
   pip install flask requests feedparser
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 📂 Project Structure

```
├── static/
│   ├── app.js         # Frontend interactive state, filters, and sharing logic
│   └── style.css      # Custom HSL design tokens, responsive grids, and animations
├── templates/
│   └── index.html     # Dashboard layout & tweet composer modal template
├── .gitignore         # Build caches and env configuration exclusion rules
├── app.py             # Flask server routing, feed parser, and category analyzer
└── README.md          # Project documentation
```
