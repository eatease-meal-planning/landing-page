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
      "Je aanmelding op deze website, als je je hier hebt ingeschreven",
    ],
  },

  whatRemains: {
    title: "Wat niet wordt verwijderd",
    items: [
      "Een technische identificator die is afgeleid van je e-mailadres — een eenrichtingshash, niet het adres zelf. Omdat we die voor elk adres opnieuw kunnen berekenen, blijft het een persoonsgegeven en behandelen we het ook zo. We bewaren die 12 maanden na afloop van je proefperiode, met één enkel doel: voorkomen dat dezelfde persoon een tweede gratis proefperiode krijgt. Voor iets anders wordt die nooit gebruikt. Je hebt het recht bezwaar te maken — schrijf ons op het onderstaande adres en we verwijderen die.",
      "De gedeelde receptencatalogus — recepten, ingrediënten en hun vertalingen. Deze gegevens zijn voor alle gebruikers hetzelfde, zijn niet aan jouw account gekoppeld en bevatten niets persoonlijks over jou.",
      "Aankoopgegevens die Google Play of Apple bewaart. Die horen bij de appstore, niet bij ons, en moet je daar regelen.",
    ],
    note: "Anonieme technische serverlogs kunnen om veiligheidsredenen kort een spoor van het verzoek bewaren. Ze identificeren jou niet.",
  },

  timing: {
    title: "Hoe lang het duurt",
    body: "Verzoeken die hier binnenkomen worden handmatig binnen 30 dagen verwerkt, zoals de AVG voorschrijft. In de praktijk gaat het veel sneller. Zodra het verzoek is verwerkt, is de verwijdering onmiddellijk en onomkeerbaar — er is geen bedenktijd en geen manier om de gegevens terug te halen.",
  },

  inApp: {
    title: "Sneller: verwijderen in de app",
    body: "Heb je Eatease nog geïnstalleerd? Dan kun je je account zelf verwijderen via Instellingen → Meer. Die verwijdering is direct en loopt niet via dit formulier.",
  },

  form: {
    title: "Verwijdering aanvragen",
    body: "Vul het e-mailadres in van het account dat je wilt laten verwijderen. We sturen je een e-mail ter bevestiging dat we het verzoek hebben ontvangen.",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.com",
    reasonLabel: "Reden (optioneel)",
    reasonPlaceholder: "Vertel ons waarom je vertrekt, als je wilt.",
    submit: "Verwijdering aanvragen",
    submitting: "Bezig met versturen...",
    successTitle: "Verzoek ontvangen",
    successBody: "We hebben je een bevestigingsmail gestuurd. Je account en gegevens worden binnen 30 dagen verwijderd. Heb je dit verzoek niet gedaan? Negeer de e-mail, dan gebeurt er niets.",
    errorCaptcha: "Voltooi de beveiligingscontrole.",
    errorRateLimit: "Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.",
    errorGeneric: "Er is iets misgegaan. Probeer het opnieuw.",
    errorNetwork: "Verbinding mislukt. Controleer je netwerk en probeer het opnieuw.",
  },

  contact: {
    title: "Hulp nodig?",
    body: "Kun je niet meer bij het e-mailadres van je account, of is iets hierboven onduidelijk? Schrijf ons, dan regelen wij het:",
  },
};
