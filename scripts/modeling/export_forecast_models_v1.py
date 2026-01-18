from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[2]
MPL_DIR = ROOT / ".mplconfig"
MPL_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPL_DIR))

import numpy as np
import onnx
import onnxruntime as ort
from catboost import CatBoostRegressor
from lightgbm import LGBMRegressor
from joblib import load
from onnxmltools.convert.lightgbm.operator_converters.LightGbm import (
    convert_lightgbm,
)
from onnxruntime.quantization import QuantType, quantize_dynamic
from skl2onnx import convert_sklearn, update_registered_converter
from skl2onnx.common.data_types import FloatTensorType
from skl2onnx.common.shape_calculator import (
    calculate_linear_regressor_output_shapes,
)

from feature_dataset import FEATURE_COLUMNS

MODEL_DIR = ROOT / "apps" / "web" / "public" / "models"
DOCS_DIR = ROOT / "docs" / "modeling"

FEATURE_WINDOW = 64
TAIL_SIZE = 128
HORIZON = 24
EPS = 1e-6


def _ema(values: List[float], span: int) -> float:
    alpha = 2 / (span + 1)
    ema = values[0]
    for v in values[1:]:
        ema = alpha * v + (1 - alpha) * ema
    return ema


def _build_features(closes: List[float]) -> List[float]:
    returns: List[float] = []
    for i in range(1, len(closes)):
        prev = closes[i - 1]
        curr = closes[i]
        returns.append(0.0 if prev == 0 else (curr - prev) / prev)

    feats: List[float] = []
    feats.append(closes[-1])
    feats.append(sum(closes[-5:]) / 5)
    feats.append(sum(closes[-20:]) / 20)
    mean20 = sum(closes[-20:]) / 20
    var20 = sum((v - mean20) ** 2 for v in closes[-20:]) / 20
    feats.append(var20 ** 0.5)
    feats.append(closes[-1] - closes[-3])
    feats.append(closes[-1] - closes[-8])
    feats.append(_ema(closes[-5:], 5))
    feats.append(_ema(closes[-10:], 10))
    feats.append(sum(returns[-5:]) / 5)
    mean_ret20 = sum(returns[-20:]) / 20
    var_ret20 = sum((v - mean_ret20) ** 2 for v in returns[-20:]) / 20
    feats.append(var_ret20 ** 0.5)
    return feats


def _normalize(features: List[float], mean: List[float], std: List[float]) -> np.ndarray:
    normed = [
        (val - mean[idx]) / (std[idx] + EPS) for idx, val in enumerate(features)
    ]
    return np.asarray(normed, dtype=np.float32)


def _load_bars(path: Path) -> List[List[float]]:
    return json.loads(path.read_text())


