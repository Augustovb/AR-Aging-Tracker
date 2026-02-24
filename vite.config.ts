import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

function stripeApiPlugin(stripeKey: string): Plugin {
  return {
    name: 'stripe-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/stripe\/statement\/(cus_[a-zA-Z0-9]+)$/);
        if (!match || req.method !== 'GET') return next();

        const customerId = match[1];

        if (!stripeKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'STRIPE_API_KEY not configured' }));
          return;
        }

        try {
          // Fetch all invoices with pagination
          const allInvoices: any[] = [];
          let hasMore = true;
          let startingAfter: string | undefined;

          while (hasMore) {
            const params = new URLSearchParams({
              customer: customerId,
              limit: '100',
            });
            if (startingAfter) params.set('starting_after', startingAfter);

            const response = await fetch(
              `https://api.stripe.com/v1/invoices?${params.toString()}`,
              {
                headers: {
                  Authorization: `Bearer ${stripeKey}`,
                },
              }
            );

            if (!response.ok) {
              const err = await response.json();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.error?.message || 'Stripe API error' }));
              return;
            }

            const data = await response.json();
            allInvoices.push(...data.data);
            hasMore = data.has_more;
            if (hasMore && data.data.length > 0) {
              startingAfter = data.data[data.data.length - 1].id;
            }
          }

          // Convert to CSV
          const formatDate = (ts: number | null) =>
            ts ? new Date(ts * 1000).toISOString().split('T')[0] : '';

          const header = [
            'Invoice Number',
            'Invoice ID',
            'Status',
            'Currency',
            'Amount Due',
            'Amount Paid',
            'Amount Remaining',
            'Created Date',
            'Due Date',
            'Paid Date',
            'Description',
            'Hosted Invoice URL',
          ];

          const rows = allInvoices.map((inv) => [
            inv.number || '',
            inv.id,
            inv.status || '',
            (inv.currency || '').toUpperCase(),
            (inv.amount_due / 100).toFixed(2),
            (inv.amount_paid / 100).toFixed(2),
            (inv.amount_remaining / 100).toFixed(2),
            formatDate(inv.created),
            formatDate(inv.due_date),
            formatDate(inv.status_transitions?.paid_at ?? null),
            (inv.description || '').replace(/"/g, '""'),
            inv.hosted_invoice_url || '',
          ]);

          const csv = [header, ...rows]
            .map((r) => r.map((c) => `"${c}"`).join(','))
            .join('\n');

          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="stripe-statement-${customerId}.csv"`
          );
          res.end(csv);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), stripeApiPlugin(env.STRIPE_API_KEY || '')],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@renderer': path.resolve(__dirname, './src/renderer'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
