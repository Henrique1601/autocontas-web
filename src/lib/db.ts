import fs from 'fs';
import path from 'path';
import { BillItem } from '@/types/bill';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'bills.json');
const STORAGE_DIR = path.join(DATA_DIR, 'bills');

// Verifica se há credenciais do Supabase configuradas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

function ensureLocalStorage() {
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

// ==========================================
// Busca de Comprovantes
// ==========================================
export async function getAllBillsAsync(): Promise<BillItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar do Supabase, revertendo para local:', error.message);
      } else if (data) {
        return data.map((row: any) => ({
          id: row.id,
          provider: row.provider,
          category: row.category,
          accountNumber: row.account_number,
          referenceMonth: row.reference_month,
          dueDate: row.due_date,
          amount: parseFloat(row.amount) || 0,
          barcode: row.barcode,
          status: row.status,
          originalFileName: row.original_file_name,
          storedFilePath: row.stored_file_path,
          fileSize: Number(row.file_size) || 0,
          receivedAt: row.received_at,
          source: row.source,
        }));
      }
    } catch (err) {
      console.error('Falha de conexão Supabase:', err);
    }
  }

  // Fallback para arquivo JSON local
  ensureLocalStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as BillItem[];
  } catch (error) {
    return [];
  }
}

export function getAllBills(): BillItem[] {
  ensureLocalStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as BillItem[];
  } catch (error) {
    return [];
  }
}

// ==========================================
// Salvar Comprovante
// ==========================================
export async function saveBillAsync(bill: BillItem): Promise<BillItem> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('bills').upsert({
        id: bill.id,
        provider: bill.provider,
        category: bill.category,
        account_number: bill.accountNumber,
        reference_month: bill.referenceMonth,
        due_date: bill.dueDate,
        amount: bill.amount,
        barcode: bill.barcode,
        status: bill.status,
        original_file_name: bill.originalFileName,
        stored_file_path: bill.storedFilePath,
        file_size: bill.fileSize,
        received_at: bill.receivedAt,
        source: bill.source,
        updated_at: new Date().toISOString(),
      });

      if (error) console.error('Erro ao salvar no Supabase:', error.message);
    } catch (err) {
      console.error('Falha ao salvar no Supabase:', err);
    }
  }

  // Salva também localmente
  ensureLocalStorage();
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

export function saveBill(bill: BillItem): BillItem {
  ensureLocalStorage();
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

export async function saveBillsAsync(newBills: BillItem[]): Promise<void> {
  for (const bill of newBills) {
    await saveBillAsync(bill);
  }
}

export function saveBills(newBills: BillItem[]): void {
  ensureLocalStorage();
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
  ensureLocalStorage();
  return STORAGE_DIR;
}
