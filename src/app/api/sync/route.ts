import { NextResponse } from 'next/server';
import { syncBillsFromImap } from '@/lib/imap-worker';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, secure, user, pass } = body;

    if (!host || !user || !pass) {
      return NextResponse.json(
        { success: false, error: 'Host, usuário e senha/app password do e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await syncBillsFromImap({
      host,
      port: Number(port) || 993,
      secure: secure !== undefined ? Boolean(secure) : true,
      user,
      pass,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      totalFound: result.newBills.length,
      bills: result.newBills,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao sincronizar' },
      { status: 500 }
    );
  }
}
