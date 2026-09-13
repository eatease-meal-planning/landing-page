export const deleteAccount = {
  title: "Je account en gegevens verwijderen",
  intro: "Op deze pagina kun je verzoeken om je Eatease-account en alle bijbehorende persoonsgegevens definitief te verwijderen. Lees het onderstaande voordat je het verzoek verstuurt — de verwijdering kan niet ongedaan worden gemaakt.",

  whatIsDeleted: {
    title: "Wat er wordt verwijderd",
    items: [
      "Je account en inloggegevens",
      "Je profiel, doelen en voorkeuren",
      "Gezinsleden die je hebt toegevoegd en hun doelen",
      "Maaltijdplannen en portietoewijzingen",
      "Boodschappenlijsten en de items daarin",
      "Favoriete recepten",
      "Geregistreerde maaltijden en je macrogeschiedenis",
      "Macrodoelen en berekeningen in de cache",
      "Geregistreerde apparaten en meldingen",
      "Abonnementsgegevens en aankoopbewijzen",
      "Foto's die je hebt geüpload (profiel, maaltijden, recepten, documenten)",
      "Je aanmelding op deze website en je adres op de testerslijst van de closed test in de Google Play Console, als je je hier hebt ingeschreven",
    ],
  },

  whatRemains: {
    title: "Wat niet wordt verwijderd",
    items: [
      "Twee technische kenmerken die van je identiteit zijn afgeleid: een eenrichtingshash van je e-mailadres en een van het identificatienummer van je aanmeldprovider. Geen van beide is het adres of het account zelf, maar omdat we ze voor elke identiteit opnieuw kunnen berekenen blijven het persoonsgegevens en behandelen we ze ook zo. We bewaren ze 12 maanden na afloop van je proefperiode, met één doel: voorkomen dat dezelfde persoon een tweede gratis proefperiode krijgt. Ze worden nooit voor iets anders gebruikt. Je hebt het recht van bezwaar — vraag het vóór de verwijdering aan, op het adres onderaan deze pagina, want zodra het account weg is, is het providerkenmerk niet meer aan jou te koppelen.",
      "De gedeelde receptencatalogus — recepten, ingrediënten en hun vertalingen. Deze gegevens zijn voor alle gebruikers hetzelfde, zijn niet aan jouw account gekoppeld en bevatten niets persoonlijks over jou.",
      "Aankoopgegevens die Google Play of Apple bewaart. Die horen bij de appstore, niet bij ons, en moet je daar regelen.",
      "Back-upkopieën van onze databases, zolang het back-upvenster van de leverancier duurt. In de actieve gegevens werkt de verwijdering meteen; back-ups rouleren volgens hun eigen schema en worden nooit gebruikt om een verwijderd account terug te halen.",
    ],
    note: "We bewaren het IP-adres waar het verzoek vandaan kwam — in de tabel die deze formulieren afremt, en in de interne e-mail die een verzoek via het formulier hieronder vastlegt. Het dient alleen om de formulieren tegen misbruik te beschermen, is niet aan je profiel gekoppeld, en we wissen het op verzoek via het adres hieronder.",
  },

  timing: {
    title: "Hoe lang het duurt",
    body: "Er zijn twee wegen, met verschillende termijnen. Bevestig je met de code die we je mailen, dan gebeurt de verwijdering op het moment dat je bevestigt: meteen, zonder respijtperiode en zonder manier om de gegevens terug te halen. Gebruik je in plaats daarvan het aanvraagformulier, dan verwerken we het met de hand binnen 30 dagen, zoals de AVG vereist — in de praktijk veel sneller.",
  },

  inApp: {
    title: "Sneller: verwijderen in de app",
    body: "Heb je Eatease nog geïnstalleerd? Dan kun je je account zelf verwijderen via Instellingen → Meer. Die verwijdering is direct, maar bereikt alleen de app: je aanmelding op deze website en je adres op de testerslijst van de closed test in de Google Play Console blijven staan. Heb je je hier ingeschreven, gebruik dan ook het formulier hieronder.",
  },

  selfService: {
    title: "Verwijder je account nu",
    intro: "We sturen een code van zes cijfers naar het e-mailadres van je account, om te bevestigen dat het van jou is. Er wordt niets verwijderd voordat je die code invoert en bevestigt.",
    submit: "Stuur me een code",
    submitting: "Versturen...",

    step2: {
      title: "Voer de code in",
      body: "Als er een account bestaat voor dat adres, is een code van zes cijfers onderweg. Hij verloopt over een uur.",
      codeLabel: "Code van zes cijfers",
      codePlaceholder: "000000",
      submit: "Code bevestigen",
      submitting: "Controleren...",
      back: "Een ander adres gebruiken",
      errorCode: "Die code klopt niet, of hij is verlopen. Kijk in de e-mail en probeer het opnieuw.",
    },

    step3: {
      title: "Laatste stap — dit kan niet ongedaan worden gemaakt",
      body: "Als je bevestigt, worden je account, je gegevens en de foto's die je hebt geüpload meteen verwijderd. Er is geen respijtperiode en geen manier om er iets van terug te halen.",
      warningTrial: "Wil je dat ook het proefperiode-record hierboven wordt gewist, vraag het dan vóórdat je bevestigt, op het adres onderaan deze pagina. Zodra het account weg is, is dat record niet meer aan jou te koppelen.",
      warningTesters: "Je adres op de testerslijst van de gesloten test in de Google Play Console halen wij er met de hand af, en niet op het moment dat je bevestigt. Al het andere gaat meteen weg.",
      checkbox: "Ik begrijp dat dit definitief is en dat mijn gegevens niet kunnen worden hersteld.",
      submit: "Mijn account definitief verwijderen",
      submitting: "Verwijderen...",
      errorWaitlist: "We konden je registratie op deze website niet verwijderen, dus zijn we gestopt voordat er iets werd gewist. Je account is onaangeroerd. Probeer het opnieuw, of schrijf ons op het adres hieronder.",
    },

    done: {
      title: "Je account is verwijderd",
      body: "Je account, je gegevens en je uploads zijn weg, en je registratie op deze website is als eerste verwijderd. Wat overblijft is het proefperiode-record hierboven en je adres op de testerslijst, dat we met de hand verwijderen.",
    },
  },

  manual: {
    disclosure: "Ik kan niet meer bij het e-mailadres van mijn account",
  },

  form: {
    title: "Verwijdering per e-mail aanvragen",
    body: "Vul het e-mailadres in van het account dat je wilt laten verwijderen. We sturen je een e-mail ter bevestiging dat we het verzoek hebben ontvangen.",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.com",
    reasonLabel: "Reden (optioneel)",
    reasonPlaceholder: "Vertel ons waarom je vertrekt, als je wilt.",
    submit: "Verwijdering aanvragen",
    submitting: "Bezig met versturen...",
    successTitle: "Verzoek ontvangen",
    successBody: "We hebben je een bevestigingsmail gestuurd. Je account en gegevens worden binnen 30 dagen verwijderd. Heb je dit verzoek niet gedaan? Beantwoord die e-mail, dan annuleren we het. Er is nog niets verwijderd.",
    errorCaptcha: "Voltooi de beveiligingscontrole.",
    errorRateLimit: "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.",
    errorGeneric: "Er is iets misgegaan. Probeer het opnieuw.",
    errorNetwork: "Verbinding mislukt. Controleer je netwerk en probeer het opnieuw.",
  },

  contact: {
    title: "Hulp nodig?",
    body: "Kun je niet meer bij het e-mailadres van je account, of is iets hierboven onduidelijk? Schrijf ons, dan regelen wij het:",
    email: "privacy@eatease.eu",
  },
};
