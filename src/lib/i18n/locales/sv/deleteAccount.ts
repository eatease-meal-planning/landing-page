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
      "Din anmälan på den här webbplatsen och din adress på testarlistan för den slutna testningen i Google Play Console, om du registrerade dig här",
    ],
  },

  whatRemains: {
    title: "Vad som inte raderas",
    items: [
      "Två tekniska identifierare som härleds ur din identitet: en envägshash av din e-postadress och en av din inloggningsleverantörs identifierare. Ingen av dem är adressen eller kontot i sig, men eftersom vi kan räkna om dem för vilken identitet som helst är de fortfarande personuppgifter och behandlas så. Vi sparar dem i 12 månader efter att din provperiod tagit slut, i ett enda syfte: att hindra att samma person får en andra gratis provperiod. De används aldrig till något annat. Du har rätt att invända — be om det innan du raderar kontot, på adressen längst ner på sidan, för när kontot är borta går leverantörsidentifieraren inte längre att koppla till dig.",
      "Den gemensamma receptkatalogen — recept, ingredienser och deras översättningar. Dessa uppgifter är gemensamma för alla användare, är inte kopplade till ditt konto och innehåller inget personligt om dig.",
      "Köpuppgifter som Google Play eller Apple har. De tillhör appbutiken, inte oss, och måste hanteras där.",
      "Säkerhetskopior av våra databaser, så länge leverantörens backupfönster varar. I den aktiva datan gäller raderingen omedelbart; säkerhetskopiorna roterar enligt sitt eget schema och används aldrig för att ta tillbaka ett raderat konto.",
    ],
    note: "Vi sparar IP-adressen som begäran kom från — i tabellen som begränsar takten i de här formulären, och i det interna mejl som registrerar en begäran gjord via formuläret nedan. Den finns bara för att skydda formulären mot missbruk, är inte kopplad till din profil, och vi raderar den på begäran till adressen nedan.",
  },

  timing: {
    title: "Hur lång tid det tar",
    body: "Det finns två vägar, med olika tider. Bekräftar du med koden vi mejlar dig sker raderingen i samma stund som du bekräftar: omedelbart, utan respittid och utan något sätt att få tillbaka uppgifterna. Använder du i stället begäranformuläret behandlar vi den för hand inom 30 dagar, som GDPR kräver — i praktiken mycket snabbare.",
  },

  inApp: {
    title: "Snabbare: radera i appen",
    body: "Om du fortfarande har Eatease installerad kan du radera kontot själv under Inställningar → Mer. Den raderingen sker direkt, men når bara appen: din anmälan på den här webbplatsen och din adress på testarlistan för den slutna testningen i Google Play Console finns kvar. Om du registrerade dig här, använd även formuläret nedan.",
  },

  selfService: {
    title: "Radera ditt konto nu",
    intro: "Vi mejlar en sexsiffrig kod till adressen på ditt konto, för att bekräfta att den är din. Ingenting raderas förrän du anger koden och bekräftar.",
    submit: "Mejla mig en kod",
    submitting: "Skickar...",

    step2: {
      title: "Ange koden",
      body: "Om det finns ett konto för den adressen är en sexsiffrig kod på väg. Den går ut om en timme.",
      codeLabel: "Sexsiffrig kod",
      codePlaceholder: "000000",
      submit: "Bekräfta koden",
      submitting: "Kontrollerar...",
      back: "Använd en annan adress",
      errorCode: "Koden är inte giltig, eller så har den gått ut. Titta i mejlet och försök igen.",
    },

    step3: {
      title: "Sista steget — det här går inte att ångra",
      body: "Bekräftar du raderas ditt konto, dina uppgifter och bilderna du laddat upp med en gång. Det finns ingen respittid och inget sätt att få tillbaka något av det.",
      warningTrial: "Vill du att provperiodsposten som beskrivs ovan också raderas, be om det innan du bekräftar, på adressen längst ner på sidan. När kontot är borta går den posten inte längre att koppla till dig.",
      warningTesters: "Din adress på testarlistan för den stängda testen i Google Play Console tar vi bort för hand, och inte i stunden du bekräftar. Allt annat försvinner direkt.",
      checkbox: "Jag förstår att det här är permanent och att mina uppgifter inte går att återskapa.",
      submit: "Radera mitt konto permanent",
      submitting: "Raderar...",
      errorWaitlist: "Vi kunde inte ta bort din registrering på den här webbplatsen, så vi stannade innan något raderades. Ditt konto är orört. Försök igen, eller skriv till oss på adressen nedan.",
    },

    done: {
      title: "Ditt konto är raderat",
      body: "Ditt konto, dina uppgifter och det du laddat upp är borta, och din registrering på den här webbplatsen togs bort först. Kvar är provperiodsposten som beskrivs ovan och din adress på testarlistan, som vi tar bort för hand.",
    },
  },

  manual: {
    disclosure: "Jag kommer inte åt e-postadressen på mitt konto",
  },

  form: {
    title: "Begär radering via e-post",
    body: "Ange e-postadressen till det konto du vill radera. Vi skickar ett mejl som bekräftar att vi tagit emot din begäran.",
    emailLabel: "E-postadress",
    emailPlaceholder: "du@exempel.com",
    reasonLabel: "Anledning (valfritt)",
    reasonPlaceholder: "Berätta gärna varför du lämnar oss.",
    submit: "Begär radering",
    submitting: "Skickar...",
    successTitle: "Begäran mottagen",
    successBody: "Vi har skickat en bekräftelse till din e-post. Ditt konto och dina uppgifter raderas inom 30 dagar. Om det inte var du som gjorde begäran kan du svara på det mejlet, så avbryter vi den. Inget har raderats än.",
    errorCaptcha: "Slutför säkerhetskontrollen.",
    errorRateLimit: "För många försök. Vänta några minuter och försök igen.",
    errorGeneric: "Något gick fel. Försök igen.",
    errorNetwork: "Anslutningen misslyckades. Kontrollera nätverket och försök igen.",
  },

  contact: {
    title: "Behöver du hjälp?",
    body: "Om du inte längre kommer åt e-postadressen på ditt konto, eller om något ovan är oklart, skriv till oss så löser vi det:",
    email: "privacy@eatease.eu",
  },
};
