export type Provider = 'CPFL' | 'SABESP' | 'VIVO' | 'OUTROS';

export type BillCategory = 'Luz' | 'Agua' | 'Internet' | 'Outros';

export interface BillItem {
  id: string;
  provider: Provider;
  category: BillCategory;
  accountNumber?: string;
  referenceMonth: string; // Ex: "10/2026" ou "2026-10"
  dueDate: string; // "YYYY-MM-DD" ou "DD/MM/YYYY"
  amount: number; // Ex: 145.80
  barcode?: string;
  status: 'PAGO' | 'A_VENCER' | 'VENCIDO';
  originalFileName: string;
  storedFilePath: string;
  fileSize: number;
  receivedAt: string; // ISO date
  source: 'EMAIL' | 'SCRAPING' | 'UPLOAD';
}

export interface SyncResult {
  success: boolean;
  message: string;
  totalFound: number;
  newBills: BillItem[];
}
