import { BranchOperationalRule } from '../types/turni';

export const official25OperationalRules: BranchOperationalRule[] = [
  // 1. Fasce Orarie, Apertura, Chiusura & Pause Pranzo
  {
    id: 'rule_1',
    num: 1,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Avvicendamento Pause Pranzo (12:00 – 14:00) & Pausa Severin a 13:00',
    ruleText: 'Chi apre pranza alle 12:00, chi chiude alle 13:00. Severin pranza alle 13:00 se ci sono già 2 colleghi dell\'ufficio in pausa 12:00-13:00.',
    detail: 'I turni di apertura a 7h/8h (sabatisti, Mario Ragone e addetto apertura 8h) pranzano 12:00-13:00. I turni di chiusura a 8h fanno pausa fissa 13:00-14:00. Per Marco Severin: la pausa pranzo viene spostata alle 13:00 (13:00-13:30) se ci sono già 2 persone dell\'ufficio in pausa dalle 12:00 alle 13:00, così da non lasciare mai il banco vendita sguarnito; altrimenti resta alle 12:30.'
  },
  {
    id: 'rule_2',
    num: 2,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Puntualità & Vincolo di Timbratura',
    ruleText: 'Gli orari di turno sono precisi e vincolanti alla timbratura.',
    detail: 'Nessuna tolleranza informe: gli ingressi (06:30, 08:30) e le uscite (12:00, 13:00, 14:00, 14:30, 15:30, 17:30) definiscono il presidio operativo e sono conformi ai report presenze.'
  },
  {
    id: 'rule_3',
    num: 3,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Pause Caffè & Intervalli Durante il Turno',
    ruleText: 'Non sono previste pause aggiuntive oltre alla pausa pranzo regolamentata.',
    detail: 'L\'orario lavorativo giornaliero prevede esclusivamente la pausa pranzo formale (30 min per Severin, 60 min per gli altri turni). Non sono ammessi stacchi intermedi conteggiati a carico dell\'azienda.'
  },
  {
    id: 'rule_4',
    num: 4,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Permessi nel Primo Pomeriggio (dalle 13:00 / 14:00)',
    ruleText: 'La pausa pranzo di un\'ora resta valida prima del permesso.',
    detail: 'Se un collaboratore ha un permesso a ore nel primo pomeriggio, la pausa pranzo canonica di 1 ora viene comunque mantenuta e scalata regolarmente prima dell\'inizio del permesso (es. lavora 08:30-13:00 = 4.5h).'
  },
  {
    id: 'rule_5',
    num: 5,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Chiusura Cassa e Allarme Filiale (17:30)',
    ruleText: 'Assegnata a turno tra gli addetti banco presenti alla chiusura.',
    detail: 'La responsabilità delle quadrature di cassa e inserimento allarme alle 17:30 è affidata a rotazione agli addetti del banco vendita in servizio fino a chiusura.'
  },

  // 2. Gestione Sabati & Rotazioni Avanzate
  {
    id: 'rule_6',
    num: 6,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Turno del Lunedì per il Sabatista',
    ruleText: 'Inizia regolarmente alle 06:30 avendo rispettato il riposo della domenica.',
    detail: 'Il collaboratore che ha prestato servizio il sabato mattina (07:00-12:00) inizia regolarmente alle 06:30 il lunedì successivo. Il riposo continuativo è ampiamente tutelato dalla domenica intera (>42 ore).'
  },
  {
    id: 'rule_7',
    num: 7,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Sabatista Ufficio in Ferie (Cascade & Freeze)',
    ruleText: 'Scala al collega successivo e recupera il turno perso al rientro.',
    detail: 'Se il sabatista designato è in ferie, il sabato viene coperto dal collega successivo in rotazione. Il dipendente assente recupera il turno di sabato alla prima settimana utile al rientro per parità annuale.'
  },
  {
    id: 'rule_8',
    num: 8,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Settimana con Festività Infrasettimanale e Sabato',
    ruleText: 'Il sabato resta operativo con la normale rotazione programmata.',
    detail: 'La presenza di una festività tra lunedì e venerdì non cancella l\'apertura del sabato mattina (07:00-12:00), che prosegue regolarmente con la coppia e il sabatista di turno.'
  },
  {
    id: 'rule_9',
    num: 9,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Emergenza Sabato Magazzino (Malattia Improvvisa)',
    ruleText: 'Lasciare il magazzino con un solo operatore invece di due.',
    detail: 'Se uno dei due magazzinieri del sabato si ammala all\'ultimo momento (venerdì sera o sabato mattina), il magazzino opera regolarmente con un solo operatore, evitando richiami d\'urgenza obbligatori.'
  },
  {
    id: 'rule_10',
    num: 10,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Rotazione Orari Ufficio a Ciclo di 3 Settimane (Davide, Marco Caregnato, Andrea)',
    ruleText: '1ª sett: Sabatista 7h (06:30-14:30) + Sabato (07:00-12:00); 2ª sett: Apertura 8h (06:30-15:30); 3ª sett: Chiusura 8h (08:30-17:30).',
    detail: 'Rotazione ciclica e continua su 3 settimane per i tre addetti ufficio (Davide Alpegiani, Marco Caregnato, Andrea Poppa): (1) 1ª Settimana (Sabatista): Lun-Ven 7h dalle 06:30 alle 14:30 (pausa pranzo 12:00-13:00 = 35h) più Sabato dalle 07:00 alle 12:00 (5h) = 40h totali; (2) 2ª Settimana (Apertura 8h): Lun-Ven 8h dalle 06:30 alle 15:30 (pausa pranzo 12:00-13:00 = 40h) e Sabato Riposo = 40h totali; (3) 3ª Settimana (Chiusura 8h): Lun-Ven 8h dalle 08:30 alle 17:30 (pausa pranzo 13:00-14:00 = 40h) e Sabato Riposo = 40h totali. In questo modo tutti i giorni feriali (Lun-Ven) sono presenti 2 persone a 06:30 in apertura (Sabatista della 1ª settimana + collega della 2ª settimana) oltre a Severin, e alla chiusura delle 17:30 è sempre presente il collega della 3ª settimana oltre a Severin.'
  },

  // 3. Profili Speciali & Reparti Specifici
  {
    id: 'rule_11',
    num: 11,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Assenza di Mario Ragone (Apertura Magazzino 06:30)',
    ruleText: 'Aprire alle 06:30 solo con la coppia del sabato.',
    detail: 'In caso di assenza di Mario Ragone, l\'apertura del magazzino alle 06:30 è garantita autonomamente dai 2 carrellisti della coppia del sabato, senza dover anticipare i colleghi del turno pomeridiano.'
  },
  {
    id: 'rule_12',
    num: 12,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Venerdì di Marco Severin',
    ruleText: 'Resta sempre a riposo avendo già completato le ore settimanali.',
    detail: 'Severin Marco svolge un orario esteso dal lunedì al giovedì (38-39 ore totali: Lun 9.5h, Mar 10.5h, Mer 10.5h, Gio 9.5h). Il venerdì è il suo riposo settimanale stabilito e non va modificato.'
  },
  {
    id: 'rule_13',
    num: 13,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Showroom Finiture (Idalia) in Assenza di Giuliano Sandrini',
    ruleText: 'Nessuna sostituzione e il cliente viene rimandato o ricontattato.',
    detail: 'Quando Giuliano Sandrini è ad Agrate al sabato o in riposo mercoledì pomeriggio, nessun addetto edile viene distaccato forzatamente alle finiture: le richieste clienti vengono registrate per ricontatto.'
  },
  {
    id: 'rule_14',
    num: 14,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Copertura Chiusura Magazzino (17:30) in Emergenza',
    ruleText: 'Spostare uno dei magazzinieri del mattino alle 17:30.',
    detail: 'Qualora entrambi i magazzinieri del turno pomeridiano (coppia a 8h) risultassero assenti, il motore sposta uno dei magazzinieri antimeridiani al turno 08:30-17:30, salvaguardando scarichi e chiusura.'
  },
  {
    id: 'rule_15',
    num: 15,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Infortuni o Malori Improvvisi Durante la Giornata',
    ruleText: 'I colleghi presenti rimodulano i compiti per coprire fino a chiusura.',
    detail: 'In caso di indisposizione imprevista durante il turno, il personale già in servizio rimodula le mansioni interne per portare a termine la giornata e garantire la chiusura delle 17:30.'
  },

  // 4. Gestione Assenze, Ferie, Permessi & Monte Ore
  {
    id: 'rule_16',
    num: 16,
    category: 'assenze_monteore',
    categoryLabel: 'Assenze & Monte Ore',
    title: 'Criterio Generale Assenze Impreviste (Parità 40 Ore)',
    ruleText: 'Privilegiare sempre il cambio turno a parità di 40 ore.',
    detail: 'Di fronte a scoperture, il generatore calibra gli orari senza generare debiti/crediti orari o straordinari forzati, rispettando le 40h settimanali e le 11h continuative di riposo (D.Lgs 66/2003).'
  },
  {
    id: 'rule_17',
    num: 17,
    category: 'assenze_monteore',
    categoryLabel: 'Assenze & Monte Ore',
    title: 'Assenze Simultanee Multiple (3 o 4 Dipendenti)',
    ruleText: 'Garantire apertura e chiusura riducendo la presenza centrale.',
    detail: 'In settimane ad alta concentrazione di assenze, la priorità indiscutibile va alle fasce limite (06:30 apertura e 17:30 chiusura). L\'assottigliamento dell\'organico viene assorbito dalle ore centrali.'
  },
  {
    id: 'rule_18',
    num: 18,
    category: 'assenze_monteore',
    categoryLabel: 'Assenze & Monte Ore',
    title: 'Donazione Sangue',
    ruleText: 'Considerare sempre giornata intera retribuita di 8 ore.',
    detail: 'A norma di legge e di policy, la giornata in cui il lavoratore dona il sangue è giustificata con riposo per l\'intera giornata lavorativa (accredito pieno di 8 ore), senza richiesta di rientro parziale.'
  },
  {
    id: 'rule_19',
    num: 19,
    category: 'assenze_monteore',
    categoryLabel: 'Assenze & Monte Ore',
    title: 'Corsi di Formazione e Visite Mediche Parziali (2-4 Ore)',
    ruleText: 'L\'operatore completa il turno lavorativo prima o dopo l\'impegno.',
    detail: 'Per corsi obbligatori o visite di medicina del lavoro di durata ridotta, il collaboratore presta servizio per le ore restanti della sua giornata lavorativa ordinaria.'
  },
  {
    id: 'rule_20',
    num: 20,
    category: 'assenze_monteore',
    categoryLabel: 'Assenze & Monte Ore',
    title: 'Uscite Anticipate e Ritardi Brevi (< 2 Ore)',
    ruleText: 'Vanno sempre registrati formalmente come permessi o ROL.',
    detail: 'Tutte le frazioni orarie non lavorate (uscite anticipate, ingressi posticipati) devono essere formalizzate con richiesta di ROL/permesso per garantire la correttezza del cartellino paga.'
  },

  // 5. Politiche Aziendali, Straordinari & Stagionalità
  {
    id: 'rule_21',
    num: 21,
    category: 'politiche_aziendali',
    categoryLabel: 'Politiche Aziendali',
    title: 'Autorizzazione Straordinario Orario',
    ruleText: 'Solo su base volontaria concordata preventivamente.',
    detail: 'Il generatore automatico non assegna mai straordinari coatti: qualsiasi eventuale prestazione eccedente le 40h deve scaturire da accordo volontario preventivo con lo Store Manager.'
  },
  {
    id: 'rule_22',
    num: 22,
    category: 'politiche_aziendali',
    categoryLabel: 'Politiche Aziendali',
    title: 'Priorità Smaltimento Ferie Pregresse',
    ruleText: 'Dare priorità alle ferie arretrate dell\'anno precedente.',
    detail: 'In caso di assenze continuative programmate, il contatore assorbe prioritariamente le ferie maturate negli esercizi precedenti, in linea con gli obblighi di bilancio e fruizione.'
  },
  {
    id: 'rule_23',
    num: 23,
    category: 'politiche_aziendali',
    categoryLabel: 'Politiche Aziendali',
    title: 'Permessi Ricorrenti (Legge 104 / Congedi)',
    ruleText: 'Possono variare settimanalmente con congruo preavviso.',
    detail: 'I permessi per assistenza o congedi non hanno vincolo di giornata fissa, ma possono essere distribuiti nelle diverse giornate feriali previa comunicazione tempestiva al responsabile.'
  },
  {
    id: 'rule_24',
    num: 24,
    category: 'politiche_aziendali',
    categoryLabel: 'Politiche Aziendali',
    title: 'Scelta Ferie Estive Sovrapposte',
    ruleText: 'Accordo concordato direttamente tra i colleghi e il responsabile.',
    detail: 'In presenza di richieste coincidenti tra addetti dello stesso reparto per il periodo estivo, la conciliazione avviene tramite confronto diretto e approvazione dello Store Manager.'
  },
  {
    id: 'rule_25',
    num: 25,
    category: 'politiche_aziendali',
    categoryLabel: 'Politiche Aziendali',
    title: 'Continuità Operativa Stagionale (Agosto & Natale)',
    ruleText: 'La filiale resta sempre aperta con organico ridotto minimo.',
    detail: 'Nei periodi critici di agosto e delle festività natalizie la filiale Corvetto garantisce l\'apertura continua del punto vendita e magazzino calibrando un presidio ridotto essenziale.'
  },

  // 6. Regole di Interazione & Casi Limite Combinati
  {
    id: 'rule_26',
    num: 26,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Orario Feriale Sabatista Store Manager (Davide Alpegiani)',
    ruleText: 'Il suo orario feriale passa a 7 ore dalle 06:30 alle 14:30.',
    detail: 'Quando Davide Alpegiani è di turno al sabato (5h, 07:00-12:00), il suo orario Lun-Ven diventa 06:30-14:30 (7h), completando 35h feriali + 5h sabato = 40 ore esatte settimanali.'
  },
  {
    id: 'rule_27',
    num: 27,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Doppia Assenza Apertura Magazzino (Mario + Sabatista)',
    ruleText: 'Anticipare un magazziniere del turno pomeridiano alle 06:30.',
    detail: 'Se sia Mario Ragone sia uno dei magazzinieri del sabato risultano assenti (rimarrebbe 1 solo operatore a 06:30), si anticipa un addetto pomeridiano alle 06:30 per garantire il presidio di sicurezza obbligatorio di 2 carrellisti.'
  },
  {
    id: 'rule_28',
    num: 28,
    category: 'profili_speciali',
    categoryLabel: 'Profili Speciali',
    title: 'Rimodulazione Oraria Chiusura Magazziniere Mattino (7h)',
    ruleText: 'Il suo orario viene posticipato a 09:30-17:30 per mantenere il nastro di 7 ore.',
    detail: 'Quando un magazziniere con nastro a 7h viene spostato alla chiusura delle 17:30, il suo ingresso è posticipato alle 09:30 (09:30-13:00 / 14:00-17:30 = 7 ore lavorative nette con 1h pausa).'
  },
  {
    id: 'rule_29',
    num: 29,
    category: 'orari_pause',
    categoryLabel: 'Orari & Pause',
    title: 'Permessi Mattutini e Invarianza della Pausa Pranzo',
    ruleText: 'La pausa pranzo resta regolare alla stessa ora del suo turno.',
    detail: 'Se un collaboratore entra più tardi con permesso (es. alle 10:00 o 11:00), la sua pausa pranzo canonica non viene soppressa né spostata, ma fruita regolarmente all\'orario stabilito del proprio turno.'
  },
  {
    id: 'rule_30',
    num: 30,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Copertura Apertura Venerdì con Sabatista Sostituto',
    ruleText: 'L\'apertura viene coperta dall\'unico collega dell\'ufficio a 8 ore disponibile.',
    detail: 'Se il sabatista designato è sostituito da Marco Caregnato (che passa a 7h 06:30-14:30), l\'apertura a 8h del venerdì viene automaticamente coperta dal collega a 8h disponibile (Andrea Poppa), garantendo sempre 2 presenze a 06:30.'
  },
  {
    id: 'rule_31',
    num: 31,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Turno 8h Apertura (06:30 - 15:30) per Sabatista Uscente',
    ruleText: 'Chi è stato sabatista la settimana precedente, nella settimana successiva fa il turno di apertura da 8 ore (06:30 - 15:30).',
    detail: 'Il collaboratore dell\'ufficio che ha prestato servizio il sabato mattina precedente viene automaticamente programmato nella settimana corrente sul turno di apertura a 8 ore (06:30-12:00 / 13:00-15:30 = 8h x 5 = 40 ore feriali). Questo assicura che all\'apertura delle 06:30 siano sempre presenti 2 addetti (il sabatista di turno a 7h + l\'apertura a 8h).'
  },
  {
    id: 'rule_32',
    num: 32,
    category: 'sabati_rotazioni',
    categoryLabel: 'Sabati & Rotazioni',
    title: 'Turno 8h Chiusura (08:30 - 17:30) per Sabatista Entrante',
    ruleText: 'Chi sarà sabatista la settimana successiva, nella settimana corrente fa il turno di chiusura da 8 ore (08:30 - 17:30).',
    detail: 'Il collaboratore dell\'ufficio che sarà sabatista la settimana successiva viene programmato nella settimana corrente sul turno di chiusura a 8 ore (08:30-13:00 / 14:00-17:30 = 8h x 5 = 40 ore feriali con pausa 13:00-14:00). In questo modo la rotazione dell\'ufficio si alterna regolarmente: Chiusura 8h → Sabatista 7h+sabato → Apertura 8h (salvo ovvie eccezioni per assenze o impegni).'
  }
];
