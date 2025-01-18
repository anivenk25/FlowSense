from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

# Initialize FastAPI app
app = FastAPI()

# Load all saved models
focus_model = joblib.load('focus_score_model.pkl')
quality_model = joblib.load('code_quality_model.pkl')
error_model = joblib.load('error_prediction_model.pkl')
productivity_model = joblib.load('productivity_clustering_model.pkl')
typing_model = joblib.load('typing_rhythm_model.pkl')
tab_model = joblib.load('tab_switching_model.pkl')
complexity_model = joblib.load('code_complexity_model.pkl')
session_model = joblib.load('session_duration_model.pkl')
severity_model = joblib.load('error_severity_model.pkl')

# Define input data schema using Pydantic
class UserInput(BaseModel):
    currentStreak: int
    longestStreak: int
    sessionDuration: int
    activeFileDuration: int
    idleTime: int
    typingRhythm: int
    tabMetrics_total: int
    tabMetrics_rapid: int
    codeMetrics_linesAdded: int
    codeMetrics_linesDeleted: int
    codeMetrics_fileEdits: int
    codeMetrics_codeComplexity: int
    codeMetrics_testCoverage: int
    errorMetrics_problemCount: int
    errorSummary_bySeverity_error: int
    errorSummary_bySeverity_warning: int
    errorSummary_bySeverity_info: int
    achievements_0: str

# Helper function to preprocess the data and make predictions
def get_predictions(data: pd.DataFrame):
    # Preprocess new data (same as training preprocessing)
    numerical_features = [
        'currentStreak', 'longestStreak', 'sessionDuration', 'activeFileDuration', 
        'idleTime', 'typingRhythm', 'tabMetrics_total', 'tabMetrics_rapid', 
        'codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 
        'codeMetrics_codeComplexity', 'codeMetrics_testCoverage'
    ]
    scaler = StandardScaler()
    data[numerical_features] = scaler.fit_transform(data[numerical_features])

    # Encode categorical variables
    data['userId'] = 0  # Example user ID
    data['hasAchievement'] = data['achievements_0'].apply(lambda x: 1 if x != 'No Achievement' else 0)

    # Make predictions using all models
    focus_score = focus_model.predict(data[['currentStreak', 'longestStreak', 'sessionDuration', 'activeFileDuration', 'idleTime', 'typingRhythm']])
    code_quality = quality_model.predict(data[['codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 'codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])
    error_count = error_model.predict(data[['codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 'codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])
    productivity_cluster = productivity_model.predict(data[['sessionDuration', 'activeFileDuration', 'idleTime', 'typingRhythm']])
    typing_rhythm_impact = typing_model.predict(data[['typingRhythm', 'sessionDuration', 'activeFileDuration', 'idleTime']])
    tab_switching_impact = tab_model.predict(data[['tabMetrics_total', 'tabMetrics_rapid']])
    complexity_impact = complexity_model.predict(data[['codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])
    session_impact = session_model.predict(data[['sessionDuration', 'activeFileDuration', 'idleTime']])
    severity_cluster = severity_model.predict(data[['errorSummary_bySeverity_error', 'errorSummary_bySeverity_warning', 'errorSummary_bySeverity_info']])

    return {
        "focus_score": focus_score[0],
        "code_quality": "High" if code_quality[0] == 1 else "Low",
        "error_count": error_count[0],
        "productivity_cluster": ["Low", "Medium", "High"][productivity_cluster[0]],
        "typing_rhythm_impact": typing_rhythm_impact[0],
        "tab_switching_impact": tab_switching_impact[0],
        "complexity_impact": complexity_impact[0],
        "session_impact": session_impact[0],
        "severity_cluster": ["Low", "Medium", "High"][severity_cluster[0]]
    }

@app.post("/predict/")
def predict(user_input: UserInput):
    # Convert user input to DataFrame
    data = pd.DataFrame([user_input.dict()])
    
    # Get predictions
    predictions = get_predictions(data)
    
    # Generate actionable insights
    insights = {}

    # Focus Score Insights
    insights["Focus Score"] = predictions["focus_score"]
    if predictions["focus_score"] < 50:
        insights["Focus Score Insight"] = "Your focus score is low. Try reducing idle time and avoiding rapid tab switching."
    else:
        insights["Focus Score Insight"] = "Your focus score is good. Keep maintaining your workflow!"

    # Code Quality Insights
    insights["Code Quality"] = predictions["code_quality"]
    if predictions["code_quality"] == "Low":
        insights["Code Quality Insight"] = "Your code quality needs improvement. Focus on reducing code complexity and increasing test coverage."

    # Error Count Insights
    insights["Predicted Error Count"] = predictions["error_count"]
    if predictions["error_count"] > 10:
        insights["Error Count Insight"] = "High error count predicted. Review your code changes carefully and write more unit tests."

    # Productivity Insights
    insights["Productivity Cluster"] = predictions["productivity_cluster"]
    if predictions["productivity_cluster"] == "Low":
        insights["Productivity Insight"] = "Your productivity is low. Try scheduling shorter, more focused work sessions."

    # Typing Rhythm Insights
    insights["Typing Rhythm Impact"] = predictions["typing_rhythm_impact"]
    if predictions["typing_rhythm_impact"] < 50:
        insights["Typing Rhythm Insight"] = "Your typing rhythm is affecting your focus. Try maintaining a consistent typing speed."

    # Tab Switching Insights
    insights["Tab Switching Impact"] = predictions["tab_switching_impact"]
    if predictions["tab_switching_impact"] < 50:
        insights["Tab Switching Insight"] = "Excessive tab switching is reducing your focus. Avoid unnecessary tab switches."

    # Code Complexity Insights
    insights["Code Complexity Impact"] = predictions["complexity_impact"]
    if predictions["complexity_impact"] > 7:
        insights["Code Complexity Insight"] = "High code complexity detected. Consider refactoring your code to improve maintainability."

    # Session Duration Insights
    insights["Session Duration Impact"] = predictions["session_impact"]
    if predictions["session_impact"] < 50:
        insights["Session Duration Insight"] = "Your session duration is too short. Try longer, uninterrupted work sessions."

    # Error Severity Insights
    insights["Error Severity Cluster"] = predictions["severity_cluster"]
    if predictions["severity_cluster"] == "High":
        insights["Error Severity Insight"] = "High-severity errors detected. Prioritize fixing these errors to improve code quality."

    return insights

# Run the application with uvicorn app:app --reload