import fs from 'fs';
import path from 'path';
import { BillItem } from '@/types/bill';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bills.json');
const STORAGE_DIR = path.join(DATA_DIR, 'bills');

// Garante que os diretórios existam
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllBills(): BillItem[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as BillItem[];
  } catch (error) {
    console.error('Erro ao ler bills.json:', error);
    return [];
  }
}

export function saveBill(bill: BillItem): BillItem {
  ensureStorage();
  const bills = getAllBills();
  const existingIndex = bills.findIndex((b) => b.id === bill.id);

  if (existingIndex >= 0) {
    bills[existingIndex] = bill;
  } else {
    bills.unshift(bill);
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(bills, null, 2), 'utf-8');
  return bill;
}

export function saveBills(newBills: BillItem[]): void {
  ensureStorage();
  const bills = getAllBills();
  const existingIds = new Set(bills.map((b) => b.id));

  for (const bill of newBills) {
    if (!existingIds.has(bill.id)) {
      bills.unshift(bill);
      existingIds.add(bill.id);
    }
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(bills, null, 2), 'utf-8');
}

export function getBillsStorageDir(): string {
  ensureStorage();
  return STORAGE_DIR;
}
