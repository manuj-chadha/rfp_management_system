# AI-Powered RFP Management System

A full-stack project that demonstrates how **AI can automate the RFP (Request for Proposal) lifecycle** — from writing RFPs in natural language to generating, comparing, and recommending vendor proposals.

This project is built as part of an **SDE assignment** for **Aerchain** and focuses on:
- clean backend design
- practical AI usage
- end-to-end workflow clarity

---

## What this project does

1. User writes an RFP in plain English  
2. AI converts it into a structured RFP  
3. User selects vendors
4. Mails are sent to the vendors
5. System generates realistic vendor proposals using AI  
6. Proposals are parsed, scored, and stored  
7. AI compares proposals and recommends the best vendor  

---

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- AI via **Ollama / OpenRouter**

### Frontend
- React (Vite)
- Redux Toolkit + RTK Query
- React Router

---

## How AI is used

AI is used at **three places**:

1. **RFP generation**  
   Natural language → structured RFP JSON

2. **Vendor proposal simulation**  
   When RFP is sent to selected vendors, the backend:
   - calls an LLM
   - generates a unique proposal per vendor
   - stores it as if it came from a real vendor

3. **Proposal comparison & recommendation**  
   AI analyzes parsed proposals and returns:
   - score breakdown
   - recommended vendor
   - reasoning and trade-offs

This simulates a real procurement workflow **without requiring real vendors or emails**.

---

## Project Structure

```text
backend/
 └─ src/
    ├─ controllers/
    ├─ routes/
    ├─ services/
    ├─ models/
    └─ utils/

frontend/
 └─ src/
    ├─ pages/
    ├─ components/
    └─ slices/

## Backend Setup
```bash
cd backend
npm install
npm run dev
```


## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```


## Main User Flow

1. User opens **Create RFP** page  
2. User describes procurement requirements in natural language  
3. AI converts the text into a structured RFP  
4. User selects vendors from the vendor list  
5. User sends the RFP to selected vendors  
6. Backend generates AI-based proposals for each selected vendor  
7. Proposals are stored in the database and linked to the RFP  
8. User views all received proposals for that RFP  
9. AI compares proposals and recommends the best vendor  

This flow is fully deterministic and does not depend on real emails or external vendors.

---

## AI-Based Proposal Generation

Instead of waiting for real vendor responses, the system simulates vendor proposals using an LLM.

- Each selected vendor gets a unique proposal
- Proposal content is based on:
  - RFP specifications
  - Vendor profile
- Generated proposals are:
  - parsed
  - scored
  - persisted in the database

This allows consistent testing and evaluation.

---

## Proposal Comparison & Recommendation

Once at least two proposals exist for an RFP:

- The system compares proposals on:
  - pricing
  - delivery timeline
  - warranty and support
- AI generates:
  - score breakdown per vendor
  - recommended vendor
  - reasoning and trade-offs

The recommendation is cached and reused for UI rendering.

---

## Data Persistence

All generated data is stored in MongoDB:

- RFPs
- Selected vendors
- Generated proposals
- AI scores and recommendations


## Example Input

```text
We need 10 high-performance servers with 64GB RAM,
delivery within 30 days, and at least 2 years warranty.


