<div align="center">

<img src="https://img.shields.io/badge/RxChat-شات_الصيدلية-0EA5E9?style=for-the-badge&logoColor=white" />

# 💊 MedChat — شات الصيدلية

### روبوت محادثة ذكي يشتغل زي صيدلاني محترف

اسأله عن أي دواء، يقولك استخدامه وجرعته وسعره، وتقدر تبعتله صورة الدواء وهو يتعرف عليه

<br/>

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?style=flat-square)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35?style=flat-square)
![Groq](https://img.shields.io/badge/Groq-LLM_API-F55036?style=flat-square)

<br/>

</div>

---

## 📌 فكرة المشروع

**RxChat** هو شاتبوت صيدلاني مبني على تقنية الذكاء الاصطناعي، الهدف منه إن المستخدم يقدر يسأل عن أي دواء بشكل طبيعي ويحصل على إجابة واضحة وموثوقة من مصادر رسمية — من غير هلوسة أو معلومات غلط.

```
المستخدم يسأل → الشاتبوت يدور في بيانات الأدوية → يرد بمعلومة صح + صورة الدواء
```

---

## ✨ المميزات

| الميزة | التفاصيل |
|--------|----------|
| 💬 **محادثة طبيعية** | اسأل بالعربي أو الإنجليزي عن أي دواء |
| 🖼️ **صور الأدوية** | الشاتبوت بيبعت صورة الدواء مع الرد تلقائي |
| 📸 **قراءة صورة الدواء** | ابعت صورة الدواء وهو يتعرف عليه ويجيب معلوماته |
| 🧠 **ذاكرة المحادثة** | بيتذكر الكلام اللي فات في نفس الجلسة |
| 🚫 **مش بيهلوس** | بيجاوب بس من بيانات رسمية، لو مش متأكد بيقول |
| 💰 **الأسعار** | بيقولك سعر الدواء في الصيدليات المصرية |

---

## 🏗️ معمارية المشروع

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│         (واجهة الشات + رفع الصور)               │
└──────────────────────┬──────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────┐
│               FastAPI Backend                    │
│         (routing + session management)           │
└──────┬───────────────┬───────────────────────────┘
       │               │
┌──────▼──────┐  ┌─────▼──────────────────────────┐
│  Groq API   │  │       LangChain RAG Pipeline    │
│ Llama 3.3   │  │  Retriever + Memory + Formatter │
│ Vision LLM  │  └──────────────┬─────────────────┘
└─────────────┘                 │
                    ┌───────────▼──────────────┐
                    │        ChromaDB           │
                    │  (بيانات الأدوية كـ       │
                    │   vector embeddings)      │
                    └───────────────────────────┘
```

---

## 🛠️ التقنيات المستخدمة

### Backend
| التقنية | الاستخدام | الإصدار |
|--------|----------|---------|
| **FastAPI** | بناء الـ API endpoints | `0.111+` |
| **LangChain** | بناء الـ RAG pipeline والـ memory | `0.2+` |
| **Groq API** | تشغيل الـ LLM (Llama 3.3 + Vision) | latest |
| **ChromaDB** | حفظ embeddings الأدوية | `0.5+` |
| **OpenFDA API** | مصدر بيانات الأدوية الرسمي | REST |
| **Pillow** | معالجة الصور | `10+` |

### Frontend
| التقنية | الاستخدام |
|--------|----------|
| **React 18** | بناء واجهة الشات |
| **Axios** | التواصل مع الـ Backend |
| **React Markdown** | عرض الردود بشكل منسق |

### Deployment
| الجزء | السيرفر |
|-------|---------|
| Frontend | **Vercel** |
| Backend + DB | **Render** |
| Source Code | **GitHub** |

---

## 📁 هيكل المشروع

```
RxChat/
│
├── backend/
│   ├── main.py               # FastAPI app + endpoints
│   ├── rag_pipeline.py       # LangChain RAG setup
│   ├── llm_config.py         # Groq API configuration
│   ├── image_handler.py      # معالجة صور الأدوية
│   ├── memory.py             # إدارة تاريخ المحادثة
│   └── requirements.txt
│
├── data/
│   ├── fetch_drugs.py        # جلب بيانات من OpenFDA
│   ├── process_data.py       # تنظيف وتجهيز البيانات
│   ├── embed_to_chroma.py    # رفع البيانات على ChromaDB
│   └── drug_images/          # صور الأدوية
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageCard.jsx
    │   │   └── ImageUploader.jsx
    │   ├── App.jsx
    │   └── api.js
    └── package.json
```

---

## 🚀 تشغيل المشروع

### المتطلبات
- Python 3.11+
- Node.js 18+
- Groq API Key (مجاني من [console.groq.com](https://console.groq.com))

### 1. استنسخ المشروع

```bash
git clone https://github.com/your-username/rxchat.git
cd rxchat
```

### 2. شغّل الـ Backend

```bash
cd backend
pip install -r requirements.txt

# حط الـ API keys في ملف .env
cp .env.example .env
# افتح .env وحط فيه GROQ_API_KEY

uvicorn main:app --reload
```

### 3. جهّز بيانات الأدوية

```bash
cd data
python fetch_drugs.py        # جيب البيانات من OpenFDA
python process_data.py       # نظّف البيانات
python embed_to_chroma.py    # ارفعها على ChromaDB
```

### 4. شغّل الـ Frontend

```bash
cd frontend
npm install
npm run dev
```

الـ app هيشتغل على `http://localhost:5173` 🎉

---

## 🔑 متغيرات البيئة

```env
# .env
GROQ_API_KEY=your_groq_api_key_here
CHROMA_DB_PATH=./chroma_db
OPENFDA_API_KEY=optional_for_higher_rate_limits
```

---

## 👥 فريق العمل

| الاسم | الدور | المهام |
|-------|-------|--------|
| **[ اسم 1 ]** | Data Engineer | OpenFDA + ChromaDB + صور الأدوية |
| **[ اسم 2 ]** | AI Engineer | Groq + LangChain + RAG Pipeline |
| **[ اسم 3 ]** | Backend Engineer | FastAPI + Image Input + Memory |
| **[ اسم 4 ]** | Frontend & DevOps | React UI + Vercel + Render |

---

## 📊 مصادر البيانات

- **[OpenFDA API](https://open.fda.gov/apis/)** — بيانات الأدوية الرسمية (FDA أمريكي)
- **[RxNorm API](https://lhncbc.nlm.nih.gov/RxNav/)** — أسماء الأدوية الدولية
- أسعار الأدوية المصرية — من مصادر محلية موثوقة

---

## 🎓 ملاحظة

هذا المشروع تم تطويره كمشروع تخرج لكلية علوم الحاسب — تخصص الذكاء الاصطناعي.
المعلومات الطبية المقدمة هي للأغراض التعليمية فقط، وليست بديلاً عن استشارة صيدلاني أو طبيب متخصص.

---

<div align="center">

صُنع بـ ❤️ في مصر 🇪🇬

</div>
