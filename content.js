// Materiały robocze Prescot LED. Bez przykładowych cen i deklaracji parametrów produktów.
const decisions = {
 offer: [
  ['Produkt i zastosowanie', 'Co dokładnie reklamujemy i w jakiej sytuacji klient tego potrzebuje?', 'Wybierz produkt lub rodzinę produktów. Dla taśmy zapisz zastosowanie i planowaną długość instalacji, dla profilu miejsce montażu, a dla zasilacza warunki pracy. Model, parametry i dostępność sprawdź w aktualnej ofercie.'],
  ['Grupa odbiorców', 'Kto wybiera, kto montuje, a kto płaci za rozwiązanie?', 'Architekt szuka efektu i dokumentacji. Instalator potrzebuje zgodności elementów oraz danych do montażu. Hurtownia ocenia warunki współpracy. Rozdziel te potrzeby na osobne przekazy zamiast kierować tę samą reklamę do wszystkich.'],
  ['Korzyść i dowód', 'Dlaczego ten produkt pasuje do projektu odbiorcy?', 'Zamień opis techniczny na użyteczną informację: jaki efekt lub sposób montażu umożliwia dany wariant? Dołącz zdjęcie realizacji, kartę produktu albo rysunek. Nie przypisuj całej rodzinie cech jednego modelu.'],
  ['Zestaw i warunki oferty', 'Co klient otrzymuje, a co musi dobrać osobno?', 'Rozpisz taśmę, profil, klosz, zasilacz, sterowanie i akcesoria. Przy zestawie sprawdź zgodność napięć, moc, obciążenie sterownika oraz warunki montażu. Cenę, jednostkę sprzedaży i dostępność potwierdź przed publikacją.'],
 ],
 ads: [
  ['Wideo 4:5', 'Jak w krótkim materiale pokazać efekt światła i zastosowanie produktu?', 'Zacznij od gotowego wnętrza. Następnie pokaż detal produktu i jeden ważny wybór klienta. Zakończ przejściem do konkretnej oferty. Scenariusz powinien działać również bez dźwięku; zaplanuj czytelne napisy.'],
  ['Rolka 9:16', 'Jaki jeden moment zatrzyma odbiorcę na telefonie?', 'Pokaż włączenie oświetlenia, detal montażu lub zmianę sceny świetlnej. Jedna rolka odpowiada na jedną potrzebę. Zostaw miejsce na interfejs platformy, a parametry produktu przenieś do opisu lub na stronę.'],
  ['Grafika 4:5', 'Co odbiorca ma zrozumieć po jednym spojrzeniu?', 'Połącz zdjęcie zastosowania, krótki nagłówek i jedno wezwanie do działania. Produkt oraz tekst muszą pozostać czytelne na małym ekranie. Przy porównaniu wariantów używaj tych samych warunków zdjęcia i skali.'],
  ['Tekst i CTA', 'Jak połączyć potrzebę klienta z następnym krokiem?', 'Przygotuj wariant dla architekta i wariant dla wykonawcy. Zacznij od zastosowania, dodaj potwierdzoną korzyść i zakończ działaniem zgodnym ze stroną docelową. Unikaj ogólnych obietnic jakości bez konkretnego dowodu.'],
 ],
 page: [
  ['Obietnica na pierwszym ekranie', 'Czy strona pokazuje ten sam produkt i efekt co reklama?', 'Zdjęcie, nagłówek i przycisk powinny kontynuować przekaz reklamy. Klient szukający profilu do mebli powinien trafić do odpowiedniej oferty, a nie na ogólną stronę całego katalogu.'],
  ['Parametry i warianty', 'Jakich danych brakuje do wybrania właściwego rozwiązania?', 'Pokaż dane właściwe dla wybranego modelu. Ułatw porównanie wariantów, jednostek sprzedaży i potrzebnych elementów. Karta techniczna powinna być dostępna obok produktu. Nie uzupełniaj brakujących parametrów domysłem.'],
  ['Realizacje i odpowiedzi', 'Co pomoże klientowi wyobrazić sobie produkt we własnym projekcie?', 'Dobierz zdjęcia zastosowania do odbiorcy. Podpisz, co zostało użyte. Odpowiedz na pytania o dobór, montaż i dostępność. Oddziel wizualizacje od zdjęć rzeczywistych realizacji.'],
  ['Telefon i szybkość strony', 'Czy można wygodnie poznać ofertę i wykonać działanie na telefonie?', 'Sprawdź czytelność tabel, wybór wariantu, przycisk i formularz na małym ekranie. Ogranicz ciężkie zdjęcia. Przejdź całą ścieżkę z telefonu, włącznie z potwierdzeniem działania.'],
 ],
 action: [
  ['Jeden następny krok', 'Jakie działanie uznamy za cel tej kampanii?', 'Zapisz główne działanie klienta i dopasuj do niego przyciski. Dodatkowe materiały mogą pomagać w decyzji, ale nie powinny odciągać od jasno opisanej oferty.'],
  ['Dane potrzebne do obsługi', 'O co trzeba zapytać klienta, aby sensownie odpowiedzieć?', 'W zapytaniu o dobór przydają się zastosowanie, długość instalacji i oczekiwany efekt. Nie wymagaj pełnej specyfikacji od osoby, która potrzebuje pomocy w jej stworzeniu.'],
  ['Obsługa zapytania lub zamówienia', 'Kto przejmuje kontakt i co dzieje się dalej?', 'Przypisz osobę odpowiedzialną, sposób przekazania danych i realny termin odpowiedzi. Ustal, jak rozróżnić zapytanie detaliczne, projektowe i hurtowe. Nie obiecuj czasu obsługi bez uzgodnienia go z zespołem.'],
  ['Test całej ścieżki', 'Czy działanie dociera do właściwej osoby i zostaje poprawnie zapisane?', 'Przeprowadź test od reklamy lub oznaczonego linku po potwierdzenie. Sprawdź formularz, błędy, wiadomość zwrotną i odnotowanie zdarzenia. Użyj danych testowych i oznacz test w pomiarze.'],
 ],
 confirm: [
  ['Jasne potwierdzenie', 'Skąd klient wie, że jego działanie się udało?', 'Podaj, co zostało przyjęte i jaki będzie następny krok. Po zapytaniu nie pokazuj komunikatu o zakupie. Przy pobraniu katalogu udostępnij właściwy materiał.'],
  ['Wiadomość po działaniu', 'Jaką użyteczną informację klient powinien otrzymać?', 'Przekaż podsumowanie i kontakt do odpowiedniej osoby. Linki do kart produktów lub instrukcji dobierz do sprawy klienta. Sprawdź wygląd wiadomości na telefonie.'],
  ['Przekazanie do zespołu', 'Czy osoba obsługująca zna produkt, źródło kontaktu i potrzeby klienta?', 'W ustalonym miejscu zapisz źródło kampanii oraz treść zapytania. Przy większym projekcie dodaj opiekuna i termin kolejnego kontaktu.'],
  ['Dalsza pomoc w doborze', 'Jaki materiał pomoże wykonać kolejny krok w projekcie?', 'Zaproponuj dokumentację, listę brakujących danych lub konsultację doboru. Zachowaj związek z konkretną potrzebą zamiast wysyłać cały katalog bez wskazówek.'],
 ],
 recovery: [
  ['Odbiorcy powrotu', 'Kogo chcemy zaprosić ponownie i kogo wykluczamy?', 'Rozdziel osoby, które tylko obejrzały reklamę, od tych, które sprawdzały produkt lub rozpoczęły formularz. Wyklucz osoby, dla których cel został już osiągnięty, jeśli kolejny komunikat nie jest im potrzebny.'],
  ['Powód do powrotu', 'Na jaką wątpliwość odpowie kolejny materiał?', 'Pokaż przykład montażu, realizację lub wskazówki doboru. Dla architekta pomocny może być detal zabudowy, a dla instalatora lista zgodnych elementów. Nie opieraj każdego przypomnienia na rabacie.'],
  ['Okres i częstotliwość', 'Jak długo trwa decyzja i jak często warto się przypominać?', 'Ustal okres na podstawie rodzaju projektu oraz posiadanych danych. Zapisz limit częstotliwości i moment przeglądu. Długi projekt inwestycyjny może wymagać innego rytmu niż zakup drobnego akcesorium.'],
  ['Kontakt po zapytaniu', 'Kiedy wracamy do rozmowy i z czym możemy pomóc?', 'Zaplanuj kontakt z informacją przydatną w danym projekcie. Zapisz ustalenia klienta i status sprawy. Dalsza komunikacja powinna uwzględniać jego preferencje oraz obowiązujące w firmie zasady.'],
 ],
 measure: [
  ['Cel i punkt odniesienia', 'Po czym rozpoznamy, że kampania spełnia swoje zadanie?', 'Wybierz główny miernik związany z celem: zakup, wartościowe zapytanie, konsultacja lub pobranie. Ustal oczekiwanie i okres oceny. Puste pole jest uczciwsze od wymyślonego wyniku.'],
  ['Źródła i oznaczenia', 'Czy wiemy, z której reklamy przyszedł klient?', 'Ustal spójne nazwy kampanii, grup i materiałów. Przygotuj oznaczenia UTM oraz mapę zdarzeń. Zdarzenia testowe oddziel od właściwych wyników.'],
  ['Jakość kontaktów', 'Czy zapytania dotyczą oferty i prowadzą do dalszych rozmów?', 'Połącz dane reklamowe z informacją od handlowców. Zapisuj powody odrzucenia zapytań, typ klienta i dalszy wynik. Sama liczba formularzy nie mówi jeszcze, czy kampania pomaga sprzedaży.'],
  ['Wariant A / B', 'Jaki jeden element porównamy jako pierwszy?', 'Zmieniaj jedną rzecz: przekaz, zdjęcie, odbiorcę lub stronę. Zapisz hipotezę, warunki testu i kryterium decyzji przed startem. Nie wyciągaj wniosku na podstawie pojedynczego kontaktu.'],
  ['Przegląd i decyzja', 'Co zostawiamy, co poprawiamy i kto to zrobi?', 'Zestaw wynik z celem i jakością zapytań. Wybierz konkretną zmianę, osobę i termin. Zachowaj wniosek, aby kolejna kampania korzystała z wcześniejszych ustaleń.'],
 ],
};
const goals={
 purchase:{label:'Sprzedaż produktu',short:'Sprzedaż',page:'Oferta produktu lub zestawu',action:'Wybór i zakup',confirm:'Potwierdzenie zakupu',recovery:'Powrót do oferty',cta:'Zobacz rozwiązanie',focus:'zakup właściwego produktu lub zgodnego zestawu'},
 lead:{label:'Zapytania ofertowe',short:'Zapytania',page:'Oferta dla projektu',action:'Zapytanie o rozwiązanie',confirm:'Potwierdzenie zapytania',recovery:'Powrót do rozmowy',cta:'Porozmawiajmy o projekcie',focus:'wartościowe zapytanie o rozwiązanie LED'},
 appointment:{label:'Konsultacje projektowe',short:'Konsultacje',page:'Pomoc w doborze LED',action:'Umówienie konsultacji',confirm:'Szczegóły konsultacji',recovery:'Powrót do projektu',cta:'Zapytaj o dobór',focus:'rozmowa o doborze elementów do projektu'},
 signup:{label:'Katalog i materiały',short:'Katalog',page:'Katalog rozwiązań LED',action:'Pobranie materiału',confirm:'Dostęp do materiału',recovery:'Od katalogu do projektu',cta:'Poznaj rozwiązania LED',focus:'pobranie właściwego katalogu lub materiału projektowego'},
};
const materials={video45:{title:'Wideo 4:5',format:'4:5',kind:'wide'},reel916:{title:'Rolka 9:16',format:'9:16',kind:'vertical'},graphic45:{title:'Grafika 4:5',format:'4:5',kind:'wide'},copy:{title:'Tekst i CTA',format:'Aa',kind:'copy'}};
const make=(row,goal,stage)=>({title:row[0],question:row[1],purpose:row[2]+`\n\nW tej kampanii planujemy: ${goals[goal].focus}. Dopasuj ten punkt do wybranej rodziny produktów i odbiorców z briefu.`,ai:[`Przygotuj roboczą propozycję: ${row[0].toLocaleLowerCase('pl-PL')}, korzystając z briefu Prescot LED.`,`Zaproponuj dwa konkretne warianty dla wskazanych odbiorców. Wyjaśnij, co sprawdzić przed wyborem.`,`Wypisz brakujące informacje. Nie wymyślaj parametrów, cen, dostępności ani wyników.`],human:[`Sprawdź zgodność z aktualną ofertą, dokumentacją i ustaleniami zespołu.`,`Wybierz wariant pasujący do odbiorcy oraz celu: ${goals[goal].focus}.`,`Zapisz decyzję, osobę odpowiedzialną i materiały potrzebne do wdrożenia.`]});
export const content={goals,materials,offerDecisions:{},materialCopy:{},measurements:{},systemBranchItems:{},campaigns:{},areaIntros:{}};
for(const goal of Object.keys(goals)){
 content.offerDecisions[goal]=decisions.offer.map(row=>make(row,goal,'offer'));
 content.materialCopy[goal]=Object.fromEntries(Object.keys(materials).map((format,i)=>[format,make(decisions.ads[i],goal,'ads')]));
 content.measurements[goal]=decisions.measure.map(row=>make(row,goal,'measure'));
 content.systemBranchItems[goal]=Object.fromEntries(['page','action','confirm','recovery'].map(stage=>[stage,decisions[stage].map(row=>make(row,goal,stage))]));
 content.campaigns[goal]={brandShort:'PRESCOT LED',graphic:'assets/prescot/tasmy.webp',reel:'assets/prescot/tasmy.webp',video:'assets/prescot/tasmy.webp',graphicPrimary:'Zaplanuj światło dopasowane do wnętrza. Poznaj taśmy, profile i sterowanie LED do swojego projektu.',cta:goals[goal].cta};
}
