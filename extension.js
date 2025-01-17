const vscode = require("vscode");

class FlowStateWebview {
  constructor(context) {
    this.context = context;
    this.panel = null;
    this.updateInterval = null;
  }

  createOrShowPanel(flowTracker) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (this.panel) {
      this.panel.reveal(columnToShowIn);
      this.updateContent(flowTracker);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "flowStateMetrics",
      "Flow State Analytics",
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(
      () => {
        this.panel = null;
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
      },
      null,
      this.context.subscriptions
    );

    this.updateContent(flowTracker);

    this.updateInterval = setInterval(() => {
      this.updateContent(flowTracker);
    }, 1000);

    this.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "reset":
            flowTracker.reset();
            this.updateContent(flowTracker);
            vscode.window.showInformationMessage(
              "Flow metrics have been reset"
            );
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  updateContent(flowTracker) {
    if (!this.panel) return;

    const metrics = flowTracker.getMetrics();
    this.panel.webview.html = this.getWebviewContent(metrics);

    if (metrics.needsBreak) {
      flowTracker.breakSuggested = true;
      vscode.window
        .showInformationMessage(
          "🌟 Time for a quick break! Your focus metrics suggest you could use a refresh.",
          "Take Break",
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Take Break") {
            vscode.window.showInformationMessage(
              "👍 Good choice! Try some quick exercises or grab a drink of water."
            );
          }
        });
    }
  }

  getWebviewContent(metrics) {
    const errorSummary = metrics.getErrorSummary();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Flow State Analytics</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    line-height: 1.5;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .dashboard {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .title-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .title-section h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .status-badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .metric-card {
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 10px;
                    padding: 20px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .metric-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .metric-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .metric-title {
                    font-size: 14px;
                    color: var(--vscode-foreground);
                    opacity: 0.8;
                }
                .metric-icon {
                    font-size: 20px;
                }
                .metric-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                    margin: 10px 0;
                }
                .metric-subtitle {
                    font-size: 12px;
                    color: var(--vscode-foreground);
                    opacity: 0.6;
                }
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background-color: var(--vscode-progressBar-background);
                    border-radius: 3px;
                    margin-top: 15px;
                    overflow: hidden;
                }
                .progress-value {
                    height: 100%;
                    background-color: var(--vscode-textLink-foreground);
                    transition: width 0.3s ease;
                    border-radius: 3px;
                }
                .focus-score {
                    font-size: 48px;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0;
                    color: var(--vscode-textLink-foreground);
                }
                .streak-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    background-color: var(--vscode-textLink-foreground);
                    color: var(--vscode-button-foreground);
                }
                .actions {
                    display: flex;
                    gap: 10px;
                }
                .button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .primary-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .primary-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .secondary-button {
                    background-color: transparent;
                    border: 1px solid var(--vscode-button-background);
                    color: var(--vscode-button-background);
                }
                .secondary-button:hover {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                .highlight {
                    color: var(--vscode-textLink-foreground);
                }
                .error-list {
                    margin-top: 10px;
                    max-height: 200px;
                    overflow-y: auto;
                    font-size: 12px;
                }
                .error-item {
                    padding: 8px;
                    border-left: 3px solid;
                    margin-bottom: 4px;
                    background-color: var(--vscode-editor-background);
                }
                .error-item.error { border-color: #ff5555; }
                .error-item.warning { border-color: #f1fa8c; }
                .error-item.info { border-color: #8be9fd; }
                .error-location {
                    font-family: monospace;
                    color: var(--vscode-textPreformat-foreground);
                }
                .language-errors {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 10px;
                }
                .language-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="title-section">
                        <h1>Flow State Analytics</h1>
                        <div class="status-badge">${
                          metrics.productivityStatus
                        }</div>
                    </div>
                    <div class="actions">
                        <button class="button secondary-button" onclick="resetMetrics()">Reset Session</button>
                    </div>
                </div>

                <div class="dashboard">
                    <!-- Focus Score Card -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Focus Score</div>
                            <div class="metric-icon">🎯</div>
                        </div>
                        <div class="focus-score">${metrics.focusScore.toFixed(
                          0
                        )}</div>
                        <div class="streak-badge">
                            🔥 ${metrics.currentStreak} min streak
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${
                              metrics.focusScore
                            }%"></div>
                        </div>
                    </div>

                    <!-- Session Stats -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Session Statistics</div>
                            <div class="metric-icon">⏱️</div>
                        </div>
                        <div class="metric-value">${metrics.sessionDuration.toFixed(
                          1
                        )} min</div>
                        <div class="metric-subtitle">Session Duration</div>
                        <div class="metric-subtitle">
                            Longest Streak: ${metrics.longestStreak} minutes
                        </div>
                    </div>

                    <!-- Activity Metrics -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Activity Metrics</div>
                            <div class="metric-icon">📊</div>
                        </div>
                        <div class="metric-value">${metrics.fileEdits}</div>
                        <div class="metric-subtitle">
                            ${metrics.linesAdded} lines added • ${
      metrics.linesDeleted
    } lines removed
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${Math.min(
                              (metrics.fileEdits / 50) * 100,
                              100
                            )}%"></div>
                        </div>
                    </div>

                    <!-- Typing Rhythm -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Typing Rhythm</div>
                            <div class="metric-icon">⌨️</div>
                        </div>
                        <div class="metric-value">${metrics.typingRhythm.toFixed(
                          1
                        )}%</div>
                        <div class="metric-subtitle">Consistency Score</div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${
                              metrics.typingRhythm
                            }%"></div>
                        </div>
                    </div>

                    <!-- Navigation Patterns -->
                   <!-- Navigation Patterns -->
<div class="metric-card">
    <div class="metric-header">
        <div class="metric-title">Navigation Patterns</div>
        <div class="metric-icon">🔄</div>
    </div>
    <div class="metric-value">${metrics.tabMetrics.total}</div>
    <div class="metric-subtitle">
        ${metrics.windowSwitchCount} window switches • ${
      metrics.tabMetrics.rapid
    } rapid switches • ${metrics.commandUsage} commands 
    </div>
    <div class="progress-bar">
        <div class="progress-value" style="width: ${Math.min(
          (metrics.tabSwitchCount / 30) * 100,
          100
        )}%"></div>
    </div>
</div>

                    <!-- Debug Metrics -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Debug Metrics</div>
                            <div class="metric-icon">🐛</div>
                        </div>
                        <div class="metric-value">${
                          metrics.breakpointCount
                        }</div>
                        <div class="metric-subtitle">
                            Active Breakpoints • ${
                              metrics.errorCount
                            } Errors Detected
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${Math.min(
                              (metrics.breakpointCount / 10) * 100,
                              100
                            )}%"></div>
                        </div>
                    </div>

                    <!-- Error Summary -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Error Analysis</div>
                            <div class="metric-icon">🔍</div>
                        </div>
                        <div class="metric-value">
                            ${errorSummary.bySeverity.error} Errors • ${
      errorSummary.bySeverity.warning
    } Warnings
                        </div>
                        
                        <div class="language-errors">
                            ${Object.entries(errorSummary.byLanguage)
                              .map(
                                ([lang, errors]) => `
                                <div class="language-badge">
                                    ${lang}: ${Object.values(errors).reduce(
                                  (a, b) => a + b,
                                  0
                                )}
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        
                        <div class="error-list">
                            ${errorSummary.recent
                              .map(
                                (error) => `
                                <div class="error-item ${
                                  error.severity === 1
                                    ? "error"
                                    : error.severity === 2
                                    ? "warning"
                                    : "info"
                                }">
                                    <div class="error-location">Line ${
                                      error.line
                                    }:${error.column}</div>
                                    <div>${error.message}</div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function resetMetrics() {
                    vscode.postMessage({
                        command: 'reset'
                    });
                }

                setInterval(() => {
                    vscode.postMessage({
                        command: 'refresh'
                    });
                }, 1000);
            </script>
        </body>
        </html>`;
  }
}

class FlowStateTracker {
  constructor() {
    this.reset();
    this.settings = {
      focusThreshold: 70,
      breakInterval: 45,
      typingConsistencyWeight: 0.3,
      errorPenalty: 5,
      tabSwitchPenalty: 1,
      windowSwitchPenalty: 2,
      streakBonus: 2,
      productivityThresholds: {
        high: 80,
        medium: 60,
        low: 40,
      },
      codeQualityMetrics: {
        cleanCodeScore: 0.2,
        complexityThreshold: 10,
        testCoverageGoal: 80,
        documentationWeight: 0.3,
      },
      languageSupport: {
        javascript: true,
        typescript: true,
        python: true,
        java: true,
        csharp: true,
        go: true,
        rust: true,
        php: true,
        ruby: true,
      },
      tabMetrics: {
        rapidSwitchThreshold: 2000, // milliseconds
        penaltyMultiplier: 1.5,
      },
    };
  }

  reset() {
    this.activeFileStartTime = new Date();
    this.lastTypeTime = new Date();
    this.idleStartTime = new Date();
    this.sessionStartTime = new Date();
    this.lastStreakUpdate = new Date();
    this.typingIntervals = [];
    this.focusScore = 100;
    this.focusHistory = [];
    this.productivityScore = 100;
    this.errorCount = 0;
    this.tabSwitches = 0;
    this.breakpoints = 0;
    this.consoleInteractions = 0;
    this.windowSwitches = 0;
    this.commandCount = 0;
    this.fileEdits = 0;
    this.searchOperations = 0;
    this.refactoringActions = 0;
    this.debuggingSessions = 0;
    this.longestFocusStreak = 0;
    this.currentFocusStreak = 0;
    this.peakProductivityTime = null;
    this.breakSuggested = false;
    this.productivityPeaks = [];
    this.focusDips = [];
    this.linesAdded = 0;
    this.linesDeleted = 0;
    this.syntaxErrors = 0;
    this.codeComplexity = 0;
    this.testCoverage = 0;
    this.documentationUpdates = 0;
    this.codingPatterns = {
      conditionals: 0,
      loops: 0,
      functions: 0,
      classes: 0,
      async: 0,
      syntax: 0,
      unused: 0,
      undefined: 0,
    };
    this.errorLog = [];
    this.languageSpecificErrors = {
      javascript: { syntax: 0, reference: 0, type: 0 },
      typescript: { syntax: 0, type: 0, interface: 0 },
      python: { syntax: 0, indentation: 0, import: 0 },
      java: { syntax: 0, compilation: 0, runtime: 0 },
      go: { syntax: 0, package: 0, type: 0 },
      rust: { syntax: 0, borrow: 0, lifetime: 0 },
      php: { syntax: 0, undefined: 0, type: 0 },
      ruby: { syntax: 0, undefined: 0, gem: 0 },
    };
    this.cleanCodeMetrics = {
      functionLength: [],
      cyclomaticComplexity: [],
      dependencyCount: [],
      cohesionScore: 100,
      duplicateCode: 0,
    };
    this.codeQualityScore = 100;
    this.commentLines = 0;
    this.intellisenseUsage = 0;
    this.quickFixUsage = 0;
    this.snippetUsage = 0;
    this.symbolNavigation = 0;
    this.problemCount = 0;
    this.warningCount = 0;
    this.flowStateAchievements = [];
    this.lastTabSwitchTime = new Date();
    this.rapidTabSwitches = 0;
    this.copyPasteOperations = {
      total: 0,
      copy: 0,
      cut: 0,
      paste: 0,
      lastOperation: null,
    };
    this.tabSwitchPatterns = {
      backAndForth: 0,
      sequential: 0,
      lastTabs: [],
    };
  }

  trackTabSwitch(fromTab, toTab) {
    const now = new Date();
    const timeSinceLastSwitch = now - this.lastTabSwitchTime;

    // Track rapid switches
    if (timeSinceLastSwitch < this.settings.tabMetrics.rapidSwitchThreshold) {
      this.rapidTabSwitches++;
    }

    // Track tab switch patterns
    this.tabSwitchPatterns.lastTabs.push(toTab);
    if (this.tabSwitchPatterns.lastTabs.length > 3) {
      this.tabSwitchPatterns.lastTabs.shift();

      // Detect back and forth pattern (A -> B -> A)
      if (
        this.tabSwitchPatterns.lastTabs[0] ===
        this.tabSwitchPatterns.lastTabs[2]
      ) {
        this.tabSwitchPatterns.backAndForth++;
      }

      // Detect sequential pattern (A -> B -> C)
      if (
        new Set(this.tabSwitchPatterns.lastTabs).size ===
        this.tabSwitchPatterns.lastTabs.length
      ) {
        this.tabSwitchPatterns.sequential++;
      }
    }

    this.tabSwitches++;
    this.lastTabSwitchTime = now;
  }

  // Add new method to track copy/paste operations
  trackCopyPaste(operation) {
    this.copyPasteOperations.total++;
    this.copyPasteOperations[operation]++;
    this.copyPasteOperations.lastOperation = {
      type: operation,
      timestamp: new Date(),
    };
  }

  trackError(diagnostic, languageId) {
    const errorInfo = {
      timestamp: new Date(),
      message: diagnostic.message,
      severity: diagnostic.severity,
      line: diagnostic.range.start.line + 1,
      column: diagnostic.range.start.character + 1,
      source: diagnostic.source || languageId,
      code: diagnostic.code,
    };

    this.errorLog.push(errorInfo);

    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    if (this.languageSpecificErrors[languageId]) {
      const errorType = this.categorizeError(diagnostic.message, languageId);
      if (this.languageSpecificErrors[languageId][errorType]) {
        this.languageSpecificErrors[languageId][errorType]++;
      }
    }
  }

  categorizeError(message, languageId) {
    message = message.toLowerCase();

    switch (languageId) {
      case "javascript":
      case "typescript":
        if (message.includes("undefined") || message.includes("not defined"))
          return "reference";
        if (message.includes("type")) return "type";
        return "syntax";

      case "python":
        if (message.includes("indentation")) return "indentation";
        if (message.includes("import")) return "import";
        return "syntax";

      case "java":
        if (message.includes("cannot find symbol")) return "compilation";
        if (message.includes("runtime")) return "runtime";
        return "syntax";

      default:
        return "syntax";
    }
  }

  getErrorSummary() {
    return {
      total: this.errorLog.length,
      bySeverity: {
        error: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Error
        ).length,
        warning: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Warning
        ).length,
        info: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Information
        ).length,
      },
      byLanguage: Object.entries(this.languageSpecificErrors)
        .filter(([_, errors]) =>
          Object.values(errors).some((count) => count > 0)
        )
        .reduce((acc, [lang, errors]) => {
          acc[lang] = errors;
          return acc;
        }, {}),
      recent: this.errorLog.slice(-5),
    };
  }

  updateFocusScore() {
    let score = 100;

    const rapidSwitchPenalty =
      this.rapidTabSwitches * this.settings.tabMetrics.penaltyMultiplier;
    score -= Math.min(
      30,
      this.tabSwitches * this.settings.tabSwitchPenalty + rapidSwitchPenalty
    );

    score -= Math.min(30, this.tabSwitches * this.settings.tabSwitchPenalty);
    score -= Math.min(
      20,
      this.windowSwitches * this.settings.windowSwitchPenalty
    );
    score -= Math.min(20, this.syntaxErrors * this.settings.errorPenalty);
    score -= Math.min(20, this.problemCount * this.settings.errorPenalty);

    const rhythmScore = this.calculateTypingRhythm();
    score += (rhythmScore - 100) * this.settings.typingConsistencyWeight;

    score += Math.min(10, this.currentFocusStreak * this.settings.streakBonus);

    score +=
      (this.codeQualityScore - 100) *
      this.settings.codeQualityMetrics.cleanCodeScore;

    this.focusScore = Math.max(0, Math.min(100, score));

    this.focusHistory.push({
      timestamp: new Date(),
      score: this.focusScore,
    });

    const now = new Date();
    const timeSinceLastUpdate =
      (now.getTime() - this.lastStreakUpdate.getTime()) / 1000;

    if (timeSinceLastUpdate >= 60) {
      if (this.focusScore > this.settings.focusThreshold) {
        this.currentFocusStreak += 1;
        if (this.currentFocusStreak > this.longestFocusStreak) {
          this.longestFocusStreak = this.currentFocusStreak;
          this.checkForAchievements();
        }
      } else {
        if (this.currentFocusStreak > 0) {
          this.focusDips.push({
            timestamp: new Date(),
            duration: this.currentFocusStreak,
          });
        }
        this.currentFocusStreak = 0;
      }
      this.lastStreakUpdate = now;
    }

    if (
      this.focusScore > 90 &&
      (!this.peakProductivityTime ||
        now.getTime() - this.peakProductivityTime.getTime() > 1000 * 60 * 15)
    ) {
      this.productivityPeaks.push({
        timestamp: now,
        score: this.focusScore,
      });
      this.peakProductivityTime = now;
    }
  }

  calculateTypingRhythm() {
    if (this.typingIntervals.length < 2) return 100;

    const intervals = this.typingIntervals.slice(-30);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;

    const weightedVariance =
      intervals.reduce((acc, val, idx) => {
        const weight = (idx + 1) / intervals.length;
        return acc + weight * Math.pow(val - avgInterval, 2);
      }, 0) / intervals.length;

    const consistency = 100 - Math.min(100, Math.sqrt(weightedVariance) / 8);
    return consistency;
  }

  updateCodeQualityScore() {
    let score = 100;

    score -= Math.max(
      0,
      this.codeComplexity - this.settings.codeQualityMetrics.complexityThreshold
    );

    if (this.testCoverage < this.settings.codeQualityMetrics.testCoverageGoal) {
      score -=
        (this.settings.codeQualityMetrics.testCoverageGoal -
          this.testCoverage) *
        0.5;
    }

    const docRatio = this.commentLines / Math.max(1, this.linesAdded);
    score +=
      (docRatio - 0.2) *
      this.settings.codeQualityMetrics.documentationWeight *
      100;

    const avgFunctionLength =
      this.cleanCodeMetrics.functionLength.length > 0
        ? this.cleanCodeMetrics.functionLength.reduce((a, b) => a + b) /
          this.cleanCodeMetrics.functionLength.length
        : 0;

    score -= Math.max(0, (avgFunctionLength - 20) * 0.5);

    this.codeQualityScore = Math.max(0, Math.min(100, score));
  }

  shouldSuggestBreak() {
    const sessionDuration =
      (new Date().getTime() - this.sessionStartTime.getTime()) / 1000 / 60;
    const lowFocusScore = this.focusScore < this.settings.focusThreshold;
    const longSession = sessionDuration > this.settings.breakInterval;
    const highIntensity = this.productivityScore > 90 && sessionDuration > 30;

    return (
      !this.breakSuggested && (lowFocusScore || longSession || highIntensity)
    );
  }

  checkForAchievements() {
    const achievements = [];

    if (this.longestFocusStreak >= 30) {
      achievements.push({
        type: "FLOW_MASTER",
        description: "30+ minutes of sustained focus!",
      });
    }

    if (this.productivityPeaks.length >= 3) {
      achievements.push({
        type: "PRODUCTIVITY_GURU",
        description: "Achieved 3 productivity peaks in one session!",
      });
    }

    if (this.cleanCodeMetrics.cohesionScore > 90) {
      achievements.push({
        type: "CLEAN_CODE_CHAMPION",
        description: "Maintained high code quality standards!",
      });
    }

    if (achievements.length > 0) {
      this.flowStateAchievements.push(...achievements);
      vscode.window.showInformationMessage(
        `🏆 Achievement Unlocked: ${achievements[0].description}`
      );
    }
  }

  getMetrics() {
    this.updateFocusScore();
    this.updateCodeQualityScore();

    const sessionDuration =
      (new Date().getTime() - this.sessionStartTime.getTime()) / 1000 / 60;
    const activeFileDuration =
      (new Date().getTime() - this.activeFileStartTime.getTime()) / 1000;
    const idleTime =
      (new Date().getTime() - this.idleStartTime.getTime()) / 1000;

    return {
      focusScore: this.focusScore,
      currentStreak: this.currentFocusStreak,
      longestStreak: this.longestFocusStreak,
      sessionDuration,
      activeFileDuration,
      idleTime,
      typingRhythm: this.calculateTypingRhythm(),
      tabSwitchCount: this.tabSwitches,
      windowSwitchCount: this.windowSwitches,
      commandUsage: this.commandCount,
      breakpointCount: this.breakpoints,
      errorCount: this.syntaxErrors,
      problemCount: this.problemCount,
      warningCount: this.warningCount,
      linesAdded: this.linesAdded,
      linesDeleted: this.linesDeleted,
      fileEdits: this.fileEdits,
      codeComplexity: this.codeComplexity,
      testCoverage: this.testCoverage,
      codingPatterns: this.codingPatterns,
      codeQualityScore: this.codeQualityScore,
      cleanCodeMetrics: this.cleanCodeMetrics,
      productivityPeaks: this.productivityPeaks,
      focusDips: this.focusDips,
      achievements: this.flowStateAchievements,
      intellisenseUsage: this.intellisenseUsage,
      quickFixUsage: this.quickFixUsage,
      snippetUsage: this.snippetUsage,
      symbolNavigation: this.symbolNavigation,
      needsBreak: this.shouldSuggestBreak(),
      productivityStatus: this.getProductivityStatus(),
      focusHistory: this.focusHistory.slice(-60),
      productivityTrend: this.calculateProductivityTrend(),
      getErrorSummary: () => this.getErrorSummary(),
      tabMetrics: {
        total: this.tabSwitches,
        rapid: this.rapidTabSwitches,
        patterns: {
          backAndForth: this.tabSwitchPatterns.backAndForth,
          sequential: this.tabSwitchPatterns.sequential,
        },
      },
      copyPasteMetrics: {
        total: this.copyPasteOperations.total,
        copy: this.copyPasteOperations.copy,
        cut: this.copyPasteOperations.cut,
        paste: this.copyPasteOperations.paste,
      },
    };
  }

  calculateProductivityTrend() {
    if (this.focusHistory.length < 2) return "stable";

    const recentScores = this.focusHistory.slice(-10);
    const avgRecent =
      recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length;
    const prevScores = this.focusHistory.slice(-20, -10);

    if (prevScores.length === 0) return "stable";
    const avgPrev =
      prevScores.reduce((a, b) => a + b.score, 0) / prevScores.length;
    const diff = avgRecent - avgPrev;

    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  }

  getProductivityStatus() {
    const { high, medium, low } = this.settings.productivityThresholds;

    if (this.focusScore >= high) return "Flow State 🚀";
    if (this.focusScore >= medium) return "In The Zone 💪";
    if (this.focusScore >= low) return "Focused 🎯";
    return "Getting Started 🌱";
  }
}

function activate(context) {
    console.log("Flow state detection extension is now active");
  
    const flowTracker = new FlowStateTracker();
    const webview = new FlowStateWebview(context);
  
    // Add tab switch tracking
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          const currentTab = editor.document.fileName;
          flowTracker.trackTabSwitch(null, currentTab);
          webview.updateContent(flowTracker);
        }
      })
    );
  
    context.subscriptions.push(
      vscode.languages.onDidChangeDiagnostics((e) => {
        let totalErrors = 0;
        let totalWarnings = 0;
  
        for (const uri of e.uris) {
          const document = vscode.workspace.textDocuments.find(
            (doc) => doc.uri.toString() === uri.toString()
          );
          const languageId = document ? document.languageId : "unknown";
          const diagnostics = vscode.languages.getDiagnostics(uri);
  
          diagnostics.forEach((diagnostic) => {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
              totalErrors++;
            } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
              totalWarnings++;
            }
  
            flowTracker.trackError(diagnostic, languageId);
          });
        }
  
        flowTracker.syntaxErrors = totalErrors;
        flowTracker.warningCount = totalWarnings;
  
        webview.updateContent(flowTracker);
      })
    );
  
    context.subscriptions.push(
      vscode.debug.onDidChangeBreakpoints((e) => {
        if (e.added) flowTracker.breakpoints += e.added.length;
        if (e.removed) flowTracker.breakpoints -= e.removed.length;
        webview.updateContent(flowTracker);
      })
    );
  
    context.subscriptions.push(
      vscode.window.onDidChangeWindowState((e) => {
        if (!e.focused) {
          flowTracker.windowSwitches++;
          webview.updateContent(flowTracker);
        }
      })
    );
  
    let showMetricsDisposable = vscode.commands.registerCommand(
      "extension.getFlowMetrics",
      () => {
        webview.createOrShowPanel(flowTracker);
      }
    );
  
    let resetMetricsDisposable = vscode.commands.registerCommand(
      "extension.resetFlowMetrics",
      () => {
        flowTracker.reset();
        webview.updateContent(flowTracker);
        vscode.window.showInformationMessage("Flow metrics have been reset");
      }
    );
  
    context.subscriptions.push(showMetricsDisposable);
    context.subscriptions.push(resetMetricsDisposable);
  
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const now = new Date();
        const interval = now.getTime() - flowTracker.lastTypeTime.getTime();
  
        if (interval < 5000) {
          flowTracker.typingIntervals.push(interval);
        }
  
        const uri = event.document.uri;
        const diagnostics = vscode.languages.getDiagnostics(uri);
  
        flowTracker.syntaxErrors = diagnostics.filter(
          (d) => d.severity === vscode.DiagnosticSeverity.Error
        ).length;
        flowTracker.warningCount = diagnostics.filter(
          (d) => d.severity === vscode.DiagnosticSeverity.Warning
        ).length;
        flowTracker.problemCount = diagnostics.length;
  
        flowTracker.lastTypeTime = now;
        flowTracker.idleStartTime = now;
        flowTracker.commandCount++;
        flowTracker.fileEdits++;
  
        event.contentChanges.forEach((change) => {
          const newLineCount = (change.text.match(/\n/g) || []).length;
          const removedLineCount = change.range.end.line - change.range.start.line;
          flowTracker.linesAdded += newLineCount;
          flowTracker.linesDeleted += removedLineCount;
        });
  
        webview.updateContent(flowTracker);
      })
    );
  }
function deactivate() {}

module.exports = {
  activate,
  deactivate,
  FlowStateTracker,
  FlowStateWebview,
};
