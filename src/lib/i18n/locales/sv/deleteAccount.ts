export const deleteAccount = {
  title: "Radera ditt konto och dina uppgifter",
  intro: "På den här sidan kan du begära permanent radering av ditt Eatease-konto och alla personuppgifter som hör till det. Läs igenom nedanstående innan du skickar in begäran — raderingen går inte att ångra.",

  whatIsDeleted: {
    title: "Vad som raderas",
    items: [
      "Ditt konto och dina inloggningsuppgifter",
      "Din profil, dina mål och inställningar",
      "Familjemedlemmar du lagt till och deras mål",
      "Måltidsplaner och portionsfördelning",
      "Inköpslistor och deras poster",
      "Favoritrecept",
      "Registrerade måltider och din makrohistorik",
      "Makromål och cachade beräkningar",
      "Registrerade enheter och aviseringar",
      "Prenumerationsuppgifter och köpkvitton",
      "Foton du laddat upp (profil, måltider, recept, dokument)",
      "Din anmälan på den här webbplatsen, om du registrerade dig här",
    ],
  },

  whatRemains: {
    title: "Vad som inte raderas",
    items: [
      "En teknisk identifierare som härleds ur din e-postadress — en envägshash, inte adressen i sig. Eftersom vi kan räkna om den för vilken adress som helst är den fortfarande en personuppgift och vi behandlar den som sådan. Vi sparar den i 12 månader efter att din provperiod har avslutats, i ett enda syfte: att hindra att samma person får en andra gratis provperiod. Den används aldrig till något annat. Du har rätt att invända — skriv till adressen nedan så tar vi bort den.",
      "Den gemensamma receptkatalogen — recept, ingredienser och deras översättningar. Dessa uppgifter är gemensamma för alla användare, är inte kopplade till ditt konto och innehåller inget personligt om dig.",
      "Köpuppgifter som Google Play eller Apple har. De tillhör appbutiken, inte oss, och måste hanteras där.",
    ],
    note: "Anonyma tekniska serverloggar kan av säkerhetsskäl behålla ett spår av begäran under en kort tid. De identifierar inte dig.",
  },

  timing: {
    title: "Hur lång tid det tar",
    body: "Begäranden som skickas här behandlas manuellt inom 30 dagar, enligt GDPR. I praktiken hanterar vi dem betydligt snabbare. När begäran har behandlats sker raderingen omedelbart och oåterkalleligt — det finns ingen ångerfrist och inget sätt att få tillbaka uppgifterna.",
  },

  inApp: {
    title: "Snabbare: radera i appen",
    body: "Om du fortfarande har Eatease installerad kan du radera kontot själv under Inställningar → Mer. Den raderingen sker direkt och går inte via det här formuläret.",
  },

  form: {
    title: "Begär radering",
    body: "Ange e-postadressen till det konto du vill radera. Vi skickar ett mejl som bekräftar att vi tagit emot din begäran.",
    emailLabel: "E-postadress",
    emailPlaceholder: "du@exempel.com",
    reasonLabel: "Anledning (valfritt)",
    reasonPlaceholder: "Berätta gärna varför du lämnar oss.",
    submit: "Begär radering",
    submitting: "Skickar...",
    successTitle: "Begäran mottagen",
    successBody: "Vi har skickat en bekräftelse till din e-post. Ditt konto och dina uppgifter raderas inom 30 dagar. Om det inte var du som gjorde begäran kan du bortse från mejlet — då händer ingenting.",
    errorCaptcha: "Slutför säkerhetskontrollen.",
    errorRateLimit: "För många försök. Vänta några minuter och försök igen.",
    errorGeneric: "Något gick fel. Försök igen.",
    errorNetwork: "Anslutningen misslyckades. Kontrollera nätverket och försök igen.",
  },

  contact: {
    title: "Behöver du hjälp?",
    body: "Om du inte längre kommer åt e-postadressen på ditt konto, eller om något ovan är oklart, skriv till oss så löser vi det:",
  },
};
