import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Sync
  startSync: () => ipcRenderer.invoke('sync:start'),
  getSyncHistory: () => ipcRenderer.invoke('sync:history'),

  // Invoices
  getAllInvoices: (filters?: any) => ipcRenderer.invoke('invoices:getAll', filters),
  getInvoiceById: (id: string) => ipcRenderer.invoke('invoices:getById', id),
  getInvoicesByCustomer: (customerId: string) => ipcRenderer.invoke('invoices:getByCustomer', customerId),
  getInvoiceSummary: () => ipcRenderer.invoke('invoices:getSummary'),

  // Customers
  getAllCustomers: () => ipcRenderer.invoke('customers:getAll'),
  getCustomerById: (id: string) => ipcRenderer.invoke('customers:getById', id),
  getCustomersWithOverdue: () => ipcRenderer.invoke('customers:getWithOverdueInvoices'),

  // Email
  getEmailTemplates: () => ipcRenderer.invoke('email:getTemplates'),
  getEmailTemplateById: (id: string) => ipcRenderer.invoke('email:getTemplateById', id),
  saveEmailTemplate: (template: any) => ipcRenderer.invoke('email:saveTemplate', template),
  getEmailSuggestions: () => ipcRenderer.invoke('email:getSuggestions'),
  sendEmail: (emailData: any) => ipcRenderer.invoke('email:send', emailData),
  getEmailHistory: (customerId?: string) => ipcRenderer.invoke('email:getHistory', customerId),

  // Stripe
  getPaymentLink: (invoiceId: string) => ipcRenderer.invoke('stripe:getPaymentLink', invoiceId),
  getCustomerStatement: (customerId: string) => ipcRenderer.invoke('stripe:getCustomerStatement', customerId),
});

// Type declarations for TypeScript
export interface ElectronAPI {
  getSetting: (key: string) => Promise<any>;
  setSetting: (key: string, value: any) => Promise<{ success: boolean }>;
  getAllSettings: () => Promise<any>;
  startSync: () => Promise<{ success: boolean; message?: string }>;
  getSyncHistory: () => Promise<any[]>;
  getAllInvoices: (filters?: any) => Promise<any[]>;
  getInvoiceById: (id: string) => Promise<any>;
  getInvoicesByCustomer: (customerId: string) => Promise<any[]>;
  getInvoiceSummary: () => Promise<any>;
  getAllCustomers: () => Promise<any[]>;
  getCustomerById: (id: string) => Promise<any>;
  getCustomersWithOverdue: () => Promise<any[]>;
  getEmailTemplates: () => Promise<any[]>;
  getEmailTemplateById: (id: string) => Promise<any>;
  saveEmailTemplate: (template: any) => Promise<{ success: boolean }>;
  getEmailSuggestions: () => Promise<any[]>;
  sendEmail: (emailData: any) => Promise<{ success: boolean }>;
  getEmailHistory: (customerId?: string) => Promise<any[]>;
  getPaymentLink: (invoiceId: string) => Promise<string>;
  getCustomerStatement: (customerId: string) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
