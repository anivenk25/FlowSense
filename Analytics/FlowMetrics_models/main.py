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


from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.preprocessing import MinMaxScaler
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import re
import nltk
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio

# # Ensure NLTK resources are downloaded
nltk.download('punkt')
nltk.download('punkt_tab')

nltk.download('stopwords')
nltk.download('wordnet')


# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_methods=["GET"],  # Only allow GET requests
    allow_headers=["*"],
)

# Connect to MongoDB
client = MongoClient("mongodb+srv://mangarajanmol666:test123@cluster0.yq1bt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["test"]
codeanalyses_collection = db["codeanalyses"]
flowmetrics_collection = db["flowmetrics"]


def preprocess_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    tokens = word_tokenize(text)
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stopwords.words('english')]
    return ' '.join(tokens)

@app.get("/get_errors_plot")
def get_errors_plot(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch error messages for a specific user, preprocess them, perform topic modeling,
    generate a Plotly bar chart, and return the plot as an HTML file.
    """
    recent_errors = []
    for doc in flowmetrics_collection.find({"userId": userId}, {"errorSummary.recent": 1}):
        if "errorSummary" in doc and "recent" in doc["errorSummary"]:
            for error in doc["errorSummary"]["recent"]:
                if "message" in error:
                    recent_errors.append(error["message"])

    processed_messages = [preprocess_text(msg) for msg in recent_errors if msg]

    # TF-IDF Vectorization
    tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
    tfidf_matrix = tfidf.fit_transform(processed_messages)

    # Topic Modeling using LDA
    lda = LatentDirichletAllocation(n_components=3, random_state=42)
    lda.fit(tfidf_matrix)

    # Predict the topic for each error message
    topics = lda.transform(tfidf_matrix).argmax(axis=1)
    topic_to_error_type = {
        0: "Syntax Errors",
        1: "Warnings",
        2: "Runtime Problems"
    }
    error_types = [topic_to_error_type[topic] for topic in topics]

    # Count the number of errors in each category
    error_counts = pd.Series(error_types).value_counts().reset_index()
    error_counts.columns = ["Error Type", "Count"]

    # Generate Plotly bar chart
    fig = px.bar(error_counts, x="Error Type", y="Count")
    plot_html = pio.to_html(fig, full_html=False)  # Convert plot to HTML

    # Return the plot as an HTML response
    return Response(content=plot_html, media_type="text/html")

# Catppuccin Mocha colors for Plotly
mocha_colors_plotly = {
    "base": "#1e1e2e",
    "text": "#cdd6f4",
    "blue": "#89b4fa",
    "pink": "#f5c2e7",
    "overlay0": "#6c7086",
    "purple": "#C3B1E1"
}

catppuccin_mocha = {
    "base": "#1e1e2e",
    "text": "#cdd6f4",
    "blue": "#89b4fa",
    "purple": "#C3B1E1",
    "pink": "#f5c2e7",
    "overlay0": "#6c7086"
}

@app.get("/get_focus_score_plot")
def get_focus_score_plot(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch focus score data for a specific user and generate a Plotly line chart.
    """
    # Query focus score data
    focus_data = list(flowmetrics_collection.find({"userId": userId}, {"timestamp": 1, "focusScore": 1, "_id": 0}))
    df_focus = pd.DataFrame(focus_data)

    # Convert timestamp to datetime
    df_focus["timestamp"] = pd.to_datetime(df_focus["timestamp"], unit="ms")

    # Generate Plotly line chart
    fig = px.line(df_focus, x='timestamp', y='focusScore', title=f'Focus Score Over Time for User {userId}')
    fig.update_layout(
        plot_bgcolor=mocha_colors_plotly["base"],
        paper_bgcolor=mocha_colors_plotly["base"],
        font_color=mocha_colors_plotly["text"],
        xaxis=dict(gridcolor=mocha_colors_plotly["overlay0"]),
        yaxis=dict(gridcolor=mocha_colors_plotly["overlay0"])
    )

    # Convert plot to HTML
    plot_html = pio.to_html(fig, full_html=False)
    return Response(content=plot_html, media_type="text/html")

@app.get("/get_typing_rhythm_plot")
def get_typing_rhythm_plot(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch typing rhythm data for a specific user and generate a Plotly histogram.
    """
    # Query typing rhythm data
    typing_data = list(flowmetrics_collection.find({"userId": userId}, {"typingRhythm": 1, "_id": 0}))
    df_typing = pd.DataFrame(typing_data)

    # Generate Plotly histogram
    fig = px.histogram(df_typing, x='typingRhythm', title=f'Typing Rhythm Distribution for User {userId}')
    fig.update_layout(
        plot_bgcolor=mocha_colors_plotly["base"],
        paper_bgcolor=mocha_colors_plotly["base"],
        font_color=mocha_colors_plotly["text"],
        xaxis=dict(gridcolor=mocha_colors_plotly["overlay0"]),
        yaxis=dict(gridcolor=mocha_colors_plotly["overlay0"])
    )

    # Convert plot to HTML
    plot_html = pio.to_html(fig, full_html=False)
    return Response(content=plot_html, media_type="text/html")

@app.get("/code_metrics_radar_chart")
def code_metrics_radar_chart(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch code metrics data for a specific user, generate a radar chart, and return it as an HTML response.
    """
    # Query data from MongoDB
    data = list(flowmetrics_collection.find({"userId": userId}, {
        "codeMetrics.linesAdded": 1,
        "codeMetrics.linesDeleted": 1,
        "codeMetrics.fileEdits": 1,
        "codeMetrics.codeComplexity": 1,
        "codeMetrics.testCoverage": 1,
        "_id": 0
    }))

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)

    # Flatten the nested 'codeMetrics' structure
    df = pd.json_normalize(df.to_dict('records'))

    # Rename columns for easier access
    df.columns = [
        'codeMetrics_linesAdded',
        'codeMetrics_linesDeleted',
        'codeMetrics_fileEdits',
        'codeMetrics_codeComplexity',
        'codeMetrics_testCoverage'
    ]

    # Calculate mean values for each metric
    code_metrics = df.mean()

    # Create the radar chart
    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=code_metrics.values,
        theta=code_metrics.index,
        fill='toself',
        name='Code Metrics',
        fillcolor=catppuccin_mocha['purple'],  # Fill color
        line=dict(color=catppuccin_mocha['pink'])  # Line color
    ))

    # Update layout with responsive sizing and better readability
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, max(code_metrics.values)],
                color=catppuccin_mocha['text']  # Radial axis color
            ),
            angularaxis=dict(
                color=catppuccin_mocha['text']  # Angular axis color
            ),
            bgcolor=catppuccin_mocha['base']  # Background color
        ),
        font=dict(color=catppuccin_mocha['text']),  # General text color
        paper_bgcolor=catppuccin_mocha['base'],  # Paper background color
        plot_bgcolor=catppuccin_mocha['base'],  # Plot background color
        showlegend=True,
        legend=dict(
            font=dict(color=catppuccin_mocha['text'])  # Legend text color
        ),
        autosize=True,  # Make the chart resize based on screen size
        width=800,  # Set a default width for larger screens
        height=600,  # Set a default height for larger screens
    )

    # Convert the plot to HTML
    plot_html = pio.to_html(fig, full_html=False)

    # Wrap the HTML in a responsive div for better sizing
    responsive_html = f'''
    <div style="width: 100%; height: 100%; max-width: 100%; max-height: 600px; overflow: hidden; display: flex; justify-content: center;">
        {plot_html}
    </div>
    '''

    # Return the plot as an HTML response
    return Response(content=responsive_html, media_type="text/html")



