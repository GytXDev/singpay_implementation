'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    entite: '',
    message: 'Je souhaite recevoir la documentation API ainsi que le guide d\'intégration.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Envoi de votre demande...');

    try {
      const res = await fetch('/api/contact', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData) 
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l\'envoi');
      }

      toast.success('Votre demande a été envoyée avec succès !', { id: toastId });
      
      // Retour à la page d'accueil après 2 secondes
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error) {
      toast.error('Une erreur est survenue lors de l\'envoi.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-8 lg:p-10">
        
        <div className="mb-8 text-center relative">
          <Link 
            href="/" 
            className="absolute left-0 top-1 text-gray-400 hover:text-gray-900 transition-colors"
            title="Retour"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-900">Demande de documentation</h1>
          <p className="text-sm font-light text-gray-500 mt-2 leading-relaxed">
            Remplissez ce formulaire pour recevoir la documentation API et le guide d'intégration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                id="nom"
                type="text"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
                placeholder="Votre nom"
                value={formData.nom}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                id="prenom"
                type="text"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
                placeholder="Votre prénom"
                value={formData.prenom}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
                placeholder="Votre email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                id="telephone"
                type="tel"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50"
                placeholder="Ex: 074 XX XX XX"
                value={formData.telephone}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="entite" className="block text-sm font-medium text-gray-700 mb-2">
              Entité / Entreprise
            </label>
            <Select
              value={formData.entite}
              onValueChange={(val) => setFormData(prev => ({ ...prev, entite: val || '' }))}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger className="w-full px-4 py-3 h-[46px] bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all shadow-none">
                <SelectValue placeholder="Sélectionnez votre type d'entité" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-sm font-light text-sm">
                <SelectItem value="Entreprise / PME">Entreprise / PME</SelectItem>
                <SelectItem value="Startup">Startup</SelectItem>
                <SelectItem value="Indépendant / Freelance">Indépendant / Freelance</SelectItem>
                <SelectItem value="Association">Association</SelectItem>
                <SelectItem value="Institution Publique">Institution Publique</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-light focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 transition-all disabled:opacity-50 resize-none"
              placeholder="Votre message..."
              value={formData.message}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-medium py-3.5 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Envoi en cours...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
