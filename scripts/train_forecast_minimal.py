from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

import numpy as np
import onnx
import onnxruntime as ort
from onnxruntime.quantization import QuantType, quantize_dynamic
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_percentage_error
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "apps" / "web" / "public" / "models"
DOCS_DIR = ROOT / "docs" / "modeling"
CONFIG_DIR = ROOT / "apps" / "web" / "src" / "config"

MODEL_VER = "min-0-1-0"
MODEL_NAME = "forecast_minimal"
WINDOW = 64  
TAIL_SIZE = 128  # how many points we keep from orchestrator tail
HORIZON = 24
FEATURE_NAMES: List[str] = [
    "last_close",
    "mean_5",
    "mean_20",
    "std_20",
    "momentum_3",
    "momentum_8",
    "ema_5",
    "ema_10",
    "ret_mean_5",
    "ret_std_20",
]
EPS = 1e-6


def generate_synthetic_series(
    steps: int = 6000, start: float = 120.0, seed: int = 7
) -> np.ndarray:
    rng = np.random.default_rng(seed)
    closes = [start]
    for t in range(1, steps):
        drift = 0.04 * np.sin(t / 25) + 0.004 * (t / steps)
        shock = rng.normal(scale=0.6)
        closes.append(closes[-1] + drift + shock)
    return np.asarray(closes, dtype=np.float32)


def _ema(arr: np.ndarray, span: int) -> float:
    alpha = 2.0 / (span + 1.0)
    ema = arr[0]
    for v in arr[1:]:
        ema = alpha * v + (1 - alpha) * ema
    return float(ema)


def featurize(window: Sequence[float]) -> np.ndarray:
    w = np.asarray(window, dtype=np.float32)
    returns = np.diff(w) / w[:-1]
    feats: List[float] = []
    feats.append(float(w[-1]))
    feats.append(float(np.mean(w[-5:])))
    feats.append(float(np.mean(w[-20:])))
    feats.append(float(np.std(w[-20:])))
    feats.append(float(w[-1] - w[-3]))
    feats.append(float(w[-1] - w[-8]))
    feats.append(_ema(w[-5:], span=5))
    feats.append(_ema(w[-10:], span=10))
    feats.append(float(np.mean(returns[-5:])))
    feats.append(float(np.std(returns[-20:])))
    return np.asarray(feats, dtype=np.float32)


@dataclass
class Dataset:
    X: np.ndarray
    y_delta: np.ndarray
    last_closes: np.ndarray
    tails: List[np.ndarray]


def build_dataset(series: np.ndarray) -> Dataset:
    X: List[np.ndarray] = []
    y_delta: List[np.ndarray] = []
    last_closes: List[float] = []
    tails: List[np.ndarray] = []
    for idx in range(WINDOW, len(series) - HORIZON):
        window = series[idx - WINDOW : idx]
        target = series[idx : idx + HORIZON]
        last_close = window[-1]
        features = featurize(window)
        delta = target - last_close

        tail_start = max(0, idx - TAIL_SIZE)
        tail_slice = series[tail_start:idx]

        X.append(features)
        y_delta.append(delta)
        last_closes.append(last_close)
        tails.append(tail_slice.copy())

    return Dataset(
        X=np.stack(X),
        y_delta=np.stack(y_delta),
        last_closes=np.asarray(last_closes, dtype=np.float32),
        tails=tails,
    )


def split_time_ordered(dataset: Dataset, train_ratio: float = 0.8) -> Tuple[Dataset, Dataset]:
    n = dataset.X.shape[0]
    split = int(n * train_ratio)
    train = Dataset(
        X=dataset.X[:split],
        y_delta=dataset.y_delta[:split],
        last_closes=dataset.last_closes[:split],
        tails=dataset.tails[:split],
    )
    val = Dataset(
        X=dataset.X[split:],
        y_delta=dataset.y_delta[split:],
        last_closes=dataset.last_closes[split:],
        tails=dataset.tails[split:],
    )
    return train, val


def zscore_normalize(X: np.ndarray, mean: np.ndarray, std: np.ndarray) -> np.ndarray:
    return (X - mean) / (std + EPS)


def export_onnx(model: LinearRegression, feature_count: int, dest: Path) -> None:
    initial_type = [("input", FloatTensorType([1, feature_count]))]
    onnx_model = convert_sklearn(
        model,
        initial_types=initial_type,
        target_opset=17,
        final_types=[("delta", FloatTensorType([1, HORIZON]))],
    )
    onnx.checker.check_model(onnx_model)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        f.write(onnx_model.SerializeToString())


