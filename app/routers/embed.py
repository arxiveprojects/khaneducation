import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Chapter

router = APIRouter(tags=["Embed"])


@router.get("/embed/chapters/{chapter_id}", response_class=HTMLResponse)
def embed_chapter(chapter_id: str, db: Session = Depends(get_db)):
    chapter = db.get(Chapter, chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    pages = f"{chapter.page_start or '?'}–{chapter.page_end or '?'}"
    explanation = (
        f"{chapter.title} is explained from the uploaded book on pages {pages}. "
        "This isolated chapter document never loads the host application stylesheet."
    )
    explanation_js = json.dumps(explanation)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{chapter.title}</title>
  <style>
    :root {{ color-scheme: light; }}
    body {{ margin: 0; font-family: Georgia, "Times New Roman", serif; background: #f7f1e3; color: #1d1a14; }}
    main {{ max-width: 860px; margin: 0 auto; padding: 32px 24px 80px; }}
    h1 {{ font-size: 32px; margin: 0 0 8px; }}
    .cite {{ color: #6b5e45; font-size: 14px; margin-bottom: 24px; }}
    .viz {{ border: 2px solid #1d1a14; background: #fffdf6; padding: 20px; margin: 24px 0; }}
    .bar {{ height: 16px; background: #c46a2d; width: 64%; }}
    .tip {{ display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; }}
    button {{ width: 28px; height: 28px; border-radius: 50%; border: 1px solid #1d1a14; background: #fff; cursor: pointer; }}
    .hidden {{ display: none; margin-top: 12px; padding: 12px; background: #efe6d0; }}
    .hidden.open {{ display: block; }}
  </style>
</head>
<body>
  <main>
    <h1>{chapter.title}</h1>
    <p class="cite">Source: uploaded book, pages {pages}</p>
    <section class="viz">
      <p>Concept visualization (placeholder until slidegen returns the generated bundle).</p>
      <div class="bar"></div>
      <div class="tip">
        <button type="button" id="tip-btn" aria-label="Deeper explanation">i</button>
        <span>Hear a cited explanation</span>
      </div>
      <div id="tip-text" class="hidden">{explanation}</div>
    </section>
  </main>
  <script>
    const payload = {{
      type: "voice.read",
      text: {explanation_js},
      citation: {{ page: {chapter.page_start or 1}, paragraph_id: "p1" }}
    }};
    document.getElementById("tip-btn").addEventListener("click", () => {{
      document.getElementById("tip-text").classList.toggle("open");
      window.parent.postMessage(payload, "*");
    }});
    window.parent.postMessage({{ type: "progress", chapterId: "{chapter.id}" }}, "*");
  </script>
</body>
</html>"""
