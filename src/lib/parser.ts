import { Provider, BillCategory } from '@/types/bill';

// Mapeador de remetentes e títulos para identificar concessionárias
export function detectProvider(text: string): { provider: Provider; category: BillCategory } {
  const normalized = text.toLowerCase();

  if (normalized.includes('cpfl') || normalized.includes('energia') || normalized.includes('eletropaulo')) {
    return { provider: 'CPFL', category: 'Luz' };
  }
  if (normalized.includes('sabesp') || normalized.includes('saneamento') || normalized.includes('sanepar')) {
    return { provider: 'SABESP', category: 'Agua' };
  }
  if (normalized.includes('vivo') || normalized.includes('telefônica') || normalized.includes('claro') || normalized.includes('tim')) {
    return { provider: 'VIVO', category: 'Internet' };
  }

  return { provider: 'OUTROS', category: 'Outros' };
}

// Extrai valores (R$ 123,45) do texto do PDF ou corpo do e-mail
export function extractAmount(text: string): number {
  // Procura por "Total a pagar", "Valor", "Valor a pagar" etc
  const match = text.match(/(?:total|valor|a pagar|vencimento)?\s*R?\$?\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i);
  if (match && match[1]) {
    const rawVal = match[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(rawVal);
    if (!isNaN(val) && val > 0) return val;
  }
  return 0;
}

// Extrai data de vencimento (DD/MM/AAAA)
export function extractDueDate(text: string): string {
  const match = text.match(/(?:vencimento|venc|pagar at[eé])\D*([0-3][0-9]\/[0-1][0-9]\/20[2-3][0-9])/i);
  if (match && match[1]) {
    return match[1];
  }

  // Tenta achar qualquer data futura/recente
  const genericMatch = text.match(/([0-3][0-9]\/[0-1][0-9]\/20[2-3][0-9])/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1];
  }

  const today = new Date();
  return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
}

// Extrai mês de referência (Ex: Outubro/2026 ou 10/2026)
export function extractReferenceMonth(text: string): string {
  const match = text.match(/(?:m[eê]s|refer[eê]ncia|ref)\D*([0-1][0-9]\/20[2-3][0-9])/i);
  if (match && match[1]) {
    return match[1];
  }

  const today = new Date();
  return `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
}
