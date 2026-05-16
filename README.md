# AI Office

> AI-powered Requirements Pipeline Tool for Agile Teams

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)

## What is this?

AI Office is a requirements pipeline tool that uses multi-agent AI to automate
the analysis and structuring of software requirements. Product Managers and BA
analysts paste raw requirement text — AI agents instantly convert it into
structured GWT or Classic format tickets, ready for sprint planning.

The tool is built for Agile teams who want to spend less time writing
requirements and more time building. QA agents auto-generate test cases,
Dev agents estimate story points, and all agents are visualized as
pixel art characters in the Pixel Office view.

## Features

| Feature | Description |
|---------|-------------|
| 🔄 Requirements Pipeline | BA agents convert raw text to GWT/Classic specs |
| 🔁 BA Revision Loop | QA/Dev flag issues, BA revises automatically |
| 📋 Kanban Board | Drag-and-drop with auto QA test case generation |
| 🏃 Sprint Management | Backlog, sprint planning, story points |
| 🎮 Pixel Office | Animated AI agents visualized as pixel art characters |
| 🔬 QA Test Cases | Auto-generated on drag to In Progress, XLSX export |
| 🔐 Authentication | Multi-user login/register with account isolation |
| ✍️ Manual Ticket Creation | Create tickets directly without Pipeline |

## Tech Stack

- **Frontend:** Next.js 14, React 19, TypeScript, Tailwind CSS
- **State:** Zustand with localStorage persistence
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **AI:** Anthropic Claude API (`claude-haiku-4-5-20251001`)
- **Export:** SheetJS (XLSX)
- **Deploy:** Vercel

## Getting Started

```bash
git clone https://github.com/MikitaZhyhadla/ai-office
cd ai-office
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | demo1234 | Admin |
| qa_lead | test5678 | QA |
| dev_lead | dev9999 | Developer |

## Roadmap

- Phase 1.0 — MVP ✅
- Phase 2.0 — Advanced Features ✅
- Phase 3.0 — Intelligence & Integration 🔄
- Phase 4.0 — Team & Collaboration 📋
