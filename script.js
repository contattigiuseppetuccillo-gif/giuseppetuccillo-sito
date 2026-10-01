/* ═══════════════════════════════════════════════════════════════════════════
   Il modulo della landing e la barra fissa. Nessun tracciamento, nessun cookie,
   nessun servizio esterno oltre a quello che riceve le richieste del modulo.

   ENDPOINT  indirizzo del servizio che riceve le richieste
   CHIAVE    parola di controllo condivisa con quel servizio (non è un segreto)
   WHATSAPP  numero per il bottone WhatsApp, con prefisso e senza +, per esempio
             "393331234567". Vuoto = il bottone non compare.
   ═══════════════════════════════════════════════════════════════════════════ */
const ENDPOINT = "https://script.google.com/macros/s/AKfycbzOfwp1kDUxW7TrWkzy5MPjlCXo7s5AxmQ-zspP8ikCHaKUrNFWoRo4gNO603qKEIb8/exec";
const CHIAVE = "72d45c83b61bac77";
const WHATSAPP = "393519806026";

const modulo = document.getElementById("modulo");
const stato = document.getElementById("stato");
const apertoAlle = Date.now();

function dica(testo, tipo = "") {
  stato.textContent = testo;
  stato.className = "stato " + tipo;
}

/* Un contatto vale se sembra un'email o un numero con almeno 8 cifre. */
function contattoValido(v) {
  const t = v.trim();
  return /^\S+@\S+\.\S+$/.test(t) || t.replace(/\D/g, "").length >= 8;
}

/* Da dove arriva il clic: solo i parametri del link in bio (utm_source, utm_campaign),
   così si capisce quale post o quale link porta contatti. Non si salva niente nel browser. */
function fonte() {
  const p = new URLSearchParams(location.search);
  const f = [p.get("utm_source"), p.get("utm_campaign")].filter(Boolean).join("/");
  return f.replace(/[^\w\-\/. ]/g, "").slice(0, 60) || "diretto";
}

/* ── bottone WhatsApp: compare solo se c'è il numero ─────────────────────── */
const wa = document.getElementById("wa");
if (wa && WHATSAPP) {
  const testo = "Ciao! Vengo dal sito di Giuseppe Tuccillo e vorrei organizzare una call.";
  wa.href = "https://wa.me/" + WHATSAPP.replace(/\D/g, "") + "?text=" + encodeURIComponent(testo);
  wa.hidden = false;
  const oppure = document.getElementById("oppure");
  if (oppure) oppure.hidden = false;
}

/* Dopo l'invio: se c'è il numero, un bottone per scriverci subito. Così la richiesta
   diventa anche un messaggio in arrivo su WhatsApp, con il numero già visibile e le
   risposte automatiche del Business che partono da sole. */
function mostraWhatsAppDopo(nome) {
  const b = document.getElementById("wa-dopo");
  if (!b || !WHATSAPP) return;
  const testo = "Ciao, sono " + nome + ": ho appena compilato il modulo sul sito di Giuseppe Tuccillo.";
  b.href = "https://wa.me/" + WHATSAPP.replace(/\D/g, "") + "?text=" + encodeURIComponent(testo);
  b.hidden = false;
}

/* ── invio del modulo ────────────────────────────────────────────────────── */
modulo?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dati = new FormData(modulo);

  /* La trappola: se qualcuno ha riempito il campo nascosto è un programma.
     Si finge che sia andato tutto bene e non si invia niente. */
  if ((dati.get("sito") || "").trim() !== "") {
    dica("Grazie! Ti ricontattiamo appena possibile.", "ok");
    modulo.reset();
    return;
  }

  const nome = String(dati.get("nome") || "").trim();
  const contatto = String(dati.get("contatto") || "");
  if (nome.length < 2) { dica("Scrivi il tuo nome.", "errore"); modulo.nome.focus(); return; }
  if (!contattoValido(contatto)) { dica("Lascia un numero di telefono o un'email che possiamo usare.", "errore"); modulo.contatto.focus(); return; }
  if (!dati.get("privacy")) { dica("Per inviare serve spuntare l'informativa sulla privacy.", "errore"); return; }

  if (!ENDPOINT) {
    dica("Bozza: il modulo non è ancora collegato alla raccolta dei contatti, quindi per ora non invia niente.", "errore");
    return;
  }

  const corpo = {
    chiave: CHIAVE,
    sito: "",
    nome,
    contatto: contatto.trim(),
    interessi: dati.getAll("interessi"),
    dove: dati.get("dove"),
    fonte: fonte(),
    consenso: true,
    ms: Date.now() - apertoAlle,   // quanto ci ha messo: i programmi sono troppo veloci
  };

  const bottone = modulo.querySelector("button[type=submit]");
  bottone.disabled = true;
  dica("Invio in corso…");
  try {
    /* Il servizio non risponde con le intestazioni che servirebbero per leggere
       la risposta da un altro sito: si invia come testo semplice e senza leggere
       l'esito (mode no-cors). Se la rete funziona, la richiesta è partita; il
       controllo vero è l'email che arriva per ogni contatto. */
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(corpo),
    });
    dica("Grazie! Ti ricontattiamo appena possibile. Se entro due giorni non ricevi risposta, scrivi a Giuseppe su Instagram.", "ok");
    mostraWhatsAppDopo(nome);
    modulo.reset();
  } catch {
    dica("Non sono riuscito a inviare. Riprova fra poco o scrivi a Giuseppe su Instagram.", "errore");
  } finally {
    bottone.disabled = false;
  }
});

/* ── barra fissa sul telefono: dopo l'apertura, e non davanti al modulo ──── */
const barra = document.getElementById("barra-cta");
const apertura = document.getElementById("apertura");
const contattoSezione = document.getElementById("contatto");
if (barra && apertura && contattoSezione && "IntersectionObserver" in window) {
  let aperturaVisibile = true, contattoVisibile = false;
  const aggiorna = () => {
    const mostra = !aperturaVisibile && !contattoVisibile;
    barra.hidden = false;
    barra.classList.toggle("visibile", mostra);
    barra.tabIndex = mostra ? 0 : -1;
    barra.setAttribute("aria-hidden", mostra ? "false" : "true");
  };
  new IntersectionObserver(([v]) => { aperturaVisibile = v.isIntersecting; aggiorna(); }).observe(apertura);
  new IntersectionObserver(([v]) => { contattoVisibile = v.isIntersecting; aggiorna(); }, { threshold: 0.15 }).observe(contattoSezione);
}
