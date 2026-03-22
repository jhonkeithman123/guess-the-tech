# 🎮 Guess the Tech — Project Plan (Finalized)

## Overview

**Guess the Tech** is a GDG-themed quiz game where players identify technologies by logos or hints.  
It features **progressive difficulty**, a **Top 100 leaderboard system**, and a **community vibe** inspired by Google Developer Groups.

---

## Tech Stack

- **Frontend:** Next.js (dynamic routes, timer UI, leaderboard display)
- **Backend:** Bun (fast runtime, handles scoring and leaderboard API)
- **Database:** SQLite (stores categories, hints, logos, scores, leaderboard)
- **Theme:** GDG-inspired (Google colors, playful animations, developer community feel)

---

## Categories

- 🧠 AI
- 📱 Apps
- 🌐 Browser
- ☁️ Clouds
- 🏗 Frameworks
- 💻 IDE
- 🏢 Org
- 🖥 OS
- 🖊 Programming Languages
- 🎲 Random
- ⚡ Runtime
- 📢 Social Media
- 💻 Terminals
- 🛠 Tools

---

## Gameplay Modes

1. **Flash Logo Mode** — Logo shown for 0.5s, then hidden.
2. **Hint Mode** — Text clue provided.
3. **Category Shuffle** — Random category chosen.
4. **Boss Round** — Multiple categories in sequence.

---

## Timer System

Difficulty increases as players progress:

- **Items 1–30:** 10 seconds per question
- **Items 31–40:** 8 seconds per question
- **Items 41–50:** 6 seconds per question
- **Items 51–60:** 5 seconds per question
- **Items 61+:** 4 seconds per question

This ensures tension rises as players advance.

---

## Leaderboard System

- **Scoring:**
  - +2 points for correct tech name
  - +1 point for correct category
  - Bonus streaks for consecutive correct answers

- **Leaderboard Features:**
  - **Top 100 players** displayed globally
  - Local storage for personal bests
  - SQLite table for scores:
    ```sql
    CREATE TABLE leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      email TEXT DEFAULT NULL,
      score INTEGER NOT NULL,
      time_taken INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ```

- **Tie-breaker:** Fastest completion time wins if scores are equal.
- **Pagination:** Leaderboard view supports scrolling through ranks 1–100.
- **Highlight:** Player’s own rank is emphasized even if outside Top 100.

---

## Example Question with Hint

**Category:** Programming Languages

- Logo: 🐍 intertwined snakes
- Hint: Beginner-friendly, widely used in data science.
- Answer: Python

---

## GDG Theme Integration

- **Colors:** Google palette (Blue, Red, Yellow, Green)
- **UI:** Rounded cards, playful animations, GDG-style banners
- **Community Mode:** Multiplayer quiz sessions (future feature)
- **Tagline:** _“Learn. Play. Build. Together.”_

---

## Next Steps

1. Implement SQLite schema for categories, hints, logos, scores.
2. Build Next.js pages with timer logic per difficulty tier.
3. Create Bun API endpoints for leaderboard CRUD operations (Top 100).
4. Style frontend with GDG theme.
5. Add scoring + streak bonuses.
6. Expand categories with more logos and hints.

---
