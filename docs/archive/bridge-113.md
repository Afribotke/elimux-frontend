# CYCLE — Admin Users Page: Search, Filter, Sort, Pagination, Bulk Actions

## Goal
The existing `admin/users/page.tsx` (254 lines) displays users as a plain list with per-row disable buttons only. It lacks search, filtering, sorting, pagination, bulk actions, and a detail drawer. This cycle adds all of that without breaking existing functionality.

## Step 0: Read Current File
Read `src/app/admin/users/page.tsx` and report back:
- How does it currently fetch user data? (Direct Supabase? Backend API?)
- What columns does it display?
- How does it handle the split user model (auth.users, user_roles, student_profiles, employers, advertisers)?
- What existing components does it use?

Do NOT proceed until this is reported.

## Step 1: Create Reusable DataTable Component
Create `src/components/admin/DataTable.tsx`:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: string[];
  filterable?: boolean;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  bulkActions?: { label: string; action: (selected: T[]) => void; variant?: 'primary' | 'danger' }[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchable = true,
  searchKeys,
  filterable = true,
  filters = [],
  sortable = true,
  pagination = true,
  pageSize = 25,
  bulkActions = [],
  onRowClick,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  // Implementation: search, filter, sort, pagination, bulk select
  // Use existing design tokens: bg-elimux-card, border-border, text-muted, etc.
}
Requirements:
Search input filters across searchKeys (or all string columns if not specified)
Column headers clickable for sort (asc/desc toggle)
Filter dropdowns for each filters config
Pagination with prev/next and page numbers
Checkbox per row + header checkbox for "select all on this page"
Bulk action bar appears when rows are selected
Loading skeleton state
Empty state with Lucide icon
Responsive: horizontal scroll on mobile
Step 2: Create User Detail Drawer
Create src/components/admin/UserDetailDrawer.tsx:
tsx
interface UserDetailDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string) => void;
  onDisable: (userId: string) => void;
}
Content:
User profile summary (name, email, role, join date)
Applications submitted (list with links)
Activity log (recent actions)
Role dropdown (student, employer, advertiser, admin)
Disable/Enable account button
Close button
Use a slide-in drawer from the right side, same width as the admin sidebar.
Step 3: Refactor Users Page
Rewrite src/app/admin/users/page.tsx to use DataTable and UserDetailDrawer:
tsx
// Fetch all user data (join across relevant tables)
// Columns: Name, Email, Role, Type, Joined, Status, Actions
// Searchable by: name, email
// Filterable by: role (student, employer, advertiser, admin), status (active, disabled)
// Sortable by: name, joined date, role
// Bulk actions: Disable selected, Enable selected
// Click row → open UserDetailDrawer
Keep the existing data fetch pattern (whether direct Supabase or backend API). Don't change the auth model.
Step 4: Build & Verify
Run npm run build — zero errors.
Run npm run start locally.
Log in as admin, navigate to /admin/users
Verify:
[ ] Search filters users by name/email
[ ] Role filter dropdown works
[ ] Sort by clicking column headers
[ ] Pagination shows correct page count
[ ] Select multiple rows → bulk action bar appears
[ ] Click row → detail drawer opens
[ ] Drawer shows user info, applications, activity
[ ] Disable/Enable button works
[ ] Responsive on mobile (horizontal scroll)
If all pass, commit: feat: add search, filter, sort, pagination, and bulk actions to admin users page
Push and confirm Vercel deploy.
Rules
Do NOT break existing user disable functionality.
Do NOT change the admin auth model (ADMIN_KEY).
Do NOT create new Supabase tables.
Do NOT modify RLS policies.
Use existing design tokens and color scheme.
Report back exactly which files were created, modified, and any issues encountered with the split user model.