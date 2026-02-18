# AR Aging Tracker - Implementation Progress

## Current Status: Phase 3 Complete, Phase 4 Next

Last Updated: February 17, 2026

---

## Completed Phases

### Phase 1: Project Setup & Foundation
**Status**: Complete
**Commit**: 13ee29f

- Project structure and configuration (TypeScript, Vite, Electron)
- SQLite database with complete schema
- React app with routing and navigation
- Basic UI layout with TailwindCSS
- IPC communication layer
- Settings storage with encryption
- Logger utility

---

### Phase 2: Excel Import & AR Calculation
**Status**: Complete
**Commit**: 2b76dfc

- ExcelParser - Reads "Billing _ AR Aging.xlsx" directly
- ARCalculationService - Calculates days overdue, age buckets, and categories
- DataTransformer - Converts Excel rows to Invoice/Customer models
- CustomerRepository & InvoiceRepository - Database operations with batch upserts
- SyncEngine - Orchestrates the full import process
- Dashboard - Displays real AR summary metrics
- InvoicesView - Full invoice table with filtering

**AR Categories**: Critical (>30d & >$7,500), Relevant (>60d & >$2,000), All90 (>90d any amount)
**Age Buckets**: Current, 1-30, 31-60, 61-90, 90+

---

### Phase 2.5: Security & Real Stripe Integration
**Status**: Complete

- ApiKeyManager - Secure API key management with OS-level encryption
- StripeService - Real Stripe API integration (read-only restricted key)
- Payment link generation, customer statements, connection testing
- WSL/Electron compatibility fixes

---

### Phase 3: Customer Views & Stripe Features
**Status**: Complete
**Date**: February 17, 2026

**What was built**:
- **Auto-sync on startup** - Excel data loads automatically, no manual click needed
- **Fixed duplicate invoice bug** - Deterministic IDs based on invoice number; stale data cleared before each import
- **Customer list view** - 173 customers with AR summary (total AR, invoice count, max overdue, worst category), search by name/email, click-to-drill
- **Customer detail view** - Summary cards (Total AR, Open Invoices, Overdue count, ARR), critical invoice alerts, full invoice table
- **Aging statement per customer** - Breakdown by bucket (Current, 1-30, 31-60, 61-90, 90+) with totals
- **Real Stripe payment links** - Copy button calls Stripe API to get hosted_invoice_url, with check feedback icon
- **View in Stripe** links on every invoice row
- **Invoice IDs hidden** from UI (tucked into tooltip on hover)
- **Browser guard** - Shows message when opened in Chrome instead of Electron

**Bug fixes**:
- Fixed Excel file path (was resolving to wrong directory)
- Fixed Total Outstanding inflation caused by duplicate invoices on every sync
- Added unique index on invoice_number to prevent future duplicates

**Result**: 621 invoices and 173 customers from Excel, correct AR totals

---

## Next Phases

### Phase 4: Email System with OAuth
**Priority**: Next
**Status**: Not started

**Goal**: Send collection emails to customers from billing@... email via Google OAuth

**Tasks**:
- [ ] Google OAuth 2.0 setup for billing email (Gmail API)
  - [ ] OAuth consent screen configuration
  - [ ] Credential storage (refresh tokens encrypted via ApiKeyManager)
  - [ ] OAuth flow UI in Settings (authorize/revoke)
- [ ] Resolve customer billing emails
  - [ ] Use Stripe customer ID to fetch billing email from Stripe API
  - [ ] Fall back to Excel email column
  - [ ] Store resolved emails in customers table
- [ ] Email template manager (CRUD operations)
  - [ ] Template variable substitution ({{customer_name}}, {{amount}}, {{days_overdue}}, {{payment_link}})
  - [ ] Pre-built templates: Friendly Reminder, Urgent Notice, Escalation (already in DB)
- [ ] Email composer UI
  - [ ] Select customer -> auto-populate template with their data
  - [ ] Preview before sending
  - [ ] Send via Gmail API (OAuth authenticated)
- [ ] Suggestion engine - who to contact based on AR rules
  - [ ] Priority scoring (high/medium/low)
  - [ ] Suggested template per priority level
- [ ] Email history tracking
  - [ ] Log sent emails to database
  - [ ] Email history view per customer in detail page

**Key dependency**: OAuth token for billing@... email must be granted before sending works.

---

### Phase 5: Dashboard & Multiple AR Views
**Priority**: After Phase 4

Tasks:
- [ ] Enhanced dashboard with charts/graphs (Recharts)
- [ ] Category view with tabs (Critical, Relevant, All90)
- [ ] Customer-grouped view (show total AR per customer)
- [ ] Aging bucket view (collapsible sections)
- [ ] Search functionality across customers and invoices
- [ ] Export to CSV
- [ ] Virtual scrolling for large datasets
- [ ] Dark mode toggle

---

### Phase 6: Polish & Integrations
**Priority**: Final

Tasks:
- [ ] Google Sheets API sync (replace Excel file reading)
- [ ] Settings UI for API keys and OAuth
- [ ] Loading states and error boundaries
- [ ] Toast notifications for user feedback
- [ ] Connection testing for all APIs
- [ ] Error handling and retry logic

---

## Working Features

1. Auto-sync from Excel on startup (621 invoices, 173 customers)
2. Dashboard with AR summary cards (Critical, Relevant, All90)
3. Invoice table with age bucket and category filtering
4. Customer list with AR totals, search, drill-down
5. Customer detail with aging statement breakdown
6. Copy Stripe payment link to clipboard (real API)
7. View in Stripe links
8. Secure API key management (OS-level encryption)

---

## Technical Stack

- **Desktop**: Electron (WSL compatible)
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Database**: SQLite3 (better-sqlite3)
- **Build**: Vite + concurrently
- **Payments**: Stripe API (read-only restricted key)
- **Security**: Electron SafeStorage + OS-level encryption
- **Icons**: Lucide React
- **Date Handling**: date-fns

---

## Running the App

```bash
# Start development server (Vite + Electron)
npm run dev

# Electron desktop app will launch automatically
# NOTE: Must use the Electron window, not browser at localhost:5173

# Rebuild native modules if Node/Electron version changes
npx electron-rebuild -f -w better-sqlite3
```

---

## Notes

- **Electron only**: App requires the Electron window (not Chrome) because it uses IPC to access SQLite, Stripe API, and file system
- **Excel File**: Reading from `Billing _ AR Aging.xlsx` in project root
- **Database**: SQLite DB at `~/.config/ar-aging-tracker/ar-tracker.db`
- **Sync behavior**: Each startup clears and re-imports from Excel (ensures no duplicates)
- **Invoice IDs**: Internal UUIDs hidden from UI; invoice numbers shown only on hover/tooltip
