const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAnalyzer {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeCode(code, language) {
    const prompt = `
      Analyze this ${language} code and provide metrics in this exact format:

      1. Problem Analysis:
         - Type: [Single word category: Algorithm/UI/DataProcessing/Utility/Network/Security]
         - Domain: [Single word domain: Frontend/Backend/Database/System/Network/Security]
         - Core Functionality: [One short sentence, max 10 words]
         - Problem Complexity: [Easy/Medium/Hard]

      2. Complexity Analysis:
         - Time Complexity: [Only Big O notation, e.g. O(1), O(n), O(n²)]
         - Space Complexity: [Only Big O notation, e.g. O(1), O(n), O(n²)]

      3. Code Quality Metrics:
         - Code Readability: [Number 0-100]
         - Maintainability Score: [Number 0-100]
         - Modularity Assessment: [Number 0-100]
         - Documentation Completeness: [Number 0-100]
         - Error Handling Robustness: [Number 0-100]
         - Code Duplication Level: [Number 0-100]

      Code to analyze:
      ${code}

      Provide only the values as specified above, without explanations or additional text.
      Each metric should be a single value that can be directly stored in a database.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return this.parseAnalysis(text);
    } catch (error) {
      console.error('Error analyzing code with Gemini:', error);
      return this.getDefaultAnalysis();
    }
  }

  parseAnalysis(text) {
    const analysis = {
      problem: {
        type: this.extractValue(text, 'Type:\\s*([A-Za-z]+)', 'Unknown'),
        domain: this.extractValue(text, 'Domain:\\s*([A-Za-z]+)', 'Unknown'),
        functionality: this.extractValue(text, 'Core Functionality:\\s*([^\\n]+)', 'Unknown'),
        complexity: this.extractValue(text, 'Problem Complexity:\\s*(Easy|Medium|Hard)', 'Unknown')
      },
      complexity: {
        time: this.extractValue(text, 'Time Complexity:\\s*(O\\([^)]+\\))', 'O(1)'),
        space: this.extractValue(text, 'Space Complexity:\\s*(O\\([^)]+\\))', 'O(1)')
      },
      quality: {
        readability: this.extractScore(text, 'Code Readability:\\s*(\\d+)'),
        maintainability: this.extractScore(text, 'Maintainability Score:\\s*(\\d+)'),
        modularity: this.extractScore(text, 'Modularity Assessment:\\s*(\\d+)'),
        documentation: this.extractScore(text, 'Documentation Completeness:\\s*(\\d+)'),
        errorHandling: this.extractScore(text, 'Error Handling Robustness:\\s*(\\d+)'),
        duplication: this.extractScore(text, 'Code Duplication Level:\\s*(\\d+)')
      }
    };
    
    return analysis;
  }

  extractValue(text, regex, defaultValue) {
    const match = text.match(new RegExp(regex, 'i'));
    return match ? match[1].trim() : defaultValue;
  }

  extractScore(text, regex) {
    const match = text.match(new RegExp(regex, 'i'));
    return match ? parseInt(match[1]) : 0;
  }

  getDefaultAnalysis() {
    return {
      problem: {
        type: 'Unknown',
        domain: 'Unknown',
        complexity: 'Unknown',
        functionality: 'Unknown'
      },
      complexity: {
        time: 'O(1)',
        space: 'O(1)'
      },
      quality: {
        readability: 0,
        maintainability: 0,
        modularity: 0,
        documentation: 0,
        errorHandling: 0,
        duplication: 0
      }
    };
  }
}

module.exports = { GeminiAnalyzer };