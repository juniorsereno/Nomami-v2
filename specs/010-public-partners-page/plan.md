# Implementation Plan: Public Partners Page & Logo Upload

**Branch**: `010-public-partners-page` | **Date**: 2025-11-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-public-partners-page/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a public-facing partners page (`/parceiros`) listing all active partners with a modern grid layout. Enable administrators to upload logo images for partners, which will be stored locally and displayed on the public page.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15.5.6, React 19
**Primary Dependencies**: Tailwind CSS 4, Shadcn UI, @neondatabase/serverless
**Storage**: Neon (PostgreSQL), Local Filesystem (for images)
**Testing**: Manual Testing (No automated framework configured)
**Target Platform**: Web (Next.js App Router)
**Project Type**: Web Application
**Performance Goals**: Public page load < 1.5s
**Constraints**: Images stored locally (localhost requirement)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Follows project structure (Next.js App Router)
- [x] Uses existing database connection (Neon)
- [x] Uses existing UI library (Shadcn UI)

## Project Structure

### Documentation (this feature)

```text
specs/010-public-partners-page/
├── plan.md              # This file
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
nomami-app/
├── app/
│   ├── parceiros/
│   │   └── page.tsx             # New public page
│   └── api/
│       └── upload/
│           └── route.ts         # New API route for image upload
├── components/
│   └── partner-card.tsx         # New component for partner display
├── lib/
│   └── queries.ts               # Update to fetch logo_url
└── public/
    └── uploads/                 # Directory for storing partner logos
```

**Structure Decision**:
- **Public Page**: Placed in `app/parceiros/page.tsx` to be accessible at `/parceiros`.
- **Upload API**: Dedicated route `app/api/upload/route.ts` to handle file processing separate from partner data logic.
- **Storage**: Using `public/uploads` allows direct serving of images by Next.js without complex routing, satisfying the "localhost" storage requirement.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Local Filesystem Storage | User Requirement | Cloud storage (S3/Blob) would be more robust for production but user specifically requested localhost storage. |
