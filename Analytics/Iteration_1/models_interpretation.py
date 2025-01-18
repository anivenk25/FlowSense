# /// script
# requires-python = "<=3.9"
# dependencies = [
#   "pandas>=2.0.0",
#   "numpy>=1.21.0",
#   "matplotlib>=3.5.0",
#   "scikit-learn>=1.0.0",
#   "prophet>=1.1.0",
#   "plotly>=5.0.0",
#   "fpdf>=1.7.0",
#   "joblib>=1.0.0",
#   "shap>=0.40.0"
# ]
# description = "A script to interpret models for analyzing developer productivity and flow state."
# entry-point = "model_interpretation.py"
# ///

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
from sklearn.ensemble import RandomForestRegressor
from sklearn.cluster import KMeans
from prophet import Prophet
import shap
import joblib

# Load saved models
def load_models():
    models = {}
    metrics = ['typing_rhythm', 'tab_switches', 'errors', 'debugging', 'active_file_duration', 'idle_time']
    
    for metric in metrics:
        model_filename = f'saved_models/{metric}_model.pkl'
        models[metric] = joblib.load(model_filename)
    
    # Load Prophet model
    prophet_model_filename = 'saved_models/prophet_model.pkl'
    models['prophet'] = joblib.load(prophet_model_filename)
    
    # Load K-Means model
    kmeans_model_filename = 'saved_models/kmeans_model.pkl'
    models['kmeans'] = joblib.load(kmeans_model_filename)
    
    return models

# Interpret Random Forest models using SHAP
def interpret_random_forest(models, X_train):
    explainer = shap.TreeExplainer(models['typing_rhythm'])
    shap_values = explainer.shap_values(X_train)
    
    # Summary plot for feature importance
    shap.summary_plot(shap_values, X_train, feature_names=X_train.columns)
    plt.title('Feature Importance for Typing Rhythm')
    plt.show()

# Interpret Prophet model
def interpret_prophet(models, future):
    forecast = models['prophet'].predict(future)
    
    # Plot forecast components
    models['prophet'].plot_components(forecast)
    plt.title('Prophet Forecast Components')
    plt.show()

# Interpret K-Means clustering
def interpret_kmeans(models, df):
    df['cluster'] = models['kmeans'].predict(df[['typing_rhythm', 'tab_switches', 'errors', 'debugging', 'active_file_duration', 'idle_time']])
    
    # Visualize clusters
    plt.figure(figsize=(10, 6))
    for cluster in range(3):
        cluster_data = df[df['cluster'] == cluster]
        plt.scatter(cluster_data['hour'], cluster_data['focus_score'], label=f'Cluster {cluster}')
    plt.title('Coding Session Clusters')
    plt.xlabel('Hour of Day')
    plt.ylabel('Focus Score')
    plt.legend()
    plt.grid()
    plt.show()

# Generate insights from all models
def generate_insights(models, df, X_train, future):
    # Interpret Random Forest models
    interpret_random_forest(models, X_train)
    
    # Interpret Prophet model
    interpret_prophet(models, future)
    
    # Interpret K-Means clustering
    interpret_kmeans(models, df)

# Main function
def main():
    # Load data
    df = pd.read_csv('synthetic_developer_data.csv')
    
    # Add time-based features
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek  # Monday=0, Sunday=6
    df['date'] = pd.to_datetime(df['timestamp']).dt.date
    
    # Prepare features for Random Forest
    features = ['hour', 'day_of_week']
    X_train = df[features]
    
    # Load models
    models = load_models()
    
    # Prepare future data for Prophet
    future = models['prophet'].make_future_dataframe(periods=24, freq='H')
    
    # Generate insights
    generate_insights(models, df, X_train, future)

if __name__ == "__main__":
    main()
