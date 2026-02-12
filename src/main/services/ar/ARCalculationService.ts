import { differenceInDays } from 'date-fns';
import type { AgeBucket, ARCategory, Invoice } from '../../types/models';

export class ARCalculationService {
  /**
   * Calculate days overdue from due date
   */
  static calculateDaysOverdue(dueDate: Date): number {
    const today = new Date();
    const days = differenceInDays(today, dueDate);
    return Math.max(0, days); // Don't return negative numbers for future due dates
  }

  /**
   * Assign age bucket based on days overdue
   */
  static assignAgeBucket(daysOverdue: number): AgeBucket {
    if (daysOverdue === 0) return 'current';
    if (daysOverdue <= 30) return '1-30';
    if (daysOverdue <= 60) return '31-60';
    if (daysOverdue <= 90) return '61-90';
    return '90+';
  }

  /**
   * Categorize invoice based on AR rules:
   * - Critical: >30 days overdue AND >$7,500
   * - Relevant: >60 days overdue AND >$2,000
   * - All90: >90 days overdue (any amount)
   */
  static categorizeInvoice(invoice: Invoice): ARCategory | null {
    const { days_overdue, amount } = invoice;

    // All90: >90 days overdue (any amount)
    if (days_overdue > 90) {
      return 'all90';
    }

    // Critical: >30 days overdue AND >$7,500
    if (days_overdue > 30 && amount > 7500) {
      return 'critical';
    }

    // Relevant: >60 days overdue AND >$2,000
    if (days_overdue > 60 && amount > 2000) {
      return 'relevant';
    }

    return null;
  }

  /**
   * Convert Excel date serial number to JavaScript Date
   * Excel dates are days since 1900-01-01
   */
  static excelDateToJSDate(excelDate: number): Date {
    const EXCEL_EPOCH = new Date(1899, 11, 30); // Dec 30, 1899
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return new Date(EXCEL_EPOCH.getTime() + excelDate * MS_PER_DAY);
  }

  /**
   * Format date to ISO string for database storage
   */
  static formatDate(date: Date): string {
    return date.toISOString();
  }
}
