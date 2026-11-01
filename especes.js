// Base d'espèces – version 1 (Périgord / Sud-Ouest).
// ⚠️ Contenu à faire relire par un mycologue ou un pharmacien avant diffusion.
//
// statut : "comestible" | "toxique" | "mortel"
// mois   : mois d'apparition habituels (1 = janvier)
// traits : valeurs ACCEPTÉES pour chaque question. Absence d'un trait = toutes valeurs possibles.
//   dessous       : lames | tubes | plis | aiguillons | alveoles | autre
//   couleurDessous, chapeau : blanc | jaune | rouge | rose | brun | gris_noir | vert | violet
//   anneau, volve, bleuit, touffe : oui | non
//   milieu        : foret | prairie | bois
//   taille        : petit (<5 cm) | moyen (5–10 cm) | grand (>10 cm)
// Pour les espèces mortelles, les traits sont volontairement LARGES :
// mieux vaut les garder à tort dans la liste que les écarter à tort.

const ESPECES = [
  // ---------- BOLETS ----------
  {
    id: "cepe-bordeaux", nom: "Cèpe de Bordeaux", latin: "Boletus edulis",
    statut: "comestible", mois: [8, 9, 10, 11],
    traits: { dessous: ["tubes"], couleurDessous: ["blanc", "jaune", "vert"], chapeau: ["brun"],
      anneau: ["non"], volve: ["non"], bleuit: ["non"], milieu: ["foret"], taille: ["moyen", "grand"], touffe: ["non"] },
    criteres: [
      "Dessous en éponge (tubes), blanc puis jaune-verdâtre",
      "Pied ventru, couvert d'un fin réseau blanc en haut",
      "Chair blanche qui ne change pas de couleur à la coupe",
    ],
    confusions: ["bolet-amer", "bolet-satan"],
  },
  {
    id: "cepe-tete-negre", nom: "Cèpe tête-de-nègre", latin: "Boletus aereus",
    statut: "comestible", mois: [7, 8, 9, 10],
    traits: { dessous: ["tubes"], couleurDessous: ["blanc", "jaune", "vert"], chapeau: ["brun", "gris_noir"],
      anneau: ["non"], volve: ["non"], bleuit: ["non"], milieu: ["foret"], taille: ["moyen", "grand"], touffe: ["non"] },
    criteres: [
      "Chapeau brun très foncé, d'aspect velouté",
      "Chênaies et châtaigneraies chaudes",
      "Chair blanche immuable",
    ],
    confusions: ["bolet-amer"],
  },
  {
    id: "cepe-ete", nom: "Cèpe d'été (cèpe réticulé)", latin: "Boletus reticulatus",
    statut: "comestible", mois: [5, 6, 7, 8, 9],
    traits: { dessous: ["tubes"], couleurDessous: ["blanc", "jaune", "vert"], chapeau: ["brun"],
      anneau: ["non"], volve: ["non"], bleuit: ["non"], milieu: ["foret"], taille: ["moyen", "grand"], touffe: ["non"] },
    criteres: [
      "Le cèpe de l'été : oui, on peut trouver des cèpes en juin-juillet après des orages",
      "Chapeau brun clair, souvent craquelé par temps sec",
      "Réseau sur tout le pied",
    ],
    confusions: ["bolet-amer"],
  },
  {
    id: "bolet-amer", nom: "Bolet amer (bolet de fiel)", latin: "Tylopilus felleus",
    statut: "toxique", mois: [7, 8, 9, 10],
    traits: { dessous: ["tubes"], couleurDessous: ["blanc", "rose"], chapeau: ["brun"],
      bleuit: ["non"], volve: ["non"], anneau: ["non"], milieu: ["foret"], taille: ["moyen", "grand"] },
    criteres: [
      "Pores qui deviennent ROSÉS en vieillissant",
      "Réseau BRUN FONCÉ sur le pied (blanc chez le cèpe)",
      "Goût extrêmement amer : un seul gâche toute la poêlée",
    ],
    confusions: ["cepe-bordeaux", "cepe-ete"],
    note: "Pas mortel, mais immangeable et irritant pour le tube digestif.",
  },
  {
    id: "bolet-satan", nom: "Bolet de Satan", latin: "Rubroboletus satanas",
    statut: "toxique", mois: [6, 7, 8, 9],
    traits: { dessous: ["tubes"], couleurDessous: ["rouge", "jaune"], chapeau: ["blanc", "gris_noir"],
      bleuit: ["oui"], volve: ["non"], anneau: ["non"], milieu: ["foret"], taille: ["moyen", "grand"] },
    criteres: [
      "Chapeau blanc grisâtre, pores ROUGES",
      "Pied ventru jaune et rouge",
      "Chair qui bleuit à la coupe, odeur désagréable en vieillissant",
    ],
    confusions: ["cepe-bordeaux"],
    note: "Provoque de violents troubles digestifs.",
  },

  // ---------- CHANTERELLES & CO ----------
  {
    id: "girolle", nom: "Girolle", latin: "Cantharellus cibarius",
    statut: "comestible", mois: [6, 7, 8, 9, 10, 11],
    traits: { dessous: ["plis"], couleurDessous: ["jaune"], chapeau: ["jaune"],
      anneau: ["non"], volve: ["non"], bleuit: ["non"], milieu: ["foret"], taille: ["petit", "moyen"], touffe: ["non"] },
    criteres: [
      "Dessous en PLIS épais et fourchus qui descendent sur le pied (pas de vraies lames fines)",
      "Chair blanche, ferme, odeur fruitée d'abricot",
      "Pousse au sol, jamais sur le bois",
    ],
    confusions: ["fausse-girolle", "clitocybe-olivier"],
  },
  {
    id: "fausse-girolle", nom: "Fausse girolle", latin: "Hygrophoropsis aurantiaca",
    statut: "toxique", mois: [8, 9, 10, 11, 12],
    traits: { dessous: ["lames", "plis"], couleurDessous: ["jaune"], chapeau: ["jaune", "brun"],
      anneau: ["non"], volve: ["non"], milieu: ["foret", "bois"], taille: ["petit", "moyen"] },
    criteres: [
      "Vraies lames fines, serrées, orange vif",
      "Chair molle, orangée, sans odeur fruitée",
      "Souvent sous les pins ou sur bois pourri",
    ],
    confusions: ["girolle"],
    note: "Considérée comme suspecte : troubles digestifs signalés.",
  },
  {
    id: "clitocybe-olivier", nom: "Clitocybe de l'olivier", latin: "Omphalotus olearius",
    statut: "toxique", mois: [8, 9, 10, 11],
    traits: { dessous: ["lames", "plis"], couleurDessous: ["jaune"], chapeau: ["jaune", "rouge"],
      anneau: ["non"], volve: ["non"], milieu: ["bois", "foret"], touffe: ["oui"] },
    criteres: [
      "Pousse en TOUFFES, au pied des chênes ou sur souches",
      "Vraies lames orange vif, serrées",
      "Chair orangée (blanche chez la girolle)",
    ],
    confusions: ["girolle"],
    note: "Vomissements et diarrhées sévères quelques heures après le repas.",
  },
  {
    id: "trompette-mort", nom: "Trompette de la mort", latin: "Craterellus cornucopioides",
    statut: "comestible", mois: [8, 9, 10, 11],
    traits: { dessous: ["plis"], couleurDessous: ["gris_noir"], chapeau: ["gris_noir"],
      anneau: ["non"], volve: ["non"], milieu: ["foret"], taille: ["petit", "moyen"] },
    criteres: [
      "En forme d'entonnoir creux jusqu'à la base",
      "Dessous presque lisse, gris cendré",
      "Malgré son nom, excellent comestible",
    ],
    confusions: [],
  },
  {
    id: "chanterelle-tube", nom: "Chanterelle en tube", latin: "Craterellus tubaeformis",
    statut: "comestible", mois: [9, 10, 11, 12],
    traits: { dessous: ["plis"], couleurDessous: ["gris_noir", "brun", "jaune"], chapeau: ["brun"],
      anneau: ["non"], volve: ["non"], milieu: ["foret"], taille: ["petit"] },
    criteres: [
      "Petit chapeau brun ombiliqué, pied creux jaune",
      "Plis grisâtres, fourchus",
      "En troupes sur la mousse, bois humides",
    ],
    confusions: ["fausse-girolle"],
  },
  {
    id: "pied-mouton", nom: "Pied-de-mouton", latin: "Hydnum repandum",
    statut: "comestible", mois: [8, 9, 10, 11, 12],
    traits: { dessous: ["aiguillons"], couleurDessous: ["blanc", "jaune"], chapeau: ["blanc", "jaune"],
      anneau: ["non"], volve: ["non"], milieu: ["foret"] },
    criteres: [
      "Dessous couvert de petits AIGUILLONS (pics) cassants",
      "Chapeau crème à orangé pâle",
      "Pas de sosie dangereux connu : idéal pour débuter",
    ],
    confusions: [],
  },

  // ---------- LAMES BLANCHES : LA ZONE DANGEREUSE ----------
  {
    id: "amanite-phalloide", nom: "Amanite phalloïde", latin: "Amanita phalloides",
    statut: "mortel", mois: [7, 8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["vert", "jaune", "blanc", "brun"],
      anneau: ["oui", "non"], volve: ["oui"], bleuit: ["non"], milieu: ["foret"] },
    criteres: [
      "Chapeau vert olive à jaunâtre (parfois presque blanc)",
      "Lames BLANCHES, anneau blanc (peut disparaître)",
      "VOLVE en sac à la base, souvent enterrée : toujours déterrer le pied entier",
    ],
    confusions: ["russule-charbonniere", "rose-pres"],
    note: "Responsable de la majorité des décès. Symptômes retardés (6 à 12 h) : atteinte du foie.",
  },
  {
    id: "amanite-vireuse", nom: "Amanite vireuse / printanière", latin: "Amanita virosa / A. verna",
    statut: "mortel", mois: [5, 6, 7, 8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["blanc"],
      anneau: ["oui", "non"], volve: ["oui"], bleuit: ["non"], milieu: ["foret"] },
    criteres: [
      "Entièrement BLANCHE",
      "Lames blanches qui ne brunissent jamais",
      "Volve en sac à la base",
    ],
    confusions: ["rose-pres", "coulemelle"],
    note: "Aussi mortelle que la phalloïde.",
  },
  {
    id: "amanite-tue-mouches", nom: "Amanite tue-mouches", latin: "Amanita muscaria",
    statut: "toxique", mois: [8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["rouge", "jaune"],
      milieu: ["foret"], bleuit: ["non"] },
    criteres: [
      "Chapeau rouge vif à flocons blancs (les flocons partent à la pluie)",
      "Lames blanches",
      "Base bulbeuse avec bourrelets",
    ],
    confusions: ["amanite-cesars"],
  },
  {
    id: "amanite-pantheres", nom: "Amanite panthère", latin: "Amanita pantherina",
    statut: "toxique", mois: [7, 8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["brun"],
      milieu: ["foret"], bleuit: ["non"] },
    criteres: [
      "Chapeau brun parsemé de flocons blancs",
      "Lames blanches, anneau lisse",
      "Bulbe à rebord net",
    ],
    confusions: ["coulemelle"],
    note: "Intoxication neurologique grave.",
  },
  {
    id: "amanite-cesars", nom: "Oronge (amanite des Césars)", latin: "Amanita caesarea",
    statut: "comestible", mois: [7, 8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["jaune"], chapeau: ["rouge", "jaune"],
      volve: ["oui"], anneau: ["oui", "non"], milieu: ["foret"], taille: ["moyen", "grand"] },
    criteres: [
      "Lames et pied JAUNES (blancs chez la tue-mouches)",
      "Grande volve blanche en sac",
      "Chênaies chaudes",
    ],
    confusions: ["amanite-tue-mouches"],
    note: "Réservée aux cueilleurs expérimentés : c'est une amanite.",
  },
  {
    id: "russule-charbonniere", nom: "Russule charbonnière", latin: "Russula cyanoxantha",
    statut: "comestible", mois: [6, 7, 8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["violet", "vert", "gris_noir"],
      anneau: ["non"], volve: ["non"], bleuit: ["non"], milieu: ["foret"], taille: ["moyen", "grand"] },
    criteres: [
      "Lames blanches souples, grasses au toucher (pas cassantes)",
      "Ni anneau ni volve",
      "Chair cassante comme de la craie",
    ],
    confusions: ["amanite-phalloide"],
    note: "Un chapeau verdâtre à lames blanches doit toujours faire penser à la phalloïde.",
  },
  {
    id: "coulemelle", nom: "Coulemelle (lépiote élevée)", latin: "Macrolepiota procera",
    statut: "comestible", mois: [7, 8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["brun", "blanc"],
      anneau: ["oui"], volve: ["non"], bleuit: ["non"], milieu: ["prairie", "foret"], taille: ["grand"] },
    criteres: [
      "GRANDE : chapeau de plus de 10 cm, pied chiné",
      "Anneau double, coulissant le long du pied",
      "Jamais de volve",
    ],
    confusions: ["lepiote-brune", "amanite-pantheres"],
    note: "Ne jamais ramasser de « petite coulemelle » : les petites lépiotes sont mortelles.",
  },
  {
    id: "lepiote-brune", nom: "Petites lépiotes brunes", latin: "Lepiota brunneoincarnata & co.",
    statut: "mortel", mois: [7, 8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["brun", "rouge", "rose", "blanc"],
      anneau: ["oui", "non"], volve: ["non"], milieu: ["prairie", "foret"], taille: ["petit", "moyen"] },
    criteres: [
      "Petit chapeau (moins de 8 cm) à écailles brun rosé",
      "Lames blanches",
      "Pelouses, bords de chemins, parcs",
    ],
    confusions: ["coulemelle", "rose-pres"],
    note: "Contient les mêmes toxines que la phalloïde.",
  },

  // ---------- AGARICS ----------
  {
    id: "rose-pres", nom: "Rosé des prés", latin: "Agaricus campestris",
    statut: "comestible", mois: [6, 7, 8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["rose", "brun"], chapeau: ["blanc"],
      anneau: ["oui", "non"], volve: ["non"], bleuit: ["non"], milieu: ["prairie"], taille: ["petit", "moyen"] },
    criteres: [
      "Lames ROSES puis brun chocolat, JAMAIS blanches",
      "Prairies pâturées",
      "Ne jaunit pas au grattage de la base du pied",
    ],
    confusions: ["amanite-vireuse", "agaric-jaunissant", "lepiote-brune"],
  },
  {
    id: "agaric-jaunissant", nom: "Agaric jaunissant", latin: "Agaricus xanthodermus",
    statut: "toxique", mois: [7, 8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["rose", "brun"], chapeau: ["blanc"],
      anneau: ["oui"], volve: ["non"], milieu: ["prairie", "foret"] },
    criteres: [
      "Jaunit VIVEMENT au grattage de la base du pied",
      "Odeur d'encre ou de phénol",
    ],
    confusions: ["rose-pres"],
  },

  // ---------- LAMES COLORÉES ----------
  {
    id: "pied-bleu", nom: "Pied bleu", latin: "Lepista nuda",
    statut: "comestible", mois: [10, 11, 12],
    traits: { dessous: ["lames"], couleurDessous: ["violet"], chapeau: ["violet", "brun"],
      anneau: ["non"], volve: ["non"], milieu: ["foret", "prairie"] },
    criteres: [
      "Lames lilas, pied violet",
      "Odeur fruitée, parfumée",
      "Sporée rose pâle (jamais brun rouille)",
    ],
    confusions: ["cortinaires"],
  },
  {
    id: "cortinaires", nom: "Cortinaires (dont cortinaire rocou)", latin: "Cortinarius spp. (C. orellanus)",
    statut: "mortel", mois: [8, 9, 10, 11],
    traits: { dessous: ["lames"], couleurDessous: ["jaune", "brun", "violet", "rouge"], chapeau: ["jaune", "brun", "violet", "rouge"],
      anneau: ["non"], volve: ["non"], milieu: ["foret"] },
    criteres: [
      "Lames qui deviennent brun rouille (sporée rouille)",
      "Fine toile (cortine) entre chapeau et pied chez les jeunes",
      "Plusieurs centaines d'espèces, impossibles à distinguer sur photo",
    ],
    confusions: ["pied-bleu"],
    note: "Le cortinaire rocou détruit les reins, avec des symptômes qui apparaissent jusqu'à 2 semaines après.",
  },
  {
    id: "entolome-livide", nom: "Entolome livide", latin: "Entoloma sinuatum",
    statut: "toxique", mois: [8, 9, 10],
    traits: { dessous: ["lames"], couleurDessous: ["jaune", "rose"], chapeau: ["blanc", "gris_noir"],
      anneau: ["non"], volve: ["non"], milieu: ["foret"], taille: ["moyen", "grand"] },
    criteres: [
      "Lames jaunâtres puis roses",
      "Chapeau gris pâle",
      "Odeur de farine",
    ],
    confusions: ["rose-pres"],
    note: "Responsable de nombreuses intoxications digestives sévères.",
  },

  // ---------- SUR BOIS ----------
  {
    id: "pleurote", nom: "Pleurote en huître", latin: "Pleurotus ostreatus",
    statut: "comestible", mois: [10, 11, 12, 1, 2, 3],
    traits: { dessous: ["lames"], couleurDessous: ["blanc"], chapeau: ["gris_noir", "brun", "blanc"],
      anneau: ["non"], volve: ["non"], milieu: ["bois"], touffe: ["oui"] },
    criteres: [
      "En consoles superposées sur bois mort de feuillus",
      "Pied très court, sur le côté",
      "Lames blanches qui descendent sur le pied",
    ],
    confusions: [],
  },
  {
    id: "hypholome-touffe", nom: "Hypholome en touffe", latin: "Hypholoma fasciculare",
    statut: "toxique", mois: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    traits: { dessous: ["lames"], couleurDessous: ["jaune", "vert", "brun"], chapeau: ["jaune"],
      anneau: ["non"], volve: ["non"], milieu: ["bois"], touffe: ["oui"], taille: ["petit", "moyen"] },
    criteres: [
      "Touffes jaune soufre sur souches",
      "Lames jaune-vert puis noirâtres",
      "Goût très amer",
    ],
    confusions: ["galere-marginee"],
  },
  {
    id: "galere-marginee", nom: "Galère marginée", latin: "Galerina marginata",
    statut: "mortel", mois: [8, 9, 10, 11, 12],
    traits: { dessous: ["lames"], couleurDessous: ["brun", "jaune"], chapeau: ["brun", "jaune"],
      volve: ["non"], milieu: ["bois"], taille: ["petit", "moyen"] },
    criteres: [
      "Petite, brun-orangé, sur bois mort de conifères",
      "Petit anneau brunâtre fragile",
      "Confondue avec la pholiote changeante (comestible)",
    ],
    confusions: ["hypholome-touffe"],
    note: "Mêmes toxines que la phalloïde.",
  },

  // ---------- PRINTEMPS ----------
  {
    id: "morille", nom: "Morille", latin: "Morchella spp.",
    statut: "comestible", mois: [3, 4, 5],
    traits: { dessous: ["alveoles"], chapeau: ["brun", "jaune", "gris_noir"],
      anneau: ["non"], volve: ["non"], milieu: ["foret", "prairie"] },
    criteres: [
      "Chapeau en ÉPONGE à alvéoles régulières",
      "Entièrement CREUSE de haut en bas quand on la coupe en deux",
      "Toxique crue : toujours bien cuite",
    ],
    confusions: ["gyromitre"],
  },
  {
    id: "gyromitre", nom: "Gyromitre (fausse morille)", latin: "Gyromitra esculenta",
    statut: "mortel", mois: [3, 4, 5],
    traits: { dessous: ["alveoles"], chapeau: ["brun", "rouge"], anneau: ["non"], volve: ["non"], milieu: ["foret"] },
    criteres: [
      "Chapeau en forme de CERVEAU (circonvolutions), pas d'alvéoles",
      "Intérieur cloisonné, pas creux",
      "Sous les conifères",
    ],
    confusions: ["morille"],
  },
];

