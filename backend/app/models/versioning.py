"""
Model Versioning and Metadata Registry for Parkinson's Diagnostic Suite.
Tracks model architecture, checkpoint hash, training dataset, input dimension,
metrics, and deployment status.
"""

import os
import json
import hashlib
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
REGISTRY_FILE = os.path.join(PROJECT_ROOT, "outputs", "model_version_registry.json")


def compute_file_hash(filepath):
    """Compute SHA-256 checksum for a model checkpoint."""
    if not os.path.exists(filepath):
        return "NOT_FOUND"
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()[:16]


class ModelVersionRegistry:
    def __init__(self, registry_path=REGISTRY_FILE):
        self.registry_path = registry_path
        self.registry = self._load()

    def _load(self):
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "project": "Parkinson Diagnostic AI System",
            "schema_version": "2.0.0",
            "last_updated": datetime.now().isoformat(),
            "models": {}
        }

    def register_model(self, model_id, modality, architecture, checkpoint_path,
                       input_features, metrics, status="PRODUCTION"):
        """Register or update a model version record."""
        sha = compute_file_hash(checkpoint_path)
        size_bytes = os.path.getsize(checkpoint_path) if os.path.exists(checkpoint_path) else 0

        record = {
            "model_id": model_id,
            "modality": modality,
            "architecture": architecture,
            "checkpoint_path": os.path.relpath(checkpoint_path, PROJECT_ROOT).replace("\\", "/"),
            "checkpoint_sha256_short": sha,
            "checkpoint_size_kb": round(size_bytes / 1024, 2),
            "input_features": input_features,
            "evaluation_metrics": metrics,
            "deployment_status": status,
            "registered_at": datetime.now().isoformat()
        }

        self.registry["models"][model_id] = record
        self.registry["last_updated"] = datetime.now().isoformat()
        self.save()
        return record

    def save(self):
        os.makedirs(os.path.dirname(self.registry_path), exist_ok=True)
        with open(self.registry_path, "w", encoding="utf-8") as f:
            json.dump(self.registry, f, indent=2)

    def get_summary(self):
        return self.registry

