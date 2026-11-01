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

def trouver_etiquettes(n):
    for url in SOURCES_CSV:
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

json.dump({
    "source": REPO, "licence": "CC BY-NC 4.0 — Picek et al., Danish Fungi 2020 (WACV 2022)",
    "taille": list(taille[1:]), "moyenne": list(pc["mean"]), "ecart_type": list(pc["std"]),
    "crop_pct": pc.get("crop_pct"), "interpolation": pc.get("interpolation"),
    "especes": etiquettes,
}, open("modele/df20.json", "w"), ensure_ascii=False)
print("Taille du modèle :", round(os.path.getsize("modele/df20.onnx") / 1e6, 1), "Mo")
if not etiquettes or len(etiquettes) != model.num_classes:
    sys.exit("Liste des espèces absente ou incomplète : à récupérer autrement")
