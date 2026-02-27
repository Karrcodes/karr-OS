# KarrOS — Module Overview

A full breakdown of every module in the system: what it does, how it works, and its current status.

---

## 📅 Day Planner (Operations sub-module)
**Purpose:** Algorithmic daily scheduling engine.

**How it works:**
- On initialization, sets a T-Zero timestamp and generates an optimised timeline from that point forward
- On **Work Days**, starts from the shift start time and places tasks between shift + commute windows
- On **Days Off**, works from wake time forward, filling with personal tasks, routines, and rest
- Tasks are sorted by priority, impact score, and rigid start times
- Routine items (gym, meal prep, walk, sleep) are auto-inserted based on configurable defaults
- Sleep is always the final item: **21:30 (work days)** / **00:00 (days off)**
- Timeline items display start/end timestamps and pills for profile, priority, and category
- Play/Pause tracks active task, Complete marks it done in the DB
- **End Day** button logs bedtime to close the day

**Status:** Active. Bug fixes ongoing (complete button for active task, travel time).

---

## 📋 Operations
**Purpose:** Task management for personal and business workflows.

**How it works:**
- Three lists: **Deployment** (todo), **Grocery**, **Reminders**
- Tasks have: priority, due dates, recurrence rules, notes, strategic category, impact score, estimated duration
- **Location intelligence**: destination + home/other origin → Google Maps Distance Matrix API → auto-calculated travel time (rounded to nearest 15 min)
- **Smart Priority**: Gemini AI analyses task title and workload context to suggest a priority level
- Recurring tasks auto-generate into Day Planner items based on recurrence config
- Drag & drop reordering, undo on delete, task detail modal with subtask support
- Both personal and business profiles

**Status:** Active. Location and planner integration ongoing.

---

## 🧠 Intelligence
**Purpose:** AI-powered personal insights and analysis hub.

**How it works:**
- Central hub for AI-generated summaries, recommendations, and cross-module intelligence
- Pulls data from Operations, Finances, and Focus Map to surface patterns
- Planned: daily briefing, focus recommendations, financial anomaly alerts

**Status:** Active (early stage).

---

## 💰 Finances
**Purpose:** Personal and business financial operating system.

**Sub-modules:**
- **Projections** — income vs expense forecasting by period
- **Transactions** — log and categorise income/expenses, attach receipts
- **Analytics** — visual breakdowns, trends over time
- **Liabilities** — debt tracker with payoff scheduling
- **Savings** — savings goals / pot management
- **Settings** — pay period, profiles, categories

**How it works:**
- Separate Personal and Business profiles with privacy toggle
- Rota-aware: knows shift patterns and applies them to income projections
- Real-time Supabase sync with optimistic UI updates

**Status:** Active.

---

## 🛡️ Vault
**Purpose:** Secure personal data store.

**Sub-modules:**
- **Clipboard** — rich clipboard / notes with pinning, tagging, and search
- **Secrets Manager** — encrypted credentials storage (passwords, API keys, etc.)

**How it works:**
- Privacy mode blurs sensitive content
- Vault lock state persists across navigation
- Clipboard supports markdown, code, bullet lists

**Status:** Active.

---

## ✨ Studio *(formerly Create — disabled)*
**Purpose:** Research, development, and project building hub.

**Planned features:**
- Project boards with milestone tracking
- R&D notes and experiment logs
- Tool integrations for building (design links, code repos, docs)
- AI-assisted ideation and planning
- Progress tracking against strategic goals linked to Manifest

**Status:** Coming soon.

---

## 🎯 Manifest *(formerly Goals)*
**Purpose:** Long-term intention and milestone tracking.

**How it works:**
- Goals / intentions organised by life area
- Milestone sub-items with completion tracking
- Linked to Operations tasks for execution
- Planned: AI-generated reflection prompts, progress scoring

**Status:** Active (basic). Enhancement planned.

---

## 💚 Wellbeing *(formerly Health & Wellbeing — disabled)*
**Purpose:** Physical and mental health tracking.

**Planned features:**
- Workout logging linked to Day Planner gym sessions
- Sleep quality tracking (cross-referenced with End Day timestamp)
- Mood / energy check-ins
- Recovery metrics and trend charts
- Integration with rota to flag overload risk

**Status:** Coming soon.

---

## 🗺️ Focus Map *(within Operations)*
**Purpose:** Visual task landscape — a spatial, time-aware view of all tasks.

**How it works:**
- Tasks placed on an X/Y grid: X = time horizon, Y = impact
- AI can auto-position tasks based on due date and impact score
- Snap-to-grid for clean alignment
- Month markers along X axis
- Colour coded by priority / status

**Status:** Active. Position persistence bugs fixed.

---

## ⚙️ System / Control Centre
**Purpose:** OS-level settings and configuration.

**Includes:**
- Profile settings (name, email, avatar)
- Theme / appearance
- Demo mode toggle
- App version and roadmap

**Status:** Active.
