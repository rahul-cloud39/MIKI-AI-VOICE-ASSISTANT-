export default class RAGService {
  constructor() {
    this.documents = [];
    this.embeddings = [];
    this.geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyCxQzJuTEcZJuyOHHn2Q3FJQIoM7mqyHQU';
  }

  async getAIResponse(message) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        this.geminiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }

  async uploadPDF(fileBase64) {
    try {
      if (!fileBase64) {
        throw new Error('No PDF data was provided.');
      }

      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdfBuffer = Buffer.from(fileBase64, 'base64');
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdf = await loadingTask.promise;
      const fileId = Date.now().toString();
      const pageTexts = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str)
          .join(' ')
          .trim();

        if (pageText) {
          pageTexts.push(pageText);
        }
      }

      const text = pageTexts.join('\n\n').trim();
      
      this.documents.push({
        id: fileId,
        content: text,
        timestamp: new Date(),
        type: 'pdf',
        pageCount: pdf.numPages || 0
      });

      const embedding = await this.generateEmbedding(text.substring(0, 500));
      this.embeddings.push({
        documentId: fileId,
        embedding: embedding
      });

      return {
        success: true,
        documentId: fileId,
        message: 'PDF uploaded and processed successfully',
        pages: pdf.numPages || 0,
        charactersExtracted: text.length
      };
    } catch (error) {
      throw new Error(`PDF upload failed: ${error.message}`);
    }
  }

  async queryDocuments(query, useRAG = true) {
    try {
      let context = '';

      if (useRAG && this.documents.length > 0) {
        const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
        const rankedDocuments = this.documents
          .map((doc) => {
            const content = doc.content || '';
            const lowerContent = content.toLowerCase();
            const score = terms.reduce((total, term) => total + (lowerContent.includes(term) ? 1 : 0), 0);
            return { doc, score };
          })
          .sort((a, b) => b.score - a.score);

        context = rankedDocuments
          .slice(0, 3)
          .map(({ doc }) => doc.content.substring(0, 1200))
          .join('\n---\n');
      }

      const prompt = context
        ? `Based on these documents:\n${context}\n\nAnswer this question: ${query}`
        : query;

      const response = await this.getAIResponse(prompt);

      return {
        query,
        response,
        usedRAG: useRAG && this.documents.length > 0,
        documentsUsed: this.documents.length
      };
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async generateEmbedding(text) {
    // Simulate embedding generation
    // In production, use services like OpenAI embeddings or Hugging Face
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return Array(384).fill(0).map(() => Math.random());
  }
}
