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
      "Twoja rejestracja na tej stronie i Twój adres na liście testerów testów zamkniętych w Google Play Console, jeśli zapisałeś się tutaj",
    ],
  },

  whatRemains: {
    title: "Czego nie usuwamy",
    items: [
      "Dwa identyfikatory techniczne wywiedzione z Twojej tożsamości: jednokierunkowy skrót Twojego adresu e-mail oraz skrót identyfikatora dostawcy logowania. Żaden z nich nie jest samym adresem ani kontem, ale ponieważ potrafimy je przeliczyć dla dowolnej tożsamości, pozostają danymi osobowymi i tak je traktujemy. Przechowujemy je przez 12 miesięcy od zakończenia okresu próbnego, w jednym celu: żeby ta sama osoba nie dostała drugiego darmowego okresu próbnego. Nigdy nie służą do niczego innego. Masz prawo się temu sprzeciwić — poproś o to przed usunięciem konta, pod adresem na dole tej strony, bo gdy konto zniknie, identyfikatora dostawcy nie da się już z Tobą powiązać.",
      "Wspólnego katalogu przepisów — przepisów, składników i ich tłumaczeń. Te dane są wspólne dla wszystkich użytkowników, nie są powiązane z Twoim kontem i nie zawierają niczego osobistego na Twój temat.",
      "Danych o zakupach przechowywanych przez Google Play lub Apple. Należą one do sklepu z aplikacjami, nie do nas, i trzeba je uregulować bezpośrednio tam.",
      "Kopie zapasowe naszych baz danych, przez czas trwania okna kopii u dostawcy. W danych aktywnych usunięcie działa natychmiast; kopie rotują według własnego harmonogramu i nigdy nie służą do przywrócenia usuniętego konta.",
    ],
    note: "Zachowujemy adres IP, z którego przyszło żądanie — w tabeli ograniczającej tempo tych formularzy oraz w wewnętrznej wiadomości e-mail zapisującej żądanie złożone formularzem poniżej. Służy wyłącznie ochronie formularzy przed nadużyciami, nie jest powiązany z Twoim profilem, a na prośbę wysłaną na adres poniżej usuwamy go.",
  },

  timing: {
    title: "Ile to trwa",
    body: "Są dwie drogi, o różnych terminach. Jeśli potwierdzisz kodem, który wyślemy Ci e-mailem, usunięcie następuje w chwili potwierdzenia: natychmiast, bez okresu karencji i bez możliwości odzyskania danych. Jeśli skorzystasz z formularza, rozpatrujemy go ręcznie w ciągu 30 dni, jak wymaga RODO — w praktyce znacznie szybciej.",
  },

  inApp: {
    title: "Szybciej: usuń w aplikacji",
    body: "Jeśli nadal masz zainstalowaną aplikację Eatease, możesz usunąć konto samodzielnie w Ustawienia → Więcej. Takie usunięcie jest natychmiastowe, ale obejmuje tylko aplikację: Twoja rejestracja na tej stronie i Twój adres na liście testerów testów zamkniętych w Google Play Console pozostają. Jeśli zapisałeś się tutaj, skorzystaj także z formularza poniżej.",
  },

  selfService: {
    title: "Usuń konto teraz",
    intro: "Wyślemy sześciocyfrowy kod na adres e-mail przypisany do konta, żeby potwierdzić, że należy do Ciebie. Nic nie zostanie usunięte, dopóki nie wpiszesz tego kodu i nie potwierdzisz.",
    submit: "Wyślij mi kod",
    submitting: "Wysyłanie...",

    step2: {
      title: "Wpisz kod",
      body: "Jeśli konto dla tego adresu istnieje, sześciocyfrowy kod jest już w drodze. Wygasa za godzinę.",
      codeLabel: "Sześciocyfrowy kod",
      codePlaceholder: "000000",
      submit: "Potwierdź kod",
      submitting: "Sprawdzanie...",
      back: "Użyj innego adresu",
      errorCode: "Ten kod jest nieprawidłowy albo wygasł. Sprawdź wiadomość i spróbuj ponownie.",
    },

    step3: {
      title: "Ostatni krok — tego nie da się cofnąć",
      body: "Po potwierdzeniu Twoje konto, Twoje dane i przesłane zdjęcia znikają od razu. Nie ma okresu karencji ani sposobu, żeby cokolwiek odzyskać.",
      warningTrial: "Jeśli chcesz, żebyśmy usunęli także opisany wyżej wpis o okresie próbnym, poproś o to przed potwierdzeniem, pod adresem na dole tej strony. Gdy konto zniknie, tego wpisu nie da się już z Tobą powiązać.",
      warningTesters: "Twój adres na liście testerów testu zamkniętego w Google Play Console usuwamy ręcznie my, a nie dzieje się to w chwili potwierdzenia. Cała reszta znika natychmiast.",
      checkbox: "Rozumiem, że to nieodwracalne i że moich danych nie da się odzyskać.",
      submit: "Usuń moje konto na zawsze",
      submitting: "Usuwanie...",
      errorWaitlist: "Nie udało nam się usunąć Twojej rejestracji na tej stronie, więc zatrzymaliśmy się przed usunięciem czegokolwiek. Twoje konto pozostaje nietknięte. Spróbuj ponownie albo napisz do nas na adres poniżej.",
    },

    done: {
      title: "Twoje konto zostało usunięte",
      body: "Twoje konto, Twoje dane i przesłane pliki zniknęły, a Twoja rejestracja na tej stronie została usunięta jako pierwsza. Zostaje opisany wyżej wpis o okresie próbnym i Twój adres na liście testerów, który usuwamy ręcznie.",
    },
  },

  manual: {
    disclosure: "Nie mam dostępu do adresu e-mail przypisanego do konta",
  },

  form: {
    title: "Poproś o usunięcie e-mailem",
    body: "Podaj adres e-mail konta, które ma zostać usunięte. Wyślemy Ci wiadomość z potwierdzeniem otrzymania żądania.",
    emailLabel: "Adres e-mail",
    emailPlaceholder: "ty@przyklad.com",
    reasonLabel: "Powód (opcjonalnie)",
    reasonPlaceholder: "Napisz, dlaczego odchodzisz, jeśli chcesz.",
    submit: "Zażądaj usunięcia",
    submitting: "Wysyłanie...",
    successTitle: "Żądanie przyjęte",
    successBody: "Wysłaliśmy Ci wiadomość z potwierdzeniem. Twoje konto i dane zostaną usunięte w ciągu 30 dni. Jeśli to nie Ty wysłałeś to żądanie, odpowiedz na tę wiadomość, a je anulujemy. Na razie nic nie zostało usunięte.",
    errorCaptcha: "Ukończ weryfikację bezpieczeństwa.",
    errorRateLimit: "Zbyt wiele prób. Odczekaj kilka minut i spróbuj ponownie.",
    errorGeneric: "Coś poszło nie tak. Spróbuj ponownie.",
    errorNetwork: "Błąd połączenia. Sprawdź sieć i spróbuj ponownie.",
  },

  contact: {
    title: "Potrzebujesz pomocy?",
    body: "Jeśli nie masz już dostępu do adresu e-mail przypisanego do konta albo cokolwiek powyżej jest niejasne, napisz do nas — zajmiemy się tym:",
    email: "privacy@eatease.eu",
  },
};
