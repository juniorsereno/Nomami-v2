# Technical Analysis: Public Partners Page & Logo Upload

**Feature**: Public Partners Page & Logo Upload
**Date**: 2025-11-20

## Database Schema

The `parceiros` table requires a new column.
SQL to execute:
```sql
ALTER TABLE parceiros ADD COLUMN logo_url TEXT;
```

## Upload Strategy

To maintain the existing JSON-based architecture of the `AddPartnerForm` and `api/partners` route, we will implement an "Upload First" strategy:

1.  **New Endpoint**: `POST /api/upload`
    - Accepts `multipart/form-data` with a single file field `file`.
    - Validates file type (image) and size (< 5MB).
    - Saves file to `public/uploads/[timestamp]-[filename]`.
    - Returns JSON: `{ url: "/uploads/[timestamp]-[filename]" }`.

2.  **Form Update**: `AddPartnerForm`
    - Add a file input field.
    - On file selection, immediately upload to `/api/upload`.
    - Show a loading state/preview during upload.
    - Store the returned URL in a hidden form field `logo_url`.
    - Submit the form as JSON including `logo_url`.

## Component Architecture

### PartnerCard
- Wraps `Card` from `components/ui/card`.
- Displays `logo_url` using `next/image` (or `img` tag if domain config is tricky, but `next/image` is preferred).
- Fallback to initials if `logo_url` is missing.

### Public Page (`/parceiros`)
- Server Component.
- Fetches data using `getPartners` (updated to include `logo_url`).
- Renders a grid of `PartnerCard`s.
- Responsive: 1 col mobile, 2 cols tablet, 3/4 cols desktop.

## Security Considerations
- **File Validation**: Strictly check MIME types and extensions in `/api/upload`.
- **Path Traversal**: Ensure filenames are sanitized before saving.
- **Public Access**: The `/parceiros` page is public, so ensure no sensitive data (like internal IDs or contact info not meant for public) is leaked in the payload, though the requirements say "list of all partners", implying standard contact info is public.

## Implementation Steps Refinement
The tasks in `tasks.md` are still valid, but T007 (Update Form) now explicitly includes the "upload first" logic.