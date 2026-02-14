
# Integration of Uploaded Reference Files

## Analysis

You uploaded 10 reference files from another AI covering two areas. Here's what applies to your project and what doesn't:

### Area 1: Fighter/Gym Management (database-schema-2.sql, peleadorService, usePeleadores, ListaPeleadores, PerfilPeleador)

**Status: Already handled.** These files propose creating new tables `peleadores` and `gimnasios`, but your project already uses `fighter_profiles` and `gyms`. The gym synchronization work we just completed (gym selector in admin forms, unique index, data normalization) already covers the core problems these files solve. The `peleador_gimnasio_historial` concept is interesting but your project already has a similar mechanism through the `FighterGymTab` component and `gym_memberships` table.

**No action needed** for these files.

### Area 2: TipTap Email Editor (EmailEditor.tsx, ImageResize.tsx, emailCampaignService.ts, useEmailCampaigns.ts, database-email-campaigns.sql, useDebounce.ts)

**Status: Ready to implement.** This matches the previously approved plan for upgrading the email editor from `contentEditable` to TipTap. The reference files provide solid implementations that need adaptation to work with your existing architecture.

---

## Implementation Plan: TipTap Email Editor

### Step 1: Database - Create email drafts tables

Create the tables needed for the drafts/editor workflow. The existing `email_campaign_log` and `email_sends` tables stay as-is (they handle sent campaign history). New tables:

| Table | Purpose |
|-------|---------|
| `email_campaigns_v2` | Draft campaigns with auto-save, editor JSON content, status |
| `email_campaign_images` | Image metadata for campaign images |
| `email_templates` | Reusable email templates |

Also create the `email-campaign-images` storage bucket.

RLS policies will use the project's existing `has_role` function instead of the `auth.jwt() ->> 'role'` pattern from the reference SQL.

### Step 2: Install TipTap dependencies

13 packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`, `@tiptap/extension-text-style`, `@tiptap/extension-color`, `@tiptap/extension-highlight`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`

### Step 3: Create components

Adapt from the uploaded files:

- `src/components/email/ImageResize.tsx` - Drag-to-resize image NodeView (from uploaded ImageResize.tsx)
- `src/components/email/EmailTipTapEditor.tsx` - Full TipTap editor with toolbar, preview mode, auto-save (from uploaded EmailEditor.tsx)
- `src/hooks/useDebounce.ts` - Already exists concept, create if missing
- `src/services/emailCampaignService.ts` - CRUD for drafts, adapted to use `email_campaigns_v2`
- `src/hooks/useEmailCampaignEditor.ts` - React Query hooks for drafts

### Step 4: Rewrite EmailCampaignEditor page

Replace the current `contentEditable` div in `src/pages/admin/EmailCampaignEditor.tsx` with the TipTap editor. Keep existing recipient selection (FighterSegmentSelector, EmailRecipientSelector) and the send-mass-email integration.

Add tabs: "Contenido" (TipTap editor) and "Configuracion" (recipients, subject, test mode).

### Step 5: Update EmailCampaigns list page

Add a "Borradores" (Drafts) section to `src/pages/admin/EmailCampaigns.tsx` showing drafts from `email_campaigns_v2` alongside the existing sent campaign history from `email_campaign_log`.

---

## Technical Details

### Key adaptations from reference files

1. **RLS**: Reference uses `auth.jwt() ->> 'role' = 'admin'` which won't work. Will use `public.has_role(auth.uid(), 'admin')` instead.
2. **Table naming**: Reference uses `email_campaigns` but that could conflict with future needs. Will use `email_campaigns_v2` for drafts.
3. **Storage**: Reference bucket `email-campaign-images` is fine. The existing `email-assets` bucket stays for backward compatibility.
4. **Auto-save flow**: 2-second debounce to DB + localStorage backup, exactly as the uploaded EmailEditor.tsx implements.

### Files to create

| File | Source |
|------|--------|
| `src/components/email/ImageResize.tsx` | Adapted from uploaded ImageResize.tsx |
| `src/components/email/EmailTipTapEditor.tsx` | Adapted from uploaded EmailEditor.tsx |
| `src/services/emailCampaignService.ts` | Adapted from uploaded emailCampaignService.ts |
| `src/hooks/useEmailCampaignEditor.ts` | Adapted from uploaded useEmailCampaigns.ts |
| `src/hooks/useDebounce.ts` | From uploaded useDebounce.ts |

### Files to modify

| File | Change |
|------|--------|
| `src/pages/admin/EmailCampaignEditor.tsx` | Full rewrite with TipTap |
| `src/pages/admin/EmailCampaigns.tsx` | Add drafts section |

### Data flow

```text
Admin creates campaign
  -> INSERT into email_campaigns_v2 (estado: borrador)
  -> TipTap editor loads
  -> Auto-save every 2s -> UPDATE email_campaigns_v2
  -> Images uploaded -> Storage bucket + INSERT email_campaign_images
  -> Admin configures recipients and subject
  -> Click "Enviar"
  -> Calls send-mass-email edge function (existing)
  -> Logged in email_campaign_log (existing history)
  -> Draft status changes to "enviada"
```
