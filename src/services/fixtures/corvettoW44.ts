import type { AppData, WeekShifts } from '../../types/turni';

// Sanitized schedule fixture from the repository's 2026-W44 sample.
// Personal names and free-text notes are deliberately omitted.
export const corvettoW44App = {
  workers: [
  {
    "id": "w_1",
    "order": 1,
    "name": "ALPEGIANI DAVIDE",
    "role": "Store Manager",
    "group": "MANAGER",
    "selected": true,
    "brain": {
      "office": true,
      "warehouse": false,
      "officeProfile": "standard"
    },
    "profile": {
      "openingExperience": "mentor",
      "qualifications": {
        "fireSafety": {
          "expiry": "2027-10-15",
          "status": "valid"
        },
        "firstAid": {
          "expiry": "2027-11-30",
          "status": "valid"
        },
        "forklift": {
          "status": "none"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_2",
    "order": 2,
    "name": "CAREGNATO MARCO",
    "role": "Add. Vendite Banco Edile",
    "group": "EDILE",
    "selected": true,
    "brain": {
      "office": true,
      "warehouse": false,
      "officeProfile": "standard"
    },
    "profile": {
      "openingExperience": "autonomous",
      "qualifications": {
        "fireSafety": {
          "status": "none"
        },
        "firstAid": {
          "expiry": "2027-05-20",
          "status": "valid"
        },
        "forklift": {
          "status": "none"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_3",
    "order": 3,
    "name": "POPPA ANDREA",
    "role": "Add. Vendite Banco Edile",
    "group": "EDILE",
    "selected": true,
    "brain": {
      "office": true,
      "warehouse": false,
      "officeProfile": "standard"
    },
    "profile": {
      "openingExperience": "autonomous",
      "qualifications": {
        "fireSafety": {
          "expiry": "2027-04-10",
          "status": "valid"
        },
        "firstAid": {
          "status": "none"
        },
        "forklift": {
          "status": "none"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_4",
    "order": 4,
    "name": "SEVERIN MARCO",
    "role": "Add. Vendite Banco Edile",
    "group": "EDILE",
    "selected": true,
    "brain": {
      "office": true,
      "warehouse": false,
      "officeProfile": "severin"
    },
    "profile": {
      "openingExperience": "mentor",
      "qualifications": {
        "fireSafety": {
          "expiry": "2027-06-15",
          "status": "valid"
        },
        "firstAid": {
          "expiry": "2027-08-30",
          "status": "valid"
        },
        "forklift": {
          "status": "none"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_5",
    "order": 5,
    "name": "SANDRINI GIULIANO",
    "role": "Add. Vendite Finiture (Idalia)",
    "group": "FINITURE",
    "selected": true,
    "brain": {
      "office": true,
      "warehouse": false,
      "officeProfile": "finiture"
    },
    "profile": {
      "openingExperience": "unknown",
      "qualifications": {
        "fireSafety": {
          "status": "none"
        },
        "firstAid": {
          "status": "none"
        },
        "forklift": {
          "status": "none"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_6",
    "order": 6,
    "name": "VARTUCA PINO",
    "role": "Magazziniere",
    "group": "MAGAZZINO",
    "selected": true,
    "brain": {
      "office": false,
      "warehouse": true,
      "officeProfile": ""
    },
    "profile": {
      "openingExperience": "mentor",
      "qualifications": {
        "fireSafety": {
          "status": "none"
        },
        "firstAid": {
          "expiry": "2027-03-12",
          "status": "valid"
        },
        "forklift": {
          "expiry": "2027-06-15",
          "status": "valid"
        },
        "loader": {
          "expiry": "2027-06-15",
          "status": "valid"
        }
      }
    }
  },
  {
    "id": "w_7",
    "order": 8,
    "name": "RALLO VINCENZO",
    "role": "Magazziniere",
    "group": "MAGAZZINO",
    "selected": true,
    "brain": {
      "office": false,
      "warehouse": true,
      "officeProfile": ""
    },
    "profile": {
      "openingExperience": "autonomous",
      "qualifications": {
        "fireSafety": {
          "expiry": "2027-08-14",
          "status": "valid"
        },
        "firstAid": {
          "status": "none"
        },
        "forklift": {
          "expiry": "2027-09-20",
          "status": "valid"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_8",
    "order": 7,
    "name": "CARUSO MASSIMO",
    "role": "Magazziniere",
    "group": "MAGAZZINO",
    "selected": true,
    "brain": {
      "office": false,
      "warehouse": true,
      "officeProfile": ""
    },
    "profile": {
      "openingExperience": "mentor",
      "qualifications": {
        "fireSafety": {
          "status": "none"
        },
        "firstAid": {
          "status": "none"
        },
        "forklift": {
          "expiry": "2027-04-30",
          "status": "valid"
        },
        "loader": {
          "expiry": "2027-04-30",
          "status": "valid"
        }
      }
    }
  },
  {
    "id": "w_9",
    "order": 9,
    "name": "DRIGO MATTIA",
    "role": "Magazziniere",
    "group": "MAGAZZINO",
    "selected": true,
    "brain": {
      "office": false,
      "warehouse": true,
      "officeProfile": ""
    },
    "profile": {
      "openingExperience": "autonomous",
      "qualifications": {
        "fireSafety": {
          "status": "none"
        },
        "firstAid": {
          "expiry": "2027-09-18",
          "status": "valid"
        },
        "forklift": {
          "expiry": "2027-12-10",
          "status": "valid"
        },
        "loader": {
          "status": "none"
        }
      }
    }
  },
  {
    "id": "w_10",
    "order": 10,
    "name": "RAGONE MARIO",
    "role": "Magazziniere",
    "group": "MAGAZZINO",
    "selected": true,
    "brain": {
      "office": false,
      "warehouse": true,
      "officeProfile": ""
    },
    "profile": {
      "openingExperience": "mentor",
      "qualifications": {
        "fireSafety": {
          "expiry": "2027-07-22",
          "status": "valid"
        },
        "firstAid": {
          "status": "none"
        },
        "forklift": {
          "expiry": "2027-08-05",
          "status": "valid"
        },
        "loader": {
          "expiry": "2027-08-05",
          "status": "valid"
        }
      }
    }
  }
],
  rules: {
  "branchHours": {
    "monFri": {
      "close": "17:30",
      "open": "06:30"
    },
    "sat": {
      "close": "12:00",
      "open": "07:00"
    }
  },
  "branchMonFriOpen": "06:30",
  "branchMonFriClose": "17:30",
  "minAperturaMag": 2,
  "minAperturaImp": 2,
  "minSabatoMag": 1,
  "minSabatoImp": 1,
  "officeCoverage": {
    "minClose": 2
  }
}
} as unknown as AppData;

export const corvettoW44Week = {
  "w_1": {
    "0": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO",
      "coverageBlockedIntervals": [
        [
          510,
          750
        ]
      ]
    },
    "3": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_10": {
    "0": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_2": {
    "0": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "FERIE",
      "leaveFullDay": true,
      "leaveType": "Ferie",
      "leaveRequestId": "lr_1791470690835"
    },
    "2": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_3": {
    "0": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "07:00",
      "mOut": "12:00",
      "pIn": "",
      "pOut": "",
      "status": "LAVORO"
    }
  },
  "w_4": {
    "0": {
      "mIn": "07:30",
      "mOut": "12:30",
      "pIn": "13:00",
      "pOut": "17:30",
      "status": "LAVORO",
      "coverageBlockedIntervals": [
        [
          510,
          720
        ]
      ]
    },
    "1": {
      "mIn": "06:30",
      "mOut": "12:30",
      "pIn": "13:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "06:30",
      "mOut": "12:30",
      "pIn": "13:00",
      "pOut": "17:30",
      "status": "LAVORO",
      "coverageBlockedIntervals": [
        [
          840,
          1020
        ]
      ]
    },
    "3": {
      "mIn": "06:30",
      "mOut": "12:30",
      "pIn": "13:00",
      "pOut": "16:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_5": {
    "0": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "08:30",
      "mOut": "12:30",
      "pIn": "",
      "pOut": "",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "08:00",
      "mOut": "12:00",
      "pIn": "",
      "pOut": "",
      "status": "LAVORO"
    }
  },
  "w_6": {
    "0": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30"
    },
    "1": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30"
    },
    "2": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30"
    },
    "3": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30"
    },
    "4": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "15:30"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_7": {
    "0": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "MALATTIA",
      "leaveFullDay": true,
      "leaveType": "Ricovero",
      "leaveRequestId": "mal_1791364174187"
    },
    "1": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_8": {
    "0": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "08:30",
      "mOut": "13:00",
      "pIn": "14:00",
      "pOut": "17:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "",
      "mOut": "",
      "pIn": "",
      "pOut": "",
      "status": "RIPOSO"
    }
  },
  "w_9": {
    "0": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "1": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "2": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "3": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "4": {
      "mIn": "06:30",
      "mOut": "12:00",
      "pIn": "13:00",
      "pOut": "14:30",
      "status": "LAVORO"
    },
    "5": {
      "mIn": "07:00",
      "mOut": "12:00",
      "pIn": "",
      "pOut": "",
      "status": "LAVORO"
    }
  }
} as WeekShifts;
