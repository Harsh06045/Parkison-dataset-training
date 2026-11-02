@echo off
setlocal
echo ============================================================================
echo   NEUROFUSIONAI: AUTOMATED PATIENT ASSESSMENT AND REPORT PIPELINE
echo ============================================================================

set PYTHONPATH=backend
if "%~1"=="" (
    .venv\Scripts\python.exe scripts\test_patient.py --input-dir EXAMPLE_TEST
) else (
    .venv\Scripts\python.exe scripts\test_patient.py %*
)
