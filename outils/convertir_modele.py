"""Télécharge un modèle Danish Fungi 2020 (BVRA, Hugging Face), le convertit au format ONNX
lisible par un navigateur, vérifie que la copie donne les mêmes réponses, et écrit :
  modele/df20.onnx  — le modèle
  modele/df20.json  — réglages de l'image + liste des espèces
Exécuté par GitHub Actions (.github/workflows/modele.yml)."""
import json, os, sys
import numpy as np, torch, timm, onnxruntime as ort
from huggingface_hub import hf_hub_download, list_repo_files

REPO = os.environ.get("MODELE", "BVRA/tf_efficientnet_b0.in1k_ft_df20_299")
os.makedirs("modele", exist_ok=True)
print("Fichiers du dépôt :", list_repo_files(REPO))
cfg = json.load(open(hf_hub_download(REPO, "config.json")))
print("config :", json.dumps({k: v for k, v in cfg.items() if k != "label_names"}, indent=1)[:4000])

model = timm.create_model("hf-hub:" + REPO, pretrained=True).eval()
pc = model.pretrained_cfg
taille = tuple(pc.get("input_size", (3, 299, 299)))
etiquettes = cfg.get("label_names") or pc.get("label_names")
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
