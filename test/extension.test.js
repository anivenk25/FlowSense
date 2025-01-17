const assert = require('assert');
const vscode = require('vscode');
const { FlowStateTracker } = require('../extension');

suite('FlowSense Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('FlowStateTracker initialization', () => {
    const tracker = new FlowStateTracker();
    assert.strictEqual(tracker.focusScore, 100);
    assert.strictEqual(tracker.currentFocusStreak, 0);
    assert.strictEqual(tracker.errorCount, 0);
  });

  test('Focus score calculation', () => {
    const tracker = new FlowStateTracker();
    
    // Simulate some activity
    tracker.tabSwitches = 5;
    tracker.windowSwitches = 2;
    tracker.syntaxErrors = 1;
    
    tracker.updateFocusScore();
    
    // Focus score should be reduced from 100 based on activity
    assert.ok(tracker.focusScore < 100);
    assert.ok(tracker.focusScore > 0);
  });

  test('Error tracking', () => {
    const tracker = new FlowStateTracker();
    
    const mockDiagnostic = {
      message: 'Test error',
      severity: 1,
      range: {
        start: { line: 0, character: 0 }
      },
      source: 'typescript'
    };
    
    tracker.trackError(mockDiagnostic, 'typescript');
    
    const summary = tracker.getErrorSummary();
    assert.ok(summary.total > 0);
  });

  test('Productivity status', () => {
    const tracker = new FlowStateTracker();
    
    // Test different focus score ranges
    tracker.focusScore = 90;
    assert.strictEqual(tracker.getProductivityStatus(), 'Flow State 🚀');
    
    tracker.focusScore = 70;
    assert.strictEqual(tracker.getProductivityStatus(), 'In The Zone 💪');
    
    tracker.focusScore = 50;
    assert.strictEqual(tracker.getProductivityStatus(), 'Focused 🎯');
    
    tracker.focusScore = 30;
    assert.strictEqual(tracker.getProductivityStatus(), 'Getting Started 🌱');
  });
});