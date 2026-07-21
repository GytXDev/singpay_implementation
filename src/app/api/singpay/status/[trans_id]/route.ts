import { NextResponse } from 'next/server';
import { singpayConfig, getSingpayHeaders } from '@/lib/singpay/config';
import { SingpayStatusResponse } from '@/lib/singpay/types';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(
  request: Request,
  { params }: { params: { trans_id: string } }
) {
  try {
    const { trans_id } = await params;

    if (!trans_id) {
      return NextResponse.json<SingpayStatusResponse>(
        { success: false, message: 'ID de transaction manquant.' },
        { status: 400 }
      );
    }

    const url = `${singpayConfig.gatewayUrl}/transaction/api/status/${trans_id}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getSingpayHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    // In some cases, Singpay might return non-200 but still have a JSON body
    // that we can parse, so we shouldn't throw on !response.ok just yet,
    // unless we want to avoid parsing HTML errors. Let's parse JSON directly.
    const result = await response.json().catch(() => ({}));

    // Singpay status resolution:
    // - After user validates → result.status.message = "Succès" | "Insuffisant" | etc.
    // - Before validation    → result.status = { code: "200", success: true } (no message)
    //                          and result.transaction.status = "Partenaire"
    // Priority: status.message first, then transaction.status as fallback
    const statusMessage: string =
      result?.status?.message || result?.transaction?.status || '';
    const apiSuccess: boolean =
      result?.status?.success === true || !!result?.transaction?.status;

    if (!apiSuccess && !statusMessage) {
      return NextResponse.json<SingpayStatusResponse>({
        success: false,
        errorType: 'gateway_error',
        message: 'Impossible de récupérer le statut de la transaction.',
        data: result,
      });
    }

    return NextResponse.json<SingpayStatusResponse>({
      success: true,
      statusMessage,
      data: result,
    });
  } catch (error: any) {
    console.error('[SINGPAY_STATUS_ERROR]', error);
    const isTimeout = error.name === 'AbortError';
    
    return NextResponse.json<SingpayStatusResponse>({
      success: false,
      errorType: 'gateway_error',
      isTimeout,
      message: isTimeout
        ? 'Le serveur Singpay met trop de temps à répondre (Timeout).'
        : 'Erreur de connexion avec Singpay: ' + (error?.message || 'Inconnue'),
    }, { status: 500 });
  }
}
