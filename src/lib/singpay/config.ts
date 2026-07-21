export const singpayConfig = {
  clientId: process.env.SINGPAY_CLIENT_ID || '',
  clientSecret: process.env.SINGPAY_CLIENT_SECRET || '',
  walletId: process.env.SINGPAY_WALLET_ID || '',
  gatewayUrl: process.env.SINGPAY_GATEWAY_URL || 'https://gateway.singpay.ga/v1',
  /** URL de base pour les endpoints Transfer (sans /v1) */
  transferUrl: (process.env.SINGPAY_GATEWAY_URL || 'https://gateway.singpay.ga/v1').replace(/\/v1$/, ''),
  disbursementAirtel: process.env.SINGPAY_DISBURSEMENT_AIRTEL || '',
  disbursementMoov: process.env.SINGPAY_DISBURSEMENT_MOOV || '',
  isTestMode: process.env.MODE === 'test',
};

export const getSingpayHeaders = () => ({
  'accept': '*/*',
  'x-client-id': singpayConfig.clientId,
  'x-client-secret': singpayConfig.clientSecret,
  'x-wallet': singpayConfig.walletId,
  'Content-Type': 'application/json',
});

/**
 * Détecte si le numéro est Moov Money ou Airtel Money.
 * Airtel Money Gabon : 074, 077, 076
 * Moov Money Gabon : 065, 066, 062, 060, 063
 */
export const detectProvider = (numero: string): 'airtel' | 'moov' | 'unknown' => {
  const n = numero.replace(/\D/g, '');
  const normalized = n.startsWith('0') ? n : '0' + n;

  if (/^0(74|77|76)/.test(normalized)) return 'airtel';
  if (/^0(65|66|62|60|63)/.test(normalized)) return 'moov';
  return 'unknown';
};

export const generateReference = (length: number = 8) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let ref = '';
  for (let i = 0; i < length; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};
