"use strict";
// Reconnaissance photo : modèle Danish Fungi 2020 (BVRA, licence CC BY-NC 4.0),
// converti au format ONNX et exécuté DANS le téléphone (onnxruntime-web).
// Le modèle ne fait que proposer des pistes : il ne décide jamais de la comestibilité.

const IA_SEUIL_CERTITUDE = 0.5;   // en dessous : « je ne peux pas me prononcer »
const IA_SEUIL_DANGER = 0.05;     // une espèce dangereuse à 5 % suffit pour alerter

// Nom latin (DF20) → fiche de notre base
const IA_ESPECES = {
  "boletus edulis": "cepe-bordeaux", "boletus aereus": "cepe-tete-negre", "boletus reticulatus": "cepe-ete",
  "boletus aestivalis": "cepe-ete", "tylopilus felleus": "bolet-amer", "rubroboletus satanas": "bolet-satan",
  "boletus satanas": "bolet-satan", "cantharellus cibarius": "girolle", "hygrophoropsis aurantiaca": "fausse-girolle",
  "omphalotus olearius": "clitocybe-olivier", "omphalotus illudens": "clitocybe-olivier",
  "craterellus cornucopioides": "trompette-mort", "craterellus tubaeformis": "chanterelle-tube",
  "cantharellus tubaeformis": "chanterelle-tube", "hydnum repandum": "pied-mouton", "amanita phalloides": "amanite-phalloide",
  "amanita virosa": "amanite-vireuse", "amanita verna": "amanite-vireuse", "amanita muscaria": "amanite-tue-mouches",
  "amanita pantherina": "amanite-pantheres", "amanita caesarea": "amanite-cesars", "russula cyanoxantha": "russule-charbonniere",
  "macrolepiota procera": "coulemelle", "agaricus campestris": "rose-pres", "agaricus xanthodermus": "agaric-jaunissant",
  "lepista nuda": "pied-bleu", "clitocybe nuda": "pied-bleu", "entoloma sinuatum": "entolome-livide",
  "pleurotus ostreatus": "pleurote", "hypholoma fasciculare": "hypholome-touffe", "galerina marginata": "galere-marginee",
  "gyromitra esculenta": "gyromitre",
  "imleria badia": "bolet-bai", "xerocomus badius": "bolet-bai", "boletus badius": "bolet-bai",
  "neoboletus erythropus": "bolet-pied-rouge", "neoboletus luridiformis": "bolet-pied-rouge", "boletus erythropus": "bolet-pied-rouge",
  "suillellus luridus": "bolet-blafard", "boletus luridus": "bolet-blafard",
};
const IA_GENRES_FICHE = { morchella: "morille", cortinarius: "cortinaires", lepiota: "lepiote-brune" };
// Genres dont certaines espèces sont mortelles ou toxiques : alerte même si l'espèce n'a pas de fiche
const IA_GENRES_RISQUE = {
  amanita: "mortel", galerina: "mortel", lepiota: "mortel", cortinarius: "mortel", gyromitra: "mortel",
  conocybe: "mortel", paxillus: "mortel", inocybe: "toxique", entoloma: "toxique", clitocybe: "toxique",
  hypholoma: "toxique", omphalotus: "toxique", tricholoma: "toxique", scleroderma: "toxique", rubroboletus: "toxique",
  tylopilus: "toxique", hebeloma: "toxique", agaricus: "toxique", ramaria: "toxique",
};

let iaChargement = null;
function chargerScript(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s);
  });
}
function chargerIA() {
  iaChargement ||= (async () => {
    const reglages = await fetch("modele/df20.json").then((r) => { if (!r.ok) throw new Error("modèle absent"); return r.json(); });
    if (typeof ort === "undefined") await chargerScript("vendor/ort/ort.wasm.min.js");
    ort.env.wasm.wasmPaths = new URL("vendor/ort/", location.href).href;
    ort.env.wasm.numThreads = 1;
    const r = await fetch("modele/df20.onnx");
    if (!r.ok) throw new Error("modèle absent");
    const sessionIA = await ort.InferenceSession.create(new Uint8Array(await r.arrayBuffer()), { executionProviders: ["wasm"] });
    return { reglages, sessionIA };
  })();
  iaChargement.catch(() => { iaChargement = null; }); // permet de réessayer plus tard
  return iaChargement;
}

function iaTenseur(toile, reg) {
  const S = reg.taille[1] || reg.taille[0];
  const cp = reg.crop_pct || 1;
  const cote = Math.min(toile.width, toile.height) * cp;
  const c = document.createElement("canvas"); c.width = S; c.height = S;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  if (reg.recadrage === "etirer") ctx.drawImage(toile, 0, 0, S, S); // comme à l'entraînement : image entière redimensionnée
  else ctx.drawImage(toile, (toile.width - cote) / 2, (toile.height - cote) / 2, cote, cote, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data;
  const t = new Float32Array(3 * S * S);
  for (let i = 0, p = 0; p < S * S; i += 4, p++) {
    for (let k = 0; k < 3; k++) t[k * S * S + p] = (d[i + k] / 255 - reg.moyenne[k]) / reg.ecart_type[k];
  }
  return new ort.Tensor("float32", t, [1, 3, S, S]);
}

// Analyse toutes les photos exploitables et fait la moyenne des probabilités
async function reconnaitre(toiles) {
  const { reglages, sessionIA } = await chargerIA();
  let somme = null;
  for (const toile of toiles) {
    const sortie = await sessionIA.run({ [sessionIA.inputNames[0]]: iaTenseur(toile, reglages) });
    const z = sortie[sessionIA.outputNames[0]].data;
    let m = -Infinity; for (const v of z) if (v > m) m = v;
    const e = Array.from(z, (v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0);
    const p = e.map((v) => v / s);
    somme = somme ? somme.map((v, i) => v + p[i]) : p;
  }
  const probas = somme.map((v) => v / toiles.length);
  // « Boletus edulis Bull. » → « Boletus edulis » (on retire le nom des auteurs)
  return probas.map((p, i) => ({ p, latin: String(reglages.especes[i]).split(/\s+/).slice(0, 2).join(" ") }))
    .sort((a, b) => b.p - a.p).slice(0, 5)
    .map((x) => {
      const mots = x.latin.toLowerCase().split(/\s+/);
      const genre = mots[0], binome = mots.slice(0, 2).join(" ");
      const id = IA_ESPECES[binome] || IA_GENRES_FICHE[genre] || null;
      const fiche = id ? PAR_ID[id] : null;
      const risqueGenre = IA_GENRES_RISQUE[genre] || null;
      const statut = fiche ? fiche.statut : null;
      // Danger : fiche toxique/mortelle, OU genre mortel (ex. toute amanite), OU genre à risque sans fiche
      const danger = statut === "mortel" || statut === "toxique" || risqueGenre === "mortel" || (!fiche && !!risqueGenre);
      return { ...x, id, fiche, statut, risqueGenre, danger };
    });
}
