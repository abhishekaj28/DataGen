# DataGen

A web app for generating synthetic datasets for ML fine-tuning. You describe a task and a domain, a FastAPI backend asks an LLM (Google Gemini, Anthropic, or OpenAI) to produce labelled samples, applies rule-based checks to each sample, and a React frontend shows summary charts and lets you download the result as JSON or CSV.

> Status: working prototype. Context: a team project; a research write-up is in progress with teammates.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| Generation for 5 task types (classification, QA, summarization, NER, intent detection) | Implemented | Prompt templates in `backend/prompts.py`. |
| LLM providers: Gemini, Anthropic, OpenAI | Implemented, not exercised with real keys | The web UI always sends `llm_provider: "gemini"`. Anthropic and OpenAI are reachable only by calling the API directly. |
| Demo fallback | Implemented | If a request has no `api_key`, the backend returns a few canned samples. The response says `"source": "mock"` and the UI shows a "Demo data" notice. |
| Per-sample validation and score | Implemented (rule-based) | Length, empty output, allowed-label, summary-length, and NER-is-a-list checks. No semantic or model-based scoring. |
| Label distribution stats | Implemented | Classification and intent only. |
| Bias Analysis page: class distribution and imbalance charts | Implemented | Computed from the label counts of the last dataset. Only meaningful for classification and intent. |
| Bias Analysis page: dataset diversity | Implemented | Lexical diversity (unique words / all words), share of unique inputs, and input length, computed in the browser from the generated inputs. |
| Validation Report page | Implemented | Average quality score, share of unique inputs, valid samples, and samples with no issues, all computed from the last dataset, plus a list of flagged samples. |
| Dashboard page | Partial | Summary of the single most recent run (counts, valid vs flagged, source, activity list). There is no history. |
| Pipeline Monitor page | Implemented | Shows the stages of the last run (prompt, generate, validate, distribution check) with real counts. These are sequential steps in one request, not independent agents. |
| Export to JSON and CSV | Implemented | Done in the browser from the last dataset. There is no backend export endpoint. |
| Privacy protections (PII detection, anonymisation, differential privacy) | Not implemented | Data is LLM-generated, so no real user records are needed as input, but nothing checks generated text for personal data or memorisation. |
| Fairness or demographic bias auditing | Not implemented | "Bias analysis" here means label balance and basic text diversity only. |
| Persistence, dataset history, user accounts | Not implemented | The last dataset and API key live in browser `localStorage`. |

## Architecture

```
React + TypeScript (Vite, :8080)
   |  POST {VITE_API_URL or http://localhost:8000}/generate
FastAPI (backend/main.py)
   |-- prompts.py     builds the task-specific prompt
   |-- generator.py   calls Gemini / Anthropic / OpenAI, parses JSON, or returns demo data
   |-- validator.py   rule-based checks and summary stats
   `-- models.py      Pydantic request/response models
```

The frontend stores the response in `localStorage` (`lastDataset`); the Dashboard, Validation, Bias, Pipeline Monitor and Export pages all read from it. The API key entered on the Settings page is also kept in `localStorage` and sent to the backend with each request.

## Tech stack

- Backend: Python, FastAPI, Uvicorn, Pydantic, python-dotenv, and the `anthropic`, `openai` and `google-genai` SDKs. `pandas` is listed in `requirements.txt` but is not imported.
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Recharts, Framer Motion, React Router, TanStack Query. Tests use Vitest.
- Models called when a key is supplied: `gemini-2.5-flash`, `claude-sonnet-4-6`, `gpt-4o-mini`.

## Configuration

Backend: no environment variables are required. API keys are supplied per request (`api_key` field); the web UI takes the key from the Settings page.

Frontend: optionally set `VITE_API_URL` (for example `https://api.example.com`) if the backend is not on `http://localhost:8000`.

## Running locally

Backend (run from the repository root, not from `backend/`, because the code uses package-relative imports):

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev     # http://localhost:8080
```

Open Settings and save a Gemini API key, then use Generate Dataset. The Generate page refuses to call the backend without a saved key, so the demo fallback is only reachable by calling the API directly.

Interactive API docs are served by FastAPI at `http://localhost:8000/docs`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health message. |
| POST | `/generate` | Generate samples, validate them, and return samples plus stats. |

`POST /generate` body: `task_type` (`classification`, `summarization`, `qa`, `ner`, `intent`), `domain` (string), `num_samples` (1-50, default 10), optional `labels`, `language`, `include_edge_cases` (default true), `custom_instructions`, `llm_provider` (`gemini`, `anthropic`, `openai`), `api_key`.

The response contains `samples`, `stats`, counts, and two fields describing where the data came from: `source` (`"llm"` or `"mock"`) and `provider`.

Errors: `422` for invalid request fields, `502` with the reason in `detail` when the LLM provider fails (for example an invalid key) or returns something that is not valid JSON, or when `llm_provider` is unknown, and `500` for unexpected internal errors. There are no `/validate` or `/export` endpoints; validation runs inside `/generate` and export happens in the browser.

CORS is open to all origins (`allow_origins=["*"]`); restrict it before deploying.

## Testing

Backend (from the repository root):

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend
```

There are 11 backend tests covering the validator rules, label statistics, the demo fallback, request validation and the error responses. Calls to real LLM providers are not tested.

Frontend: `cd frontend && npm test` runs one placeholder test (`expect(true).toBe(true)`) that does not exercise application code. `npm run build` completes successfully.

## Limitations

- Demo fallback: when no `api_key` is sent, `/generate` returns a small fixed set of canned samples, repeated to reach `num_samples`. They ignore `domain`, `labels`, `language` and `custom_instructions`. The response is labelled `"source": "mock"`, but the samples still go through validation, so their scores look real.
- Validation is heuristic (length, label membership, list shape); it does not measure correctness, realism or semantic quality. A quality score of 100% means only that these checks passed.
- Bias analysis is limited to label counts and simple text diversity statistics. No fairness or demographic analysis is performed, and "Flagged Samples" on the Dashboard is simply the share of samples that failed validation.
- The LLM provider integrations (Anthropic, OpenAI, and the real Gemini path) have not been tested against live APIs in this repository.
- NER character offsets requested from the LLM are not verified.
- The API key is stored in browser `localStorage` and sent to the backend in the request body; use a development key only. There is no authentication.
- Only the latest dataset is kept, and a maximum of 50 samples per request.

## Future work

Multi-language support, dataset versioning, backend export and persistence, duplicate detection and semantic quality metrics, PII checks, and tests that cover the frontend.
