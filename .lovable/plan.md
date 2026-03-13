

# Plan: Connect Dashboard & Leaderboard to Live Analytics API

## Overview
Wire the Dashboard and Leaderboard pages to fetch real data from `https://physical-coupon.extensions.jiocommerce.io/api/v1/vouchers/analytics` instead of mock data. Other pages (Coupons, Users, etc.) will continue using mock data for now.

## API Response Structure
The analytics endpoint returns:
- `overall`: `{ totalLogins, totalDownloads, uniqueUsersLoggedIn, uniqueUsersDownloaded }`
- `breakdownByCampaign[]`: per-campaign `{ campaign, totalLogins, totalDownloads, uniqueUsersLoggedIn, uniqueUsersDownloaded }`

**Mapping to Dashboard KPIs:**
- Total Logins → "Total Logins" (replaces "Total Uploaded")
- Total Downloads → "Total Downloads" (replaces "Claimed")
- Download Rate = totalDownloads / totalLogins → "Download Rate" (replaces "Claim Rate")
- Unique Users → new KPI or replace PDF Downloads

## Changes

### 1. Create API client — `src/lib/api.ts`
- Export `API_BASE_URL = "https://physical-coupon.extensions.jiocommerce.io/api/v1"`
- Export `fetchAnalytics()` function that calls `/vouchers/analytics` and returns typed response
- Define TypeScript interfaces for the API response (`AnalyticsResponse`, `CampaignBreakdown`)

### 2. Create React Query hook — `src/hooks/use-analytics.ts`
- `useAnalytics()` hook using `useQuery` from `@tanstack/react-query` to fetch and cache the analytics data
- Returns `{ data, isLoading, error }`

### 3. Update Dashboard page — `src/pages/DashboardPage.tsx`
- Replace mock data imports with `useAnalytics()` hook
- Populate campaign filter dropdown from `data.breakdownByCampaign` (real campaign names)
- KPI cards show real `totalLogins`, `totalDownloads`, download rate, and unique users from the API
- When a campaign is selected, show that campaign's breakdown stats
- Remove the daily histogram chart (API doesn't provide daily granularity) — replace with a campaign comparison bar chart showing logins vs downloads per campaign
- Add loading skeleton and error states

### 4. Update Leaderboard page — `src/pages/LeaderboardPage.tsx`
- Replace mock data with `useAnalytics()` hook
- Rank campaigns by download rate (`totalDownloads / totalLogins`)
- Show columns: Rank, Campaign, Download Rate, Total Logins, Total Downloads
- Add loading and error states

### 5. Update KPI labels
- "Total Uploaded" → "Total Logins"
- "Claimed" → "Total Downloads"  
- "Claim Rate" → "Download Rate"
- "PDF Downloads" → "Unique Users Downloaded"

## Files to Create/Edit
| File | Action |
|---|---|
| `src/lib/api.ts` | Create — API client + types |
| `src/hooks/use-analytics.ts` | Create — React Query hook |
| `src/pages/DashboardPage.tsx` | Edit — use live data |
| `src/pages/LeaderboardPage.tsx` | Edit — use live data |

## Technical Notes
- No auth headers needed for the analytics endpoint
- The API is publicly accessible so no CORS proxy is required
- Mock data files remain unchanged (used by other pages)
- React Query handles caching, refetching, and loading states automatically

