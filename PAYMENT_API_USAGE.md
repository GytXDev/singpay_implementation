# Utilisation de l'API Payment

Endpoint: `https://gytx.dev/api/payment.php`

Ce fichier décrit comment appeler l'endpoint `payment.php` (gestion unifiée Singpay / Moov). L'API accepte les credentials via le body JSON, via headers ou via variables d'environnement du serveur (ordre de priorité: body -> headers -> env).

## Champs requis

- `numero` : numéro du client (ex: `074001209`). Le serveur détecte le provider (Airtel vs Moov) depuis le préfixe si `provider` non fourni.
- `amount` : montant (nombre positif).

## Paramètres optionnels / credentials

Vous pouvez fournir les credentials dans le JSON ou en headers. Alternativement, définir les variables d'environnement côté serveur.

Clés attendues (JSON ou headers):

- `client_id` / header `X-Client-Id`
- `client_secret` / header `X-Client-Secret`
- `x_wallet` / header `X-Wallet`
- `portefeuille` (Singpay)
- `disbursement` (Singpay)
- `provider` ou `x-provider` (force `airtel` ou `moov`)
- `payment_url` / `x-payment-url` (optionnel, si vous fournissez un endpoint custom)
- `status_url` / `x-status-url` (optionnel)
- `gateway_url` (optionnel, fallback pour construire `/74/paiement` ou `/62/paiement`)

Variables d'environnement reconnues (exemples):

- `SINGPAY_CLIENT_ID`, `SINGPAY_CLIENT_SECRET`, `SINGPAY_X_WALLET`, `SINGPAY_PORTEFEUILLE`, `SINGPAY_DISBURSEMENT`, `SINGPAY_GATEWAY_URL`
- `MOOV_CLIENT_ID`, `MOOV_CLIENT_SECRET`, `MOOV_X_WALLET`, `MOOV_PORTEFEUILLE`, `MOOV_DISBURSEMENT`, `MOOV_PAYMENT_URL`, `MOOV_STATUS_URL`
- `PAYMENT_PROVIDER` (pour forcer un provider par défaut)

## Détection du provider (logique)

- Airtel / Singpay: préfixes typiques `74`, `77`, `76` (ou `074`, `077`, `076`) → l'API construira `.../74/paiement`.
- Moov: préfixes typiques `65`, `66`, `62`, `60`, `63` (ou `065`, `066`, `062`, `060`, `063`) → l'API construira `.../62/paiement`.
- Si `provider` est explicitement fourni, il est utilisé.

## Exemples d'appel

Appels en JSON (fournir credentials via body):

Airtel (numéro Airtel détecté ou `"provider":"airtel"`):

```bash
curl -X POST https://gytx.dev/api/payment.php \
  -H "Content-Type: application/json" \
  -d '{
    "numero":"074001209",
    "amount":1000,
    "client_id":"<id>",
    "client_secret":"<secret>",
    "x_wallet":"<wallet>",
    "portefeuille":"<portefeuille>",
    "disbursement":"<disbursement>"
  }'
```

Moov (numéro Moov détecté ou `"provider":"moov"`):

```bash
curl -X POST https://gytx.dev/api/payment.php \
  -H "Content-Type: application/json" \
  -d '{
    "numero":"062001209",
    "amount":500,
    "client_id":"<id>",
    "client_secret":"<secret>",
    "x_wallet":"<wallet>"
  }'
```

Exemple via headers (préférable pour séparer données et secrets):

```bash
curl -X POST https://gytx.dev/api/payment.php \
  -H "Content-Type: application/json" \
  -H "X-Client-Id: <id>" \
  -H "X-Client-Secret: <secret>" \
  -H "X-Wallet: <wallet>" \
  -d '{"numero":"074001209","amount":1000}'
```

## Format de réponse

Réussite ou final status:

```json
{
  "success": true,
  "message": "<status text>",
  "status_message": "<status text>",
  "message_type": "success|pending|insufficient_balance|incorrect_pin|cancelled|other",
  "transaction_id": "<id>",
  "reference": "<reference>",
  "provider": "airtel|moov"
}
```

En cas d'erreur:

```json
{
  "success": false,
  "message": "<erreur lisible>",
  "status_message": "<erreur>",
  "message_type": "error"
}
```

Codes HTTP courants:

- `400` : input invalide (numero, amount, credentials manquants)
- `502` : upstream provider returned non-200
- `500` : erreur serveur / connexion

## Sécurité & bonnes pratiques

- Toujours appeler via HTTPS.
- Préférer définir les secrets en variables d'environnement plutôt que de les envoyer à chaque requête.
- Ne loggez jamais le `client_secret` en clair.
- Limitez les accès à ce endpoint (IP allowlist, auth proxy) si nécessaire.

## Débogage

- Si le provider ne retourne pas `transaction_id`, la réponse contient `provider_response` pour inspecter la réponse brute.
- Pour forcer un provider lors des tests, envoyez `"provider":"airtel"` ou `"provider":"moov"`.

---

Fichier généré automatiquement. Pour toute modification ou ajout d'exemples, demandez-moi et je mettrai à jour ce guide.
