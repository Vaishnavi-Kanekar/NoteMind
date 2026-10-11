# backend/accounts/preprocessing_file/ocr_handwritten.py
"""
Handwritten Notes OCR Pipeline
────────────────────────────────
1. Preprocess image (grayscale + adaptive threshold)
2. Run Tesseract OCR (eng model)
3. Run Tesseract again with handwriting model if available
4. Send both outputs to Groq LLaMA for correction
5. Return corrected text (or best single-pass text if Groq unavailable)
"""

import os
import cv2
import numpy as np
import pytesseract
from groq import Groq


# ── Groq client (reads GROQ_API_KEY from environment) ─────────────────────
# Set in your shell:  export GROQ_API_KEY="gsk_..."
# Or add to your Django settings and read via os.environ
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GROQ_API_KEY not set. "
                "Run: export GROQ_API_KEY='your_key_here'"
            )
        _groq_client = Groq(api_key=api_key)
    return _groq_client


# ── Step 1: Image preprocessing ───────────────────────────────────────────
def _preprocess_image(image_path: str) -> np.ndarray:
    """
    Load image from disk and apply:
      - Grayscale conversion
      - Adaptive Gaussian threshold (handles uneven phone-photo lighting)
    Returns a binary numpy array ready for Tesseract.
    Raises FileNotFoundError if the path is wrong.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Could not load image: {image_path}")

    gray   = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=10
    )
    return binary


# ── Step 2 & 3: Tesseract OCR ─────────────────────────────────────────────
def _run_tesseract(image: np.ndarray, lang: str = "eng") -> str:
    """
    Run Tesseract on a preprocessed image.
    Uses PSM 6 (assume uniform block of text) + LSTM engine.
    Returns plain text string.
    """
    from pytesseract import Output

    data = pytesseract.image_to_data(
        image,
        lang=lang,
        config="--psm 6 --oem 1",
        output_type=Output.DICT,
    )

    lines      = {}
    line_order = []

    for i, word in enumerate(data["text"]):
        word = word.strip()
        if not word or int(data["conf"][i]) < 0:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        if key not in lines:
            lines[key] = []
            line_order.append(key)
        lines[key].append(word)

    return "\n".join(" ".join(lines[k]) for k in line_order)


# ── Step 4: Groq LLaMA correction ─────────────────────────────────────────
def _correct_with_groq(text1: str, text2: str) -> str:
    """
    Send both OCR outputs to Groq LLaMA-3.3-70b.
    Returns the corrected, cleaned text.
    """
    client = _get_groq_client()

    prompt = f"""
You are given two OCR outputs of the same handwritten notes.

Your task is to correct the text using both inputs.

Instructions:
- Fix only spelling and OCR errors
- Correct broken words and merged words
- Use context to choose the correct word
- Prefer the more meaningful word between the two inputs

STRICT:
- Do NOT change sentence structure
- Do NOT rewrite sentences
- Do NOT add or remove content
- Keep line breaks exactly as they are
- Preserve headings and formatting

Return only the corrected text. No explanations.

OCR 1:
{text1}

OCR 2:
{text2}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )

    return response.choices[0].message.content.strip()


# ── Public function called from views.py ──────────────────────────────────
def extract_handwritten_text(image_path: str) -> str:
    """
    Full handwritten OCR pipeline:
      1. Preprocess image
      2. OCR with eng model
      3. OCR with handwriting model (if installed)
      4. Groq LLaMA correction (if handwriting model available + GROQ_API_KEY set)
      5. Return best available text

    Args:
        image_path: Absolute path to the uploaded image file.

    Returns:
        Corrected plain text string.

    Raises:
        FileNotFoundError : image path is wrong
        EnvironmentError  : GROQ_API_KEY not set (only if handwriting model found)
        Exception         : any Tesseract / Groq failure
    """
    # Step 1 — preprocess
    processed_image = _preprocess_image(image_path)

    # Step 2 — standard English OCR pass
    text_eng = _run_tesseract(processed_image, lang="eng")

    # Step 3 — check if custom handwriting model is installed
    available_langs = pytesseract.get_languages()

    if "handwriting" in available_langs:
        # Second OCR pass with handwriting-tuned model
        text_hw = _run_tesseract(processed_image, lang="handwriting")

        # Step 4 — Groq correction using both passes
        corrected_text = _correct_with_groq(text_eng, text_hw)
        return corrected_text

    # Fallback: only eng pass available, no Groq correction
    # Still return the single-pass result so the pipeline doesn't break
    return text_eng