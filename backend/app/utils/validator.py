import os
from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.wav', '.csv'}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

def validate_uploaded_file(file: UploadFile):
    """
    Validate the file extension and verify it does not exceed the size limit.
    """
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPG, JPEG, WAV, CSV."
        )
        
    # Read size
    try:
        # Check size by seeking to the end
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{filename}' exceeds maximum allowed size of 20MB."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating file size: {e}"
        )
