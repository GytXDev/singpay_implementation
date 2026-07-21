import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, prenom, email, telephone, entite, message } = body;

    if (!nom || !prenom || !email || !telephone || !entite || !message) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis.' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: 'Démo API Singpay <api@mail.gytx.dev>',
      to: ['n.leyalangoye@gytx.dev'],
      subject: `Demande de documentation API - ${entite}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f172a;">Nouvelle demande de documentation API</h2>
          <p>Vous avez reçu une nouvelle demande de la part de :</p>
          <ul style="line-height: 1.6;">
            <li><strong>Nom :</strong> ${nom}</li>
            <li><strong>Prénom :</strong> ${prenom}</li>
            <li><strong>Email :</strong> <a href="mailto:${email}">${email}</a></li>
            <li><strong>Téléphone :</strong> <a href="tel:${telephone}">${telephone}</a></li>
            <li><strong>Entité / Entreprise :</strong> ${entite}</li>
          </ul>
          <h3 style="color: #0f172a; margin-top: 24px;">Message :</h3>
          <p style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.6;">
            ${message.replace(/\n/g, '<br />')}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[RESEND_ERROR]', error);
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi de l'email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[CONTACT_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
