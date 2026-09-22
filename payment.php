<?php
// ====================================================
// API de Paiement Unifiée - Singpay (Airtel) & Moov
// Utilise input (JSON/form/headers) puis fallback sur variables d'environnement
// ====================================================

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Client-Id, X-Client-Secret, X-Wallet, X-Portefeuille, X-Disbursement, X-Provider, X-Payment-Url, X-Status-Url");
header("Access-Control-Expose-Headers: X-PHP-Response-Message");
header("Access-Control-Max-Age: 86400");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

ini_set('display_errors', 0);
ini_set('log_errors', 1);
header('Content-Type: application/json; charset=utf-8');

// -----------------------
// Utilities
// -----------------------
function generateRandomString($length = 8) {
    $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    $max = strlen($characters) - 1;
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $max)];
    }
    return $randomString;
}

function cleanPhoneNumber($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strpos($phone, '241') === 0) {
        $phone = substr($phone, 3);
    }
    return $phone;
}

function sendHttpRequest($url, $headers, $data = null, $method = 'POST') {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $m = strtoupper($method);
    if ($m === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($m === 'GET') {
        curl_setopt($ch, CURLOPT_HTTPGET, true);
    } else {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $m);
        if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'response' => $response,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

// get input JSON or POST
$raw = file_get_contents('php://input');
$json = json_decode($raw, true);
$input = is_array($json) ? array_merge($_POST, $json) : $_POST;
$headersIncoming = function_exists('getallheaders') ? getallheaders() : [];

function getConfigValue($keys, $input, $headersIncoming, $envNames = []) {
    foreach ($keys as $k) {
        if (isset($input[$k]) && $input[$k] !== '') return $input[$k];
    }
    foreach ($headersIncoming as $hName => $hVal) {
        $hn = strtolower($hName);
        foreach ($keys as $k) {
            if ($hn === strtolower($k) && $hVal !== '') return $hVal;
        }
    }
    foreach ($envNames as $e) {
        $val = getenv($e);
        if ($val !== false && $val !== '') return $val;
    }
    return null;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée. Utilisez POST.', 405);
    }

    $numero = isset($input["numero"]) ? trim($input["numero"]) : '';
    $amount = isset($input["amount"]) ? trim($input["amount"]) : '';
    // detect provider from input/header/env or from phone prefix
    $provider = strtolower(getConfigValue(['provider','x-provider'], $input, $headersIncoming, ['PAYMENT_PROVIDER']));
    // helper to detect by prefix similar to frontend
    function detectProviderFromNumber($num) {
        $n = preg_replace('/[^0-9]/', '', $num);
        // consider local formats starting with 0
        if (strpos($n, '0') === 0) $p = substr($n, 1, 2); else $p = substr($n, 0, 3);
        $airtelPrefixes = ['74', '77', '76', '074', '077', '076'];
        $moovPrefixes = ['65', '66', '62', '60', '63', '065', '066', '062', '060', '063'];
        if (in_array($p, $airtelPrefixes, true)) return 'airtel';
        if (in_array($p, $moovPrefixes, true)) return 'moov';
        return 'unknown';
    }

    if (!$provider) {
        $provider = detectProviderFromNumber($numero);
    }

    if (empty($numero)) throw new Exception('Le numéro de téléphone est requis.', 400);
    if (empty($amount)) throw new Exception('Le montant est requis.', 400);
    if (!is_numeric($amount) || $amount <= 0) throw new Exception('Le montant doit être un nombre positif.', 400);

    $numero = cleanPhoneNumber($numero);
    if (strlen($numero) < 8 || strlen($numero) > 9) throw new Exception('Numéro de téléphone invalide.', 400);
    if (strlen($numero) === 8) $numero = '0' . $numero;

    $reference = generateRandomString(8);

    // récupérer common creds (may be provider-specific)
    $clientId = getConfigValue(['client_id','x-client-id'], $input, $headersIncoming, ['SINGPAY_CLIENT_ID','MOOV_CLIENT_ID']);
    $clientSecret = getConfigValue(['client_secret','x-client-secret'], $input, $headersIncoming, ['SINGPAY_CLIENT_SECRET','MOOV_CLIENT_SECRET']);
    $xWallet = getConfigValue(['x_wallet','x-wallet','wallet'], $input, $headersIncoming, ['SINGPAY_X_WALLET','MOOV_X_WALLET','SINGPAY_WALLET']);

    // provider-specific values (prefers explicit input/header then env)
    // provider-specific values (prefers explicit input/header then env)
    $portefeuille = getConfigValue(['portefeuille'], $input, $headersIncoming, ['SINGPAY_PORTEFEUILLE','MOOV_PORTEFEUILLE']);
    $disbursement = getConfigValue(['disbursement'], $input, $headersIncoming, ['SINGPAY_DISBURSEMENT','MOOV_DISBURSEMENT']);
    $paymentUrl = getConfigValue(['payment_url','paymentUrl','x-payment-url','x-paymenturl'], $input, $headersIncoming, ['SINGPAY_PAYMENT_URL','MOOV_PAYMENT_URL']);
    $statusUrlTemplate = getConfigValue(['status_url','statusUrl','x-status-url'], $input, $headersIncoming, ['SINGPAY_STATUS_URL','MOOV_STATUS_URL']);

    // gateway base (singpay gateway by default)
    $gatewayBase = getConfigValue(['gateway_url','gatewayUrl'], $input, $headersIncoming, ['SINGPAY_GATEWAY_URL','GATEWAY_URL']);
    if (!$gatewayBase) $gatewayBase = 'https://gateway.singpay.ga/v1';

    // minimal checks for creds
    if (!$clientId || !$clientSecret || !$xWallet) {
        // Allow for provider-specific fewer creds (but prefer explicit)
        // If missing, respond with error so integrator supplies them
        throw new Exception('Credentials manquants. Fournir client_id, client_secret et x_wallet (ou variables d\'environnement).', 400);
    }

    // If integrator didn't provide a full paymentUrl, build it from gateway base + provider path
    if (!$paymentUrl) {
        if ($provider === 'airtel' || $provider === 'singpay') {
            $paymentUrl = rtrim($gatewayBase, '/') . '/74/paiement';
        } elseif ($provider === 'moov') {
            $paymentUrl = rtrim($gatewayBase, '/') . '/62/paiement';
        } else {
            throw new Exception('payment_url requis pour le provider ' . $provider . '.', 400);
        }
        $statusUrlTemplate = $statusUrlTemplate ?: rtrim($gatewayBase, '/') . '/transaction/api/status/{transaction_id}';
    }

    // Build headers for upstream call
    $upHeaders = [
        'accept: application/json',
        'x-client-id: ' . $clientId,
        'x-client-secret: ' . $clientSecret,
        'x-wallet: ' . $xWallet,
        'Content-Type: application/json'
    ];

    // Build payment payload depending on provider
    if ($provider === 'singpay' || $provider === 'airtel') {
        $paymentData = [
            'amount' => (float) $amount,
            'reference' => $reference,
            'client_msisdn' => $numero,
            'portefeuille' => $portefeuille,
            'disbursement' => $disbursement,
            'isTransfer' => true
        ];
    } else {
        // Generic forwarding payload for unknown provider (integrator supplies shape)
        $paymentData = isset($input['payment_data']) && is_array($input['payment_data']) ? $input['payment_data'] : [
            'amount' => (float) $amount,
            'reference' => $reference,
            'msisdn' => $numero
        ];
    }

    // Initiate payment
    $paymentResult = sendHttpRequest($paymentUrl, $upHeaders, $paymentData, 'POST');
    if (!empty($paymentResult['error'])) {
        throw new Exception('Erreur de connexion au service de paiement: ' . $paymentResult['error'], 500);
    }
    if ($paymentResult['http_code'] !== 200) {
        throw new Exception('Le service de paiement a retourné une erreur (HTTP ' . $paymentResult['http_code'] . ').', 502);
    }

    $paymentResponse = json_decode($paymentResult['response'], true);
    if (!$paymentResponse) {
        throw new Exception('Réponse invalide du service de paiement.', 502);
    }

    // try to extract transaction id from common places
    $transactionId = null;
    if (isset($paymentResponse['transaction']['id'])) $transactionId = $paymentResponse['transaction']['id'];
    elseif (isset($paymentResponse['data']['transaction_id'])) $transactionId = $paymentResponse['data']['transaction_id'];
    elseif (isset($paymentResponse['transaction_id'])) $transactionId = $paymentResponse['transaction_id'];

    // if no transaction id, still return upstream response
    if (!$transactionId) {
        header('X-PHP-Response-Message: no_transaction_id');
        echo json_encode([
            'success' => false,
            'message' => 'Aucun transaction_id retourné par le provider.',
            'provider_response' => $paymentResponse
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Poll status if template available
    $finalStatus = null;
    if ($statusUrlTemplate) {
        // replace placeholder if present
        $statusUrl = str_replace('{transaction_id}', $transactionId, $statusUrlTemplate);
        // if template didn't contain placeholder and doesn't end with id, append
        if (strpos($statusUrlTemplate, '{transaction_id}') === false) {
            $statusUrl = rtrim($statusUrlTemplate, '/') . '/' . $transactionId;
        }

        $maxAttempts = 15;
        $attempt = 0;
        while ($attempt < $maxAttempts) {
            $statusResult = sendHttpRequest($statusUrl, $upHeaders, null, 'GET');
            if (!empty($statusResult['error'])) {
                $attempt++;
                sleep(2);
                continue;
            }
            $statusData = json_decode($statusResult['response'], true);
            if ($statusData) {
                // try common paths
                $statusMsg = null;
                if (isset($statusData['status']['message'])) $statusMsg = $statusData['status']['message'];
                elseif (isset($statusData['message'])) $statusMsg = $statusData['message'];
                elseif (isset($statusData['data']['status'])) $statusMsg = $statusData['data']['status'];

                if ($statusMsg) {
                    $lowerStatus = strtolower($statusMsg);
                    $pendingKeywords = ['pending', 'processing', 'en attente', 'initiated', 'en cours'];
                    $isPending = false;
                    foreach ($pendingKeywords as $keyword) {
                        if (strpos($lowerStatus, $keyword) !== false) { $isPending = true; break; }
                    }
                    if (!$isPending) { $finalStatus = $statusMsg; break; }
                }
            }
            $attempt++;
            sleep(2);
        }
    }

    // Prepare final response
    if ($finalStatus !== null) {
        $successKeywords = ['success', 'réussi', 'processed', 'terminate', 'completed', 'approved'];
        $isSuccess = false;
        foreach ($successKeywords as $keyword) {
            if (stripos($finalStatus, $keyword) !== false) { $isSuccess = true; break; }
        }

        $messageType = 'other';
        $lowerStatus = strtolower($finalStatus);
        if ($isSuccess) $messageType = 'success';
        elseif (strpos($lowerStatus, 'insufficient') !== false || strpos($lowerStatus, 'solde insuffisant') !== false) $messageType = 'insufficient_balance';
        elseif (strpos($lowerStatus, 'incorrect pin') !== false || strpos($lowerStatus, 'code pin incorrect') !== false) $messageType = 'incorrect_pin';
        elseif (strpos($lowerStatus, 'cancelled') !== false || strpos($lowerStatus, 'annulé') !== false) $messageType = 'cancelled';

        header('X-PHP-Response-Message: ' . $finalStatus);
        echo json_encode([
            'success' => $isSuccess,
            'message' => $finalStatus,
            'status_message' => $finalStatus,
            'message_type' => $messageType,
            'transaction_id' => $transactionId,
            'reference' => $reference,
            'provider' => $provider
        ], JSON_UNESCAPED_UNICODE);
    } else {
        header('X-PHP-Response-Message: statut_indisponible');
        echo json_encode([
            'success' => false,
            'message' => 'Transaction en cours de vérification. Veuillez consulter votre téléphone pour confirmer le paiement.',
            'status_message' => 'Transaction pending verification',
            'message_type' => 'pending',
            'transaction_id' => $transactionId,
            'reference' => $reference,
            'provider' => $provider
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    $httpCode = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($httpCode);
    $errorMessage = $e->getMessage();
    header('X-PHP-Response-Message: ' . $errorMessage);
    echo json_encode([
        'success' => false,
        'message' => $errorMessage,
        'status_message' => $errorMessage,
        'message_type' => 'error'
    ], JSON_UNESCAPED_UNICODE);
}