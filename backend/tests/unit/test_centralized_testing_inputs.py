"""
Unit tests validating the Centralized Testing Inputs infrastructure.
Verifies:
1. Manifest integrity (all entries in test_manifest.json exist on disk and match SHA-256).
2. Input loadability across modalities (spiral, voice, mri, telemonitor, eeg).
3. Negative input rejections (corrupted image, corrupted audio, zero-byte file).
"""

import json
import hashlib
from pathlib import Path
import pytest
from PIL import Image
from scipy.io import wavfile
import pandas as pd

from app.core.config import settings, PROJECT_ROOT

TESTING_DIR = Path(settings.TESTING_DIR)
INPUTS_DIR = Path(settings.TESTING_INPUTS_DIR)
MANIFEST_PATH = TESTING_DIR / "test_manifest.json"


def test_manifest_file_exists_and_valid():
    assert MANIFEST_PATH.exists(), "test_manifest.json must exist in testing/"
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert "inputs" in manifest
    assert len(manifest["inputs"]) >= 10


def test_all_manifest_inputs_exist_and_match_hash():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    for item in manifest["inputs"]:
        rel_path = item["relative_path"]
        file_path = Path(PROJECT_ROOT) / rel_path
        assert file_path.exists(), f"Input file missing on disk: {rel_path}"
        assert file_path.stat().st_size == item["file_size"], f"Size mismatch for {rel_path}"

        with open(file_path, "rb") as f:
            actual_sha = hashlib.sha256(f.read()).hexdigest()
        assert actual_sha == item["sha256"], f"SHA-256 mismatch for {rel_path}"


def test_spiral_inputs_loadable_as_images():
    spiral_pd = INPUTS_DIR / "spiral" / "spiral_parkinson.png"
    spiral_norm = INPUTS_DIR / "spiral" / "spiral_control.png"

    with Image.open(spiral_pd) as img:
        assert img.size[0] > 0 and img.size[1] > 0

    with Image.open(spiral_norm) as img:
        assert img.size[0] > 0 and img.size[1] > 0


def test_mri_input_loadable_as_image():
    mri_file = INPUTS_DIR / "mri" / "mri_axial.png"
    with Image.open(mri_file) as img:
        assert img.size[0] > 0 and img.size[1] > 0


def test_voice_wav_loadable_as_audio():
    voice_wav = INPUTS_DIR / "voice" / "voice_sample.wav"
    samplerate, data = wavfile.read(str(voice_wav))
    assert samplerate > 0
    assert len(data) > 0


def test_voice_features_loadable_as_csv():
    voice_csv = INPUTS_DIR / "voice" / "voice_features.csv"
    df = pd.read_csv(voice_csv)
    assert not df.empty
    assert len(df.columns) >= 16


def test_telemonitor_features_loadable_as_csv():
    tele_csv = INPUTS_DIR / "telemonitor" / "telemonitor_features.csv"
    df = pd.read_csv(tele_csv)
    assert not df.empty
    assert len(df.columns) >= 16


def test_eeg_signals_loadable_as_csv():
    for name in ["eeg_parkinson.csv", "eeg_control.csv", "eeg_alzheimer.csv"]:
        eeg_csv = INPUTS_DIR / "eeg" / name
        assert eeg_csv.exists()
        df = pd.read_csv(eeg_csv)
        assert not df.empty


def test_corrupted_image_rejected_by_pil():
    corrupted_img = INPUTS_DIR / "corrupted" / "corrupted_image.png"
    assert corrupted_img.exists()
    with pytest.raises(Exception):
        with Image.open(corrupted_img) as img:
            img.verify()


def test_corrupted_audio_rejected_by_wavfile():
    corrupted_audio = INPUTS_DIR / "corrupted" / "corrupted_audio.wav"
    assert corrupted_audio.exists()
    with pytest.raises(Exception):
        wavfile.read(str(corrupted_audio))


def test_empty_file_rejected_as_zero_bytes():
    empty_file = INPUTS_DIR / "corrupted" / "empty_file.bin"
    assert empty_file.exists()
    assert empty_file.stat().st_size == 0
