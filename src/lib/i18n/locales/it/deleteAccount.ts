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
      "La tua iscrizione su questo sito e il tuo indirizzo nell'elenco dei tester del test chiuso nella Google Play Console, se ti sei registrato qui",
    ],
  },

  whatRemains: {
    title: "Cosa non viene eliminato",
    items: [
      "Due identificatori tecnici derivati dalla tua identità: un hash unidirezionale del tuo indirizzo email e uno dell'identificatore del tuo provider di accesso. Nessuno dei due è l'indirizzo o l'account in sé, ma poiché possiamo ricalcolarli per qualsiasi identità restano dati personali e li trattiamo come tali. Li conserviamo per 12 mesi dopo la fine del tuo periodo di prova, con un unico scopo: impedire che la stessa persona ottenga una seconda prova gratuita. Non vengono mai usati per altro. Hai il diritto di opporti — chiedilo prima di eliminare l'account, all'indirizzo in fondo a questa pagina, perché una volta eliminato l'account l'identificatore del provider non può più essere ricondotto a te.",
      "Il catalogo di ricette condiviso — ricette, ingredienti e relative traduzioni. Questi dati sono comuni a tutti gli utenti, non sono collegati al tuo account e non contengono nulla di personale su di te.",
      "I dati di acquisto in possesso di Google Play o Apple. Appartengono allo store, non a noi, e vanno gestiti direttamente con loro.",
      "Le copie di backup dei nostri database, per tutta la durata della finestra di backup del fornitore. L'eliminazione ha effetto immediato sui dati attivi; i backup ruotano secondo il loro calendario e non vengono mai usati per ripristinare un account eliminato.",
    ],
    note: "Conserviamo l'indirizzo IP da cui è arrivata la richiesta — nella tabella che limita la frequenza di questi moduli e nell'email interna che registra una richiesta inviata con il modulo qui sotto. Serve solo a proteggere i moduli dagli abusi, non è collegato al tuo profilo, e lo cancelliamo su richiesta all'indirizzo qui sotto.",
  },

  timing: {
    title: "Quanto tempo richiede",
    body: "Ci sono due strade, con tempi diversi. Se confermi con il codice che ti inviamo via email, l'eliminazione avviene nel momento in cui confermi: immediata, senza periodo di grazia e senza modo di recuperare i dati. Se usi invece il modulo di richiesta, la trattiamo a mano entro 30 giorni, come impone il GDPR — in pratica molto prima.",
  },

  inApp: {
    title: "Più veloce: elimina dall'app",
    body: "Se hai ancora Eatease installata, puoi eliminare l'account da solo in Impostazioni → Altro. Quell'eliminazione è immediata, ma raggiunge solo l'app: la tua iscrizione su questo sito e il tuo indirizzo nell'elenco dei tester del test chiuso nella Google Play Console restano. Se ti sei registrato qui, usa anche il modulo qui sotto.",
  },

  selfService: {
    title: "Elimina il tuo account adesso",
    intro: "Invieremo un codice di sei cifre all'indirizzo email del tuo account, per confermare che è tuo. Non viene eliminato nulla finché non inserisci quel codice e confermi.",
    submit: "Inviami un codice",
    submitting: "Invio in corso...",

    step2: {
      title: "Inserisci il codice",
      body: "Se esiste un account per quell'indirizzo, un codice di sei cifre è in arrivo. Scade tra un'ora.",
      codeLabel: "Codice di sei cifre",
      codePlaceholder: "000000",
      submit: "Conferma il codice",
      submitting: "Verifica in corso...",
      back: "Usa un altro indirizzo",
      errorCode: "Questo codice non è valido, oppure è scaduto. Controlla l'email e riprova.",
    },

    step3: {
      title: "Ultimo passo — non si può tornare indietro",
      body: "Confermando vengono eliminati subito il tuo account, i tuoi dati e le foto che hai caricato. Non c'è periodo di grazia né modo di recuperare nulla.",
      warningTrial: "Se vuoi che venga cancellato anche il registro della prova descritto sopra, chiedilo prima di confermare, all'indirizzo in fondo a questa pagina. Una volta eliminato l'account, quel registro non può più essere ricondotto a te.",
      warningTesters: "Il tuo indirizzo nell'elenco dei tester del test chiuso nella Google Play Console lo togliamo a mano noi, e non nel momento in cui confermi. Tutto il resto viene eliminato subito.",
      checkbox: "Capisco che è definitivo e che i miei dati non potranno essere recuperati.",
      submit: "Elimina definitivamente il mio account",
      submitting: "Eliminazione in corso...",
      errorWaitlist: "Non siamo riusciti a rimuovere la tua iscrizione su questo sito, quindi ci siamo fermati prima di eliminare qualsiasi cosa. Il tuo account è intatto. Riprova, oppure scrivici all'indirizzo qui sotto.",
    },

    done: {
      title: "Il tuo account è eliminato",
      body: "Il tuo account, i tuoi dati e i tuoi caricamenti non ci sono più, e la tua iscrizione su questo sito è stata rimossa per prima. Restano il registro della prova descritto sopra e il tuo indirizzo nell'elenco dei tester, che togliamo a mano.",
    },
  },

  manual: {
    disclosure: "Non riesco ad accedere all'indirizzo email del mio account",
  },

  form: {
    title: "Richiedi l'eliminazione via email",
    body: "Inserisci l'indirizzo email dell'account che vuoi eliminare. Ti invieremo un'email per confermare di aver ricevuto la richiesta.",
    emailLabel: "Indirizzo email",
    emailPlaceholder: "tu@esempio.com",
    reasonLabel: "Motivo (facoltativo)",
    reasonPlaceholder: "Dicci perché te ne vai, se ti va.",
    submit: "Richiedi l'eliminazione",
    submitting: "Invio in corso...",
    successTitle: "Richiesta ricevuta",
    successBody: "Ti abbiamo inviato un'email di conferma. Il tuo account e i tuoi dati saranno eliminati entro 30 giorni. Se non sei stato tu a fare questa richiesta, rispondi a quell'email e la annulleremo: finora non è stato eliminato nulla.",
    errorCaptcha: "Completa la verifica di sicurezza.",
    errorRateLimit: "Troppi tentativi. Attendi qualche minuto e riprova.",
    errorGeneric: "Qualcosa è andato storto. Riprova.",
    errorNetwork: "Connessione non riuscita. Controlla la rete e riprova.",
  },

  contact: {
    title: "Ti serve aiuto?",
    body: "Se non riesci ad accedere all'indirizzo email del tuo account, o se qualcosa qui sopra non è chiaro, scrivici e ce ne occupiamo noi:",
    email: "privacy@eatease.eu",
  },
};