def sha256sum(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def save_sha256(path: Path) -> str:
    digest = sha256sum(path)
    with open(path.with_suffix(path.suffix + ".sha256"), "w", encoding="utf-8") as f:
        f.write(digest)
    return digest


def to_tail_with_ts(tail: np.ndarray, start_ts: int, step_ms: int) -> List[List[float]]:
    # align the last point of tail to start_ts - step_ms
    first_ts = start_ts - len(tail) * step_ms
    return [[first_ts + i * step_ms, float(v)] for i, v in enumerate(tail)]


def build_test_vectors(
    session: ort.InferenceSession,
    mean: np.ndarray,
    std: np.ndarray,
    tails: Iterable[np.ndarray],
    last_closes: Iterable[float],
    count: int = 2,
) -> List[dict]:
    vectors = []
    start_ts = 1_700_000_000_000  
    step_ms = 60 * 60 * 1000  # 1h
    for idx, (tail, last_close) in enumerate(zip(tails, last_closes)):
        if idx >= count:
            break
        feats = featurize(tail[-WINDOW:])
        feats_norm = zscore_normalize(feats, mean, std).astype(np.float32)
        inp = feats_norm.reshape(1, -1)
        res = session.run(None, {"input": inp})[0].astype(np.float32).flatten()
        p50 = (res + last_close).tolist()
        vectors.append(
            {
                "id": f"case-{idx+1}",
                "tail": to_tail_with_ts(tail, start_ts, step_ms),
                "expected": {
                    "delta": res.tolist(),
                    "p50": p50,
                },
                "rtol": 1e-3,
                "atol": 1e-4,
            }
        )
        start_ts += step_ms * HORIZON
    return vectors


def main() -> None:
    print("Building synthetic dataset...")
    series = generate_synthetic_series()
    dataset = build_dataset(series)
    train, val = split_time_ordered(dataset)

    mean = np.mean(train.X, axis=0)
    std = np.std(train.X, axis=0)

    X_train = zscore_normalize(train.X, mean, std)
    X_val = zscore_normalize(val.X, mean, std)

    model = LinearRegression()
    model.fit(X_train, train.y_delta)

    val_pred = model.predict(X_val)
    val_close_pred = val_pred + val.last_closes.reshape(-1, 1)
    val_close_true = val.y_delta + val.last_closes.reshape(-1, 1)
    mape = mean_absolute_percentage_error(val_close_true, val_close_pred)
    print(f"Validation MAPE: {mape:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    onnx_path = MODEL_DIR / f"{MODEL_NAME}.onnx"
    print(f"Exporting ONNX to {onnx_path} ...")
    export_onnx(model, train.X.shape[1], onnx_path)
    onnx_digest = save_sha256(onnx_path)
    print(f"ONNX sha256: {onnx_digest}")

    quant_path = MODEL_DIR / f"{MODEL_NAME}.quant.onnx"
    print("Running dynamic quantization ...")
    quantize_dynamic(
        model_input=onnx_path,
        model_output=quant_path,
        weight_type=QuantType.QInt8,
    )
    quant_digest = save_sha256(quant_path)
    print(f"Quantized sha256: {quant_digest}")

    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    test_vectors = build_test_vectors(
        sess, mean, std, val.tails, val.last_closes, count=2
    )

    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    tv_path = DOCS_DIR / "test_vectors.json"
    with open(tv_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "model_ver": MODEL_VER,
                "horizon": HORIZON,
                "window": WINDOW,
                "feature_count": len(FEATURE_NAMES),
                "rtol": 1e-3,
                "atol": 1e-4,
                "cases": test_vectors,
            },
            f,
            indent=2,
        )
    print(f"Wrote test vectors to {tv_path}")

    manifest = {
        "modelName": MODEL_NAME,
        "modelVer": MODEL_VER,
        "path": f"/models/{MODEL_NAME}.onnx",
        "quantPath": f"/models/{MODEL_NAME}.quant.onnx",
        "onnxSha256": onnx_digest,
        "quantSha256": quant_digest,
        "inputShape": [1, len(FEATURE_NAMES)],
        "horizonSteps": HORIZON,
        "featureWindow": WINDOW,
        "tailSize": TAIL_SIZE,
        "normalization": {
          "type": "zscore",
          "mean": mean.tolist(),
          "std": (std + EPS).tolist(),
          "epsilon": EPS,
        },
        "features": [{"name": n} for n in FEATURE_NAMES],
        "outputs": ["delta"],
        "postprocess": "last_close_plus_delta",
        "rtol": 1e-3,
        "atol": 1e-4,
        "val_metrics": {"mape": float(mape)},
    }

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    manifest_path = CONFIG_DIR / "ml.manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"Wrote manifest to {manifest_path}")


if __name__ == "__main__":
    main()
