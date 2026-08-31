export const deleteAccount = {
  title: "Konto und Daten löschen",
  intro: "Auf dieser Seite können Sie die endgültige Löschung Ihres Eatease-Kontos und aller damit verbundenen personenbezogenen Daten beantragen. Lesen Sie das Folgende, bevor Sie den Antrag absenden — die Löschung lässt sich nicht rückgängig machen.",

  whatIsDeleted: {
    title: "Was gelöscht wird",
    items: [
      "Ihr Konto und Ihre Anmeldedaten",
      "Ihr Profil, Ihre Ziele und Einstellungen",
      "Von Ihnen hinzugefügte Familienmitglieder und deren Ziele",
      "Essenspläne und Portionszuweisungen",
      "Einkaufslisten und deren Einträge",
      "Lieblingsrezepte",
      "Erfasste Mahlzeiten und Ihr Makro-Verlauf",
      "Makroziele und zwischengespeicherte Berechnungen",
      "Registrierte Geräte und Benachrichtigungen",
      "Abonnementdaten und Kaufbelege",
      "Von Ihnen hochgeladene Fotos (Profil, Mahlzeiten, Rezepte, Dokumente)",
      "Ihre Anmeldung auf dieser Website, sofern Sie sich hier registriert haben",
    ],
  },

  whatRemains: {
    title: "Was nicht gelöscht wird",
    items: [
      "Eine technische Kennung, die aus Ihrer E-Mail-Adresse abgeleitet wird — ein Einweg-Hash, nicht die Adresse selbst. Da wir ihn für jede Adresse neu berechnen können, bleibt er ein personenbezogenes Datum und wird von uns auch so behandelt. Wir speichern ihn 12 Monate nach Ende Ihrer Testphase, zu einem einzigen Zweck: zu verhindern, dass dieselbe Person eine zweite kostenlose Testphase erhält. Für nichts anderes wird er verwendet. Sie haben ein Widerspruchsrecht — schreiben Sie an die unten stehende Adresse und wir entfernen ihn.",
      "Der gemeinsame Rezeptkatalog — Rezepte, Zutaten und deren Übersetzungen. Diese Daten sind für alle Nutzenden gleich, sind nicht mit Ihrem Konto verknüpft und enthalten nichts Persönliches über Sie.",
      "Kaufunterlagen bei Google Play oder Apple. Diese gehören dem App-Store, nicht uns, und müssen dort verwaltet werden.",
    ],
    note: "Anonyme technische Serverprotokolle können aus Sicherheitsgründen kurzzeitig eine Spur der Anfrage aufbewahren. Sie lassen keine Rückschlüsse auf Sie zu.",
  },

  timing: {
    title: "Wie lange es dauert",
    body: "Hier eingereichte Anträge werden manuell innerhalb von 30 Tagen bearbeitet, wie es die DSGVO vorschreibt. In der Praxis geht es deutlich schneller. Nach der Bearbeitung erfolgt die Löschung sofort und unwiderruflich — es gibt keine Karenzzeit und keine Möglichkeit, die Daten wiederherzustellen.",
  },

  inApp: {
    title: "Schneller: direkt in der App löschen",
    body: "Wenn Eatease noch installiert ist, können Sie Ihr Konto selbst unter Einstellungen → Mehr löschen. Diese Löschung erfolgt sofort und läuft nicht über dieses Formular.",
  },

  form: {
    title: "Löschung beantragen",
    body: "Geben Sie die E-Mail-Adresse des Kontos an, das gelöscht werden soll. Wir senden Ihnen eine Bestätigung, dass wir den Antrag erhalten haben.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "sie@beispiel.com",
    reasonLabel: "Grund (optional)",
    reasonPlaceholder: "Sagen Sie uns gerne, warum Sie gehen.",
    submit: "Löschung beantragen",
    submitting: "Wird gesendet...",
    successTitle: "Antrag eingegangen",
    successBody: "Wir haben Ihnen eine Bestätigung per E-Mail geschickt. Ihr Konto und Ihre Daten werden innerhalb von 30 Tagen gelöscht. Falls Sie diesen Antrag nicht gestellt haben, ignorieren Sie die E-Mail einfach — dann passiert nichts.",
    errorCaptcha: "Bitte schließen Sie die Sicherheitsprüfung ab.",
    errorRateLimit: "Zu viele Versuche. Warten Sie einige Minuten und versuchen Sie es erneut.",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    errorNetwork: "Verbindung fehlgeschlagen. Prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.",
  },

  contact: {
    title: "Brauchen Sie Hilfe?",
    body: "Wenn Sie keinen Zugriff mehr auf die E-Mail-Adresse Ihres Kontos haben oder etwas davon unklar ist, schreiben Sie uns — wir kümmern uns darum:",
  },
};
