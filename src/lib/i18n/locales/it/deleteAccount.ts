export const deleteAccount = {
  title: "Elimina il tuo account e i tuoi dati",
  intro: "In questa pagina puoi richiedere l'eliminazione definitiva del tuo account Eatease e di tutti i dati personali associati. Leggi quanto segue prima di inviare la richiesta: l'eliminazione non può essere annullata.",

  whatIsDeleted: {
    title: "Cosa viene eliminato",
    items: [
      "Il tuo account e le credenziali di accesso",
      "Il tuo profilo, i tuoi obiettivi e le preferenze",
      "I membri della famiglia che hai aggiunto e i loro obiettivi",
      "Piani alimentari e assegnazione delle porzioni",
      "Liste della spesa e i relativi articoli",
      "Ricette preferite",
      "Pasti registrati e la cronologia dei macronutrienti",
      "Obiettivi di macronutrienti e calcoli in cache",
      "Dispositivi registrati e notifiche",
      "Dati di abbonamento e ricevute d'acquisto",
      "Le foto che hai caricato (profilo, pasti, ricette, documenti)",
      "La tua iscrizione su questo sito, se ti sei registrato qui",
    ],
  },

  whatRemains: {
    title: "Cosa non viene eliminato",
    items: [
      "Un identificatore tecnico derivato dal tuo indirizzo email — un hash unidirezionale, non l'indirizzo stesso. Poiché possiamo ricalcolarlo per qualsiasi indirizzo, resta un dato personale e lo trattiamo come tale. Lo conserviamo per 12 mesi dopo la fine del tuo periodo di prova, con un'unica finalità: impedire che la stessa persona ottenga una seconda prova gratuita. Non viene usato per nient'altro. Hai il diritto di opporti: scrivici all'indirizzo qui sotto e lo rimuoveremo.",
      "Il catalogo di ricette condiviso — ricette, ingredienti e relative traduzioni. Questi dati sono comuni a tutti gli utenti, non sono collegati al tuo account e non contengono nulla di personale su di te.",
      "I dati di acquisto in possesso di Google Play o Apple. Appartengono allo store, non a noi, e vanno gestiti direttamente con loro.",
    ],
    note: "I log tecnici anonimi del server possono conservare traccia della richiesta per un breve periodo, per motivi di sicurezza. Non ti identificano.",
  },

  timing: {
    title: "Quanto tempo richiede",
    body: "Le richieste inviate da qui vengono elaborate manualmente entro 30 giorni, come previsto dal GDPR. In pratica le gestiamo molto prima. Una volta elaborata, l'eliminazione è immediata e irreversibile: non c'è alcun periodo di ripensamento né modo di recuperare i dati.",
  },

  inApp: {
    title: "Più veloce: elimina dall'app",
    body: "Se hai ancora Eatease installata, puoi eliminare l'account da solo in Impostazioni → Altro. Quell'eliminazione è immediata e non passa da questo modulo.",
  },

  form: {
    title: "Richiedi l'eliminazione",
    body: "Inserisci l'indirizzo email dell'account che vuoi eliminare. Ti invieremo un'email per confermare di aver ricevuto la richiesta.",
    emailLabel: "Indirizzo email",
    emailPlaceholder: "tu@esempio.com",
    reasonLabel: "Motivo (facoltativo)",
    reasonPlaceholder: "Dicci perché te ne vai, se ti va.",
    submit: "Richiedi l'eliminazione",
    submitting: "Invio in corso...",
    successTitle: "Richiesta ricevuta",
    successBody: "Ti abbiamo inviato un'email di conferma. Il tuo account e i tuoi dati saranno eliminati entro 30 giorni. Se non sei stato tu a fare questa richiesta, ignora l'email e non accadrà nulla.",
    errorCaptcha: "Completa la verifica di sicurezza.",
    errorRateLimit: "Troppi tentativi. Attendi qualche minuto e riprova.",
    errorGeneric: "Qualcosa è andato storto. Riprova.",
    errorNetwork: "Connessione non riuscita. Controlla la rete e riprova.",
  },

  contact: {
    title: "Ti serve aiuto?",
    body: "Se non riesci ad accedere all'indirizzo email del tuo account, o se qualcosa qui sopra non è chiaro, scrivici e ce ne occupiamo noi:",
  },
};
