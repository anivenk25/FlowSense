from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import numpy as np

# Load preprocessing objects and models
scaler = joblib.load('scaler.pkl')
linear_reg_model = joblib.load('linear_regression_reg_model.pkl')
random_forest_reg_model = joblib.load('random_forest_regression_reg_model.pkl')
gradient_boosting_reg_model = joblib.load('gradient_boosting_regression_reg_model.pkl')

# Define input data model using Pydantic
class InputData(BaseModel):
    currentStreak: float
    longestStreak: float
    sessionDuration: float
    activeFileDuration: float
    idleTime: float
    typingRhythm: float

# Initialize FastAPI app
app = FastAPI()

# Define prediction endpoint
@app.post("/predict/focus")
def predict(input_data: InputData):
    try:
        # Convert input data to DataFrame
        input_dict = input_data.dict()
        input_df = pd.DataFrame([input_dict])

        # Select only the features used during training
        features = ['currentStreak', 'longestStreak', 'sessionDuration', 'activeFileDuration', 'idleTime', 'typingRhythm']
        input_df = input_df[features]

        # Preprocess input data
        input_scaled = scaler.transform(input_df)

        # Make predictions using all models
        linear_reg_pred = linear_reg_model.predict(input_scaled)
        random_forest_reg_pred = random_forest_reg_model.predict(input_scaled)
        gradient_boosting_reg_pred = gradient_boosting_reg_model.predict(input_scaled)

        # Return predictions
        return {
            "Linear Regression": float(linear_reg_pred[0]),
            "Random Forest Regression": float(random_forest_reg_pred[0]),
            "Gradient Boosting Regression": float(gradient_boosting_reg_pred[0])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
