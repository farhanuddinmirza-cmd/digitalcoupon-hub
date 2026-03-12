

# Plan: Four UI Changes

## 1. Login Page — Change Email Placeholder
**File:** `src/pages/LoginPage.tsx` (line 37)
- Change `placeholder="rahul@admin.com"` to `placeholder="Enter Email"`

## 2. Leaderboard — Remove Trend, Split Uploaded/Claimed, Center-Align
**File:** `src/pages/LeaderboardPage.tsx`
- Remove `trend` from interface, remove `trendIcon` map, remove trend-related imports (`TrendingUp`, `TrendingDown`, `Minus`)
- Remove trend assignment in `useMemo`
- Replace the "Claimed / Uploaded" column with two separate columns: "Uploaded" first, then "Claimed"
- Remove the "Trend" column header and cell
- Add `text-center` to all `TableHead` and `TableCell` elements
- Update `colSpan` in empty state from 5 to 4

## 3. User Management — Remove Application ID, Status Column, Toggle
**File:** `src/pages/UserManagementPage.tsx`
- Remove the Application ID filter section (lines 129-143)
- Remove `applicationId` from `ManagedUser` interface and `initialManagedUsers` mapping
- Remove the "Status" column header and cell (lines 152, 164-168)
- Remove the `Switch` toggle from the Actions column (line 174)
- Remove Application ID field from the Create/Edit dialog (lines 222-231)
- Remove the enabled/status Switch from the dialog (lines 233-236)
- Remove `formAppId` state and related imports (`applicationIds` from team-data, `Switch`)
- Remove `toggleEnabled` function
- Keep edit and delete buttons in Actions

## 4. User Management — Add Password Field to Create User Dialog
**File:** `src/pages/UserManagementPage.tsx`
- Add `formPassword` state variable
- Add a password `Input` field in the Create/Edit dialog (after Email field)
- Store password in the user object (add `password` field to `ManagedUser`)
- Update `handleSave` to include password
- Update `openCreate`/`openEdit` to reset/populate password field

**File:** `src/lib/types.ts`
- Add optional `password?: string` to `User` interface

**File:** `src/lib/auth-context.tsx`
- Update `login` to also check password: `mockUsers.find(u => u.email === email && u.password === password && u.enabled)` (falling back to any-password for existing mock users without passwords)

**File:** `src/lib/mock-data.ts`
- Add `password` field to existing mock users (e.g., `password: 'admin123'` for rahul, etc.)