@app.get("/focus_by_hour_histogram")
def focus_by_hour_histogram(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch focus score data for a specific user, extract the hour of the day, and generate a histogram.
    """
    # Query data from MongoDB
    data = list(flowmetrics_collection.find({"userId": userId}, {
        "timestamp": 1,
        "focusScore": 1,
        "_id": 0
    }))

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)

    # Convert timestamp to datetime and extract the hour
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df["hour"] = df["timestamp"].dt.hour

    # Debug: Print the DataFrame
    print("DataFrame with Hour:", df)

    # Create the histogram
    fig = px.histogram(
        df,
        x="hour",
        y="focusScore",
        nbins=24,  # 24 bins for 24 hours
        title=f"Focus Score by Hour of the Day for User {userId}",
        labels={"hour": "Hour of the Day", "focusScore": "Focus Score"},
        color_discrete_sequence=[catppuccin_mocha["blue"]]
    )

    # Update layout for better styling
    fig.update_layout(
        plot_bgcolor=catppuccin_mocha["base"],
        paper_bgcolor=catppuccin_mocha["base"],
        font_color=catppuccin_mocha["text"],
        xaxis=dict(
            title="Hour of the Day",
            gridcolor=catppuccin_mocha["overlay0"],
            tickvals=list(range(24)),  # Show all 24 hours
            ticktext=[f"{h:02d}:00" for h in range(24)]  # Format as "00:00", "01:00", etc.
        ),
        yaxis=dict(
            title="Focus Score",
            gridcolor=catppuccin_mocha["overlay0"]
        ),
        bargap=0.1  # Gap between bars
    )

    # Convert the plot to HTML
    plot_html = pio.to_html(fig, full_html=False)

    # Return the plot as an HTML response
    return Response(content=plot_html, media_type="text/html")

@app.get("/focus_by_hour_combo")
def focus_by_hour_combo(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch focus score data for a specific user, normalize the scores, and draw a combo chart (bars + curve).
    """
    # Query data from MongoDB
    data = list(flowmetrics_collection.find({"userId": userId}, {
        "timestamp": 1,
        "focusScore": 1,
        "_id": 0
    }))

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)

    # Convert timestamp to datetime and extract the hour
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df["hour"] = df["timestamp"].dt.hour

    # Group by hour and calculate the mean focus score
    hourly_focus = df.groupby("hour")["focusScore"].mean().reset_index()

    # Normalize the focus scores to a range of 0 to 1
    scaler = MinMaxScaler()
    hourly_focus["normalized_focus"] = scaler.fit_transform(hourly_focus[["focusScore"]])

    # Debug: Print the hourly focus data
    print("Hourly Focus Data:", hourly_focus)

    # Create the combo chart
    fig = go.Figure()

    # Add bars for raw focus scores
    fig.add_trace(go.Bar(
        x=hourly_focus["hour"],
        y=hourly_focus["focusScore"],
        name="Focus Score",
        marker_color=catppuccin_mocha["blue"],
        opacity=0.6  # Make bars semi-transparent
    ))

    # Add a line for normalized focus scores
    fig.add_trace(go.Scatter(
        x=hourly_focus["hour"],
        y=hourly_focus["normalized_focus"],
        name="Normalized Focus Score",
        mode="lines+markers",
        line=dict(color=catppuccin_mocha["pink"], width=3),
        marker=dict(size=8, color=catppuccin_mocha["pink"])
    ))

    # Update layout for better styling
    fig.update_layout(
        plot_bgcolor=catppuccin_mocha["base"],
        paper_bgcolor=catppuccin_mocha["base"],
        font_color=catppuccin_mocha["text"],
        xaxis=dict(
            title="Hour of the Day",
            gridcolor=catppuccin_mocha["overlay0"],
            tickvals=list(range(24)),  # Show all 24 hours
            ticktext=[f"{h:02d}:00" for h in range(24)]  # Format as "00:00", "01:00", etc.
        ),
        yaxis=dict(
            title="Focus Score",
            gridcolor=catppuccin_mocha["overlay0"]
        ),
        barmode="overlay",  # Overlay bars and line
        legend=dict(
            x=0.02,  # Position legend at the top-left
            y=0.98,
            bgcolor="rgba(0,0,0,0)"  # Transparent background
        )
    )

    # Convert the plot to HTML
    plot_html = pio.to_html(fig, full_html=False)

    # Return the plot as an HTML response
    return Response(content=plot_html, media_type="text/html")

