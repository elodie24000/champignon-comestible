"use strict";

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const STATUT = {
  comestible: { label: "Comestible", classe: "s-comestible" },
  toxique: { label: "Toxique", classe: "s-toxique" },
  mortel: { label: "MORTEL", classe: "s-mortel" },
};
const PAR_ID = Object.fromEntries(ESPECES.map((e) => [e.id, e]));
const moisCourant = new Date().getMonth() + 1;
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- Stockage local (try/catch : navigation privée, quota…) ----------
const CLE_CARNET = "champiverif.carnet.v1";
function lireCarnet() {
  try { return JSON.parse(localStorage.getItem(CLE_CARNET)) || []; } catch { return []; }
}
function ecrireCarnet(c) {
  try { localStorage.setItem(CLE_CARNET, JSON.stringify(c)); return true; } catch { return false; }
}

// ---------- Navigation ----------
document.querySelectorAll(".onglets button").forEach((b) =>
  b.addEventListener("click", () => afficherVue(b.dataset.vue)));
function afficherVue(nom) {
  document.querySelectorAll(".vue").forEach((v) => v.classList.toggle("active", v.id === "vue-" + nom));
  document.querySelectorAll(".onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.vue === nom));
  if (nom === "carte") initCarte();
  window.scrollTo(0, 0);
}

// ---------- Modale ----------
const modale = $("#modale");
$("#modaleFermer").addEventListener("click", () => modale.close());
modale.addEventListener("click", (e) => { if (e.target === modale) modale.close(); });
function ouvrirModale(html) {
  $("#modaleContenu").innerHTML = html;
  if (!modale.open) modale.showModal();
  $("#modaleContenu").scrollTop = 0;
}

$("#btnUrgence").addEventListener("click", () => ouvrirModale(`
  <h2>🚨 En cas de doute après un repas</h2>
  <p><strong>Symptômes graves</strong> (malaise, vomissements importants, confusion) : appelez le <a class="tel" href="tel:15">15</a> ou le <a class="tel" href="tel:112">112</a>.</p>
  <p><strong>Centre antipoison de Bordeaux</strong> (Nouvelle-Aquitaine) : <a class="tel" href="tel:+33556964080">05 56 96 40 80</a>, 24 h/24.</p>
  <ul>
    <li>Les symptômes des espèces mortelles apparaissent souvent <strong>6 à 12 heures après</strong> le repas, voire plusieurs jours après. N'attendez pas.</li>
    <li>Gardez les restes (même les épluchures) et vos <strong>photos</strong> : elles aident les médecins.</li>
    <li>Prévenez toutes les personnes qui ont partagé le repas.</li>
  </ul>
  <h3>Faire vérifier sa cueillette</h3>
  <p>De nombreux pharmaciens et les sociétés mycologiques locales vérifient les cueillettes gratuitement.</p>`));

// =====================================================================
//  IDENTIFIER : photos → questions → verdict
// =====================================================================
const PHOTOS = [
  { cle: "dessus", label: "Le dessus", aide: "Chapeau vu de haut" },
  { cle: "dessous", label: "Le dessous", aide: "Lames, éponge ou plis" },
  { cle: "pied", label: "Le pied entier", aide: "Déterré, base comprise" },
];
let session;
function nouvelleSession() {
  session = { photos: {}, reponses: {}, iq: 0 };
  etapePhotos();
}

// --- Contrôle de qualité de la photo (100 % dans le téléphone, gratuit) ---
async function analyserPhoto(fichier) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise((ok, ko) => {
      const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url;
    });
    const raisons = [];
    const L = Math.max(img.naturalWidth, img.naturalHeight);
    if (L < 600) raisons.push("image trop petite (résolution insuffisante)");

    // Analyse sur une version réduite à 512 px
    const k = Math.min(1, 512 / L);
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(w * h);
    let somme = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      g[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; somme += g[p];
    }
    const moy = somme / g.length;
    let ec = 0; for (let p = 0; p < g.length; p++) ec += (g[p] - moy) ** 2;
    const contraste = Math.sqrt(ec / g.length);
    // Netteté : variance du laplacien (faible = flou)
    let s = 0, s2 = 0, n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const lap = g[p - 1] + g[p + 1] + g[p - w] + g[p + w] - 4 * g[p];
      s += lap; s2 += lap * lap; n++;
    }
    const nettete = s2 / n - (s / n) ** 2;

    if (moy < 45) raisons.push("photo trop sombre");
    if (moy > 225) raisons.push("photo surexposée (trop claire)");
    if (contraste < 18) raisons.push("image trop uniforme, on ne distingue rien");
    if (nettete < 60) raisons.push("photo floue");

    // Vignette légère pour le carnet
    const kv = Math.min(1, 240 / L);
    const cv2 = document.createElement("canvas");
    cv2.width = Math.round(img.naturalWidth * kv); cv2.height = Math.round(img.naturalHeight * kv);
    cv2.getContext("2d").drawImage(img, 0, 0, cv2.width, cv2.height);
    return { ok: raisons.length === 0, raisons, vignette: cv2.toDataURL("image/jpeg", 0.7),
      mesures: { nettete: Math.round(nettete), luminosite: Math.round(moy), contraste: Math.round(contraste) } };
  } catch {
    return { ok: false, raisons: ["fichier illisible"], vignette: null, mesures: {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function etapePhotos() {
  const nbOk = Object.values(session.photos).filter((p) => p.ok).length;
  $("#etape").innerHTML = `
    <h1>Vérifier un champignon</h1>
    <p class="intro">Prenez <strong>3 photos</strong> nettes, à la lumière du jour, puis répondez à quelques questions. L'application vous dira à quoi il ressemble, <strong>et surtout avec quoi il ne faut pas le confondre</strong>.</p>
    <div class="photos">
      ${PHOTOS.map((p) => {
        const ph = session.photos[p.cle];
        const etat = !ph ? "" : ph.ok ? "ok" : "ko";
        return `<label class="photo ${etat}">
          <input type="file" accept="image/*" capture="environment" data-cle="${p.cle}" hidden>
          ${ph && ph.vignette ? `<img src="${ph.vignette}" alt="">` : `<span class="ico">📷</span>`}
          <strong>${p.label}</strong><small>${p.aide}</small>
          ${ph ? `<em class="etat">${ph.ok ? "✓ Photo exploitable" : "✗ " + esc(ph.raisons.join(", "))}</em>` : ""}
        </label>`;
      }).join("")}
    </div>
    <div id="messagePhoto">${messagePhotos()}</div>
    <button type="button" class="btn principal" id="versQuestions" ${nbOk ? "" : "disabled"}>Continuer →</button>
    <p class="aide">Les photos restent dans votre téléphone. Elles servent à garder une trace de la cueillette, très utile aux médecins en cas d'intoxication.</p>`;

  document.querySelectorAll('.photo input').forEach((inp) => inp.addEventListener("change", async () => {
    const f = inp.files[0]; if (!f) return;
    inp.closest(".photo").classList.add("analyse");
    session.photos[inp.dataset.cle] = await analyserPhoto(f);
    etapePhotos();
  }));
  $("#versQuestions").addEventListener("click", () => { session.iq = 0; etapeQuestion(); });
}

function messagePhotos() {
  const ph = Object.values(session.photos);
  if (!ph.length) return "";
  const mauvaises = ph.filter((p) => !p.ok);
  if (!ph.some((p) => p.ok)) {
    return `<div class="verdict gris"><strong>⚪ Je ne peux pas me prononcer.</strong> La photo n'est pas assez bonne (${esc(mauvaises[0].raisons.join(", "))}). Reprenez-la plus près, bien éclairée, en faisant la mise au point sur le champignon.</div>`;
  }
  if (mauvaises.length) return `<p class="avert">Une photo n'est pas exploitable : vous pouvez la reprendre en touchant sa case.</p>`;
  return "";
}

function questionsActives() {
  return QUESTIONS.filter((q) => !(q.sauf && q.sauf(session.reponses)));
}

function etapeQuestion() {
  const qs = questionsActives();
  if (session.iq >= qs.length) return etapeVerdict();
  const q = qs[session.iq];
  const choix = q.couleurs
    ? COULEURS.map((c) => ({ v: c.v, label: c.label, hex: c.hex }))
    : q.choix;
  const reste = candidats(session.reponses).length;
  $("#etape").innerHTML = `
    <div class="progression"><span style="width:${Math.round((session.iq / qs.length) * 100)}%"></span></div>
    <p class="compteur">Question ${session.iq + 1} / ${qs.length} · ${reste} espèce${reste > 1 ? "s" : ""} encore possible${reste > 1 ? "s" : ""}</p>
    <h2>${esc(q.titre)}</h2>
    ${q.aide ? `<p class="aide">${esc(q.aide)}</p>` : ""}
    <div class="choix ${q.couleurs ? "couleurs" : ""}">
      ${choix.map((c) => `<button type="button" data-v="${c.v}" class="${session.reponses[q.cle] === c.v ? "choisi" : ""}">
        ${c.hex ? `<i style="background:${c.hex}"></i>` : ""}<strong>${esc(c.label)}</strong>${c.detail ? `<small>${esc(c.detail)}</small>` : ""}</button>`).join("")}
      <button type="button" data-v="?" class="sais-pas">Je ne sais pas</button>
    </div>
    <div class="nav-q">
      <button type="button" class="btn" id="qRetour">← Retour</button>
    </div>`;
  document.querySelectorAll(".choix button").forEach((b) => b.addEventListener("click", () => {
    session.reponses[q.cle] = b.dataset.v;
    // Une réponse peut masquer des questions suivantes : on nettoie les réponses devenues sans objet
    for (const autre of QUESTIONS) if (autre.sauf && autre.sauf(session.reponses)) delete session.reponses[autre.cle];
    session.iq++;
    etapeQuestion();
  }));
  $("#qRetour").addEventListener("click", () => {
    if (session.iq === 0) etapePhotos(); else { session.iq--; etapeQuestion(); }
  });
}

// --- Moteur : élimine les espèces incompatibles avec les réponses ---
function candidats(rep) {
  return ESPECES.filter((e) => QUESTIONS.every((q) => {
    if (q.filtre === false) return true;
    const r = rep[q.cle];
    if (!r || r === "?") return true;
    const t = e.traits[q.cle];
    return !t || t.includes(r);
  }));
}
function score(e, rep) {
  let s = 0;
  for (const q of QUESTIONS) {
    const r = rep[q.cle], t = e.traits[q.cle];
    if (r && r !== "?" && t && t.includes(r)) s += 1 / t.length; // un trait précis compte plus qu'un trait large
  }
  return s;
}

function calculerVerdict(rep, liste) {
  const mortels = liste.filter((e) => e.statut === "mortel");
  const toxiques = liste.filter((e) => e.statut === "toxique");
  const comestibles = liste.filter((e) => e.statut === "comestible");
  const noms = (l) => l.map((e) => e.nom).join(", ");
  if (!rep.dessous || rep.dessous === "?") {
    return { classe: "gris", titre: "⚪ Je ne peux pas me prononcer",
      texte: "Il faut au minimum savoir ce qu'il y a sous le chapeau (lames, éponge, plis…). Regardez à nouveau ou faites vérifier." };
  }
  if (!liste.length) {
    return { classe: "gris", titre: "⚪ Je ne peux pas me prononcer",
      texte: `Aucune des ${ESPECES.length} espèces de la base ne correspond. Il existe des milliers d'espèces en France : ce champignon n'y figure sans doute pas. Ne le consommez pas.` };
  }
  if (mortels.length) {
    return { classe: "rouge", titre: "🔴 DANGER : une espèce mortelle correspond",
      texte: `Vos réponses sont compatibles avec : <strong>${esc(noms(mortels))}</strong>. Ne consommez pas ce champignon. Ne le mélangez pas avec le reste de la cueillette.` };
  }
  if (toxiques.length) {
    return { classe: "rouge", titre: "🔴 Risque de confusion avec une espèce toxique",
      texte: `Vos réponses sont compatibles avec : <strong>${esc(noms(toxiques))}</strong>. Ne consommez pas sans vérification par un expert.` };
  }
  if (comestibles.length > 3) {
    return { classe: "gris", titre: "⚪ Trop de possibilités",
      texte: "Plusieurs espèces correspondent. Répondez plus précisément ou faites vérifier." };
  }
  return { classe: "orange", titre: "🟠 Ressemble à : " + esc(noms(comestibles)),
    texte: "Vos réponses ne correspondent à aucune espèce dangereuse <em>de la base</em>, mais la base n'en contient qu'une partie. <strong>Faites vérifier par un pharmacien ou un mycologue avant toute consommation.</strong>" };
}

function etapeVerdict() {
  const rep = session.reponses;
  const liste = candidats(rep).sort((a, b) => score(b, rep) - score(a, rep));
  const v = calculerVerdict(rep, liste);
  session.verdict = v; session.liste = liste;
  const avertBase = (rep.baseDegagee !== "oui" && rep.dessous === "lames")
    ? `<p class="avert">⚠️ La base du pied n'a pas été dégagée : <strong>impossible d'écarter les amanites mortelles</strong>, dont la volve reste souvent sous terre.</p>` : "";
  const photosOk = Object.values(session.photos).filter((p) => p.ok).length;
  $("#etape").innerHTML = `
    <div class="verdict ${v.classe}"><strong>${v.titre}</strong><p>${v.texte}</p></div>
    ${avertBase}
    ${photosOk < 3 ? `<p class="aide">${photosOk}/3 photo(s) exploitables : pour un avis d'expert, apportez le champignon entier.</p>` : ""}
    <h3>Ce que ça pourrait être (${liste.length})</h3>
    <div class="cartes">${liste.map((e) => carteEspece(e)).join("") || "<p>Aucune espèce.</p>"}</div>
    <div class="actions">
      <button type="button" class="btn principal" id="enregistrer">📍 Enregistrer dans mon carnet</button>
      <button type="button" class="btn" id="recommencer">Nouveau champignon</button>
    </div>
    <p class="aide">Rappel : aucun résultat de cette application n'est une autorisation de consommer.</p>`;
  brancherCartes($("#etape"));
  $("#recommencer").addEventListener("click", nouvelleSession);
  $("#enregistrer").addEventListener("click", enregistrerObservation);
}

function carteEspece(e) {
  const st = STATUT[e.statut];
  const horsSaison = !e.mois.includes(moisCourant);
  return `<button type="button" class="carte-espece ${st.classe}" data-id="${e.id}">
    <span class="badge ${st.classe}">${st.label}</span>
    <strong>${esc(e.nom)}</strong><em>${esc(e.latin)}</em>
    ${horsSaison ? `<small class="hors-saison">Rare en ${MOIS_LONG[moisCourant - 1]}</small>` : ""}
  </button>`;
}
function brancherCartes(racine) {
  racine.querySelectorAll(".carte-espece, .chip-espece").forEach((b) =>
    b.addEventListener("click", () => ouvrirFiche(b.dataset.id)));
}

function barreMois(e) {
  return `<div class="barre-mois">${MOIS.map((m, i) =>
    `<span class="${e.mois.includes(i + 1) ? "on" : ""} ${i + 1 === moisCourant ? "maintenant" : ""}">${m[0].toUpperCase()}</span>`).join("")}</div>`;
}

function ouvrirFiche(id) {
  const e = PAR_ID[id]; if (!e) return;
  const st = STATUT[e.statut];
  ouvrirModale(`
    <span class="badge ${st.classe}">${st.label}</span>
    <h2>${esc(e.nom)}</h2><p class="latin">${esc(e.latin)}</p>
    <h3>Saison</h3>${barreMois(e)}
    <h3>Pour le reconnaître</h3>
    <ul>${e.criteres.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    ${e.note ? `<p class="note ${st.classe}">${esc(e.note)}</p>` : ""}
    ${e.confusions.length ? `<h3>Ne pas confondre avec</h3>
      <div class="chips">${e.confusions.map((c) => PAR_ID[c]).filter(Boolean).map((c) =>
        `<button type="button" class="chip-espece ${STATUT[c.statut].classe}" data-id="${c.id}">${esc(c.nom)} · ${STATUT[c.statut].label}</button>`).join("")}</div>` : ""}
    <p class="aide">Fiche indicative. Seul l'examen du champignon entier par un connaisseur fait foi.</p>`);
  brancherCartes($("#modaleContenu"));
}

// ---------- Enregistrement géolocalisé ----------
function enregistrerObservation() {
  const btn = $("#enregistrer");
  btn.disabled = true; btn.textContent = "Localisation…";
  const finir = (pos) => {
    const obs = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      lat: pos ? +pos.coords.latitude.toFixed(5) : null,
      lon: pos ? +pos.coords.longitude.toFixed(5) : null,
      verdict: session.verdict.classe,
      titre: session.verdict.titre.replace(/<[^>]+>/g, ""),
      pistes: session.liste.slice(0, 4).map((e) => e.id),
      vignette: (Object.values(session.photos).find((p) => p.ok) || {}).vignette || null,
    };
    const c = lireCarnet(); c.unshift(obs);
    const ok = ecrireCarnet(c) || ecrireCarnet(c.map((o, i) => (i ? o : { ...o, vignette: null })));
    btn.textContent = ok ? (pos ? "✓ Enregistré avec position" : "✓ Enregistré (sans position)") : "Mémoire du téléphone pleine";
  };
  if (!navigator.geolocation) return finir(null);
  navigator.geolocation.getCurrentPosition(finir, () => finir(null), { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}

// =====================================================================
//  SAISON
// =====================================================================
let moisSaison = moisCourant;
function rendreSaison() {
  $("#moisChoix").innerHTML = MOIS.map((m, i) =>
    `<button type="button" data-m="${i + 1}" class="${i + 1 === moisSaison ? "actif" : ""}">${m}</button>`).join("");
  $("#moisChoix").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    moisSaison = +b.dataset.m; rendreSaison();
  }));
  const du = ESPECES.filter((e) => e.mois.includes(moisSaison));
  const groupe = (statuts, titre, intro) => {
    const l = du.filter((e) => statuts.includes(e.statut));
    return l.length ? `<h3>${titre}</h3>${intro ? `<p class="aide">${intro}</p>` : ""}<div class="cartes">${l.map(carteEspece).join("")}</div>` : "";
  };
  const absents = ESPECES.filter((e) => e.statut === "comestible" && !e.mois.includes(moisSaison));
  $("#saisonListe").innerHTML = `
    <p class="intro">En <strong>${MOIS_LONG[moisSaison - 1]}</strong>, ${du.length} espèces de la base peuvent sortir.</p>
    ${groupe(["mortel"], "☠️ Mortels à connaître ce mois-ci", "Ce sont eux qu'il faut savoir reconnaître en priorité.")}
    ${groupe(["toxique"], "⚠️ Toxiques du moment")}
    ${groupe(["comestible"], "🧺 Comestibles de saison")}
    ${absents.length ? `<h3>Peu probables en ${MOIS_LONG[moisSaison - 1]}</h3>
      <p class="aide">Si vous pensez en avoir trouvé un, soyez doublement prudent : c'est peut-être un sosie.</p>
      <p class="absents">${absents.map((e) => esc(e.nom)).join(" · ")}</p>` : ""}`;
  brancherCartes($("#saisonListe"));
}

// =====================================================================
//  FICHES
// =====================================================================
const ORDRE = { mortel: 0, toxique: 1, comestible: 2 };
function rendreFiches() {
  const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = norm($("#recherche").value.trim());
  const l = ESPECES.filter((e) => !q || norm(e.nom + " " + e.latin).includes(q))
    .sort((a, b) => ORDRE[a.statut] - ORDRE[b.statut] || a.nom.localeCompare(b.nom, "fr"));
  $("#fichesListe").innerHTML = `<div class="cartes">${l.map(carteEspece).join("")}</div>
    <p class="aide">${ESPECES.length} espèces dans cette première version, centrée sur le Périgord.</p>`;
  brancherCartes($("#fichesListe"));
}
$("#recherche").addEventListener("input", rendreFiches);

// =====================================================================
//  CARTE & CARNET
// =====================================================================
let carte, calque, modeCarte = "prive";
const MAILLE = 0.1; // ≈ 8 × 11 km en Dordogne : on ne divulgue jamais le coin exact
const COUL_VERDICT = { rouge: "#c0392b", orange: "#d9822b", gris: "#8a8a8a" };

document.querySelectorAll(".bascule button").forEach((b) => b.addEventListener("click", () => {
  modeCarte = b.dataset.mode;
  document.querySelectorAll(".bascule button").forEach((x) => x.classList.toggle("actif", x === b));
  rendreCarte();
}));

function initCarte() {
  if (typeof L === "undefined") {
    $("#carte").innerHTML = `<p class="aide">Carte indisponible hors connexion.</p>`;
  } else if (!carte) {
    carte = L.map("carte").setView([45.15, 0.75], 9); // Dordogne
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: "© contributeurs OpenStreetMap",
    }).addTo(carte);
    calque = L.layerGroup().addTo(carte);
  }
  setTimeout(() => carte && carte.invalidateSize(), 50);
  rendreCarte();
}

