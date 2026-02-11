-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  arr REAL,
  tenant TEXT,
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe ON customers(stripe_customer_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  days_overdue INTEGER NOT NULL DEFAULT 0,
  age_bucket TEXT NOT NULL,
  category TEXT,
  stripe_invoice_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_age_bucket ON invoices(age_bucket);
CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category);
CREATE INDEX IF NOT EXISTS idx_invoices_days_overdue ON invoices(days_overdue);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email history table
CREATE TABLE IF NOT EXISTS email_history (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  template_id TEXT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (template_id) REFERENCES email_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_email_history_customer ON email_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);

-- Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  records_synced INTEGER DEFAULT 0,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(started_at);

-- App metadata table
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default email templates
INSERT OR IGNORE INTO email_templates (id, name, subject, body, type) VALUES
('tpl_friendly', 'Friendly Reminder', 'Payment Reminder: Invoice {{invoice_number}}',
'Hi {{customer_name}},

I hope this email finds you well. I wanted to reach out regarding Invoice {{invoice_number}} for {{amount}}, which is now {{days_overdue}} days overdue.

Could you please let me know the status of this payment? If you have any questions or need assistance, I''m here to help.

Payment link: {{payment_link}}

Best regards', 'reminder'),

('tpl_urgent', 'Urgent Payment Notice', 'Urgent: Overdue Invoice {{invoice_number}}',
'Hi {{customer_name}},

This is an urgent notice regarding Invoice {{invoice_number}} for {{amount}}, which has been outstanding for {{days_overdue}} days.

Please arrange payment as soon as possible to avoid any service interruption.

Payment link: {{payment_link}}

If payment has already been made, please disregard this notice and send us confirmation.

Best regards', 'urgent'),

('tpl_escalation', 'Payment Escalation', 'Final Notice: Invoice {{invoice_number}}',
'Hi {{customer_name}},

Despite previous reminders, Invoice {{invoice_number}} for {{amount}} remains unpaid after {{days_overdue}} days.

This is our final notice before we escalate this matter further. Please arrange immediate payment to resolve this issue.

Payment link: {{payment_link}}

If you are experiencing difficulties with payment, please contact us immediately to discuss options.

Best regards', 'escalation');
