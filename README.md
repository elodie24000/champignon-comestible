# Champi'Vérif 🍄

Application web (installable sur téléphone, fonctionne hors connexion) pour **vérifier un champignon pas à pas**, connaître ses **sosies dangereux**, suivre les **saisons** et **recenser ses cueillettes** sur une carte.

> Principe de sécurité : l'application ne dit **jamais** « comestible, vous pouvez le manger ». Ses verdicts possibles sont :
> 🔴 *danger / risque de confusion*, 🟠 *ressemble à… faites vérifier*, ⚪ *je ne peux pas me prononcer*.
> C'est conforme à la recommandation de l'ANSES de ne pas consommer un champignon identifié par une application.

## Ce que fait la version 1

| Onglet | Contenu |
|---|---|
| 📷 **Vérifier** | 3 photos (dessus, dessous, pied déterré) avec **contrôle de qualité automatique** (flou, trop sombre, surexposé, trop petit). Si aucune photo n'est exploitable, l'application répond « je ne peux pas me prononcer ». Ensuite, environ 9 questions simples (lames/éponge/plis, couleurs, anneau, volve, bleuissement…) éliminent les espèces incompatibles. Le verdict liste **en priorité les espèces dangereuses encore possibles**. |
| 🗓️ **Saison** | Pour chaque mois : les mortels à connaître, les toxiques, les comestibles de saison et ceux « peu probables », qui signalent une confusion possible. |
| 🗺️ **Carnet** | Observations datées et géolocalisées, carte précise (privée) **ou** vue partagée floutée par mailles de ~10 km, et histogramme mensuel. |
| 📖 **Fiches** | 32 espèces du Périgord, dont 16 comestibles, 10 toxiques et 6 mortelles ou groupes mortels, avec critères, saison et « ne pas confondre avec ». |
| 🚨 **Urgence** | 15 / 112, centre antipoison de Bordeaux, conduite à tenir. |

**Adresse de l'application :** https://elodie24000.github.io/champignon-comestible/ (hébergement gratuit GitHub Pages, branche `gh-pages`).

Tout est **gratuit**. Photos et positions exactes restent dans le téléphone.

### Recensement collectif (Supabase)

- Si la case « Participer au recensement » est cochée, l'application envoie la date, le verdict, les pistes d'espèces et une **position arrondie à ~1 km**. Hors réseau, l'envoi attend le retour de la connexion.
- Table `champi_observations` dans le projet Supabase **« CIDIL logistique »**, car le projet « Croc'Paysage commandes » refusait la connexion et l'offre gratuite est limitée à 2 projets. La table est indépendante du reste.
- **Sécurité :** n'importe qui peut déposer une observation, mais **personne ne peut relire les lignes**. La seule lecture publique est la fonction `champi_mailles()`, qui renvoie des totaux par mailles de 0,1° (~10 km) et par mois.
- Pour exporter les données brutes (recherche) : tableau de bord Supabase → Table Editor → `champi_observations` → Export CSV.

## Fichiers

- `index.html`, `style.css`, `app.js` : l'application
- `especes.js` : **la base d'espèces et les questions**. C'est le fichier à enrichir et à faire relire.
- `sw.js`, `manifest.webmanifest`, `icon.svg` : installation et fonctionnement hors connexion

- `vendor/leaflet/` : bibliothèque de carte (Leaflet 1.9.4, licence BSD), embarquée pour fonctionner sans CDN

Pour tester en local : `python3 -m http.server`, puis ouvrir http://localhost:8000.
Pour publier une mise à jour : pousser le contenu sur la branche `gh-pages`.

## Reconnaissance par photo (intelligence artificielle)

- **Modèle :** EfficientNet-B0 entraîné par les chercheurs du jeu de données *Danish Fungi 2020* (Picek et al., WACV 2022). Il reconnaît 1 604 espèces à partir d'environ 300 000 photos validées par des experts. Licence **CC BY-NC 4.0**, utilisable gratuitement mais pas pour un usage commercial.
- **Conversion :** `outils/convertir_modele.py`, exécuté par GitHub Actions (`.github/workflows/modele.yml`), télécharge le modèle, le convertit au format ONNX, vérifie que la copie donne les mêmes réponses que l'original, puis enregistre `modele/df20.onnx` (24 Mo) et `modele/df20.json` (liste des espèces).
- **Dans le téléphone :** `ia.js` exécute le modèle sur place avec onnxruntime-web (`vendor/ort/`, licence MIT). Le modèle est téléchargé une seule fois, puis fonctionne hors connexion.
- **Règles de sécurité :**
  - L'appli fait la moyenne sur toutes les photos exploitables.
  - Si la meilleure piste est sous **50 %** de certitude, elle répond « je ne peux pas me prononcer d'après la photo ».
  - Toute espèce toxique ou mortelle (ou tout genre mortel, comme *Amanita*) évoquée à **5 % ou plus** fait passer le verdict au rouge. L'IA peut aggraver un verdict, jamais l'adoucir.
- **Validation automatique** (photos Wikipédia) : amanite tue-mouches, girolle, coulemelle, polypore soufré et coprin chevelu ont été reconnus à 94-100 %. Le **cèpe a été manqué** (pris pour un plutée à 70 %, et un cortinaire à 30 %, ce qui aurait déclenché l'alerte rouge).
- **Couverture :** 29 des 32 espèces des fiches sont connues du modèle. Manquent l'oronge, le clitocybe de l'olivier et le cortinaire rocou, mais le genre *Cortinarius* déclenche quand même l'alerte.
- **Limites :** les espèces sont danoises, et l'IA se trompe davantage sur les espèces méridionales. Certaines confusions sont impossibles à lever sur photo : petites lépiotes, cortinaires, amanites blanches jeunes. L'IA ne fait que proposer des pistes.

## Prochaines étapes envisagées

1. Relecture de `especes.js` par une société mycologique ou un pharmacien, puis ajout d'espèces.
2. ~~Carnet partagé~~ (fait) : ajouter une protection anti-spam si l'appli est diffusée largement.
3. ~~Reconnaissance photo hors ligne~~ (fait) : l'évaluer sur de vraies photos du Périgord, et envisager un modèle plus précis.
4. Export vers iNaturalist / GBIF pour la recherche.
5. Ajout d'illustrations sous licence libre (Wikimedia Commons, avec crédits).
