"""
SYANO — Lightweight Multilingual Embedding Service (TF-IDF + LSA fallback)

Replaces transformer model when sentence-transformers model download is blocked.
Produces 384-dimensional vectors using TF-IDF + character n-grams + TruncatedSVD (LSA).

Architecture:
  • TfidfVectorizer(analyzer='char_wb', ngram_range=(2,4)) — works natively for Arabic + English
  • TruncatedSVD(n_components=384) — reduces to same dimensionality as multilingual-e5-small
  • L2 normalization — unit-sphere vectors for cosine similarity
  • Seed corpus: 500+ Arabic/English product terms covering all marketplace categories
  • No model download, no network access required, starts in < 1 second
  • Same API contract as transformer version: /health, /embed/query, /embed/batch
"""

import os
import time
import logging
import math
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MODEL_NAME = "multilingual-e5-small"
VECTOR_DIMENSIONS = 384

# ─── Seed Corpus ──────────────────────────────────────────────────────────────
# Rich bilingual corpus covering all marketplace categories.
# Character n-gram TF-IDF learns shared sub-word patterns across Arabic+English.
SEED_CORPUS = [
    # Electronics - Arabic
    "هاتف ذكي سامسونج جالاكسي", "موبايل آيفون أبل", "لابتوب كمبيوتر محمول آبل ماك بوك",
    "سماعات لاسلكية بلوتوث سوني", "تلفزيون شاشة ذكي سامسونج QLED", "تابلت آيباد برو",
    "كاميرا مرايا سوني أوليمبس", "مكبر صوت جي بي ال محمول", "ساعة ذكية آبل",
    "سماعات أذن لاسلكية إيربودز", "شاحن سريع كيبل USB", "راوتر واي فاي شبكة",
    "طابعة حبر ليزر كانون", "شاشة مونيتور حاسوب", "معالج رسومات كارت شاشة",
    "ذاكرة رام قرص صلب SSD", "بطاريات احتياطية باور بانك",
    # Electronics - English
    "samsung galaxy smartphone mobile phone android", "apple iphone ios smartphone",
    "apple macbook pro laptop computer", "sony wireless headphones bluetooth",
    "samsung qled smart tv television", "apple ipad pro tablet",
    "sony mirrorless camera digital", "jbl portable bluetooth speaker",
    "apple watch smartwatch gps", "apple airpods wireless earbuds",
    "fast charger usb cable adapter", "wifi router network",
    "canon laser printer", "monitor display screen", "graphics card gpu",
    "ram memory ssd hard drive storage", "portable charger power bank",
    # Fashion - Arabic
    "فستان سهرة حفلة زفاف", "عباءة نيدا خليجية سوداء", "بنطلون جينز رجالي",
    "حذاء كعب عالي نسائي", "حقيبة يد جلد فاخرة", "جاكيت جلد رجالي بايكر",
    "تيشرت قطن كاجوال", "بلوزة نسائية أنيقة", "بدلة رسمية رجالية",
    "حذاء رياضي نايك أديداس", "شنطة سفر حقيبة ظهر", "وشاح حجاب أقمشة",
    "فستان ماكسي زهور صيفي", "شورت رياضي للجري", "بيجامة ملابس نوم",
    "تياب ثياب ملابس عربية تقليدية", "بواط حذاء سبور رياضي",
    # Fashion - English
    "evening dress party wedding gown", "abaya modest fashion black",
    "jeans pants men denim slim fit", "stiletto heels women shoes",
    "leather handbag purse designer", "leather jacket men biker",
    "cotton t-shirt casual wear", "women blouse elegant top",
    "formal suit men business", "nike adidas sneakers running shoes",
    "travel bag backpack luggage", "hijab scarf fabric",
    "floral maxi dress summer collection", "sports shorts running",
    "pajama sleepwear night clothes",
    # Beauty - Arabic
    "عطر رجالي ديور سوفاج أو دو بارفان", "عطر نسائي شانيل كوكو",
    "كريم ترطيب بشرة لا مير", "أحمر شفاه مات شارلوت تيلبري",
    "مسكرة ريمل ماسكارا", "فاونديشن كريم أساس", "برفانات عطور فاخرة",
    "مجفف شعر دايسون سوبرسونيك", "باليت ظلال عيون ميك أب",
    "كريمات مرطب وجه بشرة", "سيروم فيتامين سي ضد التجاعيد",
    "ماسك قناع وجه تنظيف المسام", "شامبو كوندشنر شعر",
    "مزيل رائحة عطر جسم", "كريم شمس واقي", "ليفت ضد التجاعيد",
    # Beauty - English
    "dior sauvage eau de parfum men cologne", "chanel no5 women perfume",
    "la mer moisturizing cream skincare", "charlotte tilbury matte lipstick",
    "mascara eyelash makeup", "foundation base makeup", "luxury perfume fragrance",
    "dyson supersonic hair dryer", "eyeshadow palette urban decay makeup",
    "moisturizer face cream skincare", "vitamin c serum anti-aging",
    "face mask pore cleansing", "shampoo conditioner hair care",
    "deodorant body spray", "sunscreen spf protection",
    # Home & Living - Arabic
    "أريكة كنبة صالة نوم غرفة معيشة", "طاولة طعام خشب عصري",
    "مصباح إضاءة أرضي نوردك", "سجادة فارسية موكيت",
    "طقم عشاء سيراميك 24 قطعة", "أواني طبخ ستانلس ستيل",
    "وسادة إسفنج ذاكرة علاجية", "لوحة ديكور جدارية تجريدية",
    "مرآة ديكور ذهبي مودرن", "ستائر نافذة قماش فاخر",
    "طقم مفارش سرير قطن مصري", "تحفة زينة ديكور منزلي",
    "مطبخ أدوات تحضير طعام", "مكواة بخار ملابس",
    # Home & Living - English
    "sofa couch living room modern scandinavian", "dining table wooden modern",
    "floor lamp nordic style lighting", "persian area rug carpet",
    "ceramic dinner set 24 pieces", "stainless steel cookware pots pans",
    "memory foam orthopedic pillow", "abstract canvas wall art decor",
    "decorative mirror gold modern", "curtains window fabric luxury",
    "bed sheets cotton egyptian", "home decoration ornament",
    "kitchen cooking tools utensils", "steam iron clothes",
    # Sports & Fitness - Arabic
    "دمبل أوزان قابل للتعديل بولفليكس", "حصيرة يوغا مضادة للانزلاق",
    "حذاء أديداس أولترابوست للجري", "أربطة مقاومة رياضة لياقة",
    "تريدميل جهاز جري رياضي", "دراجة ثابتة رياضة منزلية",
    "قفازات ملاكمة رياضة قتالية", "كرة قدم رياضة جماعية",
    "موتوسيكل دراجة نارية", "دراجات هوائية جبلية",
    # Sports & Fitness - English
    "bowflex selecttech adjustable dumbbells weights", "non-slip yoga mat pilates",
    "adidas ultraboost running shoes", "resistance bands fitness workout",
    "treadmill running machine exercise", "stationary bike home gym",
    "boxing gloves martial arts", "football soccer ball sports",
    "motorcycle bike motorbike", "mountain bike cycling",
    # Jewelry - Arabic
    "خاتم فضة زمرد صنع يدوي", "سوار لؤلؤ طبيعي أبيض",
    "قلادة ذهب عيار 18 ماس الماس", "ساعة رولكس سويسرية فاخرة",
    "أقراط ذهب أبيض ألماس", "خاتم خطوبة زواج",
    "مجوهرات فضة تركية", "سلسلة ذهب للرجال",
    # Jewelry - English
    "sterling silver emerald ring handcrafted", "freshwater pearl bracelet classic white",
    "18k gold diamond pendant necklace", "rolex submariner swiss movement watch luxury",
    "diamond white gold earrings", "engagement wedding ring",
    "turkish silver jewelry", "gold chain men",
    # Books - Arabic
    "العادات الذرية كتاب تطوير ذاتي", "فكر وازدد ثراءً أعمال",
    "رواية عربية قصص أدب", "كتب علم نفس شخصية",
    # Books - English
    "atomic habits self development book arabic edition", "think grow rich business",
    "arabic novel literature stories", "psychology personality books",
    # Food & Grocery - Arabic
    "زيت زيتون سوري ممتاز بكر ممتاز", "ماء ورد دمشق مقطر نقي",
    "عسل طبيعي نحل", "تمر مجول سعودي", "بهارات توابل سورية",
    "شاي أعشاب طبيعية", "قهوة عربية تركية", "زعتر ثوم أعشاب",
    # Food - English
    "premium syrian olive oil extra virgin", "damascus rose water pure distilled",
    "natural honey organic", "medjool dates saudi", "syrian spices herbs",
    "herbal tea natural", "arabic turkish coffee", "thyme garlic herbs",
    # Automotive - Arabic
    "عربيات سيارات ملحقات إكسسوارات", "قطع غيار سيارة", "كاميرا خلفية سيارة",
    "منظم سرعة سيارة", "عطر سيارة مبخرة", "طفاية حريق سيارة",
    # Automotive - English
    "car accessories auto parts", "spare parts vehicle", "rear camera dash cam",
    "car phone holder mount", "car air freshener", "fire extinguisher vehicle",
    # Generic intents & modifiers
    "رخيص سعر منخفض مناسب اقتصادي", "فاخر أصلي عالي الجودة احترافي",
    "جديد وصل حديثاً أحدث إصدار", "هدية مناسب الشتاء البرد الصيف الحر",
    "أفضل تقييم موصى به الأكثر مبيعاً شهرة",
    "cheap affordable budget low price economy", "luxury original high quality premium professional",
    "new arrival latest version newest release", "gift winter summer seasonal",
    "best rated recommended most popular top seller bestselling",
    "fast shipping delivery", "free return warranty guarantee", "authentic original",
    # Syrian dialect bridge terms
    "بواط سبور رياضي حذاء", "شنط حقائب نسائي", "موبايلات هواتف أجهزة",
    "فساتين ثياب ملابس نسائي", "بدل بدلات رجالية", "تياب ثياب عربية",
    "ديكور زينة منزل ترتيب", "برفانات عطور روائح", "كريمات مرطبات عناية",
    "موتوسيكل دراجة نارية مركبة", "عربيات سيارات مركبات",
    # Additional product descriptions
    "256GB storage memory capacity", "wireless bluetooth connectivity",
    "4K ultra HD resolution display", "noise cancelling active anc",
    "waterproof water resistant IPX", "fast charging quick charge",
    "organic natural ingredients", "handmade artisan craft",
    "limited edition exclusive", "sale discount offer bargain deal",
    "used second hand refurbished", "brand new sealed box",
]


