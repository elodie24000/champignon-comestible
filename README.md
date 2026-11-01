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
| 📖 **Fiches** | 29 espèces du Périgord, dont 14 comestibles, 9 toxiques et 6 mortelles ou groupes mortels, avec critères, saison et « ne pas confondre avec ». |
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

## Reconnaissance par photo : où en est-on ?

La v1 **n'identifie pas l'espèce à partir de la photo**. Elle contrôle seulement la qualité de l'image. L'identification se fait par les questions, ce qui est plus sûr pour un premier prototype. Les pistes pour ajouter une IA de reconnaissance :

| Source | Gratuit ? | Remarques |
|---|---|---|
| **Danish Fungi 2020 / FungiTastic** (jeux de données ouverts de l'Atlas danois des champignons, environ 300 000 photos validées par des experts) | Oui, données et modèles publiés pour la recherche | Peut tourner **dans le téléphone, hors ligne**. Espèces d'Europe du Nord, en bonne partie communes avec la France. C'est la meilleure piste gratuite, mais elle demande du travail d'intégration. |
| **iNaturalist** | L'API de reconnaissance n'est pas ouverte librement | On peut en revanche publier les observations sur iNaturalist pour obtenir une validation **par la communauté**, ce qui est gratuit. |
| API commerciales (ex. mushroom.id / Kindwise) | Payant après un quota d'essai | Simple à brancher. |

Quelle que soit la source, une photo **ne permet pas** de distinguer certaines espèces : petites lépiotes, cortinaires, jeunes amanites blanches, base de pied cachée. L'IA ne peut donc que **proposer des pistes**. Les questions et la règle « le danger d'abord » restent indispensables.

## Prochaines étapes envisagées

1. Relecture de `especes.js` par une société mycologique ou un pharmacien, puis ajout d'espèces.
2. ~~Carnet partagé~~ (fait) : ajouter une protection anti-spam si l'appli est diffusée largement.
3. Modèle de reconnaissance photo hors ligne (DF20), affiché comme simple suggestion.
4. Export vers iNaturalist / GBIF pour la recherche.
5. Ajout d'illustrations sous licence libre (Wikimedia Commons, avec crédits).
