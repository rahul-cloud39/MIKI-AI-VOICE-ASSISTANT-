import React, { useState } from 'react';
import './RAGUpload.css';

export default function RAGUpload({ onUploadSuccess, onQuery }) {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [useRAG, setUseRAG] = useState(true);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadPDF = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileBase64 = event.target.result.split(',')[1];

        const response = await fetch('/api/rag/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: fileBase64 })
        });

        const data = await response.json();
        onUploadSuccess?.(data);
        setFile(null);
        alert('PDF uploaded successfully!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, useRAG })
      });

      const data = await response.json();
      setResult(data);
      onQuery?.(data);
    } catch (error) {
      alert('Query failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rag-container">
      <div className="rag-section">
        <h3>Upload PDF</h3>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUploadPDF} disabled={!file || loading}>
          {loading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>

      <div className="rag-section">
        <h3>Query Documents</h3>
        <input
          type="text"
          placeholder="Ask a question about your documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={useRAG}
            onChange={(e) => setUseRAG(e.target.checked)}
          />
          Use Document AI (RAG)
        </label>
        <button onClick={handleQuery} disabled={!query || loading}>
          {loading ? 'Processing...' : 'Ask AI'}
        </button>
      </div>

      {result && (
        <div className="result-box">
          <h4>Answer:</h4>
          <p>{result.response}</p>
          {result.usedRAG && <p className="info">Used document context</p>}
        </div>
      )}
    </div>
  );
}
