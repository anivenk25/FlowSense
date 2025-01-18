import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Function to generate meaningful synthetic data
def generate_synthetic_data(num_records, num_users=3):
    data = []
    base_timestamp = datetime.now()

    # Define clusters for productivity patterns
    clusters = {
        "High Productivity": {"focus_score_mean": 80, "typing_rhythm_mean": 80, "idle_time_mean": 300},
        "Moderate Productivity": {"focus_score_mean": 60, "typing_rhythm_mean": 60, "idle_time_mean": 600},
        "Low Productivity": {"focus_score_mean": 40, "typing_rhythm_mean": 40, "idle_time_mean": 900}
    }

    for i in range(num_records):
        # Randomize time intervals (1 to 10 minutes)
        time_interval = timedelta(minutes=random.randint(1, 10))
        timestamp = (base_timestamp + time_interval).isoformat()
        base_timestamp += time_interval

        # Simulate multiple users
        user_id = f"user_{random.randint(1, num_users)}"

        # Randomly assign a productivity cluster
        cluster = random.choice(list(clusters.keys()))
        focus_score = round(np.random.normal(loc=clusters[cluster]["focus_score_mean"], scale=10), 1)
        focus_score = max(0, min(100, focus_score))  # Ensure focus score is within 0-100

        # Simulate typing rhythm correlated with focus score
        typing_rhythm = int(np.random.normal(loc=clusters[cluster]["typing_rhythm_mean"], scale=10))
        typing_rhythm = max(0, min(100, typing_rhythm))  # Ensure typing rhythm is within 0-100

        # Simulate idle time based on cluster
        idle_time = round(np.random.normal(loc=clusters[cluster]["idle_time_mean"], scale=100), 3)
        idle_time = max(0, idle_time)  # Ensure idle time is non-negative

        # Simulate session duration (longer sessions for high productivity)
        session_duration = round(np.random.normal(loc=30 + 20 * (focus_score / 100), scale=10), 6)

        # Simulate active file duration (correlated with focus score)
        active_file_duration = round(np.random.normal(loc=1200 * (focus_score / 100), scale=200), 3)

        # Simulate tab metrics with variability
        tab_metrics = {
            "total": random.randint(1, 20),
            "rapid": random.randint(0, 5),
            "patterns": {
                "backAndForth": random.randint(0, 3),
                "sequential": random.randint(0, 5)
            }
        }

        # Simulate copy-paste metrics with variability
        copy_paste_metrics = {
            "total": random.randint(0, 10),
            "copy": random.randint(0, 5),
            "cut": random.randint(0, 3),
            "paste": random.randint(0, 5)
        }

        # Simulate error metrics with variability (higher errors for lower focus score)
        error_metrics = {
            "syntaxErrors": random.randint(0, 2) if focus_score > 50 else random.randint(1, 5),
            "warningCount": random.randint(0, 5) if focus_score > 50 else random.randint(2, 10),
            "problemCount": random.randint(0, 10) if focus_score > 50 else random.randint(5, 20)
        }

        # Simulate code metrics with variability
        code_metrics = {
            "linesAdded": random.randint(0, 200),
            "linesDeleted": random.randint(0, 50),
            "fileEdits": random.randint(1, 10),
            "codeComplexity": random.randint(0, 10),
            "testCoverage": random.randint(0, 100)
        }

        # Simulate productivity status based on focus score
        if focus_score > 70:
            productivity_status = "Focused 🎯"
        elif focus_score > 40:
            productivity_status = "In Flow 🌊"
        else:
            productivity_status = "Distracted 😕"

        # Simulate achievements with variability (more likely for high focus score and low idle time)
        achievements = []
        if focus_score > 70 and idle_time < 500:  # High focus and low idle time
            achievement_types = ["CLEAN_CODE_CHAMPION", "DEBUGGING_MASTER", "PRODUCTIVITY_GURU"]
            achievements.append({
                "type": random.choice(achievement_types),
                "description": "Maintained high code quality standards!",
                "_id": f"678b4b6b45ee875d7437c6a{i}_ach",
                "timestamp": timestamp
            })

        # Simulate error summary with variability
        error_summary = {
            "total": error_metrics["syntaxErrors"] + error_metrics["warningCount"] + error_metrics["problemCount"],
            "bySeverity": {
                "error": error_metrics["syntaxErrors"],
                "warning": error_metrics["warningCount"],
                "info": error_metrics["problemCount"]
            },
            "byLanguage": {},
            "recent": []
        }

        record = {
            "_id": f"678b4b6b45ee875d7437c6a{i}",
            "timestamp": timestamp,
            "userId": user_id,
            "focusScore": focus_score,
            "currentStreak": random.randint(0, 5),
            "longestStreak": random.randint(1, 10),
            "sessionDuration": session_duration,
            "activeFileDuration": active_file_duration,
            "idleTime": idle_time,
            "typingRhythm": typing_rhythm,
            "tabMetrics": tab_metrics,
            "copyPasteMetrics": copy_paste_metrics,
            "errorMetrics": error_metrics,
            "codeMetrics": code_metrics,
            "productivityStatus": productivity_status,
            "achievements": achievements,
            "errorSummary": error_summary,
            "__v": 0,
            "cluster": cluster  # Add cluster label for evaluation
        }
        data.append(record)

    return pd.DataFrame(data)

# Generate synthetic data
num_records = 10000  # Number of records to generate
synthetic_data = generate_synthetic_data(num_records)

# Save to a CSV file
synthetic_data.to_csv('synthetic_developer_data.csv', index=False)
print("Synthetic data saved to synthetic_developer_data.csv")