@app.get("/quality_radar_chart")
def quality_radar_chart(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch quality scores for a specific user, calculate the average scores, and generate a radar chart.
    """
    # Query quality scores from MongoDB
    data = list(codeanalyses_collection.find({"userId": userId}, {
        "quality.readability": 1,
        "quality.maintainability": 1,
        "quality.modularity": 1,
        "quality.documentation": 1,
        "quality.errorHandling": 1,
        "quality.duplication": 1,
        "_id": 0
    }))

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)

    # Debug: Print the fetched data
    print("Fetched Data:", df)

    # Check if the DataFrame is empty
    if df.empty:
        return Response(content="No quality data found for the specified user.", media_type="text/plain")

    # Flatten the nested 'quality' structure
    df = pd.json_normalize(df.to_dict('records'))

    # Rename columns for easier access
    df.columns = [
        'readability',
        'maintainability',
        'modularity',
        'documentation',
        'errorHandling',
        'duplication'
    ]

    # Calculate average scores for each quality metric
    avg_scores = df.mean().to_dict()

    # Debug: Print the average scores
    print("Average Scores:", avg_scores)

    # Create the radar chart
    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=list(avg_scores.values()),
        theta=list(avg_scores.keys()),
        fill='toself',
        name='Quality Metrics',
        fillcolor=catppuccin_mocha['purple'],  # Fill color
        line=dict(color=catppuccin_mocha['pink'])  # Line color
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100],  # Scores are out of 100
                color=catppuccin_mocha['text']  # Radial axis color
            ),
            angularaxis=dict(
                color=catppuccin_mocha['text']  # Angular axis color
            ),
            bgcolor=catppuccin_mocha['base']  # Background color
        ),
        title=f'Quality Metrics (Radar Chart) for User {userId}',
        title_font=dict(color=catppuccin_mocha['text']),  # Title color
        font=dict(color=catppuccin_mocha['text']),  # General text color
        paper_bgcolor=catppuccin_mocha['base'],  # Paper background color
        plot_bgcolor=catppuccin_mocha['base'],  # Plot background color
        showlegend=True,
        legend=dict(
            font=dict(color=catppuccin_mocha['text'])  # Legend text color
        )
    )

    # Convert the plot to HTML
    plot_html = pio.to_html(fig, full_html=False)

    # Return the plot as an HTML response
    return Response(content=plot_html, media_type="text/html")

@app.get("/developer_rating")
def developer_rating(userId: str = Query(..., description="The user ID to filter data")):
    """
    Fetch code analysis and flow metrics data for a specific user, normalize and weight the metrics,
    and calculate a composite developer rating with priority on code analysis, focus score, and errors.
    """
    # Fetch code analysis data
    code_analysis_data = list(codeanalyses_collection.find({"userId": userId}, {
        "quality.readability": 1,
        "quality.maintainability": 1,
        "quality.modularity": 1,
        "quality.documentation": 1,
        "quality.errorHandling": 1,
        "quality.duplication": 1,
        "_id": 0
    }))

    # Fetch flow metrics data
    flow_metrics_data = list(flowmetrics_collection.find({"userId": userId}, {
        "focusScore": 1,
        "sessionDuration": 1,  # Assuming sessionDuration is in milliseconds
        "errorMetrics.syntaxErrors": 1,
        "errorMetrics.warningCount": 1,
        "errorMetrics.problemCount": 1,
        "_id": 0
    }))

    # Convert data to DataFrames
    df_code_analysis = pd.DataFrame(code_analysis_data)
    df_flow_metrics = pd.DataFrame(flow_metrics_data)

    # Check if DataFrames are empty
    if df_code_analysis.empty:
        return {"message": "No code analysis data found for the specified user."}
    if df_flow_metrics.empty:
        return {"message": "No flow metrics data found for the specified user."}

    # Flatten nested structures
    df_code_analysis = pd.json_normalize(df_code_analysis.to_dict('records'))
    df_flow_metrics = pd.json_normalize(df_flow_metrics.to_dict('records'))

    # Rename columns for easier access
    df_code_analysis.columns = [
        'readability',
        'maintainability',
        'modularity',
        'documentation',
        'errorHandling',
        'duplication'
    ]

    df_flow_metrics.columns = [
        'focusScore',
        'sessionDuration',
        'syntaxErrors',
        'warningCount',
        'problemCount'
    ]

    # Normalize the data (scale to 0-100)
    scaler = MinMaxScaler(feature_range=(0, 100))
    df_code_analysis = pd.DataFrame(scaler.fit_transform(df_code_analysis), columns=df_code_analysis.columns)
    df_flow_metrics = pd.DataFrame(scaler.fit_transform(df_flow_metrics), columns=df_flow_metrics.columns)

    # Calculate weighted focus score based on session duration
    df_flow_metrics['weighted_focus_score'] = df_flow_metrics['focusScore'] * (df_flow_metrics['sessionDuration'] / df_flow_metrics['sessionDuration'].sum())

    # Calculate average weighted focus score
    average_focus_score = df_flow_metrics['weighted_focus_score'].sum()

    # Define weights for code analysis and flow metrics
    weights_code_analysis = {
        'readability': 0.30,
        'maintainability': 0.30,
        'modularity': 0.15,
        'documentation': 0.15,
        'errorHandling': 0.05,
        'duplication': 0.05
    }

    weights_flow_metrics = {
        'focusScore': 0.50,  # Higher weight for focus score
        'syntaxErrors': 0.20,
        'warningCount': 0.20,
        'problemCount': 0.10
    }

    # Calculate weighted scores for code analysis
    df_code_analysis['weighted_score'] = (
        df_code_analysis['readability'] * weights_code_analysis['readability'] +
        df_code_analysis['maintainability'] * weights_code_analysis['maintainability'] +
        df_code_analysis['modularity'] * weights_code_analysis['modularity'] +
        df_code_analysis['documentation'] * weights_code_analysis['documentation'] +
        df_code_analysis['errorHandling'] * weights_code_analysis['errorHandling'] +
        df_code_analysis['duplication'] * weights_code_analysis['duplication']
    )

    # Calculate weighted scores for flow metrics
    df_flow_metrics['weighted_score'] = (
        df_flow_metrics['focusScore'] * weights_flow_metrics['focusScore'] +
        df_flow_metrics['syntaxErrors'] * weights_flow_metrics['syntaxErrors'] +
        df_flow_metrics['warningCount'] * weights_flow_metrics['warningCount'] +
        df_flow_metrics['problemCount'] * weights_flow_metrics['problemCount']
    )

    # Calculate overall scores
    code_analysis_score = df_code_analysis['weighted_score'].mean()
    flow_metrics_score = df_flow_metrics['weighted_score'].mean()

    # Combine scores into a composite rating
    composite_rating = (code_analysis_score * 0.6) + (flow_metrics_score * 0.4)  # 60% code analysis, 40% flow metrics

    # Round the scores for better readability
    composite_rating = round(composite_rating, 2)
    code_analysis_score = round(code_analysis_score, 2)
    flow_metrics_score = round(flow_metrics_score, 2)
    average_focus_score = round(average_focus_score, 2)

    # Prepare the response
    response = {
        "userId": userId,
        "compositeRating": composite_rating,
        "codeAnalysisScore": code_analysis_score,
        "flowMetricsScore": flow_metrics_score,
        "averageFocusScore": average_focus_score,
        "codeAnalysisDetails": df_code_analysis.to_dict("records"),
        "flowMetricsDetails": df_flow_metrics.to_dict("records")
    }

    return response
