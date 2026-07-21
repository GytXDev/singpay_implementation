import { NextResponse } from 'next/server';
import { singpayConfig, getSingpayHeaders, detectProvider, generateReference } from '@/lib/singpay/config';
import { SingpayInitRequest, SingpayInitResponse } from '@/lib/singpay/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body: SingpayInitRequest = await request.json();
    const { numero, amount } = body;

    if (!numero || !amount) {
      return NextResponse.json<SingpayInitResponse>(
        { success: false, message: 'Numéro ou montant manquant.' },
        { status: 400 }
      );
    }

    const provider = detectProvider(numero);

    if (provider === 'unknown') {
      return NextResponse.json<SingpayInitResponse>(
        {
          success: false,
          message: 'Numéro non reconnu. Utilisez un numéro Airtel Money (074, 077, 076) ou Moov Money (065, 066, 062, 060, 063).',
        },
        { status: 400 }
      );
    }

    const finalAmount = singpayConfig.isTestMode ? '100' : amount.toString();
    const reference = generateReference();
    
    const endpoint = provider === 'airtel'
      ? `${singpayConfig.gatewayUrl}/74/paiement`
      : `${singpayConfig.gatewayUrl}/62/paiement`;

    const payload = {
      amount: finalAmount,
      reference,
      client_msisdn: numero,
      portefeuille: singpayConfig.walletId,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getSingpayHeaders(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const result = await response.json();

    if (result.transaction && result.transaction.id) {
      return NextResponse.json<SingpayInitResponse>({
        success: true,
        transactionId: result.transaction.id,
        provider,
        data: result,
      });
    } else if (result.status && result.status.message) {
      return NextResponse.json<SingpayInitResponse>(
        { success: false, message: result.status.message, data: result },
        { status: 400 }
      );
    } else {
      return NextResponse.json<SingpayInitResponse>(
        { success: false, message: "Erreur lors de l'initialisation du paiement.", data: result },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[SINGPAY_INITIATE_ERROR]', error);
    return NextResponse.json<SingpayInitResponse>(
      { success: false, message: 'Erreur interne: ' + (error?.message || 'Inconnue') },
      { status: 500 }
    );
  }
}
