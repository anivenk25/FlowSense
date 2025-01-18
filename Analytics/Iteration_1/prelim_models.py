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
# description = "A script to analyze developer productivity and flow state."
# entry-point = "prelim_models.py"
# ///

import matplotlib
matplotlib.use('TkAgg')  # Use an interactive backend
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.cluster import KMeans
from prophet import Prophet
from fpdf import FPDF
import shap
import joblib
import os
from scipy.stats import pearsonr

# Create a directory to save models
if not os.path.exists('saved_models'):
    os.makedirs('saved_models')

# Load synthetic data
df = pd.read_csv('synthetic_developer_data.csv')

# Add time-based features
df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek  # Monday=0, Sunday=6
df['date'] = pd.to_datetime(df['timestamp']).dt.date

# Define metrics to analyze
metrics = ['typing_rhythm', 'tab_switches', 'errors', 'debugging', 'active_file_duration', 'idle_time']

# Calculate a composite "focus score" (weighted average of metrics)
weights = {
    'typing_rhythm': 0.3,
    'active_file_duration': 0.3,
    'debugging': 0.2,
    'errors': -0.1,
    'idle_time': -0.1,
    'tab_switches': -0.1
}
df['focus_score'] = sum(df[metric] * weight for metric, weight in weights.items())

# Prepare features
features = ['hour', 'day_of_week']

# Train models and calculate relative scores
for metric in metrics:
    print(f"\nTraining model for {metric}...")

    # Prepare target
    y = df[metric]

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(df[features], y, test_size=0.2, random_state=42)

    # Train Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate model
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    print(f"Model Mean Squared Error for {metric}: {mse:.2f}")

    # Save the model
    model_filename = f'saved_models/{metric}_model.pkl'
    joblib.dump(model, model_filename)
    print(f"Model saved to {model_filename}")

    # Add predicted value to DataFrame
    df[f'predicted_{metric}'] = model.predict(df[features])

    # Calculate relative score
    df[f'relative_{metric}'] = df[metric] - df[f'predicted_{metric}']

    # Add interpretation
    df[f'performance_{metric}'] = np.where(
        df[f'relative_{metric}'] > 0, 'Better than expected',
        np.where(df[f'relative_{metric}'] < 0, 'Worse than expected', 'As expected')
    )

# Productivity Trends Over Time
df['timestamp'] = pd.to_datetime(df['timestamp'])
df.set_index('timestamp', inplace=True)

# Exclude non-numeric columns from resampling
numeric_columns = df.select_dtypes(include=[np.number]).columns
daily_trends = df[numeric_columns].resample('D').mean()

# Plot daily trends
plt.figure(figsize=(12, 6))
for metric in metrics:
    plt.plot(daily_trends.index, daily_trends[metric], label=metric.replace('_', ' ').title())
plt.title('Daily Productivity Trends')
plt.xlabel('Date')
plt.ylabel('Metric Value')
plt.legend()
plt.grid()
plt.show()  # Display the plot

# Correlation Analysis
correlation_matrix = df[numeric_columns].corr()
plt.figure(figsize=(10, 6))
plt.imshow(correlation_matrix, cmap='coolwarm', interpolation='none')
plt.colorbar()
plt.xticks(range(len(numeric_columns)), numeric_columns, rotation=45)
plt.yticks(range(len(numeric_columns)), numeric_columns)
plt.title('Correlation Matrix of Productivity Metrics')
plt.show()  # Display the plot

# Anomaly Detection
anomalies = df[(df['focus_score'] < df['focus_score'].quantile(0.05)) | (df['focus_score'] > df['focus_score'].quantile(0.95))]
print("Anomalies in Focus Score:")
print(anomalies[['timestamp', 'focus_score']].head())

# Personalized Recommendations
def get_recommendations(row):
    recommendations = []
    if row['hour'] >= 9 and row['hour'] <= 12:
        recommendations.append("This is the best time for deep work. Focus on complex tasks!")
    if row['relative_typing_rhythm'] < -10:
        recommendations.append("Your typing rhythm is slower than usual. Consider taking a break.")
    if row['idle_time'] > df['idle_time'].quantile(0.75):
        recommendations.append("High idle time detected. Minimize distractions.")
    return recommendations

df['recommendations'] = df.apply(get_recommendations, axis=1)

# Daily/Weekly Summaries
daily_summary = df[numeric_columns].resample('D').agg({
    'focus_score': 'mean',
    'typing_rhythm': 'mean',
    'debugging': 'sum',
    'errors': 'sum'
})
print("Daily Summary:")
print(daily_summary.head())

# Interactive Dashboard with Plotly
fig = go.Figure()
for metric in metrics:
    fig.add_trace(go.Scatter(x=df.index, y=df[metric], name=metric.replace('_', ' ').title()))
fig.update_layout(title='Productivity Metrics Over Time', xaxis_title='Time', yaxis_title='Metric Value')
fig.write_html("productivity_metrics.html")  # Save as HTML
print("Plot saved as productivity_metrics.html. Open it in a browser to view.")

# Time-Series Forecasting with Prophet
prophet_df = df[['timestamp', 'typing_rhythm']].rename(columns={'timestamp': 'ds', 'typing_rhythm': 'y'})
prophet_model = Prophet()
prophet_model.fit(prophet_df)

# Save the Prophet model
prophet_model_filename = 'saved_models/prophet_model.pkl'
joblib.dump(prophet_model, prophet_model_filename)
print(f"Prophet model saved to {prophet_model_filename}")

# Make predictions
future = prophet_model.make_future_dataframe(periods=24, freq='H')
forecast = prophet_model.predict(future)

# Plot forecast
prophet_model.plot(forecast)
plt.title('Typing Rhythm Forecast')
plt.show()  # Display the plot

# Clustering with K-Means
X = df[['typing_rhythm', 'tab_switches', 'errors', 'debugging', 'active_file_duration', 'idle_time']]
kmeans = KMeans(n_clusters=3)
df['cluster'] = kmeans.fit_predict(X)

# Save the K-Means model
kmeans_model_filename = 'saved_models/kmeans_model.pkl'
joblib.dump(kmeans, kmeans_model_filename)
print(f"K-Means model saved to {kmeans_model_filename}")

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
plt.show()  # Display the plot

# Feature Importance with SHAP
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_train)
shap.summary_plot(shap_values, X_train, feature_names=features)

# Exportable PDF Report
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Productivity Report", ln=True, align='C')

# Add insights
pdf.cell(200, 10, txt=f"Best hour for productivity: {df.groupby('hour')['focus_score'].mean().idxmax()}:00", ln=True)
pdf.cell(200, 10, txt=f"Worst hour for productivity: {df.groupby('hour')['focus_score'].mean().idxmin()}:00", ln=True)
pdf.cell(200, 10, txt=f"Average daily focus score: {daily_summary['focus_score'].mean():.2f}", ln=True)

# Save the PDF
pdf.output("productivity_report.pdf")

# Load saved models (example for typing_rhythm model)
loaded_model = joblib.load('saved_models/typing_rhythm_model.pkl')
print("Loaded typing_rhythm model successfully!")
