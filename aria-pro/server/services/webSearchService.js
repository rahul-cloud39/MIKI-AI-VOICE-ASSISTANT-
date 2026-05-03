import fetch from 'node-fetch';

export default class WebSearchService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.geminiKey = process.env.GEMINI_API_KEY;
  }

  async getAIResponse(message) {
    if (!this.geminiKey) {
      throw new Error('GEMINI_API_KEY is missing from the server environment.');
    }

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
    if (!res.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error(data.error?.message || 'Gemini API did not return a valid response. Check GEMINI_API_KEY in environment variables.');
    }
    return data.candidates[0].content.parts[0].text;
  }

  async searchWeb(query, useWebSearch = true) {
    try {
      let searchResults = '';

      if (useWebSearch) {
        searchResults = await this.performSearch(query);
      }

      const prompt = searchResults
        ? `Here are recent search results about "${query}":\n${searchResults}\n\nBased on this information, provide a comprehensive answer.`
        : query;

      const response = await this.getAIResponse(prompt);

      return {
        query,
        response,
        usedWebSearch: useWebSearch && !!searchResults,
        searchResults: searchResults ? searchResults.substring(0, 500) : null
      };
    } catch (error) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }

  async performSearch(query) {
    try {
      if (this.serpApiKey) {
        // Using SerpAPI for real web search
        const response = await fetch(
          `https://serpapi.com/search?q=${encodeURIComponent(query)}&api_key=${this.serpApiKey}`
        );
        const data = await response.json();
        
        return data.organic_results
          ?.slice(0, 3)
          .map(result => `${result.title}: ${result.snippet}`)
          .join('\n') || 'No results found';
      } else {
        // Fallback: Simulate search results
        return `[Simulated Results for "${query}"]\n- Result 1: Information about ${query}\n- Result 2: More details\n- Result 3: Additional context`;
      }
    } catch (error) {
      console.log('Search error:', error);
      return null;
    }
  }
}
