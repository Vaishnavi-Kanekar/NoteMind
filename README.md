# NoteMind — Smart Semantic Notes Management and Retrieval Platform

NoteMind is a full-stack application that helps users organize, search, and retrieve information from their notes using semantic search and Retrieval-Augmented Generation (RAG).

Instead of relying only on keyword matching, NoteMind uses vector embeddings to find relevant information based on the meaning of a user's query. It also uses Optical Character Recognition (OCR) to extract text from supported uploaded documents and images.

The platform combines document processing, semantic retrieval, and AI-generated responses to make personal knowledge easier to access.

## Key Features

- **User Authentication:** Secure signup and login using JWT authentication.
- **Document Upload:** Upload supported documents, PDFs, text files, and images.
- **OCR Processing:** Extract text from supported images and scanned documents using Tesseract OCR.
- **Semantic Search:** Retrieves relevant note content using vector embeddings and similarity search.
- **AI-Powered Question Answering:** Generates context-aware responses using retrieved note content and a Groq-hosted language model.
- **Persistent Storage:** PostgreSQL stores application data, while pgvector supports vector similarity search.

## How It Works

1. **Upload:** The user uploads a document or image through the React frontend.
2. **Text Extraction:** The backend extracts text from supported file formats using document-processing utilities and OCR where needed.
3. **Text Chunking:** Extracted text is divided into smaller chunks for efficient retrieval.
4. **Embedding Generation:** Text chunks are converted into vector embeddings.
5. **Storage:** Document information and embeddings are stored in PostgreSQL using pgvector.
6. **Query Processing:** When the user asks a question, the system generates an embedding for the query.
7. **Semantic Retrieval:** The system retrieves the most relevant note chunks using vector similarity search.
8. **Response Generation:** The retrieved context and user query are sent to a Groq-hosted language model to generate a context-aware answer.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, HTML, CSS |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL, pgvector |
| Authentication | JWT |
| Document Processing | Tesseract OCR, Python document-processing libraries |
| Semantic Retrieval | Text embeddings, vector similarity search |
| Generative AI | Groq API, Retrieval-Augmented Generation (RAG) |

## Project Structure

```text
NoteMind/
├── backend/
│   ├── accounts/
│   │   ├── migrations/
│   │   ├── preprocessing_file/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Python 3.10 or a compatible version for the project's dependencies
- Node.js and npm
- PostgreSQL
- PostgreSQL pgvector extension
- Tesseract OCR
- A Groq API key

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Vaishnavi-Kanekar/NoteMind.git
cd NoteMind
```

### 2. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

**Note:** If installation fails because a dependency is incompatible with your operating system, review `requirements.txt` and install the project's required Python packages and system dependencies.

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

Add the following variables and replace the example values with your local configuration:

```env
SECRET_KEY=replace_with_a_secure_django_secret_key
DEBUG=True

DB_NAME=semantic_notes
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

GROQ_API_KEY=your_groq_api_key
```

Keep your actual `.env` file private. Never commit API keys, passwords, or Django secret keys to GitHub.

### 4. Configure PostgreSQL

Create a PostgreSQL database named `semantic_notes`, or use another database name and update `DB_NAME` accordingly.

Ensure that the pgvector extension is installed on your PostgreSQL server and enabled in the application database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run this SQL command while connected to the intended database.

### 5. Run Database Migrations

From the `backend/` directory, run:

```bash
python manage.py migrate
```

Start the Django development server:

```bash
python manage.py runserver
```

The backend will normally be available at:

```text
http://127.0.0.1:8000/
```

### 6. Set Up the Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd ~/sem4/Project1/frontend
```

Install the dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will normally open at:

```text
http://localhost:3000/
```

Ensure that the API base URL in `frontend/src/services/api.js` points to the running Django backend.


## Author

**Vaishnavi Kanekar**

---

*NoteMind demonstrates the integration of full-stack development, document processing, semantic retrieval, and generative AI in a practical knowledge-management application.*