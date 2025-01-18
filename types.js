// Types for the code analysis results
const CodeAnalysisSchema = {
    problem: {
      type: String,        // Type of problem being solved
      domain: String,      // Domain category
      complexity: String,  // Problem complexity level
      functionality: String // Core functionality description
    },
    complexity: {
      time: String,       // Time complexity in Big O notation
      space: String,      // Space complexity in Big O notation
      bottlenecks: Array, // List of identified bottlenecks
      scalability: Array  // Scalability concerns
    },
    quality: {
      readability: Number,      // 0-100 score
      maintainability: Number,  // 0-100 score
      modularity: Number,       // 0-100 score
      documentation: Number,    // 0-100 score
      errorHandling: Number,    // 0-100 score
      duplication: Number      // Code duplication level
    },
    patterns: {
      design: Array,       // List of design patterns
      architecture: Array, // Architectural patterns
      solid: Array        // SOLID principles adherence
    },
    bestPractices: {
      followed: Array,    // List of followed best practices
      violated: Array,    // List of violated best practices
      security: Array     // Security considerations
    },
    optimizations: {
      performance: Array, // Performance optimization suggestions
      memory: Array,     // Memory optimization suggestions
      structure: Array   // Code structure improvements
    },
    technicalDebt: {
      identified: Array,  // List of identified technical debt
      codeSmells: Array, // Code smells found
      refactoring: Array // Refactoring priorities
    },
    security: {
      vulnerabilities: Array, // Security vulnerabilities
      dataHandling: Array,   // Data handling concerns
      validation: Array      // Input validation issues
    },
    testing: {
      coverage: Number,   // Test coverage score
      types: Array,      // Types of testing needed
      edgeCases: Array   // Identified edge cases
    },
    developerExperience: {
      maintainability: Number,      // Maintainability score
      learningCurve: Number,        // Learning curve assessment
      debuggingFriendliness: Number // Debugging friendliness score
    }
  };