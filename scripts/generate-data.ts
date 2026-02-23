/**
 * One-time script to generate static JSON data from the Excel file.
 * Run with: npx tsx scripts/generate-data.ts
 */
import * as XLSX from 'xlsx';
import { differenceInDays } from 'date-fns';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// --- Types ---
type AgeBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';
type ARCategory = 'critical' | 'relevant' | 'all90';

interface Invoice {
  id: string;
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'open';
  days_overdue: number;
  age_bucket: AgeBucket;
  category: ARCategory | null;
  stripe_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  arr: number | null;
  tenant: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- AR Calculation ---
function excelDateToJSDate(excelDate: number): Date {
  const EXCEL_EPOCH = new Date(1899, 11, 30);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(EXCEL_EPOCH.getTime() + excelDate * MS_PER_DAY);
}

function calculateDaysOverdue(dueDate: Date): number {
  return Math.max(0, differenceInDays(new Date(), dueDate));
}

function assignAgeBucket(daysOverdue: number): AgeBucket {
  if (daysOverdue === 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

function categorizeInvoice(daysOverdue: number, amount: number): ARCategory | null {
  if (daysOverdue > 90) return 'all90';
  if (daysOverdue > 30 && amount > 7500) return 'critical';
  if (daysOverdue > 60 && amount > 2000) return 'relevant';
  if (daysOverdue > 0) return 'standard';
  return null;
}

function parseARR(value: any): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// --- Main ---
const excelPath = resolve(__dirname, '..', 'Billing _ AR Aging.xlsx');
console.log(`Reading Excel file: ${excelPath}`);

const workbook = XLSX.readFile(excelPath);

// The "AR | All" sheet has:
//   Row 0-4: metadata (Days Overdue, Value, Total, blank, "Invoices" label)
//   Row 5: column headers (Stripe Link, Client Name, Invoice #, Cus_id, ...)
//   Row 6+: actual data
const sheet = workbook.Sheets['AR | All'];
const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Header row is index 5
const headers = rawRows[5] as string[];
console.log('Column headers:', headers);

// Data rows start at index 6
const dataRows = rawRows.slice(6).filter(row => row.length > 1);
console.log(`Data rows: ${dataRows.length}`);

const customers = new Map<string, Customer>();
const invoices: Invoice[] = [];
const now = new Date().toISOString();

// Map headers to indices
const col = (name: string) => headers.indexOf(name);

for (const row of dataRows) {
  const invoiceNumber = row[col('Invoice #')];
  const dueDateRaw = row[col('Due Date Day')];
  const valueRaw = row[col('Value')];

  if (!invoiceNumber || !dueDateRaw || !valueRaw) continue;

  const customerId = row[col('Cus_id')] || `cus_unknown`;
  const customerName = row[col('Client Name')] || 'Unknown';
  const customerEmail = row[col('Email')] || null;
  const customerARR = parseARR(row[col("Customer's ARR")]);

  if (!customers.has(customerId)) {
    customers.set(customerId, {
      id: customerId,
      name: customerName,
      email: customerEmail,
      arr: customerARR,
      tenant: null,
      stripe_customer_id: customerId.startsWith('cus_') ? customerId : null,
      created_at: now,
      updated_at: now,
    });
  }

  const dueDate = typeof dueDateRaw === 'number'
    ? excelDateToJSDate(dueDateRaw)
    : new Date(dueDateRaw);

  const createdDateRaw = row[col('Invoice Created At Day')];
  const createdDate = createdDateRaw
    ? (typeof createdDateRaw === 'number' ? excelDateToJSDate(createdDateRaw) : new Date(createdDateRaw))
    : new Date();

  const daysOverdue = calculateDaysOverdue(dueDate);
  const ageBucket = assignAgeBucket(daysOverdue);
  const amount = typeof valueRaw === 'number'
    ? valueRaw
    : parseFloat(String(valueRaw).replace(/[^0-9.-]/g, '')) || 0;

  invoices.push({
    id: `inv_${String(invoiceNumber)}`,
    customer_id: customerId,
    customer_name: customerName,
    invoice_number: String(invoiceNumber),
    amount,
    currency: (row[col('Currency')] || 'usd').toLowerCase(),
    due_date: dueDate.toISOString(),
    status: 'open',
    days_overdue: daysOverdue,
    age_bucket: ageBucket,
    category: categorizeInvoice(daysOverdue, amount),
    stripe_invoice_id: String(invoiceNumber),
    created_at: createdDate.toISOString(),
    updated_at: now,
  });
}

const customersArray = Array.from(customers.values());

const outDir = resolve(__dirname, '..', 'src', 'data');
writeFileSync(resolve(outDir, 'customers.json'), JSON.stringify(customersArray, null, 2));
writeFileSync(resolve(outDir, 'invoices.json'), JSON.stringify(invoices, null, 2));

console.log(`Generated ${customersArray.length} customers → src/data/customers.json`);
console.log(`Generated ${invoices.length} invoices → src/data/invoices.json`);
