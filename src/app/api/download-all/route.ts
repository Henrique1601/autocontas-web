import { NextResponse } from 'next/server';
import { getAllBills, getBillsStorageDir } from '@/lib/db';
import * as archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // ex: "10/2026"
    const provider = searchParams.get('provider');

    let bills = getAllBills();

    if (month) {
      bills = bills.filter((b) => b.referenceMonth === month);
    }
    if (provider) {
      bills = bills.filter((b) => b.provider === provider);
    }

    if (bills.length === 0) {
      return NextResponse.json({ error: 'Nenhum comprovante encontrado para o filtro' }, { status: 404 });
    }

    const archiveFunc = (archiver as any).default || archiver;
    const archive = archiveFunc('zip', { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    const storageDir = getBillsStorageDir();

    archive.pipe(passthrough);

    for (const bill of bills) {
      const fullPath = path.join(storageDir, bill.storedFilePath);
      if (fs.existsSync(fullPath)) {
        // Organiza em pastas dentro do ZIP por Categoria/Mês
        const zipPath = `${bill.category}/${bill.referenceMonth.replace('/', '-')}_${bill.provider}_${bill.originalFileName}`;
        archive.file(fullPath, { name: zipPath });
      }
    }

    archive.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of passthrough) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="comprovantes_${month ? month.replace('/', '-') : 'todos'}.zip"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
