# Singpay API

Application Next.js qui fournit une interface de paiement Mobile Money au Gabon, avec prise en charge d'Airtel Money et de Moov Money via Singpay.

Le depot contient deux implementations :

- l'application Next.js actuelle dans `src/`, exposee par les routes `/api/singpay/*` ;
- `payment.php`, une implementation PHP legacy autonome documentee dans [PAYMENT_API_USAGE.md](PAYMENT_API_USAGE.md).

## Prerequis

- Node.js compatible avec Next.js 16 ;
- npm ;
- un compte Singpay et ses identifiants API ;

## Installation

```bash
npm install
Copy-Item .env.example .env.local
```

Renseignez ensuite les valeurs de `.env.local`. Ce fichier ne doit jamais etre commite. Le fichier `.env.example` est volontairement versionne et ne contient aucun secret.

Demarrer en developpement :

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

Commandes disponibles :

```bash
npm run lint    # verifier le code
npm run build   # compiler pour la production
npm run start   # demarrer le build de production
```

## Configuration

Les variables sont detaillees dans [.env.example](.env.example).

| Variable                | Requise | Description                                                      |
| ----------------------- | ------- | ---------------------------------------------------------------- |
| `SINGPAY_CLIENT_ID`     | Oui     | Identifiant client Singpay.                                      |
| `SINGPAY_CLIENT_SECRET` | Oui     | Secret client Singpay. Ne pas l'exposer au navigateur.           |
| `SINGPAY_WALLET_ID`     | Oui     | Portefeuille utilise pour le paiement.                           |
| `SINGPAY_GATEWAY_URL`   | Non     | URL de base Singpay, par defaut `https://gateway.singpay.ga/v1`. |
| `MODE`                  | Non     | Avec la valeur `test`, force le montant a `100` pour les tests.  |

Les variables `SINGPAY_DISBURSEMENT_AIRTEL` et `SINGPAY_DISBURSEMENT_MOOV` sont conservees pour les flux de decaissement et l'implementation legacy. Elles ne sont pas necessaires au flux de paiement Next.js actuel.

## Fonctionnement du paiement

1. L'utilisateur saisit un numero gabonais et un montant sur `/`.
2. Le prefixe du numero determine l'operateur : Airtel (`074`, `077`, `076`) ou Moov (`065`, `066`, `062`, `060`, `063`).
3. Le serveur initialise le paiement chez Singpay.
4. L'utilisateur valide la demande sur son telephone.
5. Le navigateur interroge le statut jusqu'a obtenir un resultat final, puis redirige vers `/success` en cas de succes.

Les secrets Singpay sont utilises uniquement dans les route handlers serveur. Ils ne doivent pas etre prefixes par `NEXT_PUBLIC_`.

## Routes API Next.js

### `POST /api/singpay/initiate`

Initialise un paiement.

```json
{
  "numero": "074001209",
  "amount": 1000
}
```

Une reponse reussie contient `success: true`, `transactionId` et `provider` (`airtel` ou `moov`). Les erreurs de validation renvoient HTTP `400` ; les erreurs internes renvoient HTTP `500`.

### `GET /api/singpay/status/:trans_id`

Recupere le statut d'une transaction Singpay. La reponse contient `statusMessage` tant que Singpay fournit un statut lisible. Les timeouts sont signales par `errorType: "gateway_error"` et `isTimeout: true`.

## Securite et mise en production

- Ne commitez jamais `.env.local` ou un autre fichier d'environnement contenant des secrets.
- Utilisez HTTPS en production.
- Verifiez que les identifiants Singpay correspondent a l'environnement cible avant de desactiver `MODE=test`.
- Ajoutez une authentification ou une limitation de debit devant les routes publiques si l'application est exposee au-dela d'une demo.

## Implementation PHP legacy

`payment.php` peut etre deploye sur un hebergement PHP separe. Il accepte les credentials dans le JSON, les headers ou les variables d'environnement, dans cet ordre de priorite : body, headers, environnement.

Pour les champs, exemples de requetes, reponses et codes HTTP de cette implementation, consultez [PAYMENT_API_USAGE.md](PAYMENT_API_USAGE.md).
