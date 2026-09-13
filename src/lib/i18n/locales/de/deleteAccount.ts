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
      "Ihre Anmeldung auf dieser Website und Ihre Adresse in der Testerliste des geschlossenen Tests in der Google Play Console, sofern Sie sich hier registriert haben",
    ],
  },

  whatRemains: {
    title: "Was nicht gelöscht wird",
    items: [
      "Zwei technische Kennungen, die aus Ihrer Identität abgeleitet werden: ein Einweg-Hash Ihrer E-Mail-Adresse und einer Ihrer Anmeldeanbieter-Kennung. Keine von beiden ist die Adresse oder das Konto selbst, aber da wir sie für jede Identität neu berechnen können, bleiben sie personenbezogene Daten und werden von uns auch so behandelt. Wir speichern sie 12 Monate nach Ende Ihrer Testphase, zu einem einzigen Zweck: zu verhindern, dass dieselbe Person eine zweite kostenlose Testphase erhält. Für nichts anderes werden sie verwendet. Sie haben ein Widerspruchsrecht — wenden Sie sich damit vor der Löschung an die Adresse am Ende dieser Seite, denn sobald das Konto weg ist, lässt sich die Anbieter-Kennung Ihnen nicht mehr zuordnen.",
      "Der gemeinsame Rezeptkatalog — Rezepte, Zutaten und deren Übersetzungen. Diese Daten sind für alle Nutzenden gleich, sind nicht mit Ihrem Konto verknüpft und enthalten nichts Persönliches über Sie.",
      "Kaufunterlagen bei Google Play oder Apple. Diese gehören dem App-Store, nicht uns, und müssen dort verwaltet werden.",
      "Sicherungskopien unserer Datenbanken, solange das Sicherungsfenster des Anbieters reicht. In den aktiven Daten wirkt die Löschung sofort; Sicherungen rollieren nach ihrem eigenen Zeitplan und werden nie verwendet, um ein gelöschtes Konto zurückzuholen.",
    ],
    note: "Wir speichern die IP-Adresse, von der die Anfrage kam — in der Tabelle, die diese Formulare gegen Missbrauch begrenzt, und in der internen E-Mail, die eine über das untenstehende Formular gestellte Anfrage festhält. Sie dient ausschließlich dem Schutz der Formulare, ist nicht mit Ihrem Profil verknüpft, und auf Anfrage an die unten stehende Adresse löschen wir sie.",
  },

  timing: {
    title: "Wie lange es dauert",
    body: "Es gibt zwei Wege, mit unterschiedlichen Fristen. Bestätigen Sie mit dem Code, den wir Ihnen per E-Mail schicken, erfolgt die Löschung im Moment der Bestätigung: sofort, ohne Karenzzeit und ohne Möglichkeit, die Daten wiederherzustellen. Nutzen Sie stattdessen das Antragsformular, bearbeiten wir es manuell innerhalb von 30 Tagen, wie es die DSGVO vorschreibt — in der Praxis deutlich schneller.",
  },

  inApp: {
    title: "Schneller: direkt in der App löschen",
    body: "Wenn Eatease noch installiert ist, können Sie Ihr Konto selbst unter Einstellungen → Mehr löschen. Diese Löschung erfolgt sofort, erreicht aber nur die App: Ihre Anmeldung auf dieser Website und Ihre Adresse in der Testerliste des geschlossenen Tests in der Google Play Console bleiben bestehen. Wenn Sie sich hier registriert haben, nutzen Sie zusätzlich das Formular unten.",
  },

  selfService: {
    title: "Konto jetzt löschen",
    intro: "Wir senden einen sechsstelligen Code an die E-Mail-Adresse Ihres Kontos, um zu bestätigen, dass sie Ihnen gehört. Nichts wird gelöscht, bevor Sie diesen Code eingeben und bestätigen.",
    submit: "Code per E-Mail senden",
    submitting: "Wird gesendet...",

    step2: {
      title: "Code eingeben",
      body: "Falls für diese Adresse ein Konto besteht, ist ein sechsstelliger Code unterwegs. Er läuft in einer Stunde ab.",
      codeLabel: "Sechsstelliger Code",
      codePlaceholder: "000000",
      submit: "Code bestätigen",
      submitting: "Wird geprüft...",
      back: "Andere Adresse verwenden",
      errorCode: "Dieser Code ist ungültig oder abgelaufen. Prüfen Sie die E-Mail und versuchen Sie es erneut.",
    },

    step3: {
      title: "Letzter Schritt — dies lässt sich nicht rückgängig machen",
      body: "Mit der Bestätigung werden Ihr Konto, Ihre Daten und Ihre hochgeladenen Fotos sofort gelöscht. Es gibt keine Karenzzeit und keine Möglichkeit, etwas davon wiederherzustellen.",
      warningTrial: "Soll auch der oben beschriebene Eintrag zur Testphase gelöscht werden, wenden Sie sich vor dem Bestätigen an die Adresse am Ende dieser Seite. Sobald das Konto weg ist, lässt sich dieser Eintrag Ihnen nicht mehr zuordnen.",
      warningTesters: "Ihre Adresse auf der Testerliste des geschlossenen Tests in der Google Play Console entfernen wir von Hand, nicht im Moment der Bestätigung. Alles andere wird sofort gelöscht.",
      checkbox: "Mir ist klar, dass dies endgültig ist und meine Daten nicht wiederhergestellt werden können.",
      submit: "Mein Konto endgültig löschen",
      submitting: "Wird gelöscht...",
      errorRegistration: "Ihre Anmeldung auf dieser Website konnte nicht entfernt werden, deshalb haben wir abgebrochen, bevor etwas gelöscht wurde. Ihr Konto ist unverändert. Bitte versuchen Sie es erneut oder schreiben Sie an die unten stehende Adresse.",
    },

    done: {
      title: "Ihr Konto ist gelöscht",
      body: "Ihr Konto, Ihre Daten und Ihre Uploads sind weg, und Ihre Anmeldung auf dieser Website wurde zuerst entfernt. Es bleiben der oben beschriebene Eintrag zur Testphase und Ihre Adresse auf der Testerliste, die wir von Hand entfernen.",
    },
  },

  manual: {
    disclosure: "Ich habe keinen Zugriff mehr auf die E-Mail-Adresse meines Kontos",
  },

  form: {
    title: "Löschung per E-Mail beantragen",
    body: "Geben Sie die E-Mail-Adresse des Kontos an, das gelöscht werden soll. Wir senden Ihnen eine Bestätigung, dass wir den Antrag erhalten haben.",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "sie@beispiel.com",
    reasonLabel: "Grund (optional)",
    reasonPlaceholder: "Sagen Sie uns gerne, warum Sie gehen.",
    submit: "Löschung beantragen",
    submitting: "Wird gesendet...",
    successTitle: "Antrag eingegangen",
    successBody: "Wir haben Ihnen eine Bestätigung per E-Mail geschickt. Ihr Konto und Ihre Daten werden innerhalb von 30 Tagen gelöscht. Falls Sie diesen Antrag nicht gestellt haben, antworten Sie einfach darauf — dann stornieren wir ihn. Bisher wurde nichts gelöscht.",
    errorCaptcha: "Bitte schließen Sie die Sicherheitsprüfung ab.",
    errorRateLimit: "Zu viele Versuche. Warten Sie einige Minuten und versuchen Sie es erneut.",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    errorNetwork: "Verbindung fehlgeschlagen. Prüfen Sie Ihr Netzwerk und versuchen Sie es erneut.",
  },

  contact: {
    title: "Brauchen Sie Hilfe?",
    body: "Wenn Sie keinen Zugriff mehr auf die E-Mail-Adresse Ihres Kontos haben oder etwas davon unklar ist, schreiben Sie uns — wir kümmern uns darum:",
    email: "privacy@eatease.eu",
  },
};
