import React, { useState } from 'react';
import './ImageVision.css';

export default function ImageVision({ onAnalysisComplete }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState('What is in this image?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const apiBaseUrl = '';

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Image file could not be read.'));
      reader.readAsDataURL(file);
    });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setError('');
    setResult(null);

    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }

    setImage(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please choose an image first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const dataUrl = await readFileAsDataURL(image);
      const [meta, imageBase64] = dataUrl.split(',');
      const mimeTypeMatch = meta?.match(/data:(.*);base64/);
      const mimeType = mimeTypeMatch?.[1] || image.type || 'image/jpeg';

      const response = await fetch(`${apiBaseUrl}/api/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, query, mimeType })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Image analysis request failed.');
      }

      setResult(data);
      onAnalysisComplete?.(data);
    } catch (error) {
      setResult(null);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vision-container">
      <h3>Image Understanding</h3>

      <div className="vision-upload">
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="preview" className="preview-image" />}
      </div>

      <div className="vision-query">
        <input
          type="text"
          placeholder="Ask a question about the image..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <button onClick={handleAnalyze} disabled={!image || loading} className="analyze-btn">
        {loading ? 'Analyzing...' : 'Analyze Image'}
      </button>

      {error && (
        <div className="vision-error">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="vision-result">
          <h4>Analysis:</h4>
          <p>{result.analysis}</p>
        </div>
      )}
    </div>
  );
}
