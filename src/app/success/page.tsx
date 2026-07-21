'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '---';

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 lg:p-10 text-center">
      <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-2xl font-medium tracking-tight text-gray-900 mb-2">
        Paiement Réussi !
      </h1>
      
      <p className="text-gray-500 font-light text-sm mb-6">
        Votre transaction a été validée et traitée avec succès par l'opérateur.
      </p>

      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-6 mb-8">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest mb-2">Montant payé</p>
        <p className="text-3xl font-medium tracking-tight text-gray-900">{amount} FCFA</p>
      </div>

      <Link 
        href="/"
        className="w-full flex items-center justify-center bg-gray-900 hover:bg-black text-white font-medium py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
      >
        Effectuer un nouveau paiement
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-sm font-light text-gray-400 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Chargement de la confirmation...
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