def _pick_tails(bars: List[List[float]], count: int = 2) -> List[List[List[float]]]:
    if len(bars) < TAIL_SIZE + FEATURE_WINDOW + HORIZON:
        raise ValueError("Not enough bars to build test vectors.")
    step = max(1, (len(bars) - TAIL_SIZE - HORIZON) // count)
    tails: List[List[List[float]]] = []
    for i in range(count):
        end = TAIL_SIZE + i * step
        tail = bars[end - TAIL_SIZE : end]
        tails.append(tail)
    return tails


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _write_sha(path: Path) -> str:
    digest = _sha256(path)
    path.with_suffix(path.suffix + ".sha256").write_text(digest)
    return digest


def export_lgbm(model_path: Path, out_path: Path) -> None:
    model = load(model_path)
    update_registered_converter(
        LGBMRegressor,
        "LgbmRegressor",
        calculate_linear_regressor_output_shapes,
        convert_lightgbm,
    )
    onnx_model = convert_sklearn(
        model,
        initial_types=[("input", FloatTensorType([1, len(FEATURE_COLUMNS)]))],
        target_opset={"": 17, "ai.onnx.ml": 3},
        final_types=[("delta", FloatTensorType([1, HORIZON]))],
    )
    onnx.checker.check_model(onnx_model)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(onnx_model.SerializeToString())


def maybe_quantize(path: Path) -> Path | None:
    if not path.exists():
        return None
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb <= 5:
        return None
    quant_path = path.with_name(path.stem + ".quant.onnx")
    quantize_dynamic(
        model_input=path.as_posix(),
        model_output=quant_path.as_posix(),
        weight_type=QuantType.QInt8,
    )
    _write_sha(quant_path)
    return quant_path


def export_catboost(model_path: Path, out_path: Path) -> None:
    model = CatBoostRegressor()
    model.load_model(model_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    model.save_model(out_path, format="onnx", export_parameters={"onnx_opset_version": 17})


def build_test_vectors(
    session: ort.InferenceSession,
    mean: List[float],
    std: List[float],
    tails: List[List[List[float]]],
    model_ver: str,
) -> Dict[str, object]:
    cases = []
    for idx, tail in enumerate(tails):
        closes = [float(p[1]) for p in tail]
        features = _build_features(closes[-FEATURE_WINDOW:])
        features = _normalize(features, mean, std)
        inp = features.reshape(1, -1)
        output = session.run(None, {"input": inp})[0].astype(np.float32).flatten()
        last_close = closes[-1]
        p50 = (output + last_close).tolist()
        cases.append(
            {
                "id": f"case-{idx+1}",
                "tail": [[int(p[0]), float(p[1])] for p in tail],
                "expected": {"delta": output.tolist(), "p50": p50},
                "rtol": 1e-3,
                "atol": 1e-4,
            }
        )

    return {
        "model_ver": model_ver,
        "horizon": HORIZON,
        "window": FEATURE_WINDOW,
        "feature_count": len(FEATURE_COLUMNS),
        "rtol": 1e-3,
        "atol": 1e-4,
        "cases": cases,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export LGBM/CatBoost to ONNX.")
    parser.add_argument("--data-bars", default="data/normalized/binance/BTCUSDT_1h.json")
    parser.add_argument("--lgbm-model", default="data/models/v1/lgbm/forecast_lgbm_v1.joblib")
    parser.add_argument("--cat-model", default="data/models/v1/catboost/forecast_catboost_v1.cbm")
    parser.add_argument("--lgbm-ver", default="lgbm-0-1-0")
    parser.add_argument("--cat-ver", default="cat-0-1-0")
    parser.add_argument("--lgbm-meta", default="data/models/v1/lgbm/forecast_lgbm_v1.meta.json")
    parser.add_argument("--cat-meta", default="data/models/v1/catboost/forecast_catboost_v1.meta.json")
    args = parser.parse_args()

    bars = _load_bars(Path(args.data_bars))
    tails = _pick_tails(bars, count=2)

    lgbm_meta = json.loads(Path(args.lgbm_meta).read_text())
    cat_meta = json.loads(Path(args.cat_meta).read_text())

    lgbm_out = MODEL_DIR / "forecast_lgbm_v1.onnx"
    export_lgbm(Path(args.lgbm_model), lgbm_out)
    _write_sha(lgbm_out)

    cat_out = MODEL_DIR / "forecast_catboost_v1.onnx"
    cat_exported = False
    try:
        export_catboost(Path(args.cat_model), cat_out)
        _write_sha(cat_out)
        cat_exported = True
    except Exception as exc:
        if cat_out.exists():
            cat_out.unlink()
        cat_sha = cat_out.with_suffix(cat_out.suffix + ".sha256")
        if cat_sha.exists():
            cat_sha.unlink()
        print(f"[export] CatBoost ONNX failed: {exc}")

    lgbm_sess = ort.InferenceSession(lgbm_out.as_posix(), providers=["CPUExecutionProvider"])
    maybe_quantize(lgbm_out)

    lgbm_tv = build_test_vectors(
        lgbm_sess,
        lgbm_meta["normalization"]["mean"],
        lgbm_meta["normalization"]["std"],
        tails,
        args.lgbm_ver,
    )
    cat_tv = None
    if cat_exported:
        try:
            cat_sess = ort.InferenceSession(
                cat_out.as_posix(), providers=["CPUExecutionProvider"]
            )
            cat_tv = build_test_vectors(
                cat_sess,
                cat_meta["normalization"]["mean"],
                cat_meta["normalization"]["std"],
                tails,
                args.cat_ver,
            )
        except Exception as exc:
            print(f"[export] CatBoost ONNX validation failed: {exc}")
            cat_exported = False
            if cat_out.exists():
                cat_out.unlink()
            cat_sha = cat_out.with_suffix(cat_out.suffix + ".sha256")
            if cat_sha.exists():
                cat_sha.unlink()

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "test_vectors_lgbm.json").write_text(
        json.dumps(lgbm_tv, ensure_ascii=True, indent=2)
    )
    if cat_tv:
        (DOCS_DIR / "test_vectors_catboost.json").write_text(
            json.dumps(cat_tv, ensure_ascii=True, indent=2)
        )

    print(f"[export] LGBM -> {lgbm_out}")
    if cat_exported:
        print(f"[export] CatBoost -> {cat_out}")


if __name__ == "__main__":
    main()