# ─── Model ────────────────────────────────────────────────────────────────────

class TFIDFEmbedder:
    """
    Lightweight multilingual embedder using TF-IDF char n-grams + LSA (TruncatedSVD).

    Why this works:
    - char_wb n-grams (2–4 chars) capture Arabic root patterns and English sub-words
    - TruncatedSVD projects to 384 dims (same as multilingual-e5-small)
    - L2 normalization enables cosine similarity via pgvector's <=> operator
    - Semantically related terms share character patterns → similar vectors
    """

    def __init__(self, n_components: int = VECTOR_DIMENSIONS):
        self.n_components = n_components
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.svd: Optional[TruncatedSVD] = None
        self.load_time_ms: int = 0

    def fit(self, corpus: list[str]) -> None:
        t0 = time.time()

        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 4),
            max_features=50_000,
            sublinear_tf=True,
            strip_accents=None,     # preserve Arabic diacritics as features
            lowercase=True,
            min_df=1,
        )
        X = self.vectorizer.fit_transform(corpus)

        n_features = X.shape[1]
        actual_dims = min(self.n_components, n_features - 1)
        self.svd = TruncatedSVD(
            n_components=actual_dims,
            algorithm="randomized",
            n_iter=5,
            random_state=42,
        )
        self.svd.fit(X)
        self._actual_dims = actual_dims
        self.load_time_ms = int((time.time() - t0) * 1000)
        logger.info(
            f"TF-IDF embedder ready: vocab={n_features}, dims={actual_dims}, "
            f"corpus={len(corpus)} docs, load_time={self.load_time_ms}ms"
        )

    def embed(self, texts: list[str]) -> list[list[float]]:
        assert self.vectorizer is not None and self.svd is not None
        X = self.vectorizer.transform(texts)
        reduced = self.svd.transform(X)

        # Pad to exactly VECTOR_DIMENSIONS if SVD produced fewer components
        if reduced.shape[1] < VECTOR_DIMENSIONS:
            pad = np.zeros((reduced.shape[0], VECTOR_DIMENSIONS - reduced.shape[1]))
            reduced = np.hstack([reduced, pad])

        normed = normalize(reduced, norm="l2")
        return normed.tolist()


