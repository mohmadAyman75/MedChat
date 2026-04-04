# 🏥 MedChat — AI Pharmacy Chatbot

An AI-powered pharmacy chatbot that uses **OpenFDA** drug data, **ChromaDB** for vector search, **Groq LLM** with a full **RAG pipeline**, **FastAPI** backend, and a **React** frontend.

---

## 📁 Project Structure

```
MedChat/
├── data_engineering/   # Person 1 — Data & ChromaDB
├── ai_engine/          # Person 2 — LLM & RAG Pipeline
├── backend/            # Person 3 — FastAPI Endpoints
└── frontend/           # Person 4 — React Chat UI
```

---

## 🚀 Quick Start

### 1. Clone & Setup Environment
```bash
git clone https://github.com/mohmadAyman75/MedChat.git
cd MedChat
cp .env.example .env
# Fill in your GROQ_API_KEY in .env
```

### 2. Load Drug Data into ChromaDB
```bash
pip install -r data_engineering/requirements.txt
make data-all
make test-chroma
```

### 3. Test RAG Pipeline
```bash
pip install -r ai_engine/requirements.txt
make test-rag
```

### 4. Run Backend
```bash
pip install -r backend/requirements.txt
make run-backend
# API docs at http://localhost:8000/docs
```

### 5. Run Frontend
```bash
make install-frontend
make run-frontend
# App at http://localhost:5173
```

---

## 🐳 Docker

```bash
make docker-up
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key |
| `OPENFDA_API_KEY` | OpenFDA API key (optional) |
| `CHROMA_PATH` | Path for ChromaDB persistence |
| `GROQ_MODEL` | Groq model name (default: llama3-70b-8192) |

---

## 📌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a text message |
| `POST` | `/api/analyze-image` | Upload a drug image |
| `GET` | `/api/history/{session_id}` | Get chat history |
| `GET` | `/health` | Health check |

---

## 🧠 Tech Stack

- **Data**: OpenFDA API, ChromaDB, sentence-transformers
- **AI**: Groq (LLaMA 3), LangChain, RAG
- **Backend**: FastAPI, Python 3.11+
- **Frontend**: React + Vite
- **Deploy**: Vercel (frontend), Render (backend)
