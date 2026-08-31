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
      "Înscrierea ta pe acest site, dacă te-ai înregistrat aici",
    ],
  },

  whatRemains: {
    title: "Ce nu se șterge",
    items: [
      "Un identificator tehnic derivat din adresa ta de e-mail — un hash unidirecțional, nu adresa în sine. Deoarece îl putem recalcula pentru orice adresă, rămâne o dată cu caracter personal și îl tratăm ca atare. Îl păstrăm timp de 12 luni după încheierea perioadei de probă, cu un singur scop: să împiedicăm aceeași persoană să primească o a doua perioadă de probă gratuită. Nu este folosit pentru nimic altceva. Ai dreptul să te opui — scrie-ne la adresa de mai jos și îl vom elimina.",
      "Catalogul de rețete comun — rețete, ingrediente și traducerile lor. Aceste date sunt comune tuturor utilizatorilor, nu sunt legate de contul tău și nu conțin nimic personal despre tine.",
      "Datele de achiziție păstrate de Google Play sau Apple. Acestea aparțin magazinului de aplicații, nu nouă, și trebuie gestionate acolo.",
    ],
    note: "Jurnalele tehnice anonime ale serverului pot păstra o urmă a cererii pentru o scurtă perioadă, din motive de securitate. Ele nu te identifică.",
  },

  timing: {
    title: "Cât durează",
    body: "Cererile trimise de aici sunt procesate manual în termen de 30 de zile, conform GDPR. În practică le rezolvăm mult mai repede. Odată procesată, ștergerea este imediată și ireversibilă — nu există perioadă de grație și nici modalitate de a recupera datele.",
  },

  inApp: {
    title: "Mai rapid: șterge din aplicație",
    body: "Dacă mai ai Eatease instalată, îți poți șterge singur contul din Setări → Mai multe. Acea ștergere este instantanee și nu trece prin acest formular.",
  },

  form: {
    title: "Solicită ștergerea",
    body: "Introdu adresa de e-mail a contului pe care vrei să îl ștergi. Îți vom trimite un e-mail de confirmare că am primit cererea.",
    emailLabel: "Adresă de e-mail",
    emailPlaceholder: "tu@exemplu.com",
    reasonLabel: "Motiv (opțional)",
    reasonPlaceholder: "Spune-ne de ce pleci, dacă vrei.",
    submit: "Solicită ștergerea",
    submitting: "Se trimite...",
    successTitle: "Cerere primită",
    successBody: "Ți-am trimis un e-mail de confirmare. Contul și datele tale vor fi șterse în termen de 30 de zile. Dacă nu tu ai făcut această cerere, ignoră e-mailul și nu se va întâmpla nimic.",
    errorCaptcha: "Finalizează verificarea de securitate.",
    errorRateLimit: "Prea multe încercări. Așteaptă câteva minute și încearcă din nou.",
    errorGeneric: "Ceva nu a mers bine. Încearcă din nou.",
    errorNetwork: "Conexiunea a eșuat. Verifică rețeaua și încearcă din nou.",
  },

  contact: {
    title: "Ai nevoie de ajutor?",
    body: "Dacă nu mai ai acces la adresa de e-mail a contului sau dacă ceva de mai sus nu este clar, scrie-ne și ne ocupăm noi:",
  },
};
