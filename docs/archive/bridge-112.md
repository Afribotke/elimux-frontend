CYCLE — Complete Admin Dashboard
Goal
Transform the partially-implemented admin dashboard into a production-ready command center. The admin must be able to oversee all platform operations: users, content, applications, revenue, and system health.
Step 0: Audit — Report Current State First
Before writing any code, audit and report back:
Read src/app/admin/layout.tsx — what navigation items exist? What routes are wired?
Read src/app/admin/page.tsx — what's on the overview/dashboard home?
List all files in src/app/admin/ — what pages exist?
List all files in src/components/admin/ — what components exist?
Check Supabase for admin-related tables/views — what data sources are available?
Read src/lib/supabase.ts or similar — how does the admin query Supabase?
Report findings in this format:
plain
EXISTING:
- Pages: admin/page.tsx, admin/users/page.tsx, ...
- Components: AdminSidebar, AdminHeader, StatCard, ...
- Navigation items: Dashboard, Users, ...
- Supabase tables accessible: profiles, institutions, ...

MISSING:
- Pages: admin/scholarships, admin/bursaries, admin/applications, ...
- Components: DataTable, FilterBar, ApprovalFlow, ...
- Features: bulk actions, export CSV, real-time stats, ...
Do NOT proceed to Step 1 until this audit is complete and reported.
Step 1: Admin Layout & Navigation
1.1 Update Admin Sidebar Navigation
Open src/app/admin/layout.tsx (or src/components/admin/AdminSidebar.tsx). Ensure the navigation includes ALL operational areas:
tsx
const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Institutions', href: '/admin/institutions', icon: Building2 },
  { label: 'Programs', href: '/admin/programs', icon: BookOpen },
  { label: 'Scholarships', href: '/admin/scholarships', icon: GraduationCap },
  { label: 'Bursaries', href: '/admin/bursaries', icon: Banknote },
  { label: 'Applications', href: '/admin/applications', icon: FileCheck },
  { label: 'Internships', href: '/admin/internships', icon: Briefcase },
  { label: 'Attachments', href: '/admin/attachments', icon: ClipboardList },
  { label: 'Advertisers', href: '/admin/advertisers', icon: Megaphone },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];
