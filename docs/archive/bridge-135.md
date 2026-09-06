=== CYCLE 051 — ADMIN USERS: BULK DELETE ONLY ===

## AUDIT OF CURRENT STATE

**Already Built & Live (b710811, origin/main):**
- `src/app/admin/users/page.tsx` — fully functional admin users page
- Search, filter, sort, pagination all working
- Bulk activate/suspend already implemented via `handleBulkStatus`
- Individual delete per row via `deleteAdminUser(id, adminKey)`
- CSV export working
- Auth gate: client-side `x-admin-key` header via `AdminKeyProvider`, verified against `NEXT_PUBLIC_API_URL/api/admin/verify`
- Data fetched via `@/lib/api` (`fetchAdminUsers`, `updateAdminUserStatus`, `deleteAdminUser`)

**Real Gap:**
- No bulk delete. Individual delete exists per row, but no way to select multiple users and delete them at once.

**What NOT to touch:**
- Do NOT replace the existing page architecture
- Do NOT add a new `/api/admin/users/bulk-delete` API route
- Do NOT use `supabase.auth.admin.deleteUser()` directly
- Do NOT change auth gating — the `x-admin-key` mechanism stays exactly as is

## WHAT CLAUDE MUST DO

### STEP 1: Add bulk delete to existing admin users page

**File to modify:** `src/app/admin/users/page.tsx`

Find the existing `handleBulkStatus` function. Add a new `handleBulkDelete` function immediately after it, following the exact same pattern:

```tsx
const handleBulkDelete = async () => {
  if (!adminKey) {
    toast({ title: 'Admin key required', variant: 'destructive' });
    return;
  }
  if (selectedRows.size === 0) {
    toast({ title: 'No users selected', variant: 'destructive' });
    return;
  }
  
  const count = selectedRows.size;
  if (!confirm(`Permanently delete ${count} user(s)? This cannot be undone.`)) {
    return;
  }
  
  setIsLoading(true);
  const ids = Array.from(selectedRows);
  
  const results = await Promise.allSettled(
    ids.map(id => deleteAdminUser(id, adminKey))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  if (failed > 0) {
    toast({ 
      title: `Deleted ${succeeded} of ${count} users`, 
      description: `${failed} failed. Check console for details.`,
      variant: 'destructive' 
    });
  } else {
    toast({ title: `Deleted ${succeeded} user(s) successfully` });
  }
  
  setSelectedRows(new Set());
  await loadUsers(); // Refresh the table
  setIsLoading(false);
};
Note: Ensure deleteAdminUser is already imported from @/lib/api. If not, add it to the import statement.
STEP 2: Wire bulk delete into the DataTable bulk actions
Find where bulkActions is passed to the DataTable component (or wherever the bulk action buttons are rendered). Add a delete button alongside the existing activate/suspend buttons.
If the bulk actions are rendered inline in the page, add this button:
tsx
{selectedRows.size > 0 && (
  <button
    onClick={handleBulkDelete}
    disabled={isLoading}
    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    Delete ({selectedRows.size})
  </button>
)}
If bulk actions are passed as a prop array to DataTable, add an entry like:
tsx
{
  label: `Delete (${selectedRows.size})`,
  onClick: handleBulkDelete,
  variant: 'danger',
  icon: 'trash',
  disabled: isLoading,
}
Use whatever pattern already exists in the file. Do not refactor the DataTable component itself — just add the delete action using the same pattern as activate/suspend.
STEP 3: Add self-deletion guard
In handleBulkDelete, before calling deleteAdminUser, check if the current admin's own user ID is in the selection. If so, show a toast and abort:
tsx
// Add this inside handleBulkDelete, before the confirm() dialog:
const currentUserId = /* however the page gets the current user's ID */;
if (ids.includes(currentUserId)) {
  toast({ 
    title: 'Cannot delete yourself', 
    description: 'Remove your own account from the selection.',
    variant: 'destructive' 
  });
  return;
}
If the page doesn't already have access to the current user's ID, find how it's obtained (likely from a user context or auth hook) and use that same source.
VERIFICATION CHECKLIST
After Claude applies the changes:
Build: npm run build — must pass with zero errors.
Type check: npx tsc --noEmit — must be clean.
UI test: Visit /admin/users. Confirm:
[ ] Bulk "Delete (N)" button appears when 1+ rows are selected
[ ] Button styling is red/danger, consistent with delete semantics
[ ] Button shows the correct selected count
Self-guard test: Select your own admin account + one other user. Click Delete. Confirm toast says "Cannot delete yourself" and no deletion occurs.
Bulk delete test (use test accounts only): Select 2-3 test user accounts. Click Delete. Confirm:
[ ] Confirmation dialog appears with correct count
[ ] After confirming, toast shows success count
[ ] Deleted users disappear from the table after refresh
[ ] selectedRows is cleared after operation
Partial failure test: If possible, try deleting one valid user ID + one non-existent ID. Confirm:
[ ] The valid user is deleted
[ ] Toast reports partial success (e.g., "Deleted 1 of 2 users, 1 failed")
No regression: Confirm existing features still work:
[ ] Search still filters
[ ] Sort still toggles
[ ] Bulk activate/suspend still works
[ ] Individual row delete still works
[ ] CSV export still works
Do NOT commit or push until all 7 items are checked.