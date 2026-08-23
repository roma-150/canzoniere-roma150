# Canzoniere Roma 150 — contesto progetto

PWA offline per il canzoniere del gruppo scout Roma 150. Repository GitHub:
`https://github.com/roma-150/canzoniere-roma150` (pubblico, GitHub Pages attivo su branch `main`).

## Stack e architettura

- Nessun framework, nessun build step: `index.html` è un file unico (HTML+CSS+JS inline).
- Dati in `songs.json`, caricato via `fetch()` a runtime.
- `service-worker.js` gestisce la cache offline: network-first per `songs.json` (dati sempre aggiornati se online), cache-first per il resto (guscio app).
- `manifest.json` rende l'app installabile (PWA).
- Icone in `icons/` (192px e 512px), generate in Python/PIL: sfondo viola arrotondato + nota musicale bianca.

Perché niente backend: inizialmente si era pensato a Google Apps Script + Google Sheet, poi scartato perché l'app è a sola lettura e i dati li aggiorniamo solo io e l'utente insieme — GitHub statico è più veloce, affidabile e versionato (vedi decisione in conversazione precedente).

## Formato dati (songs.json)

Ogni canzone è un oggetto con questi campi:

```json
{
  "titolo": "string",
  "anno": 2026,
  "luogo": "string",
  "tonalita": "RE",
  "branca": "L/C | E/G | R/S | CoCa | Gruppo",
  "sede": ["Casalotti", "Selva Candida"],
  "testo_accordi": "..."
}
```

`testo_accordi` è testo in un formato ChordPro semplificato:
- Accordi tra parentesi quadre inline nel testo: `[RE]La mappa una via ti [SOL]indicherà`
- Notazione italiana (DO RE MI FA SOL LA SI), minori con suffisso `m` (es. `SIm`, `FA#m`)
- Blocchi (strofe/ritornelli) separati da `\n---\n`
- Un blocco che è un ritornello inizia con la riga `{rit}` seguita dal testo. L'app lo rileva e mostra il tag "Ritornello" con sfondo ambra, SENZA che il testo debba contenere "RIT." (l'ho rimosso dal testo cantato perché ridondante col tag automatico)
- Se il ritornello si ripete identico più volte di fila, NON duplicare il blocco: usare `{rit x2}` (o xN) sul blocco unico — l'app mostra "Ritornello (2 volte)" invece di stampare il testo due volte
- IMPORTANTE: ogni volta che un ritornello ricorre nella canzone, va scritto per esteso con `{rit}` (mai una sigla "RIT." da sola come segnaposto — quella convenzione è stata abbandonata su richiesta esplicita dell'utente)

## Convenzioni di trascrizione (quando arrivano nuovi PDF da trascrivere)

- I PDF dei canzonieri scout spesso hanno gli accordi scritti solo sulla prima strofa/ritornello, e le strofe successive senza. In quel caso si ripete lo stesso giro di accordi sulle strofe non accordate, assumendo che seguano lo stesso schema musicale — MA va segnalato esplicitamente all'utente come assunzione/estrapolazione, non dato per scontato (specie se il giro chitarristico non è ovvio, es. cori senza alcun accordo scritto da nessuna parte).
- Titolo, anno e luogo si ricavano dall'intestazione del PDF, es. "IL VIAGGIO DEI PIRATI (Meschia 2026)" → titolo "Il viaggio dei pirati", luogo "Meschia", anno 2026.
- Titoli in sentence case (non tutto maiuscolo come nei PDF originali).

## Stile visivo dell'app

Ispirato a un'altra app della stessa utente/gruppo, "Micio-Wallet" (gestionale scout separato, non collegato a questo progetto):
- Header viola pieno (`#3B2065`), logo icona + wordmark "Canzoniere" / "Roma 150"
- Card bianche arrotondate (radius 24px), ombra leggera
- Pulsanti pillola (`border-radius: 999px`), colore blu (`#3556D8`) per azioni primarie
- Tile a gradiente verde chiaro per la tonalità corrente, con controlli +/- circolari per trasporre
- Ritornelli evidenziati con tag pillola ambra (`#A9720B` su sfondo `#FBF2DC`), non con bordo laterale
- **Esplicitamente NO stile "liquid glass"** (traslucido/blur) per il corpo dell'app — è stato provato e scartato dall'utente. Il blur è stato mantenuto SOLO per la barra di navigazione inferiore (vedi sotto), che lì invece è voluta.

## Funzionalità implementate

- **Schermata Canzoni**: elenco con ricerca + ordinamento
  - Ricerca: multi-parola con logica AND — ogni parola digitata deve trovarsi da qualche parte (titolo, anno, luogo, branca, sede, o testo senza accordi), anche in campi diversi tra loro. Es. "L/C Selva Candida 2022" cerca tutte e tre le condizioni insieme.
  - Ordinamento: A-Z o per Anno, entrambi con toggle crescente/decrescente, raggruppati con barre divisorie (lettera iniziale, o decennio "Anni 2020")
- **Scheda canzone**: titolo, meta (anno · luogo · branca · sede), tile trasposizione (+/- ricalcola tutti gli accordi in tempo reale, notazione italiana), testo con accordi allineati sopra la sillaba giusta, pulsante autoscroll
- **Navigazione**: barra flottante in basso (stile blur/traslucido, questo sì voluto) con 4 tab: Canzoni (funzionante), Categorie, Canzonieri, Scalette (questi tre ancora segnaposto "in arrivo", da costruire). La barra sparisce quando si apre una canzone, per lasciare spazio al testo; l'icona "casa" nell'header (lato destro) torna all'elenco.

## Prossimi passi non ancora affrontati

- Costruire davvero le sezioni Categorie, Canzonieri, Scalette (per ora solo placeholder visivi)
- Continuare a trascrivere canzoni dai PDF del gruppo (finora 9 trascritte)
- Nessun meccanismo di scrittura dall'app: le canzoni si aggiungono solo modificando `songs.json` a mano (o via Claude) e ricaricando su GitHub — è una scelta esplicita, non un limite tecnico da risolvere (l'utente ha confermato di non aver bisogno che altri capi aggiungano canzoni in autonomia)

## Note di lavoro

- Il flusso finora: l'utente carica un PDF → io trascrivo in ChordPro, mostro il testo, l'utente corregge se serve → aggiorno `songs.json` e `index.html` → genero un'anteprima e uno zip da caricare manualmente su GitHub (nessun accesso diretto al repo da questa chat).
- Le anteprime mostrate in chat usano una variante di `index.html` con i dati incorporati direttamente nello script invece che caricati via `fetch("songs.json")`, perché il fetch relativo non funziona nell'ambiente di anteprima della chat (funziona invece perfettamente su GitHub Pages, dove i file sono davvero serviti insieme). Questo non è un problema del codice reale, solo un workaround per mostrare le anteprime.