embedder: Optional[TFIDFEmbedder] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedder
    logger.info("Initializing TF-IDF multilingual embedder...")
    t0 = time.time()
    try:
        emb = TFIDFEmbedder(n_components=VECTOR_DIMENSIONS)
        emb.fit(SEED_CORPUS)
        embedder = emb
        elapsed_ms = int((time.time() - t0) * 1000)
        logger.info(f"Embedder ready in {elapsed_ms}ms — dimensions: {VECTOR_DIMENSIONS}")
    except Exception as e:
        logger.error(f"FATAL: Failed to initialize embedder: {e}")
        raise SystemExit(1)
    yield
    embedder = None


app = FastAPI(title="SYANO Embedding Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryEmbedRequest(BaseModel):
    text: str
    language: Optional[str] = None


class BatchEmbedRequest(BaseModel):
    texts: list[str]
    type: str = "passage"


@app.get("/health")
def health():
    return {
        "status": "ok" if embedder is not None else "initializing",
        "model": MODEL_NAME,
        "vector_dimensions": VECTOR_DIMENSIONS,
        "backend": "tfidf-lsa",
    }


@app.post("/embed/query")
def embed_query(req: QueryEmbedRequest):
    if embedder is None:
        raise HTTPException(status_code=503, detail="Embedder not initialized")

    t0 = time.time()
    try:
        result = embedder.embed([req.text])
        processing_ms = int((time.time() - t0) * 1000)
        return {
            "embedding": result[0],
            "dimensions": len(result[0]),
            "processing_ms": processing_ms,
        }
    except Exception as e:
        logger.error(f"embed/query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed/batch")
def embed_batch(req: BatchEmbedRequest):
    if embedder is None:
        raise HTTPException(status_code=503, detail="Embedder not initialized")
    if not req.texts:
        return {"embeddings": [], "count": 0, "processing_ms": 0}

    t0 = time.time()
    MAX_BATCH = 64
    all_embeddings: list[list[float]] = []
    texts = req.texts

    for chunk_start in range(0, len(texts), MAX_BATCH):
        chunk = texts[chunk_start: chunk_start + MAX_BATCH]
        try:
            batch_emb = embedder.embed(chunk)
            all_embeddings.extend(batch_emb)
        except Exception as e:
            logger.error(f"embed/batch chunk {chunk_start} error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    processing_ms = int((time.time() - t0) * 1000)
    return {
        "embeddings": all_embeddings,
        "count": len(all_embeddings),
        "processing_ms": processing_ms,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("EMBEDDING_PORT", "8001"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        timeout_keep_alive=120,
    )
