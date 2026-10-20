/* Superanvändare: årsabonnemang via Stripe. Alla nedladdningar ingår så länge abonnemanget är aktivt.
   Inloggning: en personlig nyckel "cus_….<signatur>" som guiden sparar i webbläsaren. Den finns i länken
   https://pyreneestrip.com/?medlem=<nyckel> som visas efter köpet och skickas med e-post.
   Inställningar i Cloudflare Pages (Settings → Variables and Secrets):
     STRIPE_SECRET_KEY  finns redan
     RESEND_API_KEY     (valfritt men rekommenderat) nyckel från resend.com för att skicka inloggningslänkar
     MAIL_FROM          (valfritt) avsändare, standard "Pyreneestrip <info@pyreneestrip.com>"
     SUPER_SECRET       (valfritt) egen hemlighet för nycklarna – annars används Stripe-nyckeln */
import { stripe } from "../../_shop.js";
export { json, stripe, PRICE, CURRENCIES } from "../../_shop.js";
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sig(env, msg) {
  const key = await crypto.subtle.importKey("raw", enc.encode("super:" + (env.SUPER_SECRET || env.STRIPE_SECRET_KEY || "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(msg))).slice(0, 32);
}
export async function makeToken(env, cus) { return cus + "." + (await sig(env, cus)); }
export async function readToken(env, t) {
  const m = /^(cus_[A-Za-z0-9]+)\.([A-Za-z0-9_-]{32})$/.exec(t || ""); if (!m) return null;
  const s = await sig(env, m[1]); let d = 0; for (let i = 0; i < 32; i++) d |= s.charCodeAt(i) ^ m[2].charCodeAt(i);
  return d === 0 ? m[1] : null;
}
const periodEnd = s => s.current_period_end || (s.items && s.items.data && s.items.data[0] && s.items.data[0].current_period_end) || null;
export function subInfo(s) { return { id: s.id, status: s.status, until: periodEnd(s), cancel: !!s.cancel_at_period_end }; }
export const OK_STATUS = ["active", "trialing", "past_due"];
export async function activeSub(env, cus) {
  const l = await stripe(env, `subscriptions?customer=${encodeURIComponent(cus)}&status=all&limit=20`, null, "GET");
  const s = (l.data || []).find(x => OK_STATUS.includes(x.status) && x.metadata && x.metadata.kind === "super");
  return s ? subInfo(s) : null;
}
export const LANGS = ["sv", "no", "da", "en", "de", "fr", "es", "it", "pt"];
const MAIL = {
  sv: ["Din inloggning som superanvändare", "Hej! Här är din personliga länk till Reseguide Pyrenéerna. Öppna den på varje mobil, surfplatta eller dator där du vill ladda ner guider och GPX-filer fritt.", "Logga in som superanvändare", "Spara mejlet. Har du frågor? Svara på det här mejlet.", "Använder du guiden som app på iPhone? Håll fingret på länken, välj Kopiera och klistra in den i appen under Om guiden → Superanvändare → Logga in."],
  no: ["Din innlogging som superbruker", "Hei! Her er din personlige lenke til Reiseguide Pyreneene. Åpne den på hver mobil, nettbrett eller datamaskin der du vil laste ned guider og GPX-filer fritt.", "Logg inn som superbruker", "Ta vare på e-posten. Spørsmål? Svar på denne e-posten.", "Bruker du guiden som app på iPhone? Hold fingeren på lenken, velg Kopier og lim den inn i appen under Om guiden → Superbruker → Logg inn."],
  da: ["Dit login som superbruger", "Hej! Her er dit personlige link til Rejseguide Pyrenæerne. Åbn det på hver mobil, tablet eller computer, hvor du vil downloade guider og GPX-filer frit.", "Log ind som superbruger", "Gem mailen. Spørgsmål? Svar på denne mail.", "Bruger du guiden som app på iPhone? Hold fingeren på linket, vælg Kopiér og indsæt det i appen under Om guiden → Superbruger → Log ind."],
  en: ["Your super user login", "Hi! Here is your personal link to the Pyrenees Travel Guide. Open it on every phone, tablet or computer where you want to download guides and GPX files freely.", "Log in as a super user", "Keep this email. Questions? Just reply.", "Using the guide as an app on iPhone? Press and hold the link, choose Copy and paste it in the app under About the guide → Super user → Log in."],
  de: ["Deine Anmeldung als Super-Nutzer", "Hallo! Hier ist dein persönlicher Link zum Reiseführer Pyrenäen. Öffne ihn auf jedem Handy, Tablet oder Computer, auf dem du Reiseführer und GPX-Dateien frei herunterladen möchtest.", "Als Super-Nutzer anmelden", "Bewahre diese E-Mail auf. Fragen? Antworte einfach.", "Sie nutzen den Reiseführer als App auf dem iPhone? Halten Sie den Finger auf den Link, wählen Sie Kopieren und fügen Sie ihn in der App unter Über den Reiseführer → Super-Nutzer → Anmelden ein."],
  fr: ["Votre connexion super-utilisateur", "Bonjour ! Voici votre lien personnel vers le Guide de voyage des Pyrénées. Ouvrez-le sur chaque téléphone, tablette ou ordinateur où vous voulez télécharger librement guides et fichiers GPX.", "Se connecter comme super-utilisateur", "Conservez cet e-mail. Une question ? Répondez simplement.", "Vous utilisez le guide comme application sur iPhone ? Appuyez longuement sur le lien, choisissez Copier et collez-le dans l'application sous À propos du guide → Super-utilisateur → Se connecter."],
  es: ["Tu acceso como superusuario", "¡Hola! Aquí tienes tu enlace personal a la Guía de viaje de los Pirineos. Ábrelo en cada móvil, tableta u ordenador donde quieras descargar guías y archivos GPX libremente.", "Entrar como superusuario", "Guarda este correo. ¿Preguntas? Responde a este mensaje.", "¿Usas la guía como app en el iPhone? Mantén pulsado el enlace, elige Copiar y pégalo en la app en Sobre la guía → Superusuario → Entrar."],
  it: ["Il tuo accesso da super utente", "Ciao! Ecco il tuo link personale alla Guida di viaggio dei Pirenei. Aprilo su ogni telefono, tablet o computer dove vuoi scaricare liberamente guide e file GPX.", "Accedi come super utente", "Conserva questa e-mail. Domande? Rispondi pure.", "Usi la guida come app su iPhone? Tieni premuto il link, scegli Copia e incollalo nell'app in Informazioni sulla guida → Super utente → Accedi."],
  pt: ["O seu acesso de superutilizador", "Olá! Aqui está a sua ligação pessoal ao Guia de viagem dos Pirenéus. Abra-a em cada telemóvel, tablet ou computador onde quer descarregar guias e ficheiros GPX livremente.", "Entrar como superutilizador", "Guarde este e-mail. Dúvidas? Basta responder.", "Usa o guia como app no iPhone? Mantenha o dedo na ligação, escolha Copiar e cole-a na app em Sobre o guia → Superutilizador → Entrar."],
};
export async function sendLogin(env, to, lang, link) {
  if (!env.RESEND_API_KEY || !to) return false;
  const t = MAIL[lang] || MAIL.en, esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const html = `<div style="font:16px/1.5 Georgia,serif;color:#18262b;max-width:520px"><h1 style="font:600 24px Arial,sans-serif">pyreneestrip.com</h1><p>${esc(t[1])}</p><p><a href="${esc(link)}" style="display:inline-block;background:#0d6b6e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font:600 15px Arial,sans-serif">${esc(t[2])}</a></p><p style="font:13px Arial,sans-serif;color:#56666b">${esc(link)}</p>${t[4] ? `<p style="font:13px Arial,sans-serif;color:#56666b">${esc(t[4])}</p>` : ""}<p style="font:13px Arial,sans-serif;color:#56666b">${esc(t[3])}<br>Thomas Bajer · pyreneestrip.com</p></div>`;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM || "Pyreneestrip <info@pyreneestrip.com>", to: [to], reply_to: "info@pyreneestrip.com", subject: t[0], html, text: `${t[1]}\n\n${link}\n\n${t[4] ? t[4] + "\n\n" : ""}${t[3]}\nThomas Bajer · pyreneestrip.com` }) });
  return r.ok;
}
export const loginLink = (origin, token, lang) => `${origin}/?medlem=${encodeURIComponent(token)}${lang ? "&lang=" + lang : ""}#om`;