function rendreCarte() {
  const obs = lireCarnet();
  const geo = obs.filter((o) => o.lat != null);
  if (calque) {
    calque.clearLayers();
    if (modeCarte === "prive") {
      geo.forEach((o) => L.circleMarker([o.lat, o.lon], {
        radius: 8, color: "#fff", weight: 2, fillColor: COUL_VERDICT[o.verdict] || "#555", fillOpacity: 0.9,
      }).bindPopup(`<strong>${esc(o.titre)}</strong><br>${new Date(o.date).toLocaleDateString("fr-FR")}`).addTo(calque));
    } else {
      const mailles = {};
      geo.forEach((o) => {
        const k = Math.floor(o.lat / MAILLE) + ":" + Math.floor(o.lon / MAILLE);
        mailles[k] = (mailles[k] || 0) + 1;
      });
      Object.entries(mailles).forEach(([k, n]) => {
        const [a, b] = k.split(":").map(Number);
        L.rectangle([[a * MAILLE, b * MAILLE], [(a + 1) * MAILLE, (b + 1) * MAILLE]], {
          color: "#3d5a3a", weight: 1, fillOpacity: Math.min(0.15 + n * 0.1, 0.7),
        }).bindPopup(`${n} observation${n > 1 ? "s" : ""} dans cette maille`).addTo(calque);
      });
    }
    if (geo.length) carte.fitBounds(geo.map((o) => [o.lat, o.lon]), { maxZoom: 13, padding: [30, 30] });
  }
  $("#carteAide").textContent = modeCarte === "prive"
    ? "Points précis : visibles uniquement sur votre téléphone."
    : "Vue partagée : les positions sont regroupées par mailles d'environ 10 km, pour ne jamais dévoiler les coins de cueillette.";

  // Évolution mensuelle + liste
  const parMois = Array(12).fill(0);
  obs.forEach((o) => parMois[new Date(o.date).getMonth()]++);
  const max = Math.max(1, ...parMois);
  $("#carnet").innerHTML = !obs.length
    ? `<p class="intro">Votre carnet est vide. Après une vérification, touchez « Enregistrer dans mon carnet » : la date et la position seront notées.</p>`
    : `<h3>Observations par mois</h3>
      <div class="histo">${parMois.map((n, i) => `<div title="${n} en ${MOIS_LONG[i]}"><span style="height:${(n / max) * 100}%"></span><small>${MOIS[i][0].toUpperCase()}</small></div>`).join("")}</div>
      <h3>${obs.length} observation${obs.length > 1 ? "s" : ""}</h3>
      <ul class="liste-obs">${obs.map((o) => `<li>
        ${o.vignette ? `<img src="${o.vignette}" alt="">` : `<span class="ico">🍄</span>`}
        <div><strong class="v-${o.verdict}">${esc(o.titre)}</strong>
        <small>${new Date(o.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}${o.lat == null ? " · sans position" : ""}</small></div>
        <button type="button" class="suppr" data-id="${o.id}" aria-label="Supprimer">🗑</button></li>`).join("")}</ul>`;
  $("#carnet").querySelectorAll(".suppr").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Supprimer cette observation ?")) return;
    ecrireCarnet(lireCarnet().filter((o) => o.id !== b.dataset.id)); rendreCarte();
  }));
}

// ---------- Démarrage ----------
nouvelleSession();
rendreSaison();
rendreFiches();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
