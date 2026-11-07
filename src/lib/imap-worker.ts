import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { BillItem } from '@/types/bill';
import { detectProvider, extractAmount, extractDueDate, extractReferenceMonth } from './parser';
import { getBillsStorageDir, saveBills } from './db';

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export async function syncBillsFromImap(config: ImapConfig): Promise<{ newBills: BillItem[]; message: string }> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  const downloadedBills: BillItem[] = [];
  const storageDir = getBillsStorageDir();

  try {
    await client.connect();

    // Abre a Caixa de Entrada
    const lock = await client.getMailboxLock('INBOX');

    try {
      // Busca mensagens dos últimos 90 dias com remetentes ou palavras-chave conhecidas
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 90);

      const searchCriteria = {
        since: sinceDate,
      };

      const messages = client.fetch(searchCriteria, {
        source: true,
        envelope: true,
      });

      for await (const msg of messages) {
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || '';
        const from = parsed.from?.text || '';
        const bodyText = parsed.text || '';
        const combinedHeader = `${subject} ${from}`;

        const detected = detectProvider(combinedHeader);
        if (detected.provider === 'OUTROS') {
          // Se não detectou no remetente ou assunto, verifica no corpo
          const inBody = detectProvider(bodyText.substring(0, 500));
          if (inBody.provider === 'OUTROS') {
            continue; // Não é fatura de concessionária mapeada
          }
        }

        // Procura anexos em PDF
        for (const attachment of parsed.attachments) {
          if (
            attachment.contentType === 'application/pdf' ||
            attachment.filename?.toLowerCase().endsWith('.pdf')
          ) {
            const fileName = attachment.filename || `fatura_${detected.provider}.pdf`;
            const hash = crypto
              .createHash('md5')
              .update(attachment.content)
              .digest('hex');
            const safeFileName = `${detected.provider.toLowerCase()}_${hash.substring(0, 8)}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const targetPath = path.join(storageDir, safeFileName);

            // Salva o arquivo no disco
            if (!fs.existsSync(targetPath)) {
              fs.writeFileSync(targetPath, attachment.content);
            }

            const amount = extractAmount(bodyText) || 0;
            const dueDate = extractDueDate(bodyText);
            const refMonth = extractReferenceMonth(bodyText);

            const bill: BillItem = {
              id: hash,
              provider: detected.provider,
              category: detected.category,
              amount,
              dueDate,
              referenceMonth: refMonth,
              status: 'A_VENCER',
              originalFileName: fileName,
              storedFilePath: safeFileName,
              fileSize: attachment.size,
              receivedAt: (parsed.date || new Date()).toISOString(),
              source: 'EMAIL',
            };

            downloadedBills.push(bill);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    if (downloadedBills.length > 0) {
      saveBills(downloadedBills);
    }

    return {
      newBills: downloadedBills,
      message: `Sincronização concluída! ${downloadedBills.length} comprovantes/faturas encontrados.`,
    };
  } catch (error: any) {
    console.error('Erro na sincronização IMAP:', error);
    throw new Error(`Falha ao conectar no e-mail: ${error.message || error}`);
  }
}
