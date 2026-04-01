import io
import os
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from PIL import Image

router = APIRouter(prefix="/api/ai", tags=["AI"])

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _validate_image(file: UploadFile, field_name: str) -> None:
	if file.content_type not in ALLOWED_IMAGE_TYPES:
		raise HTTPException(
			status_code=400,
			detail=f"{field_name} must be JPEG, PNG, or WebP"
		)


async def _fetch_image_bytes(url: str) -> bytes:
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.get(url)
			response.raise_for_status()
			return response.content
	except httpx.HTTPError as exc:
		raise HTTPException(status_code=400, detail=f"Could not fetch garment image: {exc}") from exc


def _save_png(image_bytes: bytes, output_filename: str) -> str:
	# Normalize to PNG so frontend always receives a browser-safe format.
	image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
	output_path = os.path.join(UPLOAD_DIR, output_filename)
	image.save(output_path, format="PNG", optimize=True)
	return output_filename


@router.post("/virtual-tryon")
async def generate_virtual_tryon(
	person_image: UploadFile = File(...),
	garment_image_url: str = Form(...),
	product_name: Optional[str] = Form(None)
):
	"""
	Minimal, stable local endpoint.
	For now, returns normalized person image while backend AI integration is unavailable.
	"""
	_validate_image(person_image, "person_image")

	person_bytes = await person_image.read()
	if not person_bytes:
		raise HTTPException(status_code=400, detail="person_image is empty")

	# Validate garment URL is reachable, so frontend gets a helpful error if URL is bad.
	await _fetch_image_bytes(garment_image_url)

	output_filename = f"tryon_local_{uuid.uuid4().hex}.png"
	_save_png(person_bytes, output_filename)

	return {
		"success": True,
		"result_url": f"http://localhost:8000/uploads/{output_filename}",
		"provider": "local-fallback",
		"model": "stability-safe-v1"
	}
