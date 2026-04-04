# ART OS — PRODUCT REQUIREMENTS DOCUMENT

**Version:** 2.0 — April 2026
**Status:** Final specification for development
**Audience:** Any developer with zero prior context

---

## TABLE OF CONTENTS

1. Critical Rules
2. Product Overview
3. Design System (Apple HIG)
4. Technical Architecture
5. Information Architecture & Navigation
6. Onboarding System
7. AI Decision Impact Engine
8. AI Partner & Personality
9. Dashboard & Command Center
10. Task Management
11. Projects & Goals
12. Financial Management
13. Health & Wellness System
14. Faith & Spiritual Tracking
15. Streaks & Habits
16. Business Management
17. Pipeline & CRM
18. Schedule System
19. Ideal Self Algorithm
20. Voice & NLP System
21. Notification System
22. Reporting & Analytics
23. Ecosystem Map & Idea Bank
24. Knowledge Vault & Mentors
25. Loading States & Skeleton UI
26. Error Handling
27. Data Deletion & Archival
28. Accessibility
29. Multi-Tenancy & SaaS Architecture
30. Data Model Reference
31. Build Phases
32. Complete Feature List

---

## 1. CRITICAL RULES

These rules are non-negotiable. Every line of code must comply.

### Rule 1: Zero Hardcoded Data

There must be zero hardcoded business names, client names, revenue numbers, task descriptions, dollar values, expense amounts, or any user-specific data anywhere in the codebase. Not in constants, not in seed functions, not in default state, not in example data, not in placeholder text that looks like real data. Every piece of data comes from: user input during onboarding, user manual entry during usage, AI calculation based on real data, or API sync (Stripe, Plaid, calendar). If a field has not been filled, the app shows a helpful empty state. Throughout this document, `{variable}` notation indicates values computed at runtime.

### Rule 2: SaaS Product

ART OS is for any entrepreneur, not one person. Generic models: `User`, `Business`, `Client`. UUIDs via `crypto.randomUUID()`. All records have `createdAt` and `updatedAt`. Works for fitness coaches, real estate agents, SaaS founders, freelancers.

### Rule 3: Onboarding First

First screen is always the onboarding wizard. Not the dashboard. Onboarding is mandatory and exhaustive.

### Rule 4: Everything Is Interactive

Nothing is display-only. Numbers are tappable for breakdowns and editable. Statuses are tappable to change. Cards open Vaul drawers. Voice input works everywhere.

### Rule 5: The AI Decision Engine Is the Core

The ability to weigh the impact of any decision and show short/long-term effects using AI. If this fails, the app is a to-do list. Prioritize above all else.

---

## 2. PRODUCT OVERVIEW

**Pitch:** ART OS is a life/business operating system that calculates the AI-powered impact of every decision so entrepreneurs can see what their life looks like if they do something versus if they do not.

**Feeling:** Like an AI that knows everything about your life and proactively plans for you. Not a dashboard — an intelligence that talks, argues, and holds you accountable.

**Fails if:** It cannot weigh any decision's impact on short and long-term time horizons.

**Target:** Entrepreneurs 24–50, running multiple businesses, tech-savvy, overwhelmed.

**Price:** $49–99/mo as a business coach replacement.

**Platform:** Responsive web app, PWA installable, dark mode default with light mode.

**Design:** Apple Health meets premium fintech meets AI coaching. Progress rings, bento grid, warm tones, blue accent.

---

## 3. DESIGN SYSTEM — APPLE HIG

This section is the single source of truth. When conflicts arise, this section wins.

### 3.1 Colors

Backgrounds: `--bg-primary: #1C1C1E`, `--bg-elevated: #2C2C2E` (cards), `--bg-secondary: #3A3A3C` (inputs/hover), `--bg-tertiary: #48484A` (pressed), `--bg-warm-gradient: radial-gradient(ellipse at 50% 0%, rgba(60,55,50,0.12) 0%, #1C1C1E 70%)`.

Text: `--text-primary: #F5F5F7`, `--text-secondary: rgba(255,255,255,0.55)`, `--text-tertiary: rgba(255,255,255,0.35)`.

Accent: `--accent: #0A84FF` (all interactive elements), `--accent-hover: #409CFF`, `--accent-bg: rgba(10,132,255,0.12)`.

Semantic: `--positive: #30D158` (money/success only, never buttons), `--negative: #FF453A`, `--warning: #FF9F0A`, `--info: #64D2FF`, `--spiritual: #FFD60A`, `--ai: #BF5AF2`.

Borders: `--border: rgba(255,255,255,0.06)`, `--border-hover: rgba(255,255,255,0.12)`, `--separator: rgba(255,255,255,0.08)`.

Light mode: `--bg-primary: #F5F5F7`, `--bg-elevated: #FFFFFF`, `--bg-secondary: #E5E5EA`, `--accent: #007AFF`, `--positive: #34C759`, `--negative: #FF3B30`, `--border: rgba(0,0,0,0.08)`.

### 3.2 Typography

System font: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif`. Monospace (data numbers only): `-apple-system, 'SF Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums`.

Scale: Title Large 34px w700 ls-0.5px. Title 28px w700 ls-0.3px. Title Small 22px w700 ls-0.2px. Headline 17px w600. Body 17px w400 lh1.5 (minimum body size). Callout 16px. Subheadline 15px. Footnote 13px. Caption 12px. Caption Upper 12px w600 uppercase (only permitted uppercase).

Prohibitions: No all-caps except Caption Upper. No monospace for non-data text. No letter-spacing above 1px. No text-shadow/glow. No JetBrains Mono.

### 3.3 Components

**Cards:** Solid `--bg-elevated`, 1px `--border`, 16px radius, 16px 20px padding. Hover: bg to `--bg-secondary`, border to `--border-hover`. No translateY lift. No box-shadow. Active: scale(0.98). No backdrop-blur on regular cards. No pseudo-element accent lines. Floating elements only (drawers/sheets): `rgba(44,44,46,0.85)`, `backdrop-filter: blur(40px)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.4)`.

**Buttons:** Primary: solid `--accent`, white, 17px w600, 16px 32px padding, 14px radius, min-height 44px, no gradient. Secondary: `rgba(255,255,255,0.08)`, `--text-primary`. Text: no bg, `--accent` color.

**Inputs:** `--bg-secondary`, 1px `--border`, 12px radius, 14px 16px padding, 17px, min-height 52px. Focus: border to `--accent`, no glow/ring. Labels: 13px w500, `--text-secondary`, normal case.

**Animations:** Ease curve `[0.25, 0.1, 0.25, 1]`. Entrance: opacity 0→1, y 8→0, 0.25s, stagger 30ms. Tap: scale(0.97) 0.1s. No spring physics. No hover lifts. No gradient animations.

**Badges:** 4px 10px padding, 8px radius, 12px w600. Positive/negative/warning/info/ai variants with 12-15% bg opacity and full color text.

**Progress:** Bars 4px, `--bg-secondary` track, `--accent` fill, 2px radius. Rings: SVG, 8px stroke, contextual color, strokeLinecap round, rotate(-90deg), no glow.

### 3.4 Verification Checklist

No green as button/link/accent. No all-caps except 12px captions. No monospace except data. No hover lifts. No gradient buttons. No input glow. No blur on regular cards. No text shadows. Warm gradient background. Body text 17px+. Touch targets 44px+.

---

## 4. TECHNICAL ARCHITECTURE

**Stack:** Next.js 14+ (App Router), TypeScript strict, Tailwind CSS + CSS vars, Zustand persist (localStorage → future Supabase), Recharts, Framer Motion, Vaul, Sonner, date-fns, Anthropic API, Plaid, Stripe, Vercel, next-pwa.

**Data:** UUIDs, ISO 8601 timestamps, localStorage persistence, future Supabase migration with RLS. No hardcoded data. Computed values derived at render time.

**API:** `/api/ai` route: receives message + context snapshot → builds dynamic system prompt → calls Anthropic → returns response. Without API key: Copy Context mode.

---

## 5. NAVIGATION

**Desktop:** Collapsible left sidebar (280px/72px). Groups: Home, Command Center (AI, Decision Lab, Scenarios), Empire (Businesses, Pipeline, Clients, Drivers), Execution (Tasks, Projects, Goals, Sprint, Roadmap), Money (Financials, Net Worth, Expenses), Foundation (Health, Energy, Schedule, Habits), Mind (Ideas, Knowledge, Reflections, Mentors), Growth (Reports, Insights, Skills, Ecosystem), Account (Settings). Caption Upper group labels. Footnote nav items. Active: `--accent-bg` + `--accent` text.

**Mobile:** 6-tab bottom bar (49px): Home, Command, Empire, Health, AI, More.

**Search:** Cmd+K. Full-screen floating overlay. 20px centered input. Debounced 200ms. Results by category.

---

## 6. ONBOARDING SYSTEM

### 6.1 Format

**Desktop:** Left 55% conversation (AI bubbles + questions + inputs), right 45% live dashboard preview. AI bubbles: `--bg-elevated`, asymmetric radius (18/18/18/4px), 17px, 16px 20px padding. Questions: Title Small (22px w600) on page background, not in cards. Inputs: standalone, not in cards. 32px spacing between elements. 1–2 fields per screen.

**Mobile:** Full-screen conversation. Summary cards after each category.

**Chips:** `--bg-secondary`, `--border`, 20px radius, 8px 16px, 13px. Selected: `--accent-bg`, `--accent` border.

**Progress:** 2px bar, `--accent` fill. Below: "Step {n} of 13 · {category}" in Footnote.

**Navigation:** ← Back (secondary), Continue → (primary, disabled until required). Enter advances. Skip link on optional sections.

### 6.2 Category 0: Welcome

AI: "Welcome to ART OS. I'm going to be your AI business partner — but first, I need to learn everything about you. Your businesses, your finances, your health, your goals, your struggles. The more honest you are, the smarter I get. This takes about 10–15 minutes. It's the most important 15 minutes you'll spend on this app. Ready?"

[Let's go →] primary button. Caption: "Everything is stored locally and never shared."

Preview: Empty dashboard skeleton with shimmer placeholders.

### 6.3 Category 1: Identity — "About You"

AI: "Let's start with the basics."

Q1: "What's your first name?" — text, auto-focused. AI: "Great, {Name}. Nice to meet you." App capitalizes everywhere. Preview: greeting updates.

Q2: "Where are you based? City and state." — text with location autocomplete. Note: "For time zone and prayer times." Preview: location in greeting.

Q3: "How old are you?" — number/slider 18–80. AI: "Got it. Good baseline for projections."

Q4: "In one or two sentences — how would you describe where you are in life right now?" — textarea 2–3 lines. Placeholder: "I'm running 3 businesses but feel scattered..." Stored permanently for AI context.

### 6.4 Category 2: Businesses — "Your Businesses"

AI: "Now let's map out your empire. How many businesses or projects are you actively running? Include side projects, dormant businesses, and ideas."

Q1: "How many?" — buttons [1]–[5] [6+] or number selector. AI: "Let's go through each one."

Per business loop — AI: "Tell me about business #{n}."

Q2: Name — text. Preview: business card appears.
Q3: Type — dropdown (13 options: Marketing/SEO Agency, Service Business, E-commerce, SaaS, Content/Influencer, Real Estate, Coaching/Consulting, Freelance, Brick & Mortar, Food & Bev, Health & Wellness, Education, Other).
Q4: Status — chips: Active–Growing, Active–Stable, Active–Declining, Pre-Revenue, Dormant, Idea Only.
Q5: Monthly revenue — dollar input. AI responds contextually. Preview: revenue on card, income ticker updates.
Q6: Day-to-day description — textarea 3–4 lines. Critical for AI task optimization.
Q7: Role — chips: Owner-operator, Owner-manager, Mostly passive, Partner/co-owner.
Q8: Team — [Yes]/[No]. If yes: sub-form per member (name, title, role description, compensation type+amount). [+ Add another].
Q9: Tools — text + suggestion chips (Stripe, QuickBooks, Instantly, GoHighLevel, Notion, Slack, Google Workspace, Social Media, Other). Multi-select.
Q10: Payment method — chips: Stripe, Bank transfer, Cash, Check, PayPal, Multiple.
Q11: Recurring clients — [Yes–add them]/[No–per-job]. If yes: client sub-flow (name, monthly payment, ad spend, relationship health chips, start date, communication frequency chips, running MRR total, [+ Add another]). If per-job: avg job value (dollar) + jobs/month (number).
Q12: Biggest bottleneck — textarea. AI: "I'll keep an eye on this."
Q13: Color — picker grid (8–10 presets + custom). Preview: card accent updates.

After all: AI summarizes count and total revenue. Preview: all cards visible.

### 6.5 Category 3: Finances — "Your Money"

AI: "Let's get real about your finances. I need both sides — what comes in and what goes out."

Q1: Plaid — [Connect via Plaid] / [Manual] / [Maybe later].
Q2: Housing — chips [Rent-free] [Rent] [Mortgage] + dollar.
Q3: Cars — [No payment] or [Add car: $/mo] [+ Add another].
Q4: Car insurance — dollar.
Q5: Phone — dollar.
Q6: Subscriptions total — dollar. AI: "Most people underestimate this."
Q7: Food/dining — dollar or slider $200–$3,000.
Q8: Other recurring — label + dollar, repeatable.
Q9: Debts — [None] or [Add: type, monthly, balance] repeatable.
Q10: Savings — chips: Under $5K, $5–20K, $20–50K, $50–100K, $100K+.
Q11: Assets — name + type (dropdown: Real Estate, Vehicle, Investment, Social Media, IP, Other) + value. Repeatable.

AI auto-summary: income, expenses, net, savings rate, net worth. [Looks right ✓] / [Adjust]. Preview: financial tile appears.

### 6.6 Category 4: Goals — "Where You're Going"

AI: "Now the important part — where are you trying to go?"

Q1: Income target — large slider $5K–$500K, Title Large display. AI: "{x}x your current. Aggressive but doable."
Q2: Target date — month/year picker. AI: "{x} months. Need ${gap}/mo."
Q3: Why this number — textarea. Stored as motivation context.
Q4: North star metric — text + chips (Monthly revenue, Net worth, New clients/month, Daily score, Something else).
Q5: Exit intent — [Yes]/[Maybe]/[No]. If yes: which business, price, timeline.
Q6: Ideal day description — large textarea. AI: "Be specific." Generates Ideal Self. Preview: goal meter appears.

### 6.7 Category 5: Health — "Your Foundation"

AI: "Your body and mind run your business."

Q1: Target wake time — time picker.
Q2: Actual wake time — time picker. AI notes gap if >2 hours.
Q3: Exercise — chips (Consistently, Sometimes, Rarely, Never). If yes: type (text), frequency (chips), gym access (chips).
Q4: Diet — chips (Clean, Mixed, Mostly junk, Don't think about it).
Q5: Caffeine — chips (Coffee, Energy drinks, Both, Neither). If energy drinks: daily count slider.
Q6: Smoking — chips (No, Cigarettes, Vape, Trying to quit).
Q7: Phone screen time — slider 0–12 hours.
Q8: Energy level — slider 1–10.
Q9: Stress level — slider 1–10.
Q10: Habits to build — multi-select (Exercise, Eat clean, Sleep on time, Read, Meditate, Journal, Limit screen time, Water, Outreach, Content, + Custom).
Q11: Trying to quit — text. [Keep private] toggle (default on). Preview: habit tiles appear.

### 6.8 Category 6: Schedule — "Your Day"

AI: "Let's map your ideal daily schedule."

Q1: Work start — time picker.
Q2: Work end — time picker.
Q3: Fixed commitments — [None] or repeating: title, time, duration, days-of-week multi-select.
Q4: Deep focus preference — chips (Morning, Afternoon, Evening, Late night, No preference).
Q5: Focus duration — chips (15, 30, 45, 60, 90+ min).

AI: "I'll build your schedule template and adjust as I learn." Preview: schedule bar appears.

### 6.9 Category 7: Faith — "Your Spirit"

AI: "Optional but important. Spiritual practice impacts discipline."

Q1: Faith role — chips (Central, Sometimes, Spiritual not religious, Not really, Prefer not to say). If not really/prefer not: category ends, no prayer tile.
Q2: Tradition — dropdown (Islam, Christianity, Judaism, Buddhism, Hinduism, Sikhism, Spiritual, Other).
Q3 (Islam): Track prayers? — chips (Build consistency, Already consistent, Not now).
Q4 (if tracking): Current consistency — chips (All 5, 3–4, 1–2, Rarely, Want to start).
Q5: Faith role model — text (optional).
Q6: Dashboard visibility — chips (Prominent, Small tile, Health section only).
Other faiths: adapted (meditation for Buddhism, devotional for Christianity, Shabbat for Judaism). Preview: prayer/spiritual tile appears.

### 6.10 Category 8: Struggles — "Real Talk"

AI: "The hard part. What's actually getting in your way — not what you tell people."

Q1: Procrastination pattern — textarea.
Q2: Patterns you wish you could change — textarea.
Q3: Biggest distraction — chips (Phone/social, New ideas, Netflix/YouTube, Gaming, Gambling, Socializing, Over-researching, Other).
Q4 (if quitting something): Impact on productivity/finances — textarea. [Keep private] toggle.
Q5: Last time "locked in" — textarea.
Q6: What needs to be true — textarea.

AI: "Thanks for being honest. I'll use this carefully." No preview changes — feeds AI only.

### 6.11 Category 9: AI Preferences — "Your AI Partner"

Q1: Communication style — chips (Direct, Push hard, Supportive, Mix).
Q2: Motivators — multi-select (Numbers going up, Competing with self, Fear of wasting potential, Proving people wrong, Building something great, Freedom, Providing for family).
Q3: Proactive frequency — chips (Multiple daily, Once daily, Important only, Let me come to you).
Q4: Reasoning display — chips (Show everything, Big decisions only, Just tell me).
Q5: Factor health into business? — [Yes]/[No].

### 6.12 Category 10: Connections — "Power Up"

Q1: Anthropic API key — text + [Test] button. Status: idle/loading/pass/fail. Fallback note about Copy Context.
Q2: Stripe — [Connect]/[Skip].
Q3: Plaid — [Connect]/[Skip].
Q4: Calendar — [Connect Google Calendar]/[Skip].

### 6.13 Category 11: Security — "Lock It Down"

Q1: PIN — 4–6 digit masked input + confirmation. Required.

### 6.14 Category 12: Summary — "Your OS Is Ready"

Scrollable summary by category with key data points. Each section has [Edit] link. User: [Launch ART OS →] or [Go back and edit]. Preview: fully assembled dashboard.

### 6.15 Edge Cases

Quit mid-onboarding: progress saved, resumes on return. Skip optional: features show "Complete setup to unlock." Redo: Settings → re-run (clears data) or update info (edit without reset). Single business: no business selectors shown.

---

## 7. AI DECISION IMPACT ENGINE

This is the feature that makes or breaks ART OS. If a user cannot input any decision and immediately see how it impacts their life, the app is just another to-do list.

### 7.1 Task Dollar Value Estimation

Every task has an estimated dollar value. The AI calculates these differently by task type.

**Direct revenue tasks** (send invoice, close deal, onboard client): Use actual dollar amounts from task or client data. If the task is "Send invoice to {client}" and the client pays ${amount}/mo, the task value is ${amount}.

**Revenue-generating activity tasks** (cold outreach, content creation, ad optimization): Calculate from the user's historical conversion data. Formula: (average revenue per activity session) × (estimated sessions this task represents). Example: if 200 cold emails historically yields 2 clients at ${avgClientValue} each, one batch is worth approximately ${avgClientValue × 2}. If no historical data exists, use conservative industry defaults and label as "estimated — will improve as I learn your conversion rates."

**Infrastructure tasks** (set up CRM, document SOPs, hire VA): Estimate based on time saved × effective hourly rate. The effective hourly rate is the user's net income divided by estimated working hours per month. Example: automating invoicing saves 4 hours/month at ${hourlyRate}/hr = ${value}/month, annualized to ${value × 12}. Present as "estimated annual value."

**Health-correlation tasks** (gym, meal prep, sleep): Cross-reference health data with productivity data. If gym days correlate with 2.1× task completion rate, the dollar value of a gym session = (completion uplift) × (average task dollar value). If insufficient data: label as "indirect value" and say "I'll refine this estimate as I learn your patterns."

**Cost-reduction tasks** (cancel subscription, renegotiate): Direct savings minus opportunity cost of time. Net value = savings - (estimated hours × hourly rate).

All dollar values are displayed with an expandable [?] icon that shows the reasoning. Users can override any AI estimate with their own number.

### 7.2 Decision Impact Analysis — Complete Flow

**Trigger:** User navigates to the Decision Lab page and taps [+ New Decision], or asks the AI "Should I {x}?", or uses voice "Should I {x}?"

**Step 1: User states the decision.** A single text input (or voice transcription) with placeholder "What are you considering?" The user types or speaks their decision. Examples: "Should I sign this office lease for $800/month?" or "Should I hire a virtual assistant?" or "Should I buy a new car?"

**Step 2: AI asks clarifying questions.** The AI does not immediately analyze. It generates 3–6 relevant questions based on the decision type, presented as a sequential chat-style conversation. Each question has the appropriate input type (text, dollar, chips, slider). The AI adapts its questions based on the decision type:

For financial decisions (lease, purchase, hire): term length, expected unlock, which business, exit clause, replaces existing expense.

For strategic decisions (new business, pivot, partnership): time investment, revenue potential, risk tolerance, current bandwidth, alignment with goals.

For personal decisions (move, quit habit, lifestyle change): timeline, cost, impact on work, family considerations, reversibility.

The user answers each question. All answers feed into the analysis.

**Step 3: AI generates full impact analysis.** The analysis is displayed as a rich card (or multiple cards in a scrollable view) with these sections:

**Decision statement:** The question restated clearly at the top.

**Option A (the proposed action):** Financial impact subsection showing monthly cost or revenue change, annual impact, net monthly impact after expected revenue gains. Non-financial impact subsection showing time commitment, credibility/reputation effect, lock-in or commitment level, bandwidth impact (low/medium/high). Timeline projection showing four time points (Month 1, Month 3, Month 6, Month 12), each as a tappable card that expands to show a detailed P&L projection for that period. Risk factors subsection listing 2–4 risks with specific mitigations for each. Confidence rating (Low / Medium / Medium-High / High) with a plain-English explanation of why.

**Option B (status quo — do nothing):** What happens if the user maintains the current course. Cost of inaction calculation showing the estimated revenue or opportunity left on the table per month and cumulatively. Current trajectory projection.

**Option C (AI-generated alternative — if applicable):** The AI proposes an option the user may not have considered. Examples: negotiate different terms, try a smaller version first, delay with specific conditions, approach differently. This section includes the same financial and non-financial analysis structure as Option A.

**AI Recommendation:** A clear verdict: YES (with conditions), YES (unconditionally), NO (with reasoning), or CONDITIONAL (with specific requirements). Includes confidence percentage, the core reasoning in 2–3 sentences, and any behavioral context. Example: "You have {n} active commitments and a {x}% follow-through rate. Before signing, commit to {specific action} within 48 hours. Don't sign if this is going to sit on your to-do list."

**Mentor Perspective:** If the user has loaded mentor personas, a button: "What would {mentor} do?" Tapping regenerates the analysis through that mentor's known frameworks, philosophies, and decision-making patterns.

**Action buttons:** Three option buttons — [I'll do A] [I'll do B] [I'll do C]. When the user selects one, it creates a commitment record with the decision ID linked. Two additional buttons: [Argue with me on this] opens a conversational thread where the user pushes back and the AI defends its position with data — the AI has full authority to disagree. [Set check-in] lets the user pick 30, 60, or 90 days. At that date, the app prompts: "You made this decision {x} days ago. How did it play out?" with rating options (better than expected, as expected, worse, much worse) and a text field for notes. The outcome is logged to the decision journal and fed back into the AI to improve future accuracy.

[Share this analysis] generates a clean, professional PDF or document with the full analysis for sending to a business partner, mentor, or friend.

### 7.3 Spending Impact Calculator — Complete Flow

**Trigger:** User opens the spending calculator from the Decision Lab sidebar, or asks "Can I afford {x}?"

**Input form:** Item name (text), monthly cost including payment + insurance + maintenance (dollar), down payment or upfront cost (dollar), "Does this replace a current expense?" toggle — if yes: what it replaces (text) and current cost (dollar).

**Output analysis** contains five sections:

**The Real Cost:** Monthly increase (net after trade-in/replacement), annual cost, 5-year total cost including estimated depreciation, down payment impact on savings (savings drop from ${x} to ${y}).

**What This Equals In Your World:** Revenue needed to break even on this purchase monthly. Translated into the user's specific activities: number of additional client sessions at their average rate, additional clients at average fee, additional service jobs at average ticket, percentage increase in current output needed. At the user's current execution rate ({x}%), how much they would need to improve to absorb the cost.

**Can You Afford This?:** Current net take-home, take-home after purchase, emergency runway change (months of expenses covered by savings), savings rate change. Verdict: CAN AFFORD (green badge), STRETCH (orange badge), or CANNOT AFFORD (red badge). Plain-English explanation.

**The Alternative:** If the monthly cost were invested instead — in the user's highest-ROI business channel (estimated return), in an S&P 500 index fund (10-year projection), in business ads (estimated additional revenue).

**Action buttons:** [Share analysis], [Revisit later] (sets a reminder), [Ask AI more questions].

### 7.4 Mentor Persona Flow

**Creating a mentor:** Navigate to Mentors page → [+ Add Mentor]. Form: name (text), "Who is this person?" (textarea, 1–2 sentences), feed sources section — paste links (articles, videos, book summaries) one by one with [Add] button. Each added source shows with a checkmark. Minimum 3 sources recommended. [Create Mentor] button.

The AI processes the sources and extracts: key frameworks, decision-making patterns, communication style, known philosophies, domain expertise. These are stored as the mentor's "profile" and injected into the system prompt when the user asks "What would {mentor} do?"

**Pre-built archetypes** (no sources needed): The Operator ("Scale systems, hire, delegate"), The Investor ("What's the ROI? Show me the numbers"), The Builder ("Ship fast, iterate, don't overthink"), The Minimalist ("Do less, better. Cut everything non-essential").

**Using a mentor:** In any Decision Lab analysis, tap "What would {mentor} do?" The AI regenerates the recommendation section through that mentor's lens. Also available in the AI Partner chat: "What would {mentor name} say about this?"

---

## 8. AI PARTNER & PERSONALITY

### 8.1 Core Personality

The AI communicates like a $1M/year business advisor — data-driven, direct, always pushing toward action. It never passively listens. Every response moves toward a decision or next action. It thinks like someone who has built and exited multiple 8-figure businesses while maintaining excellent health, fitness, relationships, and spiritual practice. It is simultaneously a coach, partner, mentor, and strategist. It shows data, asks "what would it take?", and always recommends an action. It has full authority to argue with the user.

### 8.2 Dynamic System Prompt — Complete Template

Every API call includes a system prompt rebuilt from scratch using current data from the Zustand store. The template:

```
You are the user's AI business partner inside ART OS. You have complete
knowledge of their life, businesses, finances, health, and behavioral
patterns. You communicate like a $1M/year business advisor — data-driven,
direct, always pushing toward action. You never just listen passively.
Every response should move toward a decision or next action.

YOUR PERSONALITY:
- Think like someone who has built and exited multiple 8-figure businesses
- You maintain great health, fitness, relationships, and spiritual practice
- You are simultaneously a coach, partner, mentor, and strategist
- You show data, ask "what would it take?", and always recommend an action
- You have full authority to argue with the user if you disagree
- You adapt your communication style based on what works for this specific user

COMMUNICATION STYLE (from onboarding):
Style: {user.aiPushStyle}
Motivators: {user.aiMotivators.join(', ')}
Frequency: {user.aiFrequency}
Reasoning: {user.aiReasoningDisplay}

ESCALATION PROTOCOL:
Day 1: Gentle observation. "I noticed {task} hasn't been started. Worth ~${value}/day."
Day 3: Data-backed. "{Task} pending 3 days. Highest-ROI at ${hourlyRate}/hr. What would it take?"
Day 7: Firm. "7 days. ${totalCost} lost. Committed {x} times. Follow-through: {y}%. What's blocking this?"
Day 14+: Direct. "{x} days. {y} commits, 0 follow-through. ${z} cumulative cost. Commit with plan, remove, or tell me what's really going on."

THE USER:
Name: {user.userName}
Age: {user.userAge}
Location: {user.userLocation}
Self-description: "{user.userSituation}"
Biggest strength: {analyzed from behavioral data}
Biggest weakness: {analyzed from patterns}
Core pattern: {analyzed from task completion/abandonment}

GOALS:
Income target: ${user.incomeTarget}/mo by {user.targetDate}
Current income: ${calculated from businesses}
Gap: ${gap}
North star: "{user.northStarMetric}"
Ideal day: "{user.idealDay}"
Why: "{user.incomeWhy}"

BUSINESSES ({businesses.length} total):
{businesses.map(b => `
  ${b.name} (${b.type}): ${b.status}, $${b.monthlyRevenue}/mo
  Day-to-day: "${b.dayToDay}"
  Role: ${b.roleDetail}, Team: ${b.teamMembers?.length || 'Solo'}
  Tools: ${b.tools}, Bottleneck: "${b.bottleneck}"
  Revenue model: ${b.revenueModel}
  Clients: ${clients.filter(c => c.businessId === b.id).map(c =>
    `${c.name}: $${c.grossMonthly}/mo, $${c.adSpend} ad spend, ${c.relationshipHealth}`
  ).join('; ')}
`).join('\n')}

FINANCES:
Monthly income: ${totalRevenue}
Monthly expenses: ${totalExpenses}
Net take-home: ${netIncome}
Savings: {user.savingsRange}
Debts: {debts list}
Assets: {assets with values}
Net worth: ~${calculated}

HEALTH & HABITS:
Target wake: {user.wakeUpTime}, Actual avg: {calculated from logs}
Exercise: {user.exercise}, Diet: {user.dietQuality}
Caffeine: {user.caffeineType} ({user.caffeineAmount}/day)
Active streaks: {streaks.map(s => `${s.habit}: ${s.currentStreak}d`).join(', ')}
Energy pattern: {analyzed from energyLogs}
Correlations: {e.g., "Gym days = 2.1x task completion"}

FAITH:
Tradition: {user.faithTradition}
Prayer tracking: {user.trackPrayers ? 'enabled' : 'disabled'}
Consistency: {calculated percentage}
Prayer-productivity correlation: {if data exists}

STRUGGLES (handle with care):
Procrastination: "{user.procrastination}"
Distraction: {user.biggestDistraction}
Trying to quit: "{user.tryingToQuit}"
Last locked in: "{user.lockedInMemory}"
What needs to be true: "{user.whatNeedsToBeTrue}"

COMMITMENTS (last 30 days):
Total: {count}, Fulfilled: {fulfilled}, Rate: {percentage}%
Outstanding: {list of unfulfilled}
Most commonly broken: {pattern analysis}

BEHAVIORAL PATTERNS:
Tasks avoided: {list with days pending}
Most productive time: {time range from energy/task data}
Avg daily score: {score}, 7-day trend: {improving/declining/flat}
Idea:execution ratio: {ideas generated per 1 executed}
Action-to-result delays: {e.g., "Cold outreach → client: avg 45 days"}

ACTIVE MENTOR PERSONAS:
{mentors.map(m => `${m.name}: ${m.description}`).join('\n')}

CURRENT CONTEXT:
Date: {today}, Time: {now}
Tasks done today: {count} worth ${value}
Tasks remaining: {count} worth ${value}
Execution score: {score}/100 ({zone label})
Days since last app open: {count}
```

This prompt is rebuilt from scratch on every API call.

### 8.3 Proactive AI Behavior

The AI generates messages stored in an AI inbox without being asked. Priority levels: critical (red badge — requires immediate attention), important (orange badge — address today), informational (blue badge — FYI). The inbox is accessible from the AI Insights tile on the dashboard.

**Proactive message triggers and templates:**

Revenue concentration > 40%: "⚠ {client.name} represents {x}% of your net revenue from {business.name}. If they leave, you lose ${amount}/mo. I recommend signing {n} more clients in the next {timeframe} to reduce concentration below 30%."

Business flatline (0 tasks in 7 days): "🔴 {business.name} has had zero activity in 7 days. Status is {status} with ${revenue}/mo at stake. Is this intentional? If not, here's the highest-impact task you could do today: {suggestion}."

Stale tasks (> 7 days): "{n} tasks are older than 7 days without completion. The top one — '{task.text}' — is worth approximately ${value}. Want me to reprioritize your list?"

Commitment rate < 50%: "Your commitment follow-through rate has dropped to {x}%. You've made {total} commitments and fulfilled {fulfilled}. I'd recommend making fewer commitments and honoring all of them rather than over-committing."

High-value task pending 3+ days: "'{task.text}' has been pending for {days} days. Estimated value: ${value}. This is your {rank} highest-ROI task. What's blocking it?"

Health decline pattern: "Your energy has been declining for {n} days. I noticed you've skipped gym {n} times and your sleep average dropped to {hours} hours. On gym days, your task completion is {x}% higher."

Score declining 3+ days: "Your execution score has dropped for {n} consecutive days: {scores}. The biggest factor is {primary cause}. Here's one thing to do right now that would have the most impact: {suggestion}."

Decision check-in: "You made this decision {n} days ago: '{decision.text}'. Time for a check-in. How did it play out?"

Goal deadline approaching: "Your goal '{goal.title}' is due in {n} days. Current: {current}/{target}. You need to {action} to hit it. Alternatively, we can adjust the target."

### 8.4 Escalation Protocol — Detailed

The escalation operates on a per-task basis. Each task has a `createdAt` timestamp and a `skipCount`. The AI tracks days since creation for incomplete tasks.

**Day 1:** Tone is gentle, observational. Format: "I noticed {task} hasn't been started. It's worth approximately ${value}/day based on {reasoning}. No pressure — just flagging it." Delivered as an informational (blue) inbox message.

**Day 3:** Tone is data-backed, recommending. Format: "{task} has been pending for 3 days. Based on your data, this is your highest-ROI activity right now at ${hourlyRate}/hr. Your similar tasks average {days} days to complete. What would it take to start today? I can break it into subtasks if that helps." Delivered as an important (orange) inbox message.

**Day 7:** Tone is firm, cost-focused. Format: "7 days. ${totalCost} in estimated lost value since this was created. You've committed to this {x} times and haven't followed through. Your follow-through rate on {category} tasks is {y}%. Before we discuss anything else — what's actually blocking this?" Delivered as a critical (red) inbox message. If the task has been skipped (via the skip tracking system), the AI references the skip reasons.

**Day 14+:** Tone is direct confrontation. Format: "This has been on your list for {x} days. You've committed {y} times and not followed through. The cumulative cost is ${z}. I need you to pick one: (1) Commit right now with a specific plan and deadline — I'll hold you to it. (2) Remove it from your list — it's okay to decide this isn't a priority. (3) Tell me what's really going on — I can't help if I don't know. No judgment either way, but doing nothing is the worst option." Delivered as a critical (red) inbox message and also surfaces in the Next Action tile.

### 8.5 Conversation Memory

AI chat history is stored in the Zustand store as an array of `AiMessage` objects. The last 10 conversations are summarized and included in the system prompt. Summaries capture: topic, user's position, AI's recommendation, outcome (if known), key data points discussed. This prevents the AI from repeating old advice and allows it to reference past conversations: "Last time we discussed this, you decided to {x}. How did that go?"

### 8.6 Copy Context Mode

If no API key is configured, the AI page shows a prominent [Copy Context to Claude.ai] button. When tapped, it copies the complete context snapshot (the same data that would be in the system prompt) as plain text to the clipboard. The user can then paste this into claude.ai or any AI chat and interact with full context. The button shows a checkmark and "Copied!" confirmation for 2 seconds after tapping.

### 8.7 Re-engagement After Absence

1–2 days: Normal greeting. "Welcome back. Here's what you missed." Shows tasks completed/remaining since last visit.

3–6 days: "You've been away for {n} days. Your Ideal Self kept going. Here's the gap." Compares what the Ideal Self would have accomplished versus what actually happened.

7+ days: "A lot might have changed. Want to update me on anything?" Offers a quick 5-question catch-up.

30+ days: "Welcome back. Want to do a quick catch-up?" Fresh start flow.

Never guilt-trip. Always informative. Always end with: "Here's your #1 action to get back on track."

### 8.8 AI Feedback

Thumbs down on any message: AI acknowledges, adjusts, logs for pattern learning. "You were right about {x}" positive feedback reinforces good recommendations. AI reduces recommendation types that get thumbed down.

---

## 9. DASHBOARD & COMMAND CENTER

### 9.1 Philosophy

The dashboard is a customizable, living command center. Tile layout is user-controlled. Content inside tiles changes by time of day. Every tile opens a detail view. Think iOS home screen for your life.

### 9.2 Grid

12-column CSS grid, 16px gap, 24px padding, 1440px max-width. Tile sizes: Small (3 cols, 120px min), Medium (4 cols, 180px min), Wide (6 cols), Large (8 cols), Full (12 cols). Mobile (<768px): Small→6 cols, all others→12, gap→12px, padding→16px.

All tiles use standard `.card` styling (solid `--bg-elevated`, 16px radius, no blur, no accent lines). Tile headers: Footnote (13px w600, `--text-secondary`, normal case). Entry animation: standard ease, 30ms stagger.

### 9.3 Greeting Bar

Above the tile grid: "{timeGreeting}, {user.name}" in Title style with search icon and theme toggle. Below: today's date in Footnote. Time greetings: "Good morning" (<12), "Good afternoon" (12–17), "Good evening" (>17).

### 9.4 TILE 1: Daily Score Ring

**Size:** Large (8 columns). **Always shown:** Yes. **Data source:** Computed from `todayHealth`, `tasks`, `focusSessions` via the `getExecutionScore()` function (see Section 19).

**Visual description:** The center of this tile is dominated by a 180px SVG progress ring. The ring has an 8px stroke on a track of `rgba(255,255,255,0.06)`. The progress arc uses `strokeLinecap: round` and is colored based on the current score: 0–25% uses `--negative` (red), 26–50% uses `--warning` (amber), 51–100% uses `--accent` (blue). The ring animates from 0 to the current percentage over 1.2 seconds with the standard ease curve when the dashboard loads. Inside the ring, centered vertically, is the percentage number in 48px weight 700 monospace, colored the same as the ring stroke. Below the number, "vs Ideal" in 13px `--text-tertiary`.

Below the ring: a line showing "{earnedPoints} / {idealPoints}" in monospace 14px, with the earned portion in `--text-primary` and the ideal in `--text-tertiary`. Next to it, a comparison indicator: "↑{x}% from yesterday" in `--positive` if improving, "↓{x}%" in `--negative` if declining, or "—" in `--text-tertiary` if unchanged. A thin full-width progress bar (4px, rounded) sits below as a secondary visual.

**Tap → Score Detail Drawer** (Vaul, slides from bottom, floating card styling). Contains five sections:

Section 1 — Points Earned: A list of every point-earning action today. Each row shows: a checkmark icon in `--positive`, the category (Task, Prayer, Habit), the description, the point value right-aligned in monospace, and the timestamp in `--text-tertiary`. Rows animate in with 30ms stagger. Each row is tappable — navigates to that task or habit detail.

Section 2 — Points Remaining: Same list format but with empty circle icons instead of checkmarks. Each row is tappable to complete the action directly from this drawer (checkbox toggles on tap).

Section 3 — Dollar Equivalent: A card within the drawer showing three lines: "Earned today: ~${earned}" in `--positive` monospace, "Left on table: ~${remaining}" in `--negative` monospace, "Ideal day value: ~${idealTotal}" in `--text-tertiary` monospace. Below: "These values are AI-estimated based on your business data" in Caption with a [?] icon that expands to explain the calculation methodology.

Section 4 — 7-Day Trend: Recharts AreaChart, 200px tall. X-axis: last 7 days (abbreviated day names). Y-axis: 0–100%. Area fill: `--accent` gradient (30% opacity at top → 0% at bottom). Line: `--accent`, strokeWidth 2. Dashed average line at 40% opacity. Today's point is a larger dot. Each point tappable → tooltip showing that day's score and top activity.

Section 5 — Personal Records: Best day ever (date, score, one-line summary of what happened), best week average, current improving streak count, total points all-time. Each in a compact card format.

**Empty state:** "Your score starts at 0%. Complete your first task to start earning points. Every task, prayer, and habit has a point value based on its impact." With a [See how scoring works →] link to an explainer.

### 9.5 TILE 2: The Next Action ("The One Thing")

**Size:** Full (12 columns). **Always shown:** Yes, at or near top. **Data source:** `tasks` sorted by `getTaskPriorityScore()`, filtered to incomplete.

**Visual description:** This is the most important element on the dashboard. It displays the single highest-priority incomplete task. The tile shows the task text in Title Small (22px w700) centered. Below: a priority score badge (e.g., "Score: {n}/100" in `--accent-bg` with `--accent` text, 12px). If the task is linked to a project and goal, those are shown below in Caption: "📋 {project.name} → 🎯 {goal.title}". Two action buttons centered: [Done ✓] as a primary button (14px radius, `--accent` background) and [Skip →] as a text button in `--accent`.

This tile has four time-of-day content states:

**Morning (before noon):** Hero single-task display as described above. Includes a predictive motivation line from the AI above the task: "If you do one thing today, make it this." or "Complete this and you're already ahead of yesterday."

**Afternoon (noon–6pm):** Switches to a compact list showing the top 3–5 remaining tasks, each with a [Done] checkbox and [Skip] text link. Header: "Still on your plate" with remaining count.

**Evening (after 8pm):** End-of-day summary. Shows: today's score, tasks done versus planned, and a prompt: "How was your day? Tap to do a 2-minute voice review." The [Start voice review →] button opens a voice recording drawer.

**Absence (2+ days):** Welcome-back state. Shows: "While you were away, your Ideal Self completed {n} tasks and earned {points} points. Your gap: {gapAmount}." With [Let's catch up →] button linking to AI Partner.

**Empty state (no tasks):** "Your plate is clear." with two buttons: [+ Add your first task] (opens inline task input) and [Ask AI what to focus on →] (navigates to AI Partner).

### 9.6 TILE 3: Money Tracker

**Size:** Medium (4 columns). **Always shown:** Yes. **Data source:** `businesses.monthlyRevenue`, `expenseEntries`.

**Visual description:** Header "Net income" in Footnote. Below: the net income figure in 32px w700 monospace, colored `--positive` if positive or `--negative` if negative. Below the number: "{currentMonth} take-home" in Caption `--text-secondary`. At the bottom: a small Recharts AreaChart sparkline (100px wide, 32px tall) showing 7-day income trend. If net income is zero or negative: "Start tracking" in Caption italic `--text-tertiary` instead of the sparkline.

**Tap → Net Income Drawer.** Contains: a 14-day income trajectory LineChart (Recharts, 120px tall) with actual values as a solid `--accent` line and projected values as a dashed `--text-tertiary` line. Below: per-business revenue section — each business as a row with color dot, name, and an inline editable number field for revenue (on blur: saves update, shows toast "Revenue updated"). Below: summary — Total Revenue in `--positive`, Total Expenses in `--negative`, Net Income with a top border separator, colored by sign.

**Empty state:** "Add your businesses and revenue in onboarding to see your income here."

### 9.7 TILE 4: Execution Score

**Size:** Medium (4 columns). **Data source:** Computed via `getExecutionScore()`.

**Visual description:** Header "Execution" in Footnote. The score displayed as "{score}/100" in 32px w700 monospace, colored by zone (see Section 19.3). Below: the zone label and emoji in Caption (e.g., "✨ Peak performance"). A small 40px SVG progress ring at the bottom, stroke colored `--accent`, with the score number centered inside in 10px w700.

**Tap → Execution Detail Drawer.** Shows the score formula broken down into four components, each as a row with a label, a mini progress bar, and the points earned out of maximum: Commitment ({done}/{committed} tasks, {points}/35), Energy (gym, meals, caffeine, sleep — {points}/25), Focus ({sessions} sessions, {points}/20), Faith ({prayers} prayers, {points}/20). Below: 7-day trend line chart and zone history.

**Empty state:** "Complete your first task or log a habit to start building your score."

### 9.8 TILE 5: Tasks Preview

**Size:** Medium (4 columns) or Wide (6 columns). **Data source:** `tasks` sorted by priority score.

**Visual description:** Header "Tasks" with a "{done}/{total}" count badge in `--accent-bg`. Shows top 5 tasks sorted by AI priority score. Each task row: a colored priority dot (red for critical, orange for high, blue for medium, gray for low), the task text truncated to one line, and the dollar value right-aligned in monospace `--accent`. Completed tasks: the dot becomes a checkmark, text is muted with strikethrough. Below the list: an inline text input "Add task..." that expands on tap. A "View all tasks →" link at the bottom.

**Interactions:** Tap the priority dot or a checkbox area to toggle completion (with XP animation: "+{xp} XP" floats up and fades). Tap task text to open the task detail drawer (full editing, impact analysis, subtasks). Mobile: swipe right completes, swipe left skips (triggers obstacle question).

**Tap tile header → navigates to full Tasks page.**

**Empty state:** "No tasks yet. Add your first task, or let AI suggest tasks based on your goals." with [+ Add a task] and [Let AI suggest tasks] buttons.

### 9.9 TILE 6: Prayer Tracker

**Size:** Medium (4 columns). **Shown:** Only if user enabled prayer tracking. **Data source:** `todayHealth.prayers`, user's location for times.

**Visual description:** This tile has a distinct warm feel. Background is standard `--bg-elevated` with a very subtle warm border treatment: border color `rgba(255,214,10,0.12)` (the `--spiritual` color at 12% opacity). Header "Salah" (or faith-appropriate label) with "{done}/5" count.

Five prayer mini-buttons arranged horizontally in a row, evenly spaced. Each button is approximately 56px wide by 64px tall. Each shows: the prayer name in 13px w600 centered, the time in 11px monospace `--text-tertiary` below. Default state: standard card background. Completed state: `rgba(255,214,10,0.08)` background with `rgba(255,214,10,0.25)` border and a "✓" above the name.

Below the prayer buttons: a streak line — "🔥 {n}-day streak" if active, or just the count without emoji if broken. Below that: a motivational quote in 11px italic `--text-tertiary`, rotated daily from a curated faith-appropriate list.

**Tap a prayer button:** The background fills with a warm wash animation (radial, 250ms ease). The checkmark fades in. The streak counter updates. The score ring and execution score update. If all 5 are complete: a gentle golden shimmer cascades across the tile and a toast appears: "Every prayer completed today." Tapping a completed prayer again: confirmation prompt "Remove this prayer log?" — then undoes.

**Tap tile → Prayer Detail Drawer.** Five large prayer buttons (each ~80px tall, full width), showing prayer name (16px w600), time window (e.g., "Fajr: 5:47 AM – 7:15 AM"), and a [Mark as prayed] button. 30-day calendar heatmap: 6 rows × 5 columns of cells, gold intensity by count (5/5 = bright, 3–4 = medium, 1–2 = dim, 0 = dark gray, today highlighted with border, tappable for tooltip). Streak stats: current, best ever, last miss date. AI correlation (after 7+ days): "On days you pray all 5: score averages {x}%. On days you miss: {y}%." Weekly stat and monthly trend chart.

**Multi-faith adaptation:** Christianity → "Daily devotional" or "Church attendance." Buddhism → "Meditation sessions." Judaism → "Shabbat + daily prayer." Spiritual → customizable practice. Same structure (buttons, heatmap, streaks, correlations), different labels and colors.

**Empty state:** N/A — this tile only appears if prayer tracking is enabled.

### 9.10 TILE 7: Habits

**Size:** Wide (6 columns). **Data source:** `streaks`, `todayHealth`, custom habit entries.

**Visual description:** Header "Habits" with "{done}/{total} today" count. A grid of habit mini-cards, each approximately 70px square. Each card shows: an emoji at the top (💪 for gym, 🍎 for diet, 😴 for sleep, etc.), an abbreviated name in 11px below, and the streak count at the bottom with 🔥 if the streak is active. Completed habits: subtle `--accent-bg` fill and a small checkmark overlay. Not completed: standard dark card, tappable. Private habits are never shown on this tile.

**Tap any mini-card:** Toggles today's completion for that habit.

**Tap tile → Habits Detail Drawer.** Full list of all habits, including a collapsible "Private" section at the bottom. Each habit row expands to show: today's toggle, a logging form specific to the type (gym: type dropdown, duration slider 15–120 min, notes textarea; diet: meal description, quality rating with three colored dots — green Clean, yellow Okay, red Junk; sleep: bed time picker, wake time picker, hours auto-calculated; screen time: hours slider 0–12, category chips — social media/YouTube/games/productive; water: glasses count stepper; custom: configurable boolean/number/text/rating). Below the form: streak stats (current, best, heatmap), AI correlation (after 7+ days: "On gym days, task completion is {x}% higher"), and a 30-day trend chart. At the bottom of the drawer: [+ Add custom habit] button (form: name, emoji, logging type, private toggle) and [Edit habits] link (reorder, show/hide, delete).

**Empty state:** "No habits tracked yet. Set up habits in onboarding or add custom ones here." with [Add habit] button.

### 9.11 TILE 8: Schedule Timeline

**Size:** Full (12 columns). **Data source:** `todaySchedule` array of `ScheduleBlock` objects.

**Visual description:** Header "Today's schedule" in Footnote. Below: a horizontal bar spanning the full tile width, 56px tall, `--bg-secondary` background, 8px border-radius. Schedule blocks are positioned absolutely within this bar based on their start time and duration, proportionally scaled to the visible time range (earliest block start to latest block end). Each block is colored by type: prayer `--spiritual`, work `--accent`, health `--positive`, personal `--info`, meal `--warning`. Completed blocks are at 40% opacity. Block labels (truncated to fit) appear centered inside blocks wider than 5% of the bar. A red vertical line (2px wide, full bar height) indicates the current time, updated every minute. Time labels appear below the bar: 6AM, 9AM, 12PM, 3PM, 6PM, 9PM, 12AM.

**Tap tile → Schedule Detail Drawer.** Full list of today's blocks, each showing: time (monospace, 12px), title (13px w500), duration and type (Caption), colored left border matching block type. Completed blocks have strikethrough text. Links: [Edit schedule →] navigates to full Schedule page, [+ Add block] opens inline form.

**Empty state:** "No schedule blocks yet." with [Plan your day →] link to Schedule page.

### 9.12 TILE 9: AI Insights

**Size:** Medium (4 columns). **Data source:** AI-generated proactive messages stored in the inbox.

**Visual description:** Header "AI Insights" with a badge showing the count of unread messages (blue circle with white number). The tile body shows a preview of the most recent unread AI insight: the message text truncated to 2 lines in Body (17px), with the priority level indicated by a small colored dot (red/orange/blue) at the top-left of the message area. If all messages are read, shows the most recent one dimmed.

**Tap → AI Inbox page.** Full list of all proactive messages, sorted by priority (critical first, then important, then informational). Each message card shows: priority dot, message text, timestamp, and action buttons specific to the message type (e.g., [Ask AI] [Create Task] [View Details] [Dismiss]).

**Empty state:** "No AI insights yet. As I learn your patterns, I'll surface recommendations here."

### 9.13 TILE 10: Cost of Inaction

**Size:** Medium (4 columns). **Data source:** Computed from incomplete high-priority tasks and their dollar values.

**Visual description:** Header "Cost of inaction" in Footnote. The main element is a large number in 28px w700 monospace `--negative` (red) that ticks upward in real-time, updating every second. This represents the estimated revenue being left on the table right now based on uncompleted high-value tasks. Below: a breakdown showing the top 2–3 uncompleted tasks contributing to this cost, each with task name (truncated) and hourly rate in Caption.

The real-time ticking effect: the number increments by (total daily task value / 86400) every second, creating an urgency effect — the user watches money slip away.

**Tap → Cost Detail Drawer.** Full breakdown of all incomplete tasks with their estimated values, sorted by value descending. Each shows: task text, estimated daily value, days pending, cumulative cost. Total at the bottom. [Start top task →] button.

**Empty state:** "No pending tasks to calculate. You're all caught up!"

### 9.14 TILE 11: Life Expectancy Counter

**Size:** Small (3 columns). **Data source:** `user.userAge`, actuarial tables, health behavior adjustments.

**Visual description:** Header "Time remaining" in Footnote. Three numbers stacked: years, months, days — each in 22px w700 monospace `--text-primary` with their labels in Caption below. The days counter decrements in real-time (updates every second). The purpose is perspective and motivation, not morbidity.

**Tap → Life Detail Drawer.** Shows how health behaviors are affecting the projection: "Based on your age ({age}) and health behaviors:" followed by adjustments — "+{x} years from regular exercise" in `--positive`, "-{x} years from {negative habit}" in `--negative`. Net projection compared to actuarial average. A motivational framing: "You have approximately {hours} working hours left. Make each one count."

**Empty state:** Shows based on age alone until health data accumulates.

### 9.15 TILE 12: Net Worth

**Size:** Medium (4 columns). **Data source:** `assets` values minus `debts` balances.

**Visual description:** Header "Net worth" in Footnote. The net worth figure in 28px w700 monospace, `--positive` if positive or `--negative` if negative. A small trend indicator: up arrow + percentage if increasing, down if decreasing, compared to last month.

**Tap → Net Worth page** (full page, not drawer). Shows: assets versus liabilities breakdown in a stacked layout, each item editable. A Recharts LineChart showing projected net worth at current trajectory versus "optimized trajectory" (if the user follows AI recommendations). An interactive section: "What would it take to reach ${target} by age {age}?" with an input for the target and a slider for age, auto-calculating the required monthly savings rate or income increase.

**Empty state:** "Add your assets and debts in onboarding to track net worth."

### 9.16 TILE 13: Streak Board

**Size:** Medium (4 columns). **Data source:** `streaks` array.

**Visual description:** Header "Streaks" in Footnote. A compact list of the top active streaks (up to 5), each row showing: habit name in 13px, streak count in monospace w700 `--accent`, and 🔥 emoji if the streak is 3+ days. The longest active streak is highlighted with a subtle `--accent-bg` background row. If no streaks are active, shows the most recent broken streak with an encouraging message.

**Tap → Streaks Detail Drawer.** Full list of all tracked habits with their streak data: current streak, longest streak ever, last completed date, 30-day calendar heatmap. Tapping any habit navigates to that habit's detail in the Habits drawer.

**Empty state:** "Complete a habit for the first time to start your first streak."

### 9.17 TILE 14: Business Overview

**Size:** Wide (6 columns). **Data source:** `businesses` array.

**Visual description:** Header "Businesses" with a count badge. Contains a vertical stack of mini-cards, one per business. Each mini-card shows: a color dot (the business's chosen color), business name in Headline (17px w600), monthly revenue in monospace `--positive` (or `--text-tertiary` if $0), and a health indicator — a small pulsing dot that is green (`--positive`) for strong health, yellow (`--warning`) for weak, or red (`--negative`) for flatline. Health is calculated by `getBusinessHealth()` based on task activity in the last 7 days (see Section 16.3). Each mini-card is tappable — navigates to that business's detail page.

**Tap tile header → navigates to full Empire page** showing all businesses expanded.

**Empty state:** "No businesses added yet. Complete onboarding to add your first business."

### 9.18 Dashboard Customization

Long-press any tile (mobile) or click [Customize] (desktop) → edit mode. Each tile shows: drag handle (6 dots, top center), resize handle (bottom right, diagonal lines), remove X (top right — removes with scale-down animation, 5-second undo toast). Tile Library panel slides up from bottom showing all available tiles with on/off status. Tap to add, drag to place, "Done" to save.

Layout persisted in Zustand: `{ tiles: [{ tileId, gridColumn, order, visible }], lastModified }`.

**Default layout:** Row 1: Morning Briefing (12 cols, morning only). Row 2: Next Action (12 cols). Row 3: Net Income (3) + Execution (3) + Prayer (3) + Tasks Done (3). Row 4: Schedule (12). Row 5: Business Overview (6) + AI Insights (3) + Cost of Inaction (3). Row 6: Habits (6) + Streaks (3) + Life Counter (3). Tiles for disabled features are in the library, not placed.

### 9.19 Time-of-Day Transitions

Layout never changes. Content inside tiles adapts. Morning (<12): Next Action shows hero task, Score Ring shows "beat yesterday," prayers highlight upcoming. Afternoon (12–18): Next Action shows remaining list, Score Ring shows real-time comparison. Evening (>20): Next Action shows summary + voice review, Score Ring shows final. Content fades out 200ms, in 300ms. No layout shifts.

### 9.20 Floating Elements

**Voice FAB:** Fixed bottom 88px right 24px. 56px circle, solid `--accent` (no gradient), white mic icon, z-index 100. States: idle (mic), recording (pulsing ring + waveform + transcription text), processing (spinner).

**Quick Add FAB:** Above voice (bottom 152px). 44px circle, `rgba(255,255,255,0.08)`, plus icon. Tap → radial menu: [Task] [Idea] [Log] [Voice].

### 9.21 Morning Briefing Card

First tile before noon. `--accent-bg` background blended with `--bg-elevated`. AI-generated predictions from behavioral patterns: prayer-productivity correlation, energy peak time, scrolling risk if gym skipped. "To beat the prediction:" with 3 specific actions. Yesterday's score. [Challenge accepted →] button.

---

## 10. TASK MANAGEMENT

### 10.1 Data Model

```typescript
interface Task {
  id: string;
  businessId: string;
  projectId?: string;
  text: string;
  tag: string;
  priority: 'crit' | 'high' | 'med' | 'low';
  done: boolean;
  dueDate?: string;
  xpValue: number;           // crit=25, high=15, med=10, low=5
  dollarValue?: number;      // AI-estimated
  dollarReasoning?: string;
  drip?: 'double_down' | 'replace' | 'design' | 'eliminate';
  subtasks?: Array<{ text: string; done: boolean }>;
  recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; nextDue: string };
  delegatedTo?: string;
  skipReason?: string;
  skipCount: number;
  aiSuggested: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}
```

### 10.2 Priority Scoring

Composite score 0–100: base (crit=90, high=70, med=50, low=20) + revenue bonus (business >$10K=+10, >$0=+5) + drip bonus (double_down=+15, replace=+5) + age bonus (min(10, floor(daysSinceCreation))). Capped at 100. Highest incomplete task = "The One Thing."

### 10.3 Input Parsing

Prefixes: `!crit`/`!critical` → critical, `!high` → high, `!low` → low, `#tag` → sets tag. Default: medium. After parsing, AI auto-assigns: business (keyword matching), dollar value (with reasoning). User can adjust before confirming.

### 10.4 Skip Tracking

Swipe left (mobile) or Skip button → "What's preventing you?" → chips: [Not a priority] [Don't know how to start] [Blocked by: ___] [Don't want to]. Logged. 3+ skips triggers escalation protocol.

### 10.5 Tasks Page

Segmented control: [List] [Board]. Filter bar (business, priority, tag, status). Sort options (priority score, due date, dollar value, created date). Full CRUD. Bulk actions. Inline add form. [Let AI suggest tasks] button. Board view: To Do / In Progress / Done columns, draggable cards.

Empty state: "No tasks yet. Add your first task, or let AI suggest tasks based on your goals." [+ Add a task] [Let AI suggest tasks].

---

## 11. PROJECTS & GOALS

### 11.1 Hierarchy

Vision → Goals → Projects → Tasks. Each level feeds upward.

### 11.2 Projects

Container for related tasks toward a specific outcome. ICE scoring: Impact (1–10), Confidence (1–10), Ease (1–10). Score = I×C×E (max 1000). AI suggests ratings with reasoning. Projects ranked by ICE. Statuses: not_started, in_progress, blocked, complete, abandoned. Progress auto-calculated from task completion percentage.

WIP limit: recommend max 3 active. Starting 4th triggers AI message showing current projects, completion rate, and recommendation. User can override — AI logs it and may reference later.

### 11.3 Goals (12-Week Year)

Target metric, target value, current value, start date, target date (12 weeks from start). Weekly scorecard: every Sunday AI generates — tasks committed vs completed, execution rate, AI grade (A–F), specific feedback, next-week recommendations. Goal missed: AI generates analysis of why, offers extend/adjust/archive/ask AI.

### 11.4 90-Day Roadmap

Gantt-style timeline. Horizontal bars for projects, color-coded by business. Red vertical line for today. Auto-adjusts projected end dates based on actual task completion velocity.

### 11.5 Scenario Simulator

Interactive P&L simulator with sliders for variables (new clients, price changes, expense cuts, team additions). Real-time projected impact on net income. Ranges derived from user's actual data. Scenarios saveable and comparable.

---

## 12. FINANCIAL MANAGEMENT

### 12.1 Financial Command Page — Complete Layout

The Financials page is the user's complete money picture in one scrollable view with eight sections.

**Section 1: Net Take-Home (hero).** The page opens with the user's net take-home income as the dominant element. The number is displayed in 48px w700 monospace, colored `--positive` if positive or `--negative` if negative. Below: "Target: ${user.incomeTarget}" and "Gap: ${calculated}" with a progress bar showing percentage toward target. A Recharts AreaChart (240px tall) shows the last 12 months of net income as an area with `--accent` fill gradient, and the income target as a horizontal dashed line in `--text-tertiary`. All values are calculated from actual business revenue minus actual expenses. Tapping the hero number opens a drawer with full monthly breakdown. Empty state: "Start tracking revenue and expenses to see your take-home."

**Section 2: Revenue by Business.** A horizontal bar chart (Recharts BarChart) where each bar represents a business, colored by that business's chosen color. Bars show net revenue (after deductions like ad spend, splits, and processing fees — not gross). Bars are sized proportionally. Below the chart: "Total gross: ${sum}, Fees/splits: ${sum}, Net: ${sum}" in monospace. Each bar is tappable → navigates to that business's financial detail. Below: [+ Log revenue manually] button. If Stripe connected: "Auto-syncing from Stripe ✅" in `--positive` Caption. If Plaid connected: "Auto-syncing from bank ✅".

**Section 3: Expenses.** A list of expense categories from onboarding. Each row shows: category name (Footnote), amount in monospace, optional AI-generated flag in `--warning` ("⚠ above average for your income level" or "⚠ {x}% of gross"), and an [Edit] button (tapping makes the amount field inline-editable, saves on blur). Below: [+ Add expense] button. If Plaid connected: "Last 30 days auto-categorized from bank transactions" with [Review categories →] and [Correct a category →] links. User corrections teach the AI to categorize future similar transactions correctly.

**Section 4: P&L Statement.** Auto-generated table with three columns: This Month, Last Month, Delta (Δ). Rows: Gross Revenue, Business Costs (ad spend, team, tools), Processing Fees (Stripe 3%, etc.), Net Revenue, Personal Expenses, Take-Home. Delta column colored `--positive` for improvements, `--negative` for declines. Below the table: an AI-generated plain-English insight explaining the biggest change: "Your take-home improved by ${amount} primarily due to {reason}." Each row is tappable for a detailed breakdown.

**Section 5: Client Revenue Detail.** Only shown for businesses with recurring clients. Table: client name, gross payment, ad spend, net revenue, relationship health badge. If any client exceeds 30% of total net: a concentration risk warning card with `--negative` left border: "⚠ {client.name} represents {x}% of net revenue. If they leave, you lose ${amount}/mo. Diversify." [+ Add client] button below.

**Section 6: Profit First Allocation.** Four horizontal progress bars representing buckets: Owner's Pay ({x}%), Tax ({x}%), Operating Expenses ({x}%), Profit ({x}%). Each bar is colored differently (blue, orange, gray, green). Percentages are user-configurable by tapping — a slider appears inline. AI recommends allocations based on the user's revenue level following the Profit First methodology. The calculated dollar amounts for each bucket are shown next to each bar in monospace.

**Section 7: Tax Liability Estimator.** Current quarter's estimated tax liability based on net income and a configurable tax rate (default 30%, adjustable). Shows the quarterly deadline (April 15, June 15, September 15, January 15) and days remaining. Year-to-date total estimated tax. The AI generates reminders 14 days before each deadline. Below: "This is an estimate. Consult your accountant for exact amounts."

**Section 8: Daily Spending Feed.** If Plaid is connected: a scrollable feed of recent transactions (last 30 days), each showing: merchant name, amount in monospace `--negative`, auto-assigned category (tappable to correct), and a work-hour equivalent: "= {x} hours of your time" calculated from the user's effective hourly rate (net income / estimated monthly working hours). This contextualizes every purchase. Below each transaction: a small "Correct category" link. User corrections are stored and used to train future auto-categorization.

### 12.2 Net Worth Calculation

Net worth = sum of all asset values (from onboarding Q11 and ongoing updates) minus sum of all debt balances (from onboarding Q9). Assets include: real estate (estimated market value), vehicles (estimated current value), investment accounts (stated balance), and any other assets the user entered. Debts include: all debt balances entered. The user can update any asset or debt value at any time from the Net Worth page.

### 12.3 Plaid Integration Flow

1. User taps [Connect bank via Plaid] in onboarding or Settings.
2. Plaid Link widget opens (Plaid's hosted UI). User selects their bank, authenticates, and selects accounts.
3. On success, a Plaid access token is stored in the Zustand store (future: server-side encrypted).
4. The app fetches the last 30 days of transactions via the Plaid transactions API.
5. Each transaction is auto-categorized by the AI based on: merchant name, amount, category hints from Plaid's built-in categorization, and user correction history.
6. Transactions appear in the Daily Spending Feed and are aggregated into expense categories.
7. Syncing happens on app load and can be manually triggered. Loading state: "Syncing transactions..." with a progress indicator.
8. If sync fails: toast "Bank connection lost. Reconnect in Settings." Auto-retry in 30 minutes.

### 12.4 Transaction Categorization Logic

Categories match the expense categories from onboarding: Housing, Car, Insurance, Phone, Subscriptions, Food & Dining, and any custom categories the user added. The AI assigns categories using: Plaid's built-in merchant category codes as a starting point, merchant name pattern matching (e.g., "Uber Eats" → Food & Dining), user correction history (if the user previously moved "Amazon" from "Subscriptions" to "Business Costs," future Amazon transactions auto-categorize to "Business Costs"), and amount-based heuristics (large recurring charges likely match onboarding-entered expenses).

---

## 13. HEALTH & WELLNESS SYSTEM

Daily health logging via the Health page and habit tiles. Data model: `HealthLog` (date, prayers, gym, sleep times, meal quality, energy drinks, screen time, daily score), `EnergyLog` (date, time of day, level 1–10). Energy tracking: 3× daily prompts (morning, afternoon, evening) for level 1–10. Over time, AI identifies patterns and correlates with productivity. After 7+ days: "Your energy peaks between {time} and {time}" and health-business correlations.

---

## 14. FAITH & SPIRITUAL

Covered in Tile 6 (Section 9.9) and Category 7 (Section 6.9). Prayer times calculated from user location. Warm color treatment with `--spiritual`. Streak milestones at 7/14/30/60/90 days. Broken streak shows 0 without fire — encouraging, not punishing. Multi-faith: same structure, adapted labels.

---

## 15. STREAKS & HABITS

`Streak { habit, currentStreak, longestStreak, lastCompleted }`. Increments on consecutive day completion. Breaks on missed day. Longest preserved permanently. Type-specific logging: gym (type/duration/notes), diet (description/quality), sleep (bed/wake/hours), screen time (hours/category), water (count), custom (boolean/number/text/rating). Private habits: visible only in drawer's Private section and to AI. 7-day heatmap in drawer.

---

## 16. BUSINESS MANAGEMENT

`Business { id, name, type, status, monthlyRevenue, color, notes, dayToDay, bottleneck, tools, revenueModel, teamMembers, avgJobValue, jobsPerMonth }`. Detail page: header with status badge, clients CRUD, GMB profiles (city/reviews/calls/ranking), tasks filtered to business, revenue drivers (impact 1–5, status LIVE/BUILD/TEST/PLAN/IDEA/STALE), revenue chart, notes. Health indicator: strong (2+ tasks in 7 days + revenue), weak (<2 tasks or no revenue), flatline (0 tasks in 7 days, not dormant). Ecosystem map: auto-generated network diagram of businesses and connections.

---

## 17. PIPELINE & CRM

`PipelineDeal { companyName, contactName, contactEmail, stage, dealValue, source, notes }`. Stages: lead → contacted → call_booked → proposal → signed → onboarding. Kanban board with draggable cards. Each card: company, value, days in stage. Total pipeline value at top. AI flags stale deals.

---

## 18. SCHEDULE SYSTEM

`ScheduleBlock { time, title, type, duration, completed }`. Types: prayer/work/health/personal/meal. Full builder page with draggable, resizable blocks. Color-coded by type. AI generates initial suggested schedule from onboarding data (ideal day, work hours, prayers, exercise, commitments). User can accept/modify/build from scratch.

---

## 19. IDEAL SELF ALGORITHM

### 19.1 Concept

The Ideal Self is a simulation of the user performing at their absolute best every single day, based on their onboarding answers. It represents the ceiling they measure themselves against. It is not aspirational beyond what the user said they want — it is the user's own stated ideal, turned into a measurable score.

### 19.2 Daily Score Calculation — Step by Step

The execution score is computed by the `getExecutionScore()` function using four components:

**Component 1: Commitment (max 35 points).** Calculation: if `tasksCommitted > 0`, then `(tasksDone / tasksCommitted) × 35`, else 0. `tasksCommitted` is the count of tasks that were either created today or are incomplete with priority above low. `tasksDone` is the count of tasks completed today (matching today's date in `completedAt`). This component measures follow-through on what the user committed to doing today. A user who commits to 3 tasks and completes all 3 gets 35 points. A user who commits to 10 and completes 5 gets 17.5 points.

**Component 2: Energy (max 25 points).** Broken into sub-components: gym completed today = 10 points (checked from `todayHealth.gym`), meal quality is "good" = 5 points (from `todayHealth.mealQuality`), energy drinks consumed is less than 2 = 5 points (from `todayHealth.energyDrinks`), both sleep time and wake time are logged = 5 points (from `todayHealth.sleepTime` and `todayHealth.wakeTime` being non-null). This component rewards healthy behaviors that fuel productivity.

**Component 3: Focus (max 20 points).** Calculation: `min(20, focusSessionsToday × 5)`. Each logged focus session (from `focusSessions` filtered to today) earns 5 points, up to a maximum of 4 sessions (20 points). This rewards deep work.

**Component 4: Faith (max 20 points).** Calculation: `prayerCount × 4`, where `prayerCount` is the number of true values in `todayHealth.prayers` (fajr, dhuhr, asr, maghrib, isha). Each prayer is worth 4 points, max 5 prayers = 20 points. If prayer tracking is disabled, this component is excluded and the other components are proportionally scaled to fill the 100-point maximum.

**Final score:** `min(100, commitment + energy + focus + faith)`. Rounded to nearest integer.

### 19.3 Score Zones

| Range | Label | Color Variable | Emoji |
|-------|-------|---------------|-------|
| 86–100 | Peak performance | `--positive` | ✨ |
| 71–85 | Locked in | `--positive` | 🟢 |
| 51–70 | Solid day | `--accent` | 🔵 |
| 31–50 | Getting there | `--warning` | 🟡 |
| 0–30 | Restart tomorrow | `--negative` | 🔴 |

### 19.4 Partial Credit

The system gives partial credit everywhere. Completing 3 of 5 committed tasks earns 21 of 35 commitment points. Praying 3 of 5 prayers earns 12 of 20 faith points. Going to the gym but eating poorly earns 10 of 25 energy points. This avoids all-or-nothing thinking and rewards incremental effort.

### 19.5 Adaptation Over Time

The Ideal Self score formula is fixed from the user's onboarding answers but the AI uses behavioral data to provide context: "Your average score is {x}. Your best day was {y}. On days you score above 70, your revenue-generating tasks are {z}% more likely to be completed." The AI also tracks which components the user consistently maxes out versus struggles with, and tailors recommendations accordingly.

### 19.6 Consistency Projection

After 30+ days, the AI generates: "If you had performed at today's average ({x}%) consistently since Day 1, you would have: completed {n} more tasks worth approximately ${amount}, maintained a {habit} streak of {n} days, and scored {total} more points." This reframes lost consistency as concrete opportunity cost.

---

## 20. VOICE & NLP SYSTEM

### 20.1 Technology

Web Speech API (`SpeechRecognition` interface) for speech-to-text. Available on every page via the floating voice FAB (Section 9.20). Falls back gracefully on unsupported browsers: the mic button is hidden and voice-related prompts are suppressed.

### 20.2 Voice Input Flow

1. User taps the mic FAB. The FAB transforms: background becomes `--accent` with a pulsing ring animation (expanding and fading circle, 1.5s loop). A waveform visualization (5 vertical bars oscillating at different rates) appears above the FAB. A real-time transcription text area appears above the waveform, showing words as they are recognized.

2. The user speaks naturally. The Web Speech API processes audio in real-time, updating the transcription text continuously with `interimResults: true`.

3. The user stops speaking. Auto-detection via a 2-second silence threshold, or the user taps the FAB again to stop manually.

4. The final transcribed text is parsed for intent and entities (Section 20.3).

5. If the parser identifies a known command: the action is executed immediately with a confirmation toast ("Task added: '{text}'"). If the command is ambiguous: a confirmation drawer appears showing the parsed intent and asking the user to confirm or correct.

6. If no known command is matched: the text is sent to the AI Partner chat as a regular message.

### 20.3 Voice Command Parsing — Complete List

The parser checks the transcribed text against these patterns in order. First match wins.

**Task commands:**
- "Add task {description}" or "New task {description}" or "Create task {description}" → Creates a task. AI auto-assigns business and priority. Confirmation toast.
- "Complete {task name}" or "Done with {task name}" or "Finish {task name}" → Fuzzy-matches against task list, marks as complete. If multiple matches: shows disambiguation chips.
- "What should I focus on?" or "What's my top priority?" → Routes to AI Partner with this as the prompt.

**Habit commands:**
- "Log {habit}" or "I did {habit}" or "I went to the gym" or "I prayed {prayer name}" → Fuzzy-matches against habit list or prayer names. Marks as completed. Confirmation toast.
- "Log {prayer name} prayer" or "I prayed {prayer name}" → Marks specific prayer as completed.

**Decision commands:**
- "Should I {description}?" or "Can I afford {description}?" → Routes to Decision Lab with the description pre-filled.

**Query commands:**
- "How much did I make today?" or "What's my revenue?" → Shows financial summary drawer.
- "Show me my score" or "What's my score?" → Opens score detail drawer.
- "Search for {query}" or "Find {query}" → Opens universal search with query pre-filled.

**Creation commands:**
- "Brain dump {text}" or "Idea: {text}" or "New idea {text}" → Creates an idea in the idea bank. Confirmation toast.
- "Schedule {activity} at {time}" → Creates a schedule block. If time is ambiguous, asks for clarification.
- "Note: {text}" or "Remember {text}" → Creates a knowledge vault entry.

**Navigation commands:**
- "Go to {page}" or "Open {page}" → Navigates to the named page (fuzzy-matches against page names: dashboard, tasks, projects, goals, financials, health, settings, etc.).

**Unrecognized:** Any text that does not match the above patterns is sent to the AI Partner chat as a regular message. The user sees it appear in the chat interface.

### 20.4 Error Handling for Voice

If Web Speech API is not available (browser incompatibility): the mic FAB is not rendered. Voice-related UI prompts ("Tap to speak") are hidden.

If speech recognition fails mid-session (network issue, API error): the transcription area shows "Couldn't catch that. Try again." in `--negative`. The FAB returns to idle state.

If the parsed command is ambiguous (e.g., "Complete the email task" matches multiple tasks): a small drawer appears showing the top 3 matches as tappable chips. The user taps the correct one or says "the first one" / "the second one."

If the user speaks too quietly or there is excessive background noise: the transcription shows "[inaudible]" in `--text-tertiary`. The FAB returns to idle. No action is taken.

### 20.5 Voice Review (End of Day)

Triggered from the evening state of the Next Action tile (Section 9.5). The user taps [Start voice review →]. A recording drawer opens with a prompt: "How was your day? What went well, what didn't, what will you do differently tomorrow?" The user speaks for up to 2 minutes (a countdown timer is visible). The response is transcribed, stored as a `WeeklyReflection` record (even though it's daily — the model accommodates both), and processed by the AI for pattern learning. The AI may reference these reviews in future conversations: "In your review last Wednesday, you said {x}. Have you followed through on that?"

---

## 21. NOTIFICATION SYSTEM

| Type | Default Time | Default On | Trigger |
|------|-------------|-----------|---------|
| Morning briefing | 30 min after target wake | Yes | Daily |
| Prayer reminders | 10 min before each time | Yes (if tracking) | Each prayer |
| Task nudge | 2pm | Yes | If 0 tasks done |
| Streak at risk | 9pm | Yes | If habit not logged |
| AI proactive | When triggered | Yes | Data patterns |
| Weekly report | Sunday 6pm | Yes | Weekly |
| Decision check-in | Scheduled date 10am | Yes | Per decision |
| Goal deadline | 7 days before, 10am | Yes | Per goal |
| Tax reminder | 14 days before quarterly | Yes | Quarterly |
| Commitment due | Morning of due date | Yes | Per commitment |

All individually toggleable in Settings. Quiet hours: 11pm–7am default (configurable), only critical notifications bypass. PWA push via Web Push API with permission prompt. Fallback: in-app badge on AI Insights tile.

---

## 22. REPORTING & ANALYTICS

**Weekly (Sunday):** Score overview (avg, high, low, trend), task stats, revenue summary, top achievement, biggest struggle, 3 recommendations.

**Monthly:** Aggregated weekly data, revenue trend chart, expense analysis, goal progress, habit consistency rates, AI narrative, energy analysis, commitment rate.

**Quarterly:** 12-week scorecard, financial trajectory (start vs end), decision accuracy, identity evolution, next-cycle planning.

**Annual:** Year narrative, numbers summary (revenue, net worth, tasks, points, best month/day, longest streak, decision accuracy), goals review, next-year recommendations.

Generated via Anthropic API with template + period data. Without API key: raw data in template format. On-demand custom reports via voice or text.

---

## 23. ECOSYSTEM MAP & IDEA BANK

**Ecosystem:** Auto-generated network diagram of businesses as nodes with connecting lines for shared clients, skills, resources, revenue flow. AI identifies synergies. Tappable nodes → business detail.

**Ideas:** Quick-capture via voice, text, Quick Add. Status flow: Raw → Analyzed → Promoted (becomes project) or Archived. AI analysis per idea: business model, synergy with existing businesses, resources needed, recommendation. Visual: scattered grid or cloud, sized by recency or AI-rated potential.

---

## 24. KNOWLEDGE VAULT & MENTORS

**Vault:** Books, podcasts, articles, videos, notes. Fields: title, source URL, key takeaways, "What will I DO with this?" (auto-creates task if filled), tags, status (Captured → Processing → Applied → Archived).

**Mentors:** Create by name + description + source links. AI extracts frameworks and patterns. Pre-built: The Operator, The Investor, The Builder, The Minimalist. Use via "What would {mentor} do?" in Decision Lab or AI chat.

---

## 25. LOADING STATES

Shimmer skeleton matching expected content shape. `background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite`.

Contextual: AI analysis → shimmer + "Analyzing...". Plaid sync → progress + "Syncing transactions...". Reports → typing dots. Dashboard → full skeleton grid. Task list → 5 skeleton rows. Charts → skeleton rectangle then axes first, data animated in. Tiles load independently — populated tiles render immediately while others show skeletons.

---

## 26. ERROR HANDLING

AI fail → toast: "Couldn't connect to AI. Check API key in Settings or retry." + retry button. API key invalid → inline error below field. Plaid drops → toast: "Bank connection lost. Reconnect in Settings." Auto-retry 30min. Invalid input → inline error below field in `--negative`. Network offline → persistent banner: "Offline. Changes sync on reconnect." localStorage full → toast: "Storage full. Export data in Settings."

All errors recoverable. Plain English. Toasts auto-dismiss 5s. Inline validation on blur (not keystroke). Failed API calls retry once with exponential backoff.

---

## 27. DATA DELETION

**Soft delete with 30-day recovery.** Deleting a business archives all linked records (tasks, clients, revenue, GMB, drivers) — hidden but recoverable. 5-second undo toast. After 30 days: permanent purge. Deleting a project: project archived, tasks unlinked but preserved. AI may ask: "Keep these {n} tasks or archive?" Deleting a goal: goal + scorecard archived, projects unlinked.

**Full reset:** Settings → "Reset everything" → PIN entry → type "RESET" → 5-second countdown. Clears store, restarts onboarding.

**Export:** Settings → "Export all data" → JSON download of complete store.

---

## 28. ACCESSIBILITY

Keyboard navigable with visible focus indicators (2px solid `--accent`, 2px offset). Tab order: visual layout. Alt text on all images/icons. `aria-label` on icon-only buttons. WCAG AA contrast (4.5:1 body, 3:1 large). `aria-live="polite"` on toasts, `aria-live="assertive"` on errors. `prefers-reduced-motion` disables all animations. Touch targets: 44px minimum. Semantic HTML: `<button>`, `<a>`, `<nav>`, `<main>`, `<aside>`. Roles: tablist/tab/tabpanel for segmented controls, dialog + aria-modal for drawers.

---

## 29. MULTI-TENANCY

**V1 (current):** Single-user, client-side. localStorage via Zustand persist. PIN for local security.

**V2 (future):** Supabase Auth (email/OAuth), PostgreSQL with RLS (every query filtered by user_id), server-side encrypted API keys and Plaid tokens, Stripe Subscriptions.

**Tiers (future):** Free (2 businesses, 20 AI/mo, 3 decisions/mo). Standard $49/mo (10 businesses, 200 AI, 30 decisions, Plaid, Stripe, all reports). Pro $99/mo (unlimited everything + custom reports + API).

**Migration:** Zustand store shape designed for portability. Persist middleware swappable from localStorage to Supabase adapter without changing store interface.

---

## 30. DATA MODEL REFERENCE

Complete type definitions for all entities:

```typescript
// Core types
type Priority = 'crit' | 'high' | 'med' | 'low'
type BusinessType = 'agency' | 'service' | 'app' | 'content' | 'real_estate' | 'coaching' | 'other'
type BusinessStatus = 'active_healthy' | 'active_slow' | 'active_prerevenue' | 'dormant' | 'backburner' | 'idea'
type DriverStatus = 'LIVE' | 'BUILD' | 'TEST' | 'PLAN' | 'IDEA' | 'STALE' | 'NEVER TRIED'
type DripZone = 'double_down' | 'replace' | 'design' | 'eliminate'
type ProjectStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete' | 'abandoned'

// All interfaces have id: string, createdAt: string, updatedAt?: string
// Business: name, type, status, monthlyRevenue, color, icon, notes, dayToDay, bottleneck, tools, revenueModel, roleDetail, teamMembers[], avgJobValue, jobsPerMonth
// Client: businessId, name, grossMonthly, adSpend, serviceType, meetingFrequency, relationshipHealth, startDate, active
// Task: businessId, projectId?, text, tag, priority, done, dueDate?, xpValue, dollarValue?, dollarReasoning?, drip?, subtasks?, recurring?, delegatedTo?, skipReason?, skipCount, aiSuggested, completedAt?
// HealthLog: date, prayers{fajr,dhuhr,asr,maghrib,isha}, gym, gymType?, gymDuration?, sleepTime?, wakeTime?, mealQuality?, energyDrinks, screenTimeHours, dailyScore
// EnergyLog: date, timeOfDay, level
// Streak: habit, currentStreak, longestStreak, lastCompleted?
// Project: name, description, businessId?, goalId?, impact, confidence, ease, status, progress, deadline?, outcome?
// Goal: title, targetMetric, currentValue, targetValue, unit, startDate, targetDate, status, linkedProjectIds[], cycleType, weeklyScorecard[]
// RevenueEntry: businessId, amount, date, source?, notes?
// ExpenseEntry: category, amount, date, notes?, recurring
// PipelineDeal: companyName, contactName?, contactEmail?, stage, dealValue?, source?, notes?
// DecisionEntry: decision, reasoning, expectedOutcome, actualOutcome?, reviewDate?, aiAnalysis?, aiConfidence?, optionChosen?
// AiMessage: role, content, businessContext?
// AiReport: level, content, date, grade?
// BehavioralEvent: eventType, eventData{}, timestamp, dayScoreAtTime?
// ObstacleResponse: taskId, reason, deeperReason?, aiResponse?
// Idea: text, category, promoted, archived, aiAnalysis?
// Commitment: text, source, dueDate?, fulfilled, fulfilledDate?
// KnowledgeEntry: title, source, type, takeaways, actionItem?, status?
// SkillLevel: category, skill, level, xp
// FocusSession: taskId?, projectId?, startedAt, endedAt?, duration, quality?, notes?, distractions
// TimeCapsule: letter, deliverDate, delivered
// WeeklyReflection: weekStart, worked, didnt, avoided, change, grateful
// ContactEntry: name, role, lastContact?, notes?
// GmbProfile: businessId, city, reviewCount, callsPerMonth, ranking, status, hasAddress
// Sprint: sprintNumber, weekStart, deliverables[{text,done}], status
// SOP: businessId, title, status, content?
// Win: title, dollarValue?, businessId?, category, notes?
// ScheduleBlock: time, title, type, duration, completed
// RevenueDriver: businessId, category, name, impact, status, notes?
// TeamMember: name, title, whatTheyDo, compensation
```

AppState also includes: authenticated, pin, onboardingComplete, userName, userLocation, userAge, userSituation, incomeTarget, targetDate, incomeWhy, exitTarget, northStarMetric, wakeUpTime, actualWakeTime, exercise, dietQuality, caffeineType/Amount, phoneScreenTime, energyLevel, stressLevel, hasFaith, faithTradition, trackPrayers, faithConsistency, faithRoleModel, procrastination, patterns, biggestDistraction, tryingToQuit, lockedInMemory, aiAvoidanceStyle, aiPushStyle, aiMotivators[], savingsRange, anthropicKey, idealDay, whatNeedsToBeTrue, aiFrequency, aiReasoningDisplay, factorHealthInBusiness, smokingStatus, habitsToBuild[], faithDashboardVisibility, calendarConnected, plaidConnected, exitIntent, trackingPrefs{}, theme, sidebarOpen.

---

## 31. BUILD PHASES

**Phase 1 — Foundation:** Next.js setup, onboarding (all 13 categories), PIN lock, dashboard with core tiles, task management, voice input, settings, PWA, Apple HIG design system.

**Phase 2 — Intelligence:** AI Partner chat + system prompt, AI inbox, dollar value engine, Decision Lab, spending calculator, commitments, Ideal Self scoring, escalation protocol.

**Phase 3 — Strategic:** Projects with ICE, 12-Week Year goals, 90-day roadmap, scenario simulator, Plaid, Stripe, financial command center.

**Phase 4 — Depth:** Health/habits with correlations, prayer tracker, energy tracking, ecosystem map, idea bank, knowledge vault, mentors, reports (weekly/monthly/quarterly/annual), life counter, dashboard customization, push notifications, decision journal, time capsule, final polish.

---

## 32. COMPLETE FEATURE LIST (90 features)

1. Conversational AI onboarding (13 categories)
2. PIN security
3. Customizable bento dashboard (drag/resize/add/remove)
4. Daily Score Ring
5. Next Action card (4 states + absence)
6. Live money ticker
7. Money tracker tile
8. Business overview with health pulses
9. Tasks preview tile
10. Prayer tracker (multi-faith)
11. Habits grid with streaks
12. Schedule timeline
13. AI insights inbox
14. Cost of inaction (real-time)
15. Life expectancy counter
16. Net worth tile
17. Streak board
18. Morning briefing predictions
19. Morning/evening transitions
20. Voice input (every page)
21. Quick add FAB
22. Universal search (Cmd+K)
23. Task CRUD with priority scoring
24. Task dollar values (AI-estimated)
25. Task impact analysis
26. Subtasks
27. Recurring tasks
28. Task delegation
29. Skip tracking + obstacle diagnosis
30. AI-suggested tasks
31. Swipe gestures (mobile)
32. Board/Kanban view
33. Projects with ICE scoring
34. WIP limit recommendations
35. 12-Week Year goals
36. Weekly scorecard + AI grading
37. 90-day roadmap (Gantt)
38. Adaptive roadmap
39. Consistency projection
40. AI Decision Impact Engine
41. Decision clarifying questions
42. Multi-option comparison
43. Best/worst/likely scenarios
44. Spending calculator
45. Decision journal + outcomes
46. Decision accuracy scoring
47. Mentor personas
48. AI Partner chat
49. AI escalation protocol
50. AI proactive inbox
51. Commitment tracking
52. AI conversation memory
53. Copy Context mode
54. Financial command center
55. Revenue by business
56. Client concentration risk
57. Expense tracking (manual + Plaid)
58. Net worth projections
59. Profit First buckets
60. Tax estimator + reminders
61. Daily spending feed (work-hour equiv)
62. Plaid integration
63. Stripe integration
64. Health page (foundation score)
65. Sleep tracking
66. Energy tracking (3×/day)
67. Meal/diet logging
68. Private habits
69. Habit heatmap
70. Ecosystem map
71. Cross-business synergies
72. Idea bank (brain dump)
73. Idea AI analysis
74. Knowledge vault
75. Weekly report
76. Monthly report
77. Quarterly report
78. Annual report
79. Custom on-demand reports
80. Decision journal
81. Continuous learning (app keeps asking)
82. Feature tutorials
83. Push notifications
84. Dark/light mode
85. Responsive (desktop + tablet + mobile)
86. PWA
87. Settings page
88. Scenario simulator
89. Time capsule
90. Voice reviews (end of day)

---

## END OF SPECIFICATION

This document is the single source of truth for building ART OS. When in doubt:

1. Section 3 (Design System) overrides all visual decisions everywhere
2. Section 7 (AI Decision Impact Engine) is the make-or-break feature
3. Rule 1 (Zero Hardcoded Data) is non-negotiable
4. Every interaction opens a drawer or navigates — nothing is display-only
5. The app should feel like Apple built it, with an AI that genuinely knows the user

ART OS is not a dashboard. It is not a to-do list. It is an operating system that thinks.

---
---

## ADDENDUM: GAP RESOLUTIONS (31 items)

All 31 gaps identified during the specification audit are resolved below. These specifications carry the same authority as the main document. When building, treat these as if they were always part of the original spec.

---

### GAP 1: PIN Lock Screen

**Visual description:** Full-screen overlay, `--bg-primary` background with the warm gradient. Centered vertically: the ART OS logo (or app name in Title Large), followed by "Enter your PIN" in Subheadline `--text-secondary`, followed by a row of 4–6 circular dots (depending on the user's PIN length). Each dot is 16px diameter, `--border` fill when empty, `--accent` fill when a digit is entered. Below the dots: a numeric keypad grid (3 columns × 4 rows: 1–9, blank, 0, backspace icon). Each key is a 72px circle with `--bg-elevated` background, the digit in Title Small (22px w700), min touch target 72px. Tap feedback: scale(0.95) for 0.1s with `--bg-secondary` background flash.

**Wrong entry behavior:** On incorrect PIN, all dots flash `--negative` (red) for 300ms, then clear. A shake animation plays on the dot row (translateX -8px → 8px → -4px → 4px → 0, 400ms). After 3 consecutive wrong attempts: a 30-second lockout with a countdown timer displayed in Footnote `--text-tertiary` replacing the keypad: "Too many attempts. Try again in {seconds}s." After 5 wrong attempts: 5-minute lockout. After 10: 30-minute lockout. Wrong attempt count resets on successful entry.

**PIN storage:** The PIN is stored as a SHA-256 hash in the Zustand store, not plaintext. On entry, the input is hashed and compared to the stored hash. The raw PIN is never persisted.

**Recovery:** There is no recovery mechanism in V1 (single-user, client-side). If the user forgets their PIN, they must clear the browser's localStorage for the app domain, which resets all data and restarts onboarding. The Settings page shows a warning: "If you forget your PIN, your only option is to reset all data. Write it down somewhere safe." In V2 (Supabase), recovery via email/OAuth will bypass the PIN entirely since authentication is server-side.

**When shown:** On every app launch (page load) if `authenticated` is false in the store. After successful PIN entry, `authenticated` is set to true for the session. On page refresh or new tab, the user must re-enter. There is no "remember me" option — the PIN is the security layer.

---

### GAP 2: Required vs Optional Onboarding Fields

Every field is classified below. "Continue →" is disabled until all required fields in the current screen are filled.

**Category 1 (Identity):** Q1 name — REQUIRED. Q2 location — REQUIRED. Q3 age — REQUIRED. Q4 self-description — OPTIONAL (but AI warns: "This helps me understand you. Skip if you want, but I'll be less useful.").

**Category 2 (Businesses):** Q1 business count — REQUIRED (minimum 1). Per business: Q2 name — REQUIRED. Q3 type — REQUIRED. Q4 status — REQUIRED. Q5 revenue — REQUIRED (can be $0). Q6 day-to-day — OPTIONAL. Q7 role — REQUIRED. Q8 team — REQUIRED (yes/no; if yes, at least one member name). Q9 tools — OPTIONAL. Q10 payment method — OPTIONAL. Q11 recurring clients — REQUIRED (yes/no; if yes, at least one client name and payment). Q12 bottleneck — OPTIONAL. Q13 color — REQUIRED (defaults to first preset if skipped).

**Category 3 (Finances):** Q1 Plaid — REQUIRED (must select one of the three options). Q2 housing — REQUIRED (can select rent-free). Q3–Q8 expenses — each OPTIONAL (default $0). Q9 debts — OPTIONAL. Q10 savings — REQUIRED. Q11 assets — OPTIONAL.

**Category 4 (Goals):** Q1 income target — REQUIRED. Q2 target date — REQUIRED. Q3 why — OPTIONAL. Q4 north star — OPTIONAL. Q5 exit intent — REQUIRED (must pick yes/maybe/no). Q6 ideal day — OPTIONAL (but AI warns about reduced Ideal Self accuracy).

**Category 5 (Health):** Q1 target wake — REQUIRED. Q2 actual wake — REQUIRED. Q3–Q9 health questions — all OPTIONAL. Q10 habits to build — OPTIONAL (minimum 0). Q11 trying to quit — OPTIONAL.

**Category 6 (Schedule):** Q1 work start — REQUIRED. Q2 work end — REQUIRED. Q3–Q5 — all OPTIONAL.

**Category 7 (Faith):** Q1 faith role — REQUIRED (must pick one, including "prefer not to say"). All sub-questions — OPTIONAL.

**Category 8 (Struggles):** All 6 questions — OPTIONAL. The entire category is skippable via "Skip this section →".

**Category 9 (AI Preferences):** Q1 communication style — REQUIRED (defaults to "Mix" if skipped). Q2–Q5 — OPTIONAL (sensible defaults: motivators = empty array, frequency = "Once daily", reasoning = "Show everything", health factor = true).

**Category 10 (Connections):** All OPTIONAL (all skippable).

**Category 11 (Security):** PIN — REQUIRED. Confirmation match — REQUIRED.

---

### GAP 3: Onboarding Business Loop Transition

When the user completes all 13 questions for one business, an interstitial screen appears:

AI bubble: "Got it. {business.name} is mapped." The live preview highlights the newly added business card with a brief pulse animation.

If the user said they have more businesses remaining, the screen shows two buttons: [Next business →] (primary) which resets the business form for business #{n+1}, and [Actually, I'm done adding businesses] (text link) which skips remaining businesses and moves to the next category. The AI adjusts: "No problem. We can always add more later from Settings."

If the user has entered the last business (count matches what they said in Q1), the AI bubble says: "Here's your empire: {count} businesses, ${total}/mo total revenue. Let me set up your dashboard." Then the [Continue →] button advances to Category 3.

The user can also change their business count. If they originally said 5 but want to stop at 3: tapping "Actually, I'm done" updates the stored `businessCount` to 3. If they want to add more than originally stated: after the last expected business, the screen offers [+ Add another business] alongside [Continue to finances →].

---

### GAP 5: AI Without API Key — Proactive Message Fallback

When no Anthropic API key is configured, proactive messages are generated using **local template logic** — not AI. The app evaluates triggers using the same conditions (revenue concentration > 40%, business flatline, stale tasks, etc.) but instead of calling the AI to generate natural-language messages, it uses pre-written template strings with `{variable}` interpolation.

Template examples:

- Concentration risk: "⚠ {client.name} is {percentage}% of your revenue from {business.name}. Consider diversifying."
- Business flatline: "🔴 {business.name} has had no activity in {days} days."
- Stale tasks: "You have {count} tasks older than 7 days."
- Score declining: "Your score has dropped for {count} consecutive days."

These template messages are less personalized than AI-generated ones — they state the data but don't provide nuanced recommendations. Each template message includes a note: "Connect your AI key in Settings for personalized recommendations." The UI and inbox structure are identical whether messages come from templates or AI.

Additionally, the Decision Lab, Spending Calculator, and all AI chat features show: "AI features require an Anthropic API key. [Add key in Settings] or [Copy Context to use with Claude.ai]."

---

### GAP 6: Proactive Message Generation Timing

Proactive messages are evaluated using a **lazy evaluation on app load** strategy, not a background timer.

**On every app load** (when the dashboard mounts), the app runs a `generateProactiveMessages()` function that:

1. Checks the last evaluation timestamp stored in the Zustand store (`lastProactiveCheck: string`).
2. If less than 4 hours have passed since the last check, skips evaluation (prevents duplicate messages on frequent page refreshes).
3. If 4+ hours have passed, evaluates all trigger conditions against current store data.
4. For each trigger that fires, checks if a message for that trigger already exists in the inbox within the last 24 hours (deduplication — prevents "stale tasks" appearing every time the app opens).
5. New messages are added to the `proactiveMessages` array in the store with `read: false`.
6. Updates `lastProactiveCheck` to now.

**On specific state changes** (in addition to app load), certain high-priority triggers are evaluated immediately:

- When a task is completed → check if all critical tasks are done → generate congratulatory message if so.
- When a commitment due date arrives (checked against current date) → generate reminder.
- When the user hasn't opened the app in 2+ days → generate re-engagement message on next load.

**Frequency cap:** Maximum 5 new proactive messages per day. If 5 have already been generated today, no more are added regardless of triggers. This prevents inbox spam.

If an API key exists, each message is generated via an API call with the trigger data as context, allowing natural-language recommendations. Without an API key, template strings are used (Gap 5).

---

### GAP 10: DRIP Categories

DRIP is a strategic framework for categorizing revenue drivers and tasks by their strategic role. The four zones:

| Zone | Meaning | Color | Priority Bonus |
|------|---------|-------|---------------|
| `double_down` | This is working. Do more of it. Scale it. | `--positive` | +15 |
| `replace` | This works but has diminishing returns or is unsustainable. Find a replacement while it still runs. | `--warning` | +5 |
| `design` | This is a new initiative being designed/built. Not yet producing results. | `--accent` | +0 |
| `eliminate` | This is not working. Stop doing it. Cut it. | `--negative` | +0 |

**Assignment:** DRIP zones are assigned in two places:

1. **Revenue Drivers page:** Each revenue driver (e.g., "Cold email outreach," "Google Ads," "Referrals") has a DRIP zone selector — four tappable chips on the driver's detail card. The user selects the zone based on their judgment. AI can suggest zones based on performance data: "Your cold email outreach has generated {n} clients in the last 90 days. I'd tag this as 'double_down.'"

2. **Tasks:** When a task is linked to a revenue driver (via the business it belongs to), it inherits that driver's DRIP zone. Tasks can also be manually tagged with a DRIP zone via the task detail drawer — a dropdown with the four options plus "None."

**UI in Task Detail Drawer:** Below the priority selector, a "Strategic zone" dropdown with four options styled with their respective colors. When set, a small colored DRIP badge appears on the task in list views (e.g., a green "DD" badge for double_down, an orange "R" for replace).

**Impact on AI:** The AI factors DRIP zones into task prioritization and recommendations: "You have 3 tasks tagged 'double_down' that aren't done. These are your highest-leverage activities — focus here first."

---

### GAP 11: XP and Level System

**XP sources:** Tasks completed (crit = 25 XP, high = 15, med = 10, low = 5). No other XP sources — XP is earned exclusively through task completion.

**Level thresholds:** Level up occurs every 100 XP. Formula: when `xp >= 100`, the user levels up: `level += 1`, `xp -= 100` (remainder carries over). This means Level 1 requires 100 XP, Level 2 requires another 100, and so on. There is no max level.

**Level-up feedback:** When a level-up occurs (triggered in the `addXp` action in the store): a toast notification appears: "Level {newLevel}! Keep building." The XP bar on the dashboard briefly flashes `--accent` with a pulse animation. No confetti, no fanfare — Apple-style restraint.

**Display:** XP and level are shown in two places:

1. **Sidebar footer** (desktop): "Level {level}" in Footnote with a thin 2px progress bar below showing XP toward next level (`xp / 100`), colored `--accent`.

2. **AI context snapshot:** The system prompt includes "Level {level} | {xp} XP" so the AI can reference it: "You're Level 12 — you've completed over 1,200 tasks since starting."

XP and levels are intentionally low-key. They provide a subtle gamification layer without becoming the focus. No badges, no achievements, no leaderboards.

---

### GAP 12: Ideal Self Formula When Prayer Disabled

When prayer tracking is disabled (`user.trackPrayers === false`), the faith component (20 points) is removed and the remaining three components are scaled proportionally to fill the 100-point maximum.

**Scaled formula:**

```
Total available without faith = 35 + 25 + 20 = 80
Scale factor = 100 / 80 = 1.25

Commitment (max 43.75): (tasksDone / tasksCommitted) × 43.75
Energy (max 31.25):
  gym = 12.5, mealGood = 6.25, lowCaffeine = 6.25, sleepLogged = 6.25
Focus (max 25): min(25, focusSessions × 6.25)

Final score: min(100, round(commitment + energy + focus))
```

**Implementation note:** The `getExecutionScore()` function should accept a `prayerEnabled: boolean` parameter. If false, multiply each non-faith component's max by 1.25 before calculating. The zone thresholds (Section 19.3) remain the same regardless of whether prayer is enabled — 86+ is always "Peak performance."

---

### GAP 13: How AI Categorizes Tasks for Dollar Value

The AI uses a **keyword-and-context classification** approach. When a task is created, the AI evaluates the task text plus its linked business context to assign a category:

**Direct revenue** — detected by keywords: "invoice," "bill," "collect," "close deal," "sign contract," "onboard client," "charge," or if the task text contains a client name from the user's client list.

**Revenue-generating activity** — detected by keywords: "outreach," "cold email," "content," "post," "ad," "campaign," "pitch," "prospect," "follow up," "networking," "marketing," "SEO," or if the linked business has `revenueModel` containing "lead gen," "inbound," or "outbound."

**Infrastructure** — detected by keywords: "set up," "automate," "document," "SOP," "hire," "train," "system," "workflow," "organize," "CRM," "template," or if the task tag is "setup" or "operations."

**Health-correlation** — detected if the task text matches a tracked habit name (gym, meal prep, sleep, etc.) or contains: "exercise," "workout," "gym," "meal," "cook," "sleep," "meditate."

**Fallback:** If no category is confidently matched, the AI defaults to "infrastructure" with a conservative dollar estimate based on the user's hourly rate × estimated hours. The reasoning shows: "I categorized this as an infrastructure task. If this directly generates revenue, tap to adjust the estimate."

This classification happens in the API call — the system prompt instructs Claude to categorize and estimate in a structured format. If no API key exists, dollar values are not estimated (the field remains null) and the task shows "—" where the dollar value would appear, with a note: "Connect AI to estimate task values."

---

### GAP 17: Cost of Inaction Calculation

The Cost of Inaction tile shows the estimated revenue being left on the table right now due to incomplete tasks.

**Calculation:**

1. Gather all incomplete tasks where `dollarValue` is not null and `priority` is `crit` or `high`.
2. For each task, compute its **daily value** = `task.dollarValue / 30` (assumes each task's dollar value is a monthly equivalent — e.g., a task worth $600 represents $20/day of potential revenue).
3. For each task, compute **hours elapsed today** = `(currentTime - dayStart) / 3600000` (milliseconds to hours, where dayStart is midnight today or the user's `wakeUpTime` if set).
4. Each task's **cost right now** = `dailyValue × (hoursElapsed / workingHoursPerDay)`, where `workingHoursPerDay` defaults to 10 (or is derived from the user's schedule: `workEnd - workStart`).
5. **Total cost of inaction** = sum of all tasks' cost right now.
6. The ticker increments this total by `totalDailyValue / 86400` per second (updating via `setInterval` at 1-second resolution).

**Edge cases:** Tasks without dollar values are excluded. Tasks with `low` or `med` priority are excluded (only crit and high create urgency). If all high-priority tasks are complete, the tile shows "$0" in `--positive` with "You're all caught up."

---

### GAP 19: Historical Score Storage

A daily score snapshot is saved to `healthHistory` via the following mechanism:

**Trigger:** The `saveHealthDay()` action in the Zustand store. This is called in two places:

1. **On app load:** If the current date (`YYYY-MM-DD`) differs from `todayHealth.date`, the app assumes a new day has started. It pushes the current `todayHealth` object (which contains the previous day's data) into the `healthHistory` array, then resets `todayHealth` to a fresh `HealthLog` with today's date and all fields zeroed/false.

2. **At midnight:** If the app is open at midnight, a `setInterval` check (running every 60 seconds) detects the date change and triggers the same save-and-reset.

`healthHistory` is an unbounded array of `HealthLog` objects, one per day. Each contains `dailyScore` which is the execution score at the time of snapshot. For the 7-day trend chart, the app reads the last 7 entries from `healthHistory`. For "yesterday's score," it reads `healthHistory[healthHistory.length - 1].dailyScore`.

**Data retention:** In V1, all history is kept in localStorage. If storage becomes a concern, the app can prune entries older than 365 days via a cleanup function on app load.

---

### GAP 26: Behavioral Event Taxonomy

The `logEvent(eventType, eventData)` function is called at specific moments throughout the app. Here is the complete list of events logged:

| eventType | When Logged | eventData |
|-----------|------------|-----------|
| `task_completed` | User marks a task as done | `{ taskId, xpValue, dollarValue, priority, businessId }` |
| `task_created` | User creates a new task | `{ taskId, priority, businessId, aiSuggested }` |
| `task_skipped` | User skips a task | `{ taskId, reason, skipCount }` |
| `prayer_completed` | User marks a prayer | `{ prayer: 'fajr'|'dhuhr'|..., timeOfDay }` |
| `habit_completed` | User logs a habit | `{ habit, streakCount }` |
| `focus_session_started` | User starts a focus session | `{ taskId, projectId }` |
| `focus_session_ended` | User ends a focus session | `{ duration, quality, distractions }` |
| `decision_made` | User selects an option in Decision Lab | `{ decisionId, optionChosen, aiConfidence }` |
| `challenge_accepted` | User taps "Challenge accepted" on morning briefing | `{ date }` |
| `app_opened` | App loads and user authenticates | `{ daysSinceLastOpen }` |
| `commitment_made` | A commitment is created (manually or from AI) | `{ commitmentId, source }` |
| `commitment_fulfilled` | User marks a commitment as fulfilled | `{ commitmentId, daysToFulfill }` |
| `goal_created` | User creates a new goal | `{ goalId, targetMetric, targetValue }` |
| `project_status_changed` | Project status changes | `{ projectId, oldStatus, newStatus }` |
| `score_zone_changed` | User's execution score crosses a zone boundary | `{ oldZone, newZone, score }` |
| `voice_command_used` | User uses a voice command | `{ command, parsedIntent, success }` |
| `ai_feedback` | User thumbs-up or thumbs-down an AI message | `{ messageId, rating }` |

All events include the `dayScoreAtTime` field (the user's current execution score when the event fires). Events are stored in a rolling buffer: the last 500 events are kept, older ones are dropped. The AI reads the most recent events to identify patterns: "You consistently skip tasks after 10pm" or "Your focus sessions are 40% longer on gym days."

---

### GAP 7: Focus Sessions Page

**Page location:** Execution → Focus in the sidebar, or accessible via the Quick Add FAB → [Focus].

**Page layout:** The page has two sections: an active timer at the top (when a session is running) and a history list below.

**Starting a session:** At the top of the page, a large [Start Focus Session] primary button. When tapped, a configuration drawer opens: "What are you working on?" with a dropdown of current tasks (sorted by priority), and an optional project selector. "How long?" with chip options: [25 min] [45 min] [60 min] [90 min] [Custom: ___]. [Begin →] starts the session.

**Active session view:** The [Start] button is replaced by a full-width timer card. The card shows: the task name in Headline, a large countdown timer in Title Large monospace `--accent` (e.g., "38:42"), a circular progress ring (120px) around the timer showing time elapsed, a pause button (secondary style) and a [End Session] text button. Below the timer: a distractions counter — a tappable "Distractions: {n}" label. Each tap increments the counter by 1 (for self-reporting when the user gets distracted). This is stored in the `FocusSession.distractions` field.

**Ending a session:** When the timer reaches zero or the user taps [End Session], a completion drawer slides up: "How was the session?" with a quality rating slider 1–5 (1 = "couldn't focus" to 5 = "deep flow"), optional notes textarea, and [Save Session] button. This creates a `FocusSession` record with `startedAt`, `endedAt`, `duration`, `quality`, `distractions`, `notes`, `taskId`, and `projectId`. The score immediately updates (focus sessions contribute to execution score).

**History list:** Below the active timer area, a scrollable list of past sessions. Each row shows: date and time (Footnote monospace), task name, duration ("45 min"), quality (1–5 dots), distractions count. Tappable to expand and see notes.

**Empty state:** "Focus sessions help you track deep work. Each session earns 5 execution points (up to 20/day). [Start your first session →]."

**Connection to other features:** Focus sessions contribute 5 points each to the execution score (max 20). They appear in the AI context snapshot. The AI can reference them: "You averaged 2.3 focus sessions on weekdays but 0.5 on weekends."

---

### GAP 8: Sprint Page

**Page location:** Execution → Sprint in the sidebar.

**Concept:** Sprints are one-week containers of deliverables — concrete outputs the user commits to producing that week. Unlike tasks (which are individual actions), deliverables are outcomes: "Ship the landing page," "Close 2 new clients," "Record 3 videos."

**Page layout:** The page is centered on the current active sprint. At the top: "Sprint {sprintNumber}" in Title, "Week of {weekStart}" in Subheadline. Below: a list of deliverables, each as a row with a checkbox, the deliverable text in Body, and a tappable [Done] area. Completed deliverables have strikethrough text and a checkmark. Below the list: [+ Add deliverable] inline text input. Below that: a summary bar showing "{completed}/{total} deliverables" with a progress bar.

**Creating a sprint:** If no active sprint exists, the page shows: "No active sprint. Start a new one?" with [Start Sprint] primary button. Tapping opens a form: sprint number (auto-incremented), week start date (defaults to this Monday), and a text area to enter deliverables (one per line, or individual text inputs with [+ Add another]). [Launch Sprint →] creates the sprint with status `active`.

**Completing a sprint:** When all deliverables are checked, a completion banner appears: "All deliverables done! [Complete Sprint →]." Tapping changes status to `completed` and prompts: "Start next sprint?" with [Yes] opening the creation form for Sprint {n+1} and [Not yet] dismissing.

**Sprint history:** Below the active sprint, a collapsible "Previous Sprints" section showing past sprints as cards: sprint number, date, completion rate ({done}/{total}), expandable to see deliverables.

**Empty state:** "Sprints are weekly commitments to specific outcomes. Unlike tasks, these are the results you'll deliver this week. [Start your first sprint →]."

---

### GAP 9: Roadmap Page

**Page location:** Execution → Roadmap in the sidebar.

**Layout:** A horizontal Gantt-style chart built with a custom React component (not a third-party Gantt library — use positioned `<div>` elements within a scrollable container).

**Structure:** The x-axis represents time (90 days from today, divided into weeks). Each week is a column. The y-axis lists active projects, one per row. Each project is a horizontal bar spanning from its `createdAt` (or `startDate` if set) to its `deadline`. The bar is colored by the project's business color. Bar width represents duration. A fill within the bar shows progress (e.g., a 60% complete project has the left 60% of the bar filled with higher opacity). A vertical red line with a dot marks today's position.

**Interactions:** Tapping a project bar opens that project's detail drawer. Hovering (desktop) shows a tooltip: project name, progress, days remaining, projected end date. The projected end date is calculated from task completion velocity: `remainingTasks / (tasksCompletedPerWeek)` weeks from now. If the projected end date exceeds the deadline, the bar extends past the deadline with a dashed red extension and a warning icon.

**Unlinked items:** Goals without projects appear as milestone markers (diamond shapes) at their target date. Projects without deadlines appear as open-ended bars with a dashed right edge.

**Controls:** Above the chart: [90 days] [6 months] [12 months] toggle to change the time range. [+ New Project] button. A filter dropdown for business (to show only projects from a specific business or all).

**Empty state:** "No active projects to show. Create a project to start building your roadmap." [+ New Project] button.

---

### GAP 16: Commitments Page

**Page location:** Command Center → AI Partner sidebar, or accessible as a standalone page via the sidebar.

**Concept:** Commitments are promises the user makes — to the AI, to themselves, or explicitly in the app. They are tracked for follow-through rate.

**Creation:** Commitments are created in three ways:

1. **AI-extracted:** When the user says "I'll do X" or "I commit to X" in AI chat, the AI auto-creates a commitment with `source: 'ai_chat'`. The AI confirms: "I'm logging that as a commitment: '{text}'. I'll check back on {dueDate}."

2. **Decision Lab:** When the user selects an option in the Decision Lab (e.g., [I'll do A]), a commitment is created with `source: 'decision_lab'` linking to the decision.

3. **Manual:** On the Commitments page, [+ Add Commitment] button opens an inline form: commitment text (text input), due date (optional date picker), source (auto-set to "manual").

**Page layout:** Segmented control: [Active] [Fulfilled] [All]. The active view shows unfulfilled commitments sorted by due date (soonest first, undated at bottom). Each commitment card shows: the text in Body, the source in Caption `--text-tertiary` (e.g., "From AI chat · March 28"), due date if set with color coding (green if future, orange if today, red if overdue), and two action buttons: [Mark Fulfilled ✓] and [Remove]. Tapping [Mark Fulfilled] sets `fulfilled: true` and `fulfilledDate: now`, shows a toast "Commitment fulfilled!", and the AI logs this for follow-through rate calculation.

**Follow-through rate:** Displayed prominently at the top of the page: "{fulfilled}/{total} commitments fulfilled ({percentage}%)" with a progress bar. The rate is also included in the AI system prompt.

**Overdue handling:** Overdue commitments (past due date, not fulfilled) have a red left border and are surfaced in the AI's proactive messages via the escalation protocol.

**Empty state:** "No commitments yet. When you tell the AI 'I'll do X,' it gets logged here. You can also add commitments manually." [+ Add Commitment].

---

### GAP 22: Reflections Page

**Page location:** Mind → Reflections in the sidebar.

**Concept:** Weekly reflections are structured journaling prompts that help the user process their week and feed data to the AI for pattern analysis.

**Page layout:** At the top: [+ New Reflection] primary button. Below: a list of past reflections sorted by date (newest first). Each reflection card shows: "Week of {weekStart}" in Headline, a preview of the "What worked" field truncated to 2 lines, and the date in Caption. Tappable to expand.

**Creating a reflection:** [+ New Reflection] opens a full-page form (not a drawer — reflections benefit from space). The form has five labeled text areas:

1. "What worked this week?" — textarea, 3 lines.
2. "What didn't work?" — textarea, 3 lines.
3. "What did I avoid?" — textarea, 3 lines.
4. "What will I change next week?" — textarea, 3 lines.
5. "What am I grateful for?" — textarea, 2 lines.

Each textarea has a small voice input icon — tap to dictate instead of type. [Save Reflection] primary button at the bottom. The reflection is stored with `weekStart` set to the Monday of the current week.

**Viewing a reflection:** Tapping a reflection card expands it inline (accordion style) or opens it in a detail view showing all five fields in full. An [Edit] button allows changes. A [Delete] button with confirmation removes the reflection.

**AI integration:** Reflection content is included in the weekly report generation and the AI system prompt summaries. The AI may reference reflections: "In your reflection two weeks ago, you said you avoided cold outreach. You're still avoiding it."

**Empty state:** "Reflections help you process your week and give the AI data to spot patterns. Take 5 minutes every Sunday." [Write your first reflection →].

---

### GAP 23: Contacts Page

**Page location:** Empire → Clients or a sub-item; alternatively under Mind → Contacts.

**Concept:** Contacts is a lightweight personal CRM for tracking relationships outside of paying clients. Mentors, potential partners, referral sources, key connections.

**Page layout:** A searchable, scrollable list. Each contact card shows: name in Headline, role/description in Footnote `--text-secondary`, "Last contact: {date}" in Caption (colored `--warning` if > 30 days, `--negative` if > 90 days, `--positive` if < 14 days), and a truncated notes preview. Cards are sorted by last contact date (oldest first — people you haven't talked to recently float to the top).

**Creating a contact:** [+ Add Contact] button opens a drawer with: name (text, required), role or description (text, e.g., "Potential mentor, runs 3 agencies"), last contact date (date picker, optional), notes (textarea, optional). [Save].

**Editing:** Tap a contact card → detail drawer with all fields editable. [Update Last Contact] button sets `lastContact` to today. [Delete] with confirmation.

**Relationship to Clients:** Contacts are separate from Clients. Clients are paying customers linked to a business with financial data. Contacts are personal relationships without financial data. There is no automatic link between them, but the AI may reference both: "You haven't talked to {contact} in 45 days. They could be a referral source for {business}."

**Empty state:** "Track your key relationships here. I'll remind you when you haven't reached out in a while." [+ Add Contact].

---

### GAP 24: SOPs Page

**Page location:** Empire → SOPs or under each Business detail page.

**Concept:** Standard Operating Procedures — documented processes for each business. The goal is to move knowledge out of the user's head into repeatable documents.

**Page layout:** Grouped by business. Each business section shows its SOPs as a list. Each SOP row shows: title in Headline, status badge (Not Started: gray, In Progress: blue, Documented: green), and a tappable area.

**Creating an SOP:** [+ Add SOP] button per business section. Drawer form: title (text, required), business (dropdown, pre-selected if within a business section), status (defaults to "not_started"). [Create].

**Editing an SOP:** Tap an SOP row → full-page editor (not a drawer — SOPs can be long). The editor has: title (editable inline), status selector (three chips), and a large textarea or rich-text area for the SOP content. The content field supports basic markdown (headers, bullets, numbered lists). [Save] button. Changes auto-save on blur for the content field.

**Status progression:** Users manually update status. The AI may prompt: "You have {n} SOPs marked 'not started' for {business}. Documenting your processes makes it easier to delegate. Want me to suggest which SOP to write first?"

**Deletion:** [Delete SOP] with confirmation. Deletes the record (no archival — SOPs are not high-stakes data).

**Empty state:** "No SOPs yet for {business}. Documenting your processes is the first step to delegation." [+ Add SOP].

---

### GAP 25: Wins Page

**Page location:** Growth → Wins, or accessible from the dashboard via a "Log a win" action.

**Concept:** A record of accomplishments and milestones — things the user has achieved. Counterbalances the app's focus on what's not done. Wins feed into the AI's motivation repertoire.

**Page layout:** A reverse-chronological feed of win cards. Each card shows: title in Headline, dollar value (if set) in monospace `--positive`, category badge (Revenue, Client, Personal, Health, Milestone), business name (if linked) with color dot, date in Caption, and notes preview if present. Cards use standard card styling with a subtle `--positive` left border (3px).

**Creating a win:** [+ Log a Win] button opens a drawer form: title (text, required, e.g., "Signed 3 new clients this month"), dollar value (dollar input, optional), category (chips: Revenue, Client, Personal, Health, Milestone), business (dropdown, optional), notes (textarea, optional). [Save Win].

**Auto-detection (future):** The AI can suggest logging wins based on data: "You hit ${amount}/mo in revenue from {business} for the first time. Want to log this as a win?" The user confirms or dismisses. In V1, all wins are manual.

**AI integration:** Wins are included in the AI context. The AI references them for motivation: "You've logged {n} wins this month. The biggest was '{title}' worth ${value}. Keep that momentum."

**Empty state:** "No wins logged yet. Celebrate your progress — big or small. [+ Log your first win]."

---

### GAP 31: Settings Page Layout

**Page location:** Account → Settings in the sidebar.

**Layout:** A scrollable page organized into sections using Apple-style grouped list styling. Each section has a Caption Upper title and contains list rows with labels, current values, and tappable actions.

**Section 1: Profile.** Rows: Name (tappable → inline edit), Location (tappable → inline edit), Age (tappable → inline edit), Self-description (tappable → textarea drawer), [Update my info →] link to the onboarding summary (Category 12) with per-section edit links.

**Section 2: Appearance.** Rows: Theme toggle (Dark / Light — segmented control inline), Dashboard layout [Customize →] (enters dashboard edit mode), [Reset layout to default] (confirmation dialog).

**Section 3: Connections.** Rows: Anthropic API Key (shows "Connected ✓" in `--positive` or "Not connected" in `--text-tertiary`, tappable → drawer with key input + test button + status), Stripe (Connect/Disconnect button + status), Plaid (Connect/Disconnect + status + last sync time), Google Calendar (Connect/Disconnect + status).

**Section 4: Notifications.** Rows: one toggle per notification type (Morning briefing, Prayer reminders, Task nudge, Streak at risk, AI messages, Weekly report, Decision check-ins, Goal deadlines, Tax reminders, Commitment reminders). Plus: Quiet hours — two time pickers for start and end (default 11pm–7am).

**Section 5: AI Preferences.** Rows: Communication style (tappable → chips drawer), Motivators (tappable → multi-select drawer), Proactive frequency (tappable → chips drawer), Reasoning display (tappable → chips drawer), Factor health into business (toggle).

**Section 6: Privacy.** Rows: [Manage private habits →] (opens list with toggles), [Privacy overview →] (shows what data feeds into AI context).

**Section 7: Data.** Rows: [Export all data (JSON)] (generates and downloads), [Re-run onboarding] (confirmation: "This clears all data and starts fresh. Are you sure?" → type "RESET" → 5-second countdown), [Clear AI chat history] (confirmation + action).

**Section 8: Security.** Rows: [Change PIN] (drawer: enter current PIN, enter new PIN, confirm new PIN), PIN reminder note: "If you forget your PIN, your only option is to reset all data."

**Section 9: About.** Rows: Version (static text, e.g., "ART OS v1.0.0"), [Send feedback] (opens email compose or feedback form), [Terms of service], [Privacy policy].

---

### GAP 4: Prayer Times — Implementation

**Library:** Use `adhan.js` (npm package `adhan`, ~15KB gzipped). This is the industry-standard open-source library for Islamic prayer time calculation, used by major Muslim apps globally.

**Configuration:** Coordinates are derived from the user's location (entered during onboarding Category 1, Q2). Geocode the city/state string to lat/lng using a geocoding API (Google Geocoding or OpenCage) during onboarding, store the coordinates in the Zustand store as `userLat` and `userLng`.

**Calculation method:** Default to `CalculationMethod.NorthAmerica()` (ISNA) for US-based users. Provide a setting in Settings → Faith for advanced users to select their preferred method (ISNA, Muslim World League, Egyptian, Umm Al-Qura, etc.). For Asr calculation, default to standard (Shafi'i). Offer Hanafi option in settings.

**Daily update:** Prayer times are recalculated on each app load using today's date and stored coordinates. They are not stored — they are derived values computed at render time. The `adhan.js` library handles daylight saving time automatically based on the system timezone.

**Display format:** 12-hour format with AM/PM (e.g., "5:47 AM"). The next upcoming prayer is determined by comparing the current time to each prayer time.

**Other faiths:** Prayer times are only relevant for Islam. Other faith traditions (Christianity, Buddhism, etc.) use user-defined times for their practices, entered during onboarding or in the habit settings.

---

### GAP 14: Stripe Integration Flow

1. **Connection:** User taps [Connect Stripe] in onboarding or Settings. The app initiates a Stripe OAuth flow (Stripe Connect with the `read_only` scope). The user is redirected to Stripe to authorize, then back to ART OS with an authorization code.

2. **Token exchange:** The Next.js API route `/api/stripe/callback` exchanges the code for an access token and refresh token, stored in the Zustand store (V1) or server-side encrypted (V2).

3. **Data imported:** The app fetches the last 90 days of Stripe charges (successful payments only) via the Stripe API. Each charge includes: amount, currency, description, customer email/name, created timestamp, metadata.

4. **Business mapping:** On first sync, the user is shown a mapping screen: "Which business does this Stripe account belong to?" with a dropdown of their businesses. All Stripe revenue is attributed to the selected business. If the user has multiple Stripe accounts (rare), they can connect additional ones and map each to a different business.

5. **Ongoing sync:** On each app load, if Stripe is connected and the last sync was > 24 hours ago, the app fetches new charges since the last sync. New charges are added to `revenueEntries` for the mapped business with `source: 'stripe'`.

6. **Revenue calculation:** Stripe revenue automatically populates the business's revenue data. The net revenue calculation deducts the 2.9% + $0.30 Stripe processing fee automatically.

7. **Disconnect:** Settings → Stripe → [Disconnect]. Clears the tokens. Previously synced revenue entries remain in the store (they are historical data).

---

### GAP 15: Calendar Integration Flow

1. **Connection:** User taps [Connect Google Calendar] in onboarding or Settings. Standard Google OAuth flow with `calendar.readonly` scope.

2. **Token storage:** Access token and refresh token stored in the Zustand store (V1) or server-side (V2).

3. **Data imported:** On connection, the app fetches today's events from the user's primary Google Calendar. Each event includes: title, start time, end time, recurrence.

4. **Mapping to schedule blocks:** Calendar events are imported as `ScheduleBlock` records with `type: 'personal'` (default). The user can change the type to prayer/work/health/meal via the schedule page. The title is taken from the calendar event title. Duration is calculated from start/end times.

5. **Daily sync:** On each app load, the app fetches today's events and updates/adds schedule blocks. Events that were deleted in Google Calendar are removed from the schedule. Events that were modified in Google Calendar update the corresponding block. Manually added blocks (not from calendar) are preserved.

6. **Read-only:** ART OS does not write back to Google Calendar. Changes made in ART OS to calendar-sourced blocks are local only.

7. **Which calendars:** By default, only the primary calendar is synced. A future enhancement could allow selecting multiple calendars. For V1, primary only.

8. **Disconnect:** Settings → Calendar → [Disconnect]. Clears tokens. Previously imported schedule blocks remain but stop syncing.

---

### GAP 18: Money Tracker Sparkline Data Source

The 7-day sparkline on the Money Tracker tile represents **daily net income derived from the user's monthly data**, not actual daily transaction data.

**Calculation:** The sparkline shows 7 data points (one per day for the last 7 days). Each data point is the user's **current monthly net income** (total business revenue minus total expenses) as of that day. Since most users update revenue monthly, this will often be a flat line — which is correct and expected.

**When data changes:** If the user edits a business's revenue or adds an expense entry on Day 4, the sparkline will show the old net income for Days 1–3 and the new net income for Days 4–7, creating a visible step change. This accurately reflects when the data changed.

**Implementation:** Store a `dailyNetSnapshots` array in the store. On each app load, check if today's date is already in the array. If not, compute current net income and push `{ date: today, net: currentNetIncome }` into the array. Keep only the last 30 entries. The sparkline reads the last 7 entries.

**If Plaid is connected:** The sparkline becomes more dynamic because transaction data creates daily fluctuations. Each day's net is computed from actual transactions (revenue inflows minus expense outflows) for that specific day, providing a more granular view.

---

### GAP 20: Claude Model and API Parameters

**Model:** Use `claude-sonnet-4-20250514` for all API calls. Sonnet provides the best balance of quality, speed, and cost for a consumer SaaS product. Opus is too slow and expensive for real-time chat. Haiku is too terse for the depth of analysis needed in Decision Lab.

**Parameters:**

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2048,           // enough for detailed analysis
  temperature: 0.7,           // balanced creativity/consistency
  system: dynamicSystemPrompt, // built from user data (Section 8.2)
  messages: conversationHistory, // last 10 messages + current
});
```

**For Decision Lab analyses** (longer output needed): `max_tokens: 4096`.

**For proactive messages** (shorter output): `max_tokens: 512`.

**Streaming:** Yes. Use the Anthropic streaming API to display the AI's response in real-time (typing effect). The response streams token by token into the chat bubble, giving the user immediate feedback that the AI is working. Implementation: use `stream: true` in the API call, handle `message_delta` events, and append text to the message bubble progressively.

**Error handling:** If the API returns a 429 (rate limit), show toast: "AI is busy. Try again in a moment." Auto-retry after 30 seconds. If 401 (invalid key), show inline error on the API key setting. If 500 (server error), show toast: "AI unavailable. Try again later."

**Cost management:** Each API call costs approximately $0.003–0.015 depending on context size. At 200 calls/month (Standard tier), monthly AI cost per user is ~$1–3. The system prompt (context snapshot) should be kept under 4,000 tokens by summarizing rather than dumping raw data.

---

### GAP 21: Ecosystem Map Rendering

**Library:** Use `d3-force` (from the D3 ecosystem, npm `d3-force` + `d3-selection`). This provides a force-directed graph layout that naturally clusters related nodes.

**Node generation:** Each business is a node. Node size is proportional to monthly revenue (min 40px, max 100px diameter). Node color is the business's chosen color. Node label is the business name.

**Edge (connection) generation:** Edges are drawn between businesses that share any of the following:

1. **Shared clients:** If any `Client` record has the same `name` (case-insensitive fuzzy match) across two businesses. Edge label: "Shared client: {name}."
2. **Shared tools:** If the `tools` strings for two businesses contain the same tool name (parsed by splitting on commas and matching). Edge label: "Shared tool: {name}."
3. **Shared team:** If the same team member name appears in two businesses. Edge label: "Shared team: {name}."
4. **Revenue flow:** If the user has logged revenue entries noting one business as the source for another (e.g., agency refers clients to coaching). This requires a `referralFrom` field on revenue entries (optional, for future enhancement). Edge label: "Revenue flow."
5. **Same type:** Businesses of the same type get a weak edge (lower weight, lighter line). Edge label: none (implicit grouping).

**Rendering:** The force-directed graph is rendered in an SVG element using D3 selections. Nodes are circles with labels below. Edges are lines with optional labels at midpoint. The simulation runs for ~300 iterations to settle, then stops. Nodes are draggable. The SVG is responsive (fills the container width, maintains aspect ratio).

**AI synergies:** Below the graph, an AI-generated text section: "Cross-business synergies I've identified:" followed by bullet points. If no API key: this section is hidden.

**Empty state (fewer than 2 businesses):** "The ecosystem map shows connections between your businesses. Add at least 2 businesses to see the map."

---

### GAP 27: Live Preview Implementation

The live dashboard preview on the right side of the onboarding screen is a **real React component rendering simplified tile components** with data bindings to the onboarding draft state.

**Implementation:** A `LiveDashboardPreview` component (already partially built in the codebase) reads from the `onboarding-store` (separate from the main app store). As the user fills in onboarding fields, the onboarding store updates, and the preview re-renders reactively.

**Tile rendering:** The preview uses a scaled-down bento grid (approximately 45% of the screen width). Tiles are simplified versions of the real dashboard tiles — they show the same visual structure (card, header, key metric) but without full interactivity (not tappable, no drawers). Data that hasn't been entered yet shows a dash ("—") in `--text-tertiary` with subtle placeholder text (e.g., "Income" with "—" below), not gray skeleton boxes.

**Progressive population:** As data enters:
- After Category 1: Greeting tile shows "{name}" and "{location}."
- After Category 2: Business cards appear one by one with name, revenue, and color dot.
- After Category 3: Income and expense numbers populate in the financial tile.
- After Category 4: Goal meter appears with target line.
- After Category 5: Habit tiles appear for selected habits.
- After Category 6: Schedule bar appears with rough time blocks.
- After Category 7: Prayer tile appears (if enabled).
- Categories 8–10: No visible preview changes (data feeds AI only).
- Category 11: No visible change (PIN is security, not display).
- Category 12: Full preview with all tiles assembled.

**Mobile:** The preview is not shown (full-screen conversation). Instead, after each category, a brief summary card (auto-dismissed after 3 seconds or tappable to dismiss) shows a snapshot of the data just entered in a format matching the eventual dashboard tile.

---

### GAP 28: Drawer Max Height and Scroll Behavior

All Vaul drawers follow these specs:

**Max height:** `max-h-[85vh]` — the drawer never exceeds 85% of the viewport height, leaving the top 15% visible as the overlay dimming.

**Scroll:** Internal scroll via `overflow-y: auto` on the drawer content area. The drag handle and title area (first ~60px) are fixed and do not scroll.

**Drag-to-dismiss:** Vaul's default behavior — dragging the handle downward past a 40% threshold dismisses the drawer. The overlay (`bg-black/60`) behind the drawer is tappable to dismiss.

**Structure:**
```
┌─────────────────────────────────────┐  ← max-h-[85vh]
│  ──── drag handle (1px × 40px) ──── │  ← fixed
│  Drawer Title (18px w600)           │  ← fixed
│  ─────────────────────────────────  │  ← separator
│                                     │
│  [scrollable content area]          │  ← overflow-y: auto
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Drawer styling:** Uses `.card-floating` styling: `rgba(44,44,46,0.85)` background, `backdrop-filter: blur(40px)`, `border-top: 1px solid rgba(255,255,255,0.1)`, `border-radius: 20px 20px 0 0` (rounded top corners only), `padding: 20px`.

**Drag handle:** Centered horizontal bar, 40px wide, 4px tall, `rgba(255,255,255,0.1)` background, 2px border-radius, 12px bottom margin.

---

### GAP 29: lastOpenedAt Tracking

**Implementation:** Add a `lastOpenedAt: string` field to the Zustand store (ISO 8601 timestamp).

**When updated:** In the root layout component's `useEffect` (runs on every app mount after hydration), update `lastOpenedAt` to `new Date().toISOString()`. This happens after the PIN check succeeds (only authenticated sessions count as "opened").

**How "days since last open" is calculated:** `Math.floor((Date.now() - new Date(lastOpenedAt).getTime()) / 86400000)`. This value is included in the AI system prompt's `CURRENT CONTEXT` section and used by the re-engagement logic (Section 8.7) to determine which welcome-back message to show.

**Edge case:** On first-ever app launch (before onboarding), `lastOpenedAt` is null. After onboarding completes, it is set to now. The AI treats null as "first session" and does not show any re-engagement messaging.

---

### GAP 30: Correlation Data Thresholds and Disclaimers

**Minimum data thresholds:**

| Correlation Type | Minimum Days of Data | Minimum Events |
|-----------------|---------------------|----------------|
| Health → productivity (e.g., gym → task completion) | 14 days | At least 5 days with the behavior and 5 days without |
| Prayer → score | 14 days | At least 5 days with all prayers and 5 days with missed prayers |
| Energy → performance | 7 days | At least 7 energy logs across different times |
| Sleep → next-day score | 14 days | At least 10 days with sleep time logged |
| Focus sessions → task quality | 7 days | At least 5 focus sessions |

**Below threshold:** The AI does not present correlations. Instead of "Gym days = 2.1× task completion," it says nothing. The correlation section in drawers shows: "I need more data to identify patterns. Keep logging and I'll have insights within {remaining days} days."

**At threshold:** When enough data exists, the AI presents correlations with a disclaimer: "Based on your last {n} days of data, {correlation statement}. This is a pattern I'm seeing, not a guarantee — keep logging to improve accuracy."

**Above threshold (30+ days):** Correlations are presented confidently without disclaimers, but still labeled as "correlation" not "causation." The AI uses language like "On days you {behavior}, your {metric} tends to be {x}% higher" rather than "{behavior} causes {outcome}."

**Statistical approach:** Use simple percentage comparison: (average metric on behavior days) versus (average metric on non-behavior days). Express as a multiplier or percentage difference. Do not use p-values or regression — the audience is entrepreneurs, not statisticians. The AI can note sample size: "Based on {n} days of data."