const QUESTIONS = [
  {
    cle: "dessous", titre: "Qu'y a-t-il sous le chapeau ?",
    aide: "Retournez le champignon et regardez.",
    choix: [
      { v: "lames", label: "Des lames", detail: "fines feuilles serrées" },
      { v: "tubes", label: "Une éponge", detail: "petits trous (tubes)" },
      { v: "plis", label: "Des plis", detail: "veines épaisses, fourchues" },
      { v: "aiguillons", label: "Des aiguillons", detail: "petits pics" },
      { v: "alveoles", label: "Chapeau alvéolé", detail: "éponge ou cerveau (type morille)" },
    ],
  },
  {
    cle: "couleurDessous", titre: "De quelle couleur est le dessous ?", aide: "Lames, éponge ou plis.",
    sauf: (r) => r.dessous === "alveoles", couleurs: true,
  },
  {
    cle: "chapeau", titre: "De quelle couleur est le chapeau ?", aide: "La couleur dominante.", couleurs: true,
  },
  {
    cle: "taille", titre: "Quelle taille fait le chapeau ?", aide: "Diamètre.",
    choix: [
      { v: "petit", label: "Petit", detail: "moins de 5 cm" },
      { v: "moyen", label: "Moyen", detail: "5 à 10 cm" },
      { v: "grand", label: "Grand", detail: "plus de 10 cm" },
    ],
  },
  {
    cle: "baseDegagee", titre: "Avez-vous dégagé TOUT le pied, jusque dans la terre ?",
    aide: "La volve des amanites mortelles est souvent cachée sous terre ou la mousse. Ne coupez jamais au couteau.",
    choix: [
      { v: "oui", label: "Oui, en entier" },
      { v: "non", label: "Non / coupé" },
    ],
    filtre: false,
  },
  {
    cle: "volve", titre: "Y a-t-il un sac (volve) à la base du pied ?",
    aide: "Comme un œuf déchiré d'où sortirait le pied.",
    sauf: (r) => r.baseDegagee !== "oui",
    choix: [{ v: "oui", label: "Oui" }, { v: "non", label: "Non" }],
  },
  {
    cle: "anneau", titre: "Y a-t-il un anneau (une jupette) autour du pied ?",
    choix: [{ v: "oui", label: "Oui" }, { v: "non", label: "Non" }],
  },
  {
    cle: "bleuit", titre: "La chair bleuit-elle quand on la coupe ou la presse ?",
    sauf: (r) => r.dessous !== "tubes",
    choix: [{ v: "oui", label: "Oui, elle bleuit" }, { v: "non", label: "Non" }],
  },
  {
    cle: "touffe", titre: "Pousse-t-il en touffe serrée (plusieurs pieds soudés) ?",
    choix: [{ v: "oui", label: "Oui, en touffe" }, { v: "non", label: "Non, isolé ou dispersé" }],
  },
  {
    cle: "milieu", titre: "Où pousse-t-il ?",
    choix: [
      { v: "foret", label: "Au sol, en forêt" },
      { v: "prairie", label: "Prairie, pelouse" },
      { v: "bois", label: "Sur du bois", detail: "souche, tronc, branche" },
    ],
  },
];

const COULEURS = [
  { v: "blanc", label: "Blanc / crème", hex: "#f4f1e8" },
  { v: "jaune", label: "Jaune / orange", hex: "#e9a827" },
  { v: "rouge", label: "Rouge", hex: "#c0392b" },
  { v: "rose", label: "Rose", hex: "#e8a3b0" },
  { v: "brun", label: "Brun", hex: "#7a5230" },
  { v: "gris_noir", label: "Gris / noir", hex: "#4a4a4a" },
  { v: "vert", label: "Vert / olive", hex: "#8a9a4b" },
  { v: "violet", label: "Violet / lilas", hex: "#8e6bb0" },
];
