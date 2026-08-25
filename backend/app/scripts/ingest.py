import os
import re
import PyPDF2
import chromadb
from chromadb.utils import embedding_functions
from langchain_text_splitters import RecursiveCharacterTextSplitter

DATA_DIR = "data"
CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "career_knowledge"

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def main():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created '{DATA_DIR}' folder. Drop career guides, syllabus, or resume writing PDFs here.")
        return
        
    pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]
    if not pdf_files:
        print(f"No PDF files found inside '{DATA_DIR}' directory. Please drop career PDFs there and run again.")
        return
        
    print(f"Initializing persistent Chroma DB at '{CHROMA_DIR}'...")
    chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
    
    # Initialize SentenceTransformer embedding function (runs locally)
    embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection
    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embed_fn
    )
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )
    
    total_chunks = 0
    for pdf_name in pdf_files:
        pdf_path = os.path.join(DATA_DIR, pdf_name)
        print(f"Ingesting: {pdf_name}...")
        
        raw_text = extract_text_from_pdf(pdf_path)
        if not raw_text.strip():
            print(f"Warning: No text could be extracted from {pdf_name}. Skipping.")
            continue
            
        chunks = text_splitter.split_text(raw_text)
        print(f"Split into {len(chunks)} chunks.")
        
        documents = []
        metadatas = []
        ids = []
        
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{pdf_name}_chunk_{idx}"
            documents.append(chunk)
            metadatas.append({"source": pdf_name, "chunk_index": idx})
            ids.append(chunk_id)
            
        # Ingest in batches of 100
        batch_size = 100
        for i in range(0, len(documents), batch_size):
            collection.add(
                documents=documents[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size]
            )
            
        total_chunks += len(chunks)
        print(f"Finished ingesting {pdf_name}.")
        
    print(f"SUCCESS: Ingested {len(pdf_files)} PDFs ({total_chunks} total chunks) into vector database.")

if __name__ == "__main__":
    main()
