# Stealth Labs Developer Platform

Internal developer platform for engineering teams. Provides a unified view of services,
health monitoring, deployment management, and access control.

## Modules

| Module | Status | Sprint |
|--------|--------|--------|
| Service Registry | ✅ Complete | Sprint 1 |
| Health Dashboard | ✅ Complete | Sprint 2 |
| Deployment Manager | 🔧 In Progress | Sprint 3 |
| Access Control | 📋 Planned | Sprint 4 |

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React 18, TypeScript, Recharts, Tailwind CSS
- **Infrastructure:** Docker, GitHub Actions, AWS ECS

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Team

Platform Engineering Team — questions to #engineering on Slack.
