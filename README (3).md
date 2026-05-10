# 💊 Person 3 — Personalized Dosage Calculator
## RxChat Graduation Project 2024/2025

---

## 📦 Installation

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

```bash
export GROQ_API_KEY="your_groq_api_key_here"
```

---

## 🚀 Run the API

```bash
# ضع ملف الداتا في نفس المجلد
cp Deep_seek_data.json person3_dosage/

# شغّل السيرفر
cd person3_dosage
python dosage_calculator.py
```

السيرفر هيشتغل على: `http://localhost:8003`

---

## 📡 API Usage

### POST `/dosage`

**Request:**
```json
{
  "drug_name": "Paracetamol",
  "patient_profile": {
    "age": 35,
    "weight_kg": 70,
    "gender": "أنثى",
    "chronic_conditions": [],
    "kidney_function": "normal",
    "liver_function": "normal"
  }
}
```

**Response:**
```json
{
  "drug_name": "Paracetamol",
  "recommended_dose": "500-1000 مجم كل 4-6 ساعات",
  "reasoning": "...(full DeepSeek reasoning)...",
  "chain_of_thought": [
    "الخطوة 1: تحليل حالة المريضة...",
    "الخطوة 2: الجرعة الأساسية حسب OpenFDA...",
    "الخطوة 3: التعديل..."
  ],
  "safety_flag": false,
  "doctor_referral": false,
  "dose_adjustment_reason": "وظائف طبيعية ولا أمراض مزمنة",
  "risk_category": "LOW"
}
```

---

## 🏗️ Architecture

```
DosageRequest (drug + patient_profile)
        │
        ▼
Rule-Based Safety Classifier (scikit-learn RandomForest)
→ Risk Category: LOW / MEDIUM / HIGH
        │
        ▼
Few-Shot Example Loader (3 examples from Deep_seek_data.json)
        │
        ▼
Chain-of-Thought Prompt Builder
        │
        ▼
DeepSeek-R1 via Groq API
→ Reasoning + Recommended Dose
        │
        ▼
Response Parser + Safety Merge
        │
        ▼
DosageResponse → Person 4 (Prompt Builder - Step 6)
```

---

## 🔗 Integration with RAG Pipeline

**هذا الـ module هو Step 5 في الـ RAG Pipeline**

- **Input** (من Person 4): `drug_name` + `patient_profile`
- **Output** (لـ Person 4 → Prompt Builder): `dose` + `reasoning` + `safety_flag` + `doctor_referral`
- **Port**: `8003`

---

## ✅ Deliverables Checklist

- [x] Patient Profile JSON Schema (في `PatientProfile` class)
- [x] Chain-of-Thought Prompt Library (يُحمّل من `Deep_seek_data.json` — 169 مثال)
- [x] Rule-based Safety Classifier (scikit-learn RandomForest)
- [x] FastAPI endpoint — `POST /dosage`
- [ ] Evaluation Report (شغّل `train_safety_classifier()` وهتطبع التقرير)
- [ ] Integration Test مع Person 4
