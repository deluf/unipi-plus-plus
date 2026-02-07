
<p align="center">
    <img src="screenshots/icon.png" alt="icon" width=120>
    <img src="screenshots/text.png" alt="title" width=400>
</p>

<table align="center">
    <tr>
        <td align="center">
            <a href="https://chromewebstore.google.com/detail/unipi++/iblkplielknafpegjacgjbpgjgdcnkij">
            <img src="screenshots/chrome.png" height=55 alt="Chrome web store banner">
            </a>
            <br>
            <img src="https://img.shields.io/chrome-web-store/users/iblkplielknafpegjacgjbpgjgdcnkij?logo=google-chrome&logoColor=white&label=Studenti%20attivi&color=green" alt="Chrome users">
        </td>
        <td align="center">
            <a href="https://addons.mozilla.org/addon/unipi/">
            <img src="screenshots/firefox.webp" height=55 alt="Mozilla add-on banner">
            </a>
            <br>
            <img src="https://img.shields.io/amo/users/unipi?logo=firefox&logoColor=white&label=Studenti%20attivi&color=orange" alt="Firefox users">
        </td>
    </tr>
</table>

**UniPi++** estende il portale studenti dell'università di Pisa aggiungendo numerose statistiche sugli esami verbalizzati

> Il primo link (Chrome Web Store) funziona con qualsiasi browser basato su Chromium (e.g., Chrome, Brave, Edge, Opera)

---

> ### Highlights

---

Una dashboard mostra la media ponderata e aritmetica, il voto di laurea previsto, la distribuzione dei voti ed un grafico di progressione dei voti

<img src="screenshots/home.png" alt="home" height=400>

In particolare:

- Le metriche possono essere calcolate per anno accademico o sull'insieme di tutti gli esami

- Singoli esami possono essere esclusi tramite semplici checkbox

<img src="screenshots/checkbox.png" alt="checkbox" height=250>

- Tutti i parametri di calcolo (e.g., il valore della lode, eventuali esclusioni di CFU) ed anche alcune impostazioni visive (e.g., la mappa dei colori) possono essere completamente personalizzati tramite il menu dell'estensione (click sull'icona)

<img src="screenshots/popup.png" alt="popup" height=300>

---

È presente una sezione che permette di confrontare le tue statistiche con i risultati medi di qualsiasi corso di laurea offerto dall'Università di Pisa

<img src="screenshots/almalaurea.png" alt="almalaurea" height=250>

> I dati provengono da statistiche pubblicamente disponibili su [www.almalaurea.it](https://www.almalaurea.it)

---

È presente anche un'ulteriore sezione che simula come cambierebbe la media a seconda dei voti previsti nei prossimi esami

<img src="screenshots/forecast.png" alt="forecast" height=250>

> Come viene previsto il voto di laurea? Tramite un modello di regressione quadratica addestrato sulla relazione "Media degli esami" --> "Media dei voti di laurea" considerando tutti i corsi di laurea offerti dall'Università di Pisa negli anni 2022, 2023 e 2024 <img src="screenshots/predictor.png" alt="predictor" height=350>

---

> ### Privacy

---

- L'estensione è attiva solo su https://www.studenti.unipi.it/auth/studente/Libretto. Non può fisicamente leggere dati da altri siti web
- L'estensione legge solo la tabella degli esami (nomi, voti e CFU) e nient'altro
- Tutti i dati vengono elaborati localmente sul computer dell’utente. Nulla viene mai trasmesso o memorizzato su server esterni

<div>
Q: Come faccio a sapere che quello scritto sopra è vero?
<br>
A: L'estensione è completamente open-source. Puoi ispezionare il codice sorgente <a href="src/">qui</a>

---

> **UniPi++** è un'estensione NON UFFICIALE che NON è sviluppata e NON è affiliata in alcun modo con l'Università di Pisa
