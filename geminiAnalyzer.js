const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAnalyzer {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async  analyzeCode(code, language) {
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

      4. Error Analysis:
         - Potential TypeError Risk: [Number 0-100]
         - Potential ReferenceError Risk: [Number 0-100]
         - Potential SyntaxError Risk: [Number 0-100]
         - Most Likely Error Type: [TypeError/ReferenceError/SyntaxError]

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
      },
      errors: {
          typeErrorRisk: this.extractScore(text, 'Potential TypeError Risk:\\s*(\\d+)'),
          referenceErrorRisk: this.extractScore(text, 'Potential ReferenceError Risk:\\s*(\\d+)'),
          syntaxErrorRisk: this.extractScore(text, 'Potential SyntaxError Risk:\\s*(\\d+)'),
          mostLikelyError: this.extractValue(text, 'Most Likely Error Type:\\s*(TypeError|ReferenceError|SyntaxError)', 'Unknown')
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
        problemAnalysis: {
            type: 'Unknown',
            domain: 'Unknown',
            coreFunctionality: 'Unable to determine',
            problemComplexity: 'Unknown'
        },
        complexityAnalysis: {
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1)'
        },
        codeQualityMetrics: {
            codeReadability: 0,
            maintainabilityScore: 0,
            modularityAssessment: 0,
            documentationCompleteness: 0,
            errorHandlingRobustness: 0,
            codeDuplicationLevel: 0
        },
        errorAnalysis: {
            typeErrorRisk: 0,
            referenceErrorRisk: 0,
            syntaxErrorRisk: 0,
            mostLikelyErrorType: 'Unknown'
        }
    };
}
}

module.exports = { GeminiAnalyzer };