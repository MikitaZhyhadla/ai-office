# AI Office

**AI-powered Requirements Pipeline Tool for Agile Teams**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://vercel.com/)

## What is this?

AI Office is a next-generation requirements management tool that brings AI agents directly into your Agile workflow. Product Managers, Business Analysts, and Agile teams can describe features in plain language and have AI agents automatically convert them into structured, testable requirements in either Given-When-Then (GWT) or Classic specification format.

The tool integrates a full BA revision loop: after initial analysis, dedicated QA and Dev agents review the requirement for testability and feasibility. If issues are found, a BA revision agent automatically rewrites the spec based on the feedback — reducing back-and-forth between humans and ensuring requirements are production-ready before a single line of code is written.

Beyond the pipeline, AI Office provides a full Kanban board with automatic QA test case generation, sprint planning, story point estimation, and a pixel-art office visualization of your AI agents at work — making it a complete lightweight Agile workspace powered by Claude.

## Features

🔄 **Requirements Pipeline** — BA agents convert raw text into structured GWT or Classic specs  
🔁 **BA Revision Loop** — QA and Dev agents flag issues; BA agent revises automatically  
📋 **Kanban Board** — Drag-and-drop board with four columns: To Do, In Progress, Review, Done  
🏃 **Sprint Management** — Backlog view, sprint planning, story point tracking  
🎮 **Pixel Office** — Animated AI agents visualized as pixel art characters in a virtual office  
🔬 **QA Test Cases** — Auto-generated on drag to In Progress, exportable as XLSX  
🔐 **Authentication** — Multi-user login and registration with per-user data isolation  
✍️  **Manual Ticket Creation** — Create tickets directly from the backlog without the Pipeline  

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, React 19, TypeScript |
| State | Zustand with persist middleware |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API (`claude-haiku-4-5-20251001`) |
| Export | SheetJS (XLSX) |
| Deploy | Vercel |

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/MikitaZhyhadla/ai-office

# 2. Install dependencies
cd ai-office && npm install

# 3. Configure environment
cp .env.example .env.local
# Open .env.local and add your ANTHROPIC_API_KEY

# 4. Start the dev server
npm run dev

# 5. Open in browser
# http://localhost:3000 — login with admin / demo1234
```

## Test Credentials

| Username | Password | Role      |
|----------|----------|-----------|
| admin    | demo1234 | Admin     |
| qa_lead  | test5678 | QA        |
| dev_lead | dev9999  | Developer |

## Roadmap

- Phase 1.0 — MVP ✅
- Phase 2.0 — Advanced Features ✅
- Phase 3.0 — Intelligence & Integration 🔄
- Phase 4.0 — Team & Collaboration 📋
