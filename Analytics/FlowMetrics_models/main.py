from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

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

# Initialize FastAPI app
app = FastAPI()

# Preprocessing setup
numerical_features = [
    'currentStreak', 'longestStreak', 'sessionDuration', 'activeFileDuration', 
    'idleTime', 'typingRhythm', 'tabMetrics_total', 'tabMetrics_rapid', 
    'codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 
    'codeMetrics_codeComplexity', 'codeMetrics_testCoverage'
]
scaler = StandardScaler()



# Input schema
from typing import Optional
from pydantic import BaseModel

from typing import Optional
from pydantic import BaseModel

class InputData(BaseModel):
    currentStreak: Optional[float] = None
    longestStreak: Optional[float] = None
    sessionDuration: Optional[float] = None
    activeFileDuration: Optional[float] = None
    idleTime: Optional[float] = None
    typingRhythm: Optional[float] = None
    tabMetrics_total: Optional[float] = None
    tabMetrics_rapid: Optional[float] = None
    codeMetrics_linesAdded: Optional[float] = None
    codeMetrics_linesDeleted: Optional[float] = None
    codeMetrics_fileEdits: Optional[float] = None
    codeMetrics_codeComplexity: Optional[float] = None
    codeMetrics_testCoverage: Optional[float] = None
    errorSummary_bySeverity_error: Optional[float] = None
    errorSummary_bySeverity_warning: Optional[float] = None
    errorSummary_bySeverity_info: Optional[float] = None
    achievements_0: Optional[str] = None

    class Config:
        from_attributes = True



# Home endpoint
@app.get("/")
def home():
    return {"message": "Welcome to the Productivity Insights API"}

# Helper function for preprocessing
def preprocess_data(data: InputData):
    input_df = pd.DataFrame([data.dict()])
    input_df.columns = [col.replace('.', '_') for col in input_df.columns]
    try:
        input_df[numerical_features] = scaler.fit_transform(input_df[numerical_features])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error in preprocessing: {str(e)}")
    input_df['hasAchievement'] = input_df['achievements_0'].apply(lambda x: 1 if x != 'No Achievement' else 0)
    return input_df

# Endpoint for focus score
@app.post("/predict/focus/")
def predict_focus(data: InputData):
    input_df = preprocess_data(data)
    focus_score = focus_model.predict(input_df[['currentStreak', 'longestStreak', 'sessionDuration', 'activeFileDuration', 'idleTime', 'typingRhythm']])[0]
    return {
        "focus_score": round(focus_score, 2),
        "focus_insights": "Low focus score. Reduce idle time and tab switching." if focus_score < 50 else "Good focus score. Maintain your workflow!"
    }

# Endpoint for code quality
@app.post("/predict/code_quality/")
def predict_code_quality(data: InputData):
    input_df = preprocess_data(data)
    code_quality = quality_model.predict(input_df[['codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 'codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])[0]
    return {
        "code_quality": "High" if code_quality == 1 else "Low",
        "code_quality_insights": "Focus on reducing complexity and increasing test coverage." if code_quality == 0 else "Keep up the good work."
    }

# Endpoint for error count prediction
@app.post("/predict/error_count/")
def predict_error_count(data: InputData):
    input_df = preprocess_data(data)
    error_count = error_model.predict(input_df[['codeMetrics_linesAdded', 'codeMetrics_linesDeleted', 'codeMetrics_fileEdits', 'codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])[0]
    return {
        "predicted_error_count": round(error_count, 2),
        "error_insights": "High error count predicted. Review code and write more unit tests." if error_count > 10 else "Error count is manageable."
    }

# Endpoint for productivity cluster
@app.post("/predict/productivity/")
def predict_productivity(data: InputData):
    input_df = preprocess_data(data)
    productivity_cluster = productivity_model.predict(input_df[['sessionDuration', 'activeFileDuration', 'idleTime', 'typingRhythm']])[0]
    return {
        "productivity_cluster": "Low" if productivity_cluster == 0 else "Medium" if productivity_cluster == 1 else "High",
        "productivity_insights": "Low productivity. Try shorter, focused sessions." if productivity_cluster == 0 else "Maintain your productivity!"
    }

# Endpoint for typing rhythm impact
@app.post("/predict/typing_rhythm/")
def predict_typing_rhythm(data: InputData):
    input_df = preprocess_data(data)
    typing_rhythm_impact = typing_model.predict(input_df[['typingRhythm', 'sessionDuration', 'activeFileDuration', 'idleTime']])[0]
    return {
        "typing_rhythm_impact": round(typing_rhythm_impact, 2),
        "typing_rhythm_insights": "Improve typing consistency." if typing_rhythm_impact < 50 else "Your typing rhythm is fine."
    }

# Endpoint for tab switching impact
@app.post("/predict/tab_switching/")
def predict_tab_switching(data: InputData):
    input_df = preprocess_data(data)
    tab_switching_impact = tab_model.predict(input_df[['tabMetrics_total', 'tabMetrics_rapid']])[0]
    return {
        "tab_switching_impact": round(tab_switching_impact, 2),
        "tab_switching_insights": "Avoid unnecessary tab switching." if tab_switching_impact < 50 else "Tab switching is not affecting your focus."
    }

# Endpoint for code complexity impact
@app.post("/predict/complexity/")
def predict_complexity(data: InputData):
    input_df = preprocess_data(data)
    complexity_impact = complexity_model.predict(input_df[['codeMetrics_codeComplexity', 'codeMetrics_testCoverage']])[0]
    return {
        "complexity_impact": round(complexity_impact, 2),
        "complexity_insights": "High code complexity. Refactor your code." if complexity_impact > 7 else "Code complexity is manageable."
    }

# Endpoint for session duration impact
@app.post("/predict/session/")
def predict_session(data: InputData):
    input_df = preprocess_data(data)
    session_impact = session_model.predict(input_df[['sessionDuration', 'activeFileDuration', 'idleTime']])[0]
    return {
        "session_impact": round(session_impact, 2),
        "session_insights": "Short sessions detected. Try longer work sessions." if session_impact < 50 else "Your session durations are effective."
    }

# Endpoint for error severity prediction
@app.post("/predict/error_severity/")
def predict_error_severity(data: InputData):
    input_df = preprocess_data(data)
    severity_cluster = severity_model.predict(input_df[['errorSummary_bySeverity_error', 'errorSummary_bySeverity_warning', 'errorSummary_bySeverity_info']])[0]
    return {
        "error_severity_cluster": "Low" if severity_cluster == 0 else "Medium" if severity_cluster == 1 else "High",
        "error_severity_insights": "High-severity errors detected. Prioritize fixes." if severity_cluster == 2 else "Error severity is under control."
    }
