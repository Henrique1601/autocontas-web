import { NextResponse } from 'next/server';
import { getAllBillsAsync, saveBillAsync, getBillsStorageDir } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BillItem } from '@/types/bill';
import { detectProvider } from '@/lib/parser';

export async function GET() {
  try {
    const bills = await getAllBillsAsync();
    return NextResponse.json({ success: true, bills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Upload manual de comprovante com auto-organização
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const providerParam = formData.get('provider') as string | null;
    const amountParam = formData.get('amount') as string | null;
    const dueDateParam = formData.get('dueDate') as string | null;
    const refMonthParam = formData.get('referenceMonth') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const storageDir = getBillsStorageDir();

    const detected = detectProvider(file.name + ' ' + (providerParam || ''));
    const finalProvider = (providerParam as any) || detected.provider;
    const finalCategory = detected.category;

    const safeFileName = `upload_${finalProvider.toLowerCase()}_${hash.substring(0, 8)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const targetPath = path.join(storageDir, safeFileName);

    fs.writeFileSync(targetPath, buffer);

    const today = new Date();
    const bill: BillItem = {
      id: hash,
      provider: finalProvider,
      category: finalCategory,
      amount: amountParam ? parseFloat(amountParam) : 0,
      dueDate: dueDateParam || `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
      referenceMonth: refMonthParam || `${today.getMonth() + 1}/${today.getFullYear()}`,
      status: 'A_VENCER',
      originalFileName: file.name,
      storedFilePath: safeFileName,
      fileSize: file.size,
      receivedAt: new Date().toISOString(),
      source: 'UPLOAD',
    };

    await saveBillAsync(bill);

    return NextResponse.json({ success: true, bill });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
