# PassProve — client portal and verification integration

A Next.js/Supabase client-portal variant combining account management, e-shop configuration and verification UI.

**Status:** Legacy/parallel PassProve implementation retained for reference; not presented as the canonical production release.

## Scope

- Dashboard, shops, account, customization and support pages.
- Verification and invoice API route source.
- Face/OCR-related UI and model assets.

## Technology

Next.js, React, TypeScript, Tailwind CSS, Supabase.

## Architecture and source map

- `app/` — primary Next.js routes
- `api/` — parallel API source layout
- `components/` — portal components
- `lib/` — application helpers

## Local development

Requires Node.js and npm. From the repository root:

```sh
npm install
npm run dev
```

Build command declared by this checkout: `npm run build`.

These are the repository scripts, not a claim of a passing build. Dependency installation, build and live integrations were not executed during the documentation review.

## Configuration and limitations

Parallel route copies and committed generated content under `client/.next/` are present. Route files outside the framework route directory are not automatically active endpoints. Validate the active implementation before consolidation. Provider credentials, database policies and real verification results have not been validated.

## Documentation next steps

Capture screenshots using synthetic data, document a reproducible test run, and record which integrations have been verified. Keep credentials and deployment-specific configuration outside version control.
