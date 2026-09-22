"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SingpayInitResponse,
  SingpayStatusResponse,
} from "@/lib/singpay/types";

export default function PaymentPage() {
  const router = useRouter();
  const [numero, setNumero] = useState("");
  const [amount, setAmount] = useState("");

  const [status, setStatus] = useState<
    "idle" | "initiating" | "pending" | "success" | "error"
  >("idle");

  // ─── Poller le statut du paiement ────────────────────────────────────────
  const pollStatus = async (
    transactionId: string,
    toastId: string | number,
  ) => {
    try {
      const res = await fetch(`/api/singpay/status/${transactionId}`);
      const data: SingpayStatusResponse = await res.json();

      if (data.success && data.statusMessage) {
        const raw = data.statusMessage;
        const msg = raw.toLowerCase();

        const isError =
          msg.includes("insuffisant") ||
          msg.includes("insufficient") ||
          msg.includes("solde") ||
          msg.includes("not accepted") ||
          msg.includes("erreur") ||
          msg.includes("error") ||
          msg.includes("failed") ||
          msg.includes("failure") ||
          msg.includes("échec") ||
          msg.includes("echeance") ||
          msg.includes("rejeté") ||
          msg.includes("rejet") ||
          msg.includes("annulé") ||
          msg.includes("annulation") ||
          msg.includes("declined") ||
          msg.includes("refus") ||
          msg.includes("expiré") ||
          msg.includes("expire");

        const isSuccess =
          msg.includes("succès") ||
          msg.includes("succes") ||
          msg.includes("success") ||
          msg.includes("approved") ||
          msg.includes("approuvé") ||
          msg.includes("validé") ||
          msg.includes("payé") ||
          msg.includes("completed");

        if (isError) {
          setStatus("error");
          toast.error(raw, { id: toastId });
        } else if (isSuccess) {
          toast.success("Paiement effectué avec succès !", { id: toastId });
          setStatus("success");
          router.push(`/success?amount=${amount}`);
        } else {
          // Statut intermédiaire : afficher et repoller
          toast.loading(`Statut Singpay : ${raw}`, { id: toastId });
          setTimeout(() => pollStatus(transactionId, toastId), 3000);
        }
      } else if (data.errorType === "gateway_error") {
        if (data.isTimeout) {
          toast.loading("Réseau Singpay ralenti. Nouvelle tentative...", {
            id: toastId,
          });
          setTimeout(() => pollStatus(transactionId, toastId), 1000);
        } else {
          setStatus("error");
          toast.error(data.message || "Erreur réseau Singpay.", {
            id: toastId,
          });
        }
      } else {
        setTimeout(() => pollStatus(transactionId, toastId), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Erreur réseau lors de la vérification.", { id: toastId });
    }
  };

  // ─── Soumettre le formulaire ──────────────────────────────────────────────
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || !amount) return;

    setStatus("initiating");
    const toastId = toast.loading("Initialisation du paiement...");
    const amountNum = Number(amount);

    try {
      const res = await fetch("/api/singpay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, amount: amountNum }),
      });

      const data: SingpayInitResponse = await res.json();

      if (res.ok && data.success && data.transactionId) {
        setStatus("pending");
        toast.loading("Veuillez valider le paiement sur votre téléphone.", {
          id: toastId,
        });
        pollStatus(data.transactionId, toastId);
      } else {
        setStatus("error");
        toast.error(data.message || "Erreur lors de l'initialisation.", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Erreur réseau. Veuillez réessayer.", { id: toastId });
    }
  };

  const isBusy = status === "initiating" || status === "pending";

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 lg:p-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden bg-white">
            <Image
              src="/mobile_money.png"
              alt="Mobile Money"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">
            Démo Paiement Mobile Money
          </h1>
          <p className="text-sm font-light text-gray-500 mt-2 leading-relaxed">
            Saisissez vos informations pour procéder à un réel paiement sécurisé
            via Airtel Money ou Moov Money.
          </p>
        </div>

        <form onSubmit={handlePayment} className="space-y-5">
          <div>
            <label
              htmlFor="numero"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Numéro de téléphone mobile money
            </label>
            <input
              id="numero"
              type="text"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
              placeholder="074 XX XX XX ou 065 XX XX XX"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              disabled={isBusy}
              required
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Montant (FCFA)
            </label>
            <input
              id="amount"
              type="number"
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
              placeholder="Ex: 100 idéal pour une démo"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isBusy}
              required
              min="100"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-medium py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Veuillez patienter...
              </>
            ) : (
              "Valider le paiement"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
          <p className="text-[13px] font-light text-center text-gray-400 leading-relaxed">
            Un menu s'affichera automatiquement sur votre téléphone pour
            confirmer la transaction avec votre code secret.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t border-gray-50">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-light mb-1">
                Implémenté par{" "}
                <span className="font-medium text-gray-500">
                  Japhet LEYALANGOYE
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1 opacity-60 hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                Agrégateur SINGPAY
              </span>
              <Image
                src="/singpay.png"
                alt="Singpay"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
