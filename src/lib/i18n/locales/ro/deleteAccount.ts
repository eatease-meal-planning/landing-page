export const deleteAccount = {
  title: "Șterge-ți contul și datele",
  intro: "Pe această pagină poți solicita ștergerea definitivă a contului tău Eatease și a tuturor datelor personale asociate. Citește cele de mai jos înainte de a trimite cererea — ștergerea nu poate fi anulată.",

  whatIsDeleted: {
    title: "Ce se șterge",
    items: [
      "Contul tău și datele de autentificare",
      "Profilul tău, obiectivele și preferințele",
      "Membrii familiei pe care i-ai adăugat și obiectivele lor",
      "Planurile de mese și repartizarea porțiilor",
      "Listele de cumpărături și articolele din ele",
      "Rețetele favorite",
      "Mesele înregistrate și istoricul de macronutrienți",
      "Obiectivele de macronutrienți și calculele din memoria cache",
      "Dispozitivele înregistrate și notificările",
      "Datele de abonament și chitanțele de achiziție",
      "Fotografiile pe care le-ai încărcat (profil, mese, rețete, documente)",
      "Înscrierea ta pe acest site și adresa ta din lista de testeri a testării închise din Google Play Console, dacă te-ai înregistrat aici",
    ],
  },

  whatRemains: {
    title: "Ce nu se șterge",
    items: [
      "Doi identificatori tehnici derivați din identitatea ta: un hash unidirecțional al adresei tale de e-mail și unul al identificatorului furnizorului cu care te autentifici. Niciunul nu este adresa sau contul în sine, dar fiindcă îi putem recalcula pentru orice identitate rămân date cu caracter personal și așa le tratăm. Îi păstrăm 12 luni după încheierea perioadei tale de probă, cu un singur scop: să împiedicăm ca aceeași persoană să primească o a doua perioadă de probă gratuită. Nu sunt folosiți niciodată pentru altceva. Ai dreptul să te opui — cere asta înainte de a șterge contul, la adresa de la finalul acestei pagini, pentru că odată contul șters identificatorul furnizorului nu mai poate fi legat de tine.",
      "Catalogul de rețete comun — rețete, ingrediente și traducerile lor. Aceste date sunt comune tuturor utilizatorilor, nu sunt legate de contul tău și nu conțin nimic personal despre tine.",
      "Datele de achiziție păstrate de Google Play sau Apple. Acestea aparțin magazinului de aplicații, nu nouă, și trebuie gestionate acolo.",
      "Copiile de rezervă ale bazelor noastre de date, cât durează fereastra de backup a furnizorului. În datele active ștergerea are efect imediat; copiile se rotesc după propriul lor calendar și nu sunt folosite niciodată pentru a readuce un cont șters.",
    ],
    note: "Păstrăm adresa IP de la care a venit cererea — în tabelul care limitează ritmul acestor formulare și în e-mailul intern care înregistrează o cerere trimisă prin formularul de mai jos. Servește doar la protejarea formularelor împotriva abuzurilor, nu este legată de profilul tău, iar la cerere, la adresa de mai jos, o ștergem.",
  },

  timing: {
    title: "Cât durează",
    body: "Sunt două căi, cu termene diferite. Dacă confirmi cu codul pe care ți-l trimitem pe e-mail, ștergerea are loc în clipa în care confirmi: imediată, fără perioadă de grație și fără vreo cale de a recupera datele. Dacă folosești formularul de cerere, o procesăm manual în termen de 30 de zile, așa cum cere GDPR — în practică mult mai repede.",
  },

  inApp: {
    title: "Mai rapid: șterge din aplicație",
    body: "Dacă mai ai Eatease instalată, îți poți șterge singur contul din Setări → Mai multe. Acea ștergere este instantanee, dar ajunge doar la aplicație: înscrierea ta pe acest site și adresa ta din lista de testeri a testării închise din Google Play Console rămân. Dacă te-ai înregistrat aici, folosește și formularul de mai jos.",
  },

  selfService: {
    title: "Șterge-ți contul acum",
    intro: "Trimitem un cod din șase cifre la adresa de e-mail a contului tău, ca să confirmăm că este a ta. Nu se șterge nimic până nu introduci acel cod și confirmi.",
    submit: "Trimite-mi un cod",
    submitting: "Se trimite...",

    step2: {
      title: "Introdu codul",
      body: "Dacă există un cont pentru adresa aceea, un cod din șase cifre este pe drum. Expiră într-o oră.",
      codeLabel: "Cod din șase cifre",
      codePlaceholder: "000000",
      submit: "Confirmă codul",
      submitting: "Se verifică...",
      back: "Folosește altă adresă",
      errorCode: "Codul acesta nu este valid sau a expirat. Uită-te în e-mail și încearcă din nou.",
    },

    step3: {
      title: "Ultimul pas — asta nu se poate anula",
      body: "Dacă confirmi, contul tău, datele tale și fotografiile pe care le-ai încărcat se șterg imediat. Nu există perioadă de grație și nicio cale de a recupera ceva.",
      warningTrial: "Dacă vrei să ștergem și înregistrarea perioadei de probă descrisă mai sus, cere asta înainte de a confirma, la adresa de la finalul acestei pagini. Odată contul șters, acea înregistrare nu mai poate fi legată de tine.",
      warningTesters: "Adresa ta de pe lista testerilor testului închis din Google Play Console o scoatem noi manual, nu în clipa în care confirmi. Tot restul dispare imediat.",
      checkbox: "Înțeleg că este definitiv și că datele mele nu vor putea fi recuperate.",
      submit: "Șterge-mi contul definitiv",
      submitting: "Se șterge...",
      errorRegistration: "Nu am reușit să îți scoatem înregistrarea de pe acest site, așa că ne-am oprit înainte de a șterge ceva. Contul tău este neatins. Încearcă din nou sau scrie-ne la adresa de mai jos.",
    },

    done: {
      title: "Contul tău este șters",
      body: "Contul tău, datele tale și ce ai încărcat au dispărut, iar înregistrarea ta de pe acest site a fost scoasă prima. Rămân înregistrarea perioadei de probă descrisă mai sus și adresa ta de pe lista testerilor, pe care o scoatem manual.",
    },
  },

  manual: {
    disclosure: "Nu mai am acces la adresa de e-mail a contului meu",
  },

  form: {
    title: "Cere ștergerea prin e-mail",
    body: "Introdu adresa de e-mail a contului pe care vrei să îl ștergi. Îți vom trimite un e-mail de confirmare că am primit cererea.",
    emailLabel: "Adresă de e-mail",
    emailPlaceholder: "tu@exemplu.com",
    reasonLabel: "Motiv (opțional)",
    reasonPlaceholder: "Spune-ne de ce pleci, dacă vrei.",
    submit: "Solicită ștergerea",
    submitting: "Se trimite...",
    successTitle: "Cerere primită",
    successBody: "Ți-am trimis un e-mail de confirmare. Contul și datele tale vor fi șterse în termen de 30 de zile. Dacă nu tu ai făcut această cerere, răspunde la acel e-mail și o vom anula: deocamdată nu a fost șters nimic.",
    errorCaptcha: "Finalizează verificarea de securitate.",
    errorRateLimit: "Prea multe încercări. Așteaptă câteva minute și încearcă din nou.",
    errorGeneric: "Ceva nu a mers bine. Încearcă din nou.",
    errorNetwork: "Conexiunea a eșuat. Verifică rețeaua și încearcă din nou.",
  },

  contact: {
    title: "Ai nevoie de ajutor?",
    body: "Dacă nu mai ai acces la adresa de e-mail a contului sau dacă ceva de mai sus nu este clar, scrie-ne și ne ocupăm noi:",
    email: "privacy@eatease.eu",
  },
};