For any nav item whose page doesn't exist yet, create a placeholder page that says "[Feature] management coming soon" — don't leave broken links.
1.2 Add Mobile-Responsive Sidebar
The admin must work on tablet. Add a hamburger menu toggle for mobile:
Collapse sidebar to icons-only on tablet
Full hide/show toggle on mobile
Overlay backdrop when open on mobile
Step 2: Dashboard Overview Page (/admin)
2.1 Stats Cards Row
Create a row of 4 key metric cards at the top:
tsx
// src/components/admin/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change: number; // percentage change from last period
  icon: LucideIcon;
  trend: 'up' | 'down' | 'neutral';
}
Metrics to display (query from Supabase):
Total Users — count from profiles table
Total Applications — count from applications or equivalent table
Active Programs — count from programs where status = active
Revenue (Month) — sum from payments/transactions table (if exists) or placeholder
2.2 Recent Activity Feed
Show last 10 platform activities:
New user registrations
New applications submitted
New institution signups
New reviews posted
Query from Supabase, ordered by created_at DESC, limit 10.
2.3 Quick Action Buttons
Row of buttons for common admin tasks:
"Approve Pending Applications" → links to /admin/applications?status=pending
"Review New Institutions" → links to /admin/institutions?status=pending
"Manage Advertisers" → links to /admin/advertisers
"Export Report" → triggers CSV download of key metrics
2.4 Charts (Optional but Recommended)
If recharts or similar is already in the project, add:
User signups over last 30 days (line chart)
Applications by category (bar chart)
Traffic sources (pie chart)
If no chart library exists, skip this and add it as a post-launch enhancement.
Step 3: Users Management (/admin/users)
3.1 User Table
Create a data table showing all users:
Table
Column	Source
Name	profiles.full_name
Email	profiles.email or auth.users
Role	profiles.role (student, admin, etc.)
Institution	profiles.institution_id → join
Joined	profiles.created_at
Status	profiles.status or derived
Actions	View, Edit, Disable
3.2 Features
Search by name/email
Filter by role (dropdown)
Sort by any column
Pagination (25 per page)
Bulk actions: select multiple → disable/enable/delete
Export to CSV
3.3 User Detail Modal/Drawer
Clicking "View" opens a side drawer showing:
Full profile info
Applications submitted
Saved items
Activity log
Option to edit role or disable account
Step 4: Applications Management (/admin/applications)
This is CRITICAL — it's where admins approve/reject student applications.
4.1 Applications Table
Table
Column	Source
Student	applications.user_id → join profiles
Program	applications.program_id → join programs
Institution	programs.institution_id → join institutions
Submitted	applications.created_at
Status	applications.status (pending, approved, rejected)
Actions	View, Approve, Reject
4.2 Filter Tabs
All | Pending | Approved | Rejected
Default to "Pending" (admins care most about these)
4.3 Approval Flow
Clicking "View" opens detail drawer showing:
Student profile summary
Program details
Application answers/attachments
Admin notes field
Approve button (green) → updates status, sends email
Reject button (red) → updates status, requires reason, sends email
4.4 Bulk Actions
Select multiple pending applications → Approve All / Reject All
Step 5: Scholarships Management (/admin/scholarships)
5.1 Scholarship Table
Table
Column	Source
Title	scholarships.title
Provider	scholarships.provider
Deadline	scholarships.deadline
Status	scholarships.status (active, closed, draft)
Applications	count from scholarship_applications
Actions	Edit, Toggle Status, Delete
5.2 Add/Edit Scholarship Form
Modal form with fields:
Title, Description, Provider, Amount, Deadline
Eligibility criteria (textarea)
Application link or internal application
Image upload (or URL)
Status toggle
5.3 Scholarship Applications Sub-Page
/admin/scholarships/[id]/applications — shows all applications for a specific scholarship with approve/reject flow.
Step 6: Bursaries Management (/admin/bursaries)
Same pattern as Scholarships but for bursaries:
Table of all bursaries
Add/edit form
Applications sub-page with approval flow
Bursary providers management
Step 7: Institutions Management (/admin/institutions)
7.1 Institution Table
Table
Column	Source
Name	institutions.name
Type	institutions.type (university, college, TVET)
Location	institutions.city, country
Status	institutions.status (pending, approved, suspended)
Programs	count from programs
Actions	View, Approve, Suspend
7.2 Institution Approval Flow
New institutions sign up and need admin approval:
Pending institutions tab (default)
View institution profile, documents, contact info
Approve → status = active, sends confirmation email
Reject → requires reason, sends rejection email
Step 8: Advertisers Management (/admin/advertisers)
8.1 Advertiser Table
Table
Column	Source
Company	advertisers.company_name
Contact	advertisers.contact_email
Campaigns	count from advertiser_campaigns
Spend	sum from advertiser_transactions
Status	advertisers.status
Actions	View, Approve, Suspend
8.2 Campaign Oversight
Sub-page showing all active/pending ad campaigns:
Campaign name, budget, duration, status
Impressions/clicks (if tracked)
Pause/Resume/End campaign buttons
Step 9: Reviews Management (/admin/reviews)
9.1 Reviews Table
Table
Column	Source
User	reviews.user_id → join profiles
Target	reviews.program_id or reviews.institution_id
Rating	reviews.rating (1-5 stars)
Comment	reviews.comment (truncated)
Status	reviews.status (approved, flagged, hidden)
Actions	View, Approve, Hide, Delete
9.2 Moderation Features
Filter by status (Flagged first)
Bulk approve/hide/delete
Click to view full review and context
Step 10: Settings (/admin/settings)
10.1 Platform Settings
Platform name, tagline, contact email
Social media links
Maintenance mode toggle
Feature flags (enable/disable scholarships, bursaries, etc.)
10.2 Gamification Settings
Points per action (apply, review, share, etc.)
Badge thresholds
Leaderboard visibility
10.3 Payment Settings
M-Pesa configuration
Stripe/Paystack keys (masked)
Commission rates
Step 11: Data Table Component (Reusable)
Since almost every admin page needs a table, create one reusable component:
tsx
// src/components/admin/DataTable.tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  bulkActions?: BulkAction<T>[];
  onRowClick?: (row: T) => void;
}
Features:
Search input (filters across all string columns)
Column sort (click header)
Pagination controls
Checkbox selection for bulk actions
Loading skeleton state
Empty state illustration
Use this component for Users, Applications, Scholarships, Bursaries, Institutions, Advertisers, and Reviews pages.
Step 12: RLS & Security
12.1 Admin Route Guard
Ensure /admin/* routes are protected:
Check profiles.role = 'admin' on load
If not admin, redirect to / or /unauthorized
Show 403 page if manually navigated
12.2 Supabase RLS Policies
Verify these RLS policies exist (report back which ones are missing):
profiles: admins can read all, users can only read own
applications: admins can read/update all, users only own
institutions: admins can read/update all, public can read approved
scholarships: admins can CRUD, public can read active
reviews: admins can read/update all, users can CRUD own
If any are missing or too permissive, flag them — do NOT modify RLS without explicit instruction.
Step 13: Build & Verify
Run npm run build — must pass with zero errors.
Run npm run start locally.
Log in as admin and verify every page loads:
[ ] /admin — dashboard with stats
[ ] /admin/users — user table with search/filter
[ ] /admin/applications — pending applications visible
[ ] /admin/scholarships — scholarship list
[ ] /admin/bursaries — bursary list
[ ] /admin/institutions — institution approval queue
[ ] /admin/advertisers — advertiser list
[ ] /admin/reviews — review moderation
[ ] /admin/settings — platform config
Test responsive behavior on mobile/tablet widths.
If all pass, commit with message: feat: complete admin dashboard with user, application, scholarship, bursary, institution, advertiser, and review management
Push and confirm Vercel deploy.
Rules
Do NOT break existing admin pages or components.
Do NOT modify RLS policies without explicit permission.
Do NOT remove existing functionality — only add and enhance.
Use existing design tokens (bg-elimux-card, text-muted, border-border, etc.).
Report back exactly which files were created, modified, and which Step 0 audit items were missing.
If a table doesn't exist in Supabase, create a placeholder page and flag it — do NOT create Supabase tables.