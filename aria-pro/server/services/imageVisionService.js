import fetch from 'node-fetch';

export default class ImageVisionService {
  constructor() {
    this.geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GOOGLE_API_KEY,
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      'AIzaSyCxQzJuTEcZJuyOHHn2Q3FJQIoM7mqyHQU'
    ].filter(Boolean);
    this.model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
  }

  async analyzeImage(imageBase64, query = 'What is in this image?', mimeType = 'image/jpeg') {
    if (!imageBase64) {
      throw new Error('No image data was provided.');
    }

    if (this.geminiKeys.length === 0) {
      throw new Error('GEMINI_API_KEY is missing from the server environment.');
    }

    let lastError = null;

    try {
      for (const geminiKey of this.geminiKeys) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: query
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: imageBase64
                      }
                    }
                  ],
                },
              ],
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          const message = data?.error?.message || `Gemini request failed with status ${response.status}.`;
          lastError = new Error(message);
          if (!/quota exceeded|limit: 0|billing details/i.test(message)) {
            throw lastError;
          }
          continue;
        }

        const analysis = data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join('')
          .trim();

        if (!analysis) {
          const reason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason || 'unknown';
          lastError = new Error(`Gemini returned no analysis text (${reason}).`);
          continue;
        }

        return {
          query,
          analysis,
          timestamp: new Date().toISOString(),
          model: this.model
        };
      }

      if (lastError) {
        throw lastError;
      }

      throw new Error('Gemini analysis failed with no available API keys.');
    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }
}
