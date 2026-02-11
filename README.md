# AR Aging Tracker

A desktop application for managing and tracking overdue Accounts Receivable (AR) invoices.

## Features

- **Track overdue invoices** from Google Sheets data
- **Categorize AR** into Critical, Relevant, and All Over 90 categories
- **Integrate with Stripe** to fetch payment links and account statements
- **Automate email suggestions** for dunning customers
- **Send manual emails** using customizable templates
- **Visualize AR data** through multiple dashboard views

## Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Database**: SQLite3
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Copy `.env.example` to `.env`
2. Configure your Google Sheets ID
3. Add your Stripe API key
4. Set up SMTP credentials for email sending

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Package application
npm run package
```

## License

MIT
