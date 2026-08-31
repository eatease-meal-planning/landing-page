export const deleteAccount = {
  title: "Usuń swoje konto i dane",
  intro: "Na tej stronie możesz zażądać trwałego usunięcia swojego konta Eatease oraz wszystkich powiązanych z nim danych osobowych. Przeczytaj poniższe informacje przed wysłaniem żądania — usunięcia nie da się cofnąć.",

  whatIsDeleted: {
    title: "Co zostanie usunięte",
    items: [
      "Twoje konto i dane logowania",
      "Twój profil, cele i preferencje",
      "Dodani przez Ciebie członkowie rodziny i ich cele",
      "Plany posiłków i przypisanie porcji",
      "Listy zakupów i ich pozycje",
      "Ulubione przepisy",
      "Zapisane posiłki i historia makroskładników",
      "Cele makroskładników i obliczenia w pamięci podręcznej",
      "Zarejestrowane urządzenia i powiadomienia",
      "Dane subskrypcji i potwierdzenia zakupów",
      "Przesłane przez Ciebie zdjęcia (profil, posiłki, przepisy, dokumenty)",
      "Twoja rejestracja na tej stronie, jeśli zapisałeś się tutaj",
    ],
  },

  whatRemains: {
    title: "Czego nie usuwamy",
    items: [
      "Techniczny identyfikator wyprowadzony z Twojego adresu e-mail — jednokierunkowy skrót, a nie sam adres. Ponieważ możemy go przeliczyć dla dowolnego adresu, nadal jest daną osobową i tak go traktujemy. Przechowujemy go przez 12 miesięcy od zakończenia okresu próbnego, w jednym celu: aby ta sama osoba nie otrzymała drugiego bezpłatnego okresu próbnego. Nie służy do niczego innego. Masz prawo wnieść sprzeciw — napisz na adres poniżej, a go usuniemy.",
      "Wspólnego katalogu przepisów — przepisów, składników i ich tłumaczeń. Te dane są wspólne dla wszystkich użytkowników, nie są powiązane z Twoim kontem i nie zawierają niczego osobistego na Twój temat.",
      "Danych o zakupach przechowywanych przez Google Play lub Apple. Należą one do sklepu z aplikacjami, nie do nas, i trzeba je uregulować bezpośrednio tam.",
    ],
    note: "Anonimowe techniczne logi serwera mogą przez krótki czas przechowywać ślad żądania ze względów bezpieczeństwa. Nie pozwalają one Cię zidentyfikować.",
  },

  timing: {
    title: "Ile to trwa",
    body: "Żądania przesłane tutaj są przetwarzane ręcznie w ciągu 30 dni, zgodnie z wymogami RODO. W praktyce zajmujemy się nimi znacznie szybciej. Po przetworzeniu usunięcie jest natychmiastowe i nieodwracalne — nie ma okresu karencji ani możliwości odzyskania danych.",
  },

  inApp: {
    title: "Szybciej: usuń w aplikacji",
    body: "Jeśli nadal masz zainstalowaną aplikację Eatease, możesz usunąć konto samodzielnie w Ustawienia → Więcej. Takie usunięcie jest natychmiastowe i nie przechodzi przez ten formularz.",
  },

  form: {
    title: "Zażądaj usunięcia",
    body: "Podaj adres e-mail konta, które ma zostać usunięte. Wyślemy Ci wiadomość z potwierdzeniem otrzymania żądania.",
    emailLabel: "Adres e-mail",
    emailPlaceholder: "ty@przyklad.com",
    reasonLabel: "Powód (opcjonalnie)",
    reasonPlaceholder: "Napisz, dlaczego odchodzisz, jeśli chcesz.",
    submit: "Zażądaj usunięcia",
    submitting: "Wysyłanie...",
    successTitle: "Żądanie przyjęte",
    successBody: "Wysłaliśmy Ci wiadomość z potwierdzeniem. Twoje konto i dane zostaną usunięte w ciągu 30 dni. Jeśli to nie Ty wysłałeś to żądanie, po prostu zignoruj wiadomość — nic się nie stanie.",
    errorCaptcha: "Ukończ weryfikację bezpieczeństwa.",
    errorRateLimit: "Zbyt wiele prób. Odczekaj kilka minut i spróbuj ponownie.",
    errorGeneric: "Coś poszło nie tak. Spróbuj ponownie.",
    errorNetwork: "Błąd połączenia. Sprawdź sieć i spróbuj ponownie.",
  },

  contact: {
    title: "Potrzebujesz pomocy?",
    body: "Jeśli nie masz już dostępu do adresu e-mail przypisanego do konta albo cokolwiek powyżej jest niejasne, napisz do nas — zajmiemy się tym:",
  },
};
