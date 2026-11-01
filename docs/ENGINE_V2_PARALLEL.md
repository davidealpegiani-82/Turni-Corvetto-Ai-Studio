# Turni Corvetto — motore V2 parallelo

Questa cartella introduce un nucleo di verifica separato dal generatore attuale. Non sostituisce ancora `engine.ts` e non viene richiamato dal flusso di pubblicazione dei turni.

## Componenti

- `engineV2.ts`: validazione indipendente della copertura a intervalli configurabili (30 minuti per default), controllo degli intervalli orari, riposo minimo e merge prudente delle proposte.
- `mergeProposalSafely`: applica soltanto le celle effettivamente cambiate dalla proposta; preserva le celle marcate `manualEdit` e quelle modificate dopo la creazione della proposta.
- `engineV2.test.ts`: test di regressione per lacune intragiornaliere, orari non validi, modifiche manuali/concorrenza e presidio ufficio del sabato.
- `DayShift.manualEdit`: campo esplicito nel modello dati per identificare una cella protetta da modifiche automatiche.

## Esecuzione

```bash
npm install
npm test
```

## Regole iniziali e limiti da chiudere prima dell'integrazione

La policy predefinita codifica gli orari feriali 06:30–17:30 e sabato 07:00–12:00. Il presidio feriale iniziale è configurato con soglia rinforzata nelle prime ore e minimo ordinario/di chiusura pari a uno; il sabato l'ufficio richiede una sola persona. Questi valori sono parametri di test e dovranno essere derivati dalle regole effettive salvate nell'app prima dell'attivazione.

Il controllo del riposo usa la fine dell'ultimo intervallo di un giorno e l'inizio del primo del successivo. Le casistiche di assenze parziali, festività, corsi, trasferte, profili Severin/Sandrini, rotazioni del sabato, competenze e monte ore devono essere coperte da ulteriori test basati su settimane reali di Corvetto.

**Non integrare questo modulo nel generatore attivo e non promuovere questa branch finché test e confronto con settimane reali non sono completati.**
