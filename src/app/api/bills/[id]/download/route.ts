import { NextResponse } from 'next/server';
import { getAllBills, getBillsStorageDir } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bills = getAllBills();
    const bill = bills.find((b) => b.id === id);

    if (!bill) {
      return NextResponse.json({ error: 'Comprovante não encontrado' }, { status: 404 });
    }

    const filePath = path.join(getBillsStorageDir(), bill.storedFilePath);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo físico não encontrado' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(bill.originalFileName)}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
