"""Télécharge un modèle Danish Fungi 2020 (BVRA, Hugging Face), le convertit au format ONNX
lisible par un navigateur, vérifie que la copie donne les mêmes réponses, et écrit :
  modele/df20.onnx  — le modèle
  modele/df20.json  — réglages de l'image + liste des espèces
Exécuté par GitHub Actions (.github/workflows/modele.yml)."""
import json, os, sys
import io, urllib.request
import numpy as np, pandas as pd, torch, timm, onnxruntime as ort
from huggingface_hub import hf_hub_download, list_repo_files, HfApi

SOURCES_CSV = [
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/FungiCLEF2023_train_metadata_PRODUCTION.csv",
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/DF20_metadata_PROD.csv",
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/DF20-train_metadata_PROD-2.csv",
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/DF20-train_metadata_PROD.csv",
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/DF20-public_test_metadata_PROD-2.csv",
    "http://ptak.felk.cvut.cz/plants/DanishFungiDataset/DF20-public_test_metadata_PROD.csv",
]

def etiquettes_depuis_table(df, n):
    cols = {c.lower(): c for c in df.columns}
    cid = cols.get("class_id")
    nom = cols.get("scientificname") or cols.get("species")
    if not cid or not nom:
        print("  colonnes :", list(df.columns)[:40]); return None
    m = df[[cid, nom]].dropna().drop_duplicates().groupby(cid)[nom].first()
    if len(m) != n or m.index.min() != 0 or m.index.max() != n - 1:
        print("  table incomplète :", len(m), "classes"); return None
    return [str(m[i]) for i in range(n)]

def liens_readme():
    try:
        import re
        txt = urllib.request.urlopen("https://raw.githubusercontent.com/BohemianVRA/DanishFungiDataset/main/README.md", timeout=60).read().decode()
        liens = re.findall(r"https?://[^\s)\]\"']+?\.csv", txt)
        print("Liens CSV du README DF20 :", liens)
        # DF20 complet d'abord, jamais la version « Mini »
        return sorted([l for l in liens if "mini" not in l.lower()], key=lambda l: ("df20" not in l.lower(), "train" not in l.lower()))
    except Exception as e:
        print("README DF20 illisible :", e); return []

def trouver_etiquettes(n):
    for url in liens_readme() + SOURCES_CSV:
        try:
            print("Essai", url)
            data = urllib.request.urlopen(url, timeout=120).read()
            et = etiquettes_depuis_table(pd.read_csv(io.BytesIO(data), low_memory=False), n)
            if et: return et
        except Exception as e:
            print("  échec :", e)
    api = HfApi()
    for auteur in ("BVRA", "BohemianVRA"):
        try:
            for d in api.list_datasets(author=auteur):
                fichiers = list_repo_files(d.id, repo_type="dataset")
                print("Jeu de données", d.id, [f for f in fichiers if "meta" in f.lower()][:20])
                for f in fichiers:
                    fl = f.lower()
                    if "df20" in fl and "meta" in fl and fl.endswith((".csv", ".parquet")) and "mini" not in fl:
                        chemin = hf_hub_download(d.id, f, repo_type="dataset")
                        df = pd.read_parquet(chemin) if fl.endswith(".parquet") else pd.read_csv(chemin, low_memory=False)
                        et = etiquettes_depuis_table(df, n)
                        if et: print("  trouvé dans", d.id, f); return et
        except Exception as e:
            print("  échec HF", auteur, ":", e)
    return None

REPO = os.environ.get("MODELE", "BVRA/tf_efficientnet_b0.in1k_ft_df20_299")
os.makedirs("modele", exist_ok=True)
print("Fichiers du dépôt :", list_repo_files(REPO))
cfg = json.load(open(hf_hub_download(REPO, "config.json")))
print("config :", json.dumps({k: v for k, v in cfg.items() if k != "label_names"}, indent=1)[:4000])

model = timm.create_model("hf-hub:" + REPO, pretrained=True).eval()
pc = model.pretrained_cfg
taille = tuple(pc.get("input_size", (3, 299, 299)))
etiquettes = cfg.get("label_names") or pc.get("label_names")
if not etiquettes:
    print(open(hf_hub_download(REPO, "README.md")).read()[:3000])
    etiquettes = trouver_etiquettes(model.num_classes)
print("classes :", model.num_classes, "| étiquettes :", None if etiquettes is None else len(etiquettes),
      (etiquettes or [])[:5])

x = torch.randn(1, *taille)
torch.onnx.export(model, x, "modele/df20.onnx", input_names=["image"], output_names=["logits"],
                  opset_version=17, dynamo=False)
with torch.no_grad():
    ref = model(x).numpy()
y = ort.InferenceSession("modele/df20.onnx").run(None, {"image": x.numpy()})[0]
ecart = float(np.abs(y - ref).max())
print("Écart max original/converti :", ecart, "| même top-1 :", int(y.argmax()) == int(ref.argmax()))
if ecart > 1e-2:
    sys.exit("Conversion infidèle")

VALIDATION = ["Amanita_muscaria", "Boletus_edulis", "Cantharellus_cibarius", "Macrolepiota_procera",
              "Trametes_versicolor", "Laetiporus_sulphureus", "Coprinus_comatus", "Amanita_phalloides"]

def valider(etiquettes, taille):
    from PIL import Image
    S = taille[-1]; bons = 0
    for titre in VALIDATION:
        try:
            req = urllib.request.Request("https://en.wikipedia.org/api/rest_v1/page/summary/" + titre,
                                         headers={"User-Agent": "ChampiVerif/1.0 (validation modele; github.com/elodie24000)"})
            src = json.load(urllib.request.urlopen(req, timeout=60))["originalimage"]["source"]
            req = urllib.request.Request(src, headers={"User-Agent": "ChampiVerif/1.0"})
            img = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert("RGB").resize((S, S), Image.BILINEAR)
            x = (np.asarray(img, dtype=np.float32) / 255 - 0.5) / 0.5
            with torch.no_grad():
                p = torch.softmax(model(torch.from_numpy(x.transpose(2, 0, 1)[None].copy())), 1)[0].numpy()
            top = [(etiquettes[i], round(float(p[i]), 2)) for i in p.argsort()[::-1][:3]]
            ok = " ".join(top[0][0].split()[:2]).lower() == titre.replace("_", " ").lower()
            bons += ok
            print(("OK  " if ok else "NON ") + titre, top)
        except Exception as e:
            print("?   " + titre, e)
    print("Validation :", bons, "/", len(VALIDATION))
    return bons

if not etiquettes or len(etiquettes) != model.num_classes:
    sys.exit("Liste des espèces absente ou incomplète : à récupérer autrement")
if valider(etiquettes, taille) < 5:
    sys.exit("La liste des espèces ne correspond pas au modèle : rien n'est enregistré")

json.dump({
    "source": REPO, "licence": "CC BY-NC 4.0 — Picek et al., Danish Fungi 2020 (WACV 2022)",
    "taille": list(taille[1:]), "moyenne": [0.5, 0.5, 0.5], "ecart_type": [0.5, 0.5, 0.5],
    "recadrage": "etirer",
    "especes": etiquettes,
}, open("modele/df20.json", "w"), ensure_ascii=False)
print("Taille du modèle :", round(os.path.getsize("modele/df20.onnx") / 1e6, 1), "Mo")
