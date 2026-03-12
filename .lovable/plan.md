

# Running This Project Locally with Claude + MongoDB Integration

## Understanding the Constraints

Your project is a **React frontend** (Vite + TypeScript) that currently uses mock data. It has no backend server. To connect to your MongoDB instance (which uses **private network IPs** `10.41.x.x`), you need a backend API layer — the browser cannot connect to MongoDB directly.

There are **two separate things** you're asking about:

---

## 1. Running This Project Locally

You can run this project on any machine with Node.js:

```text
git clone <your-repo-url>
cd <project-folder>
npm install
npm run dev
```

If you want to use **Claude Code** (Anthropic's CLI tool) to edit the project locally:
- Install it via `npm install -g @anthropic-ai/claude-code`
- You need an **Anthropic API key** (paid) from https://console.anthropic.com
- Then run `claude` in your project directory to get an AI-assisted coding experience

This is separate from Lovable — Claude Code is a terminal-based AI editor.

---

## 2. MongoDB Integration Architecture

Since MongoDB is on a private network, the architecture must be:

```text
React Frontend  →  REST API (Express/Node.js)  →  MongoDB
 (this app)        (you host on your server        (10.41.x.x)
                    with network access)
```

### What You Need to Build (on your server):

**A Node.js/Express REST API** deployed on a machine that can reach `10.41.x.x`. This API exposes endpoints like:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/coupons` | GET | List/filter coupons |
| `/api/coupons/export` | GET | Export coupons for a campaign |
| `/api/campaigns` | GET | List campaigns |
| `/api/campaigns/:id/metrics` | GET | Dashboard metrics |
| `/api/users` | GET/POST/PUT/DELETE | User CRUD |
| `/api/activity-logs` | GET | Activity logs |
| `/api/auth/login` | POST | Authentication |

### What Changes in This Frontend:

1. **Create `src/lib/api.ts`** — An API client module that replaces all `mockData` imports with `fetch()` calls to your REST API.

2. **Update data-consuming pages** — `DashboardPage`, `CampaignsPage`, `LeaderboardPage`, `UserManagementPage`, `CampaignDetailPage` — to use React Query hooks that call the API instead of importing mock arrays.

3. **Update `auth-context.tsx`** — Replace mock login with a real `/api/auth/login` call.

4. **Add environment config** — A `VITE_API_BASE_URL` variable pointing to your API server.

### What Lovable Can Do vs. What You Must Do:

| Task | Where |
|---|---|
| Build the Express API + MongoDB queries | **Your server** (Lovable can't run Node.js backends) |
| Update the React frontend to call the API | **Lovable** (I can do this) |
| Deploy the API on a machine with MongoDB access | **Your infrastructure** |

---

## Recommended Next Steps

1. **You build and deploy the REST API** on a server that can reach your MongoDB cluster. Use Express + Mongoose with the connection string you have.

2. **Come back here** and tell me the API base URL (e.g., `https://your-api.example.com`). I will then update all frontend pages to fetch real data from your API instead of mock data.

3. Alternatively, if you share your **API spec or endpoint list**, I can pre-build the frontend integration layer so it's ready to connect the moment your API is live.

