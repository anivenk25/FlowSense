from pymongo import MongoClient
import matplotlib.pyplot as plt
import seaborn as sns

# Connect to MongoDB (replace with your connection string)
client = MongoClient("mongodb+srv://mangarajanmol666:test123@cluster0.yq1bt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["test"]  # Connect to the 'test' database
collection = db["flowmetrics"]  # Use the 'flowmetrics' collection

# Define the user ID
user_id = "123"

# Aggregation pipeline to calculate metrics
pipeline = [
    # Match documents for the specific user
    {"$match": {"userId": user_id}},
    # Group by user and calculate totals
    {
        "$group": {
            "_id": "$userId",
            "totalTimeSpent": {"$sum": "$sessionDuration"},  # Total time spent
            "totalSessions": {"$sum": 1},  # Total number of sessions
            "sessions": {"$push": "$timestamp"},  # Collect all session timestamps
            "averageSessionDuration": {"$avg": "$sessionDuration"},  # Average session duration
        }
    },
    # Unwind the sessions array to analyze timestamps
    {"$unwind": "$sessions"},
    # Extract the hour and day of the week from each session timestamp
    {
        "$project": {
            "hour": {"$hour": "$sessions"},  # Extract hour (0-23)
            "dayOfWeek": {"$dayOfWeek": "$sessions"},  # Extract day of the week (1=Sunday, 7=Saturday)
        }
    },
    # Group by hour and count sessions per hour
    {
        "$group": {
            "_id": "$hour",
            "sessionCount": {"$sum": 1},  # Count sessions per hour
        }
    },
    # Sort by session count in descending order
    {"$sort": {"sessionCount": -1}},
    # Limit to the top 1 most active hour
    {"$limit": 1},
]

# Execute the aggregation pipeline
result = list(collection.aggregate(pipeline))

# Extract metrics
if result:
    most_active_hour = result[0]["_id"]
    session_count_at_hour = result[0]["sessionCount"]
else:
    most_active_hour = None
    session_count_at_hour = 0

# Calculate total time spent and total sessions
total_metrics = list(
    collection.aggregate(
        [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": "$userId",
                    "totalTimeSpent": {"$sum": "$sessionDuration"},
                    "totalSessions": {"$sum": 1},
                    "averageSessionDuration": {"$avg": "$sessionDuration"},
                }
            },
        ]
    )
)

if total_metrics:
    total_time_spent = total_metrics[0]["totalTimeSpent"]
    total_sessions = total_metrics[0]["totalSessions"]
    average_session_duration = total_metrics[0]["averageSessionDuration"]
else:
    total_time_spent = 0
    total_sessions = 0
    average_session_duration = 0

# Calculate most active day of the week
day_of_week_result = list(
    collection.aggregate(
        [
            {"$match": {"userId": user_id}},
            {"$unwind": "$sessions"},
            {
                "$project": {
                    "dayOfWeek": {"$dayOfWeek": "$sessions"},  # Extract day of the week
                }
            },
            {
                "$group": {
                    "_id": "$dayOfWeek",
                    "sessionCount": {"$sum": 1},  # Count sessions per day
                }
            },
            {"$sort": {"sessionCount": -1}},
            {"$limit": 1},
        ]
    )
)

if day_of_week_result:
    most_active_day = day_of_week_result[0]["_id"]
    session_count_at_day = day_of_week_result[0]["sessionCount"]
else:
    most_active_day = None
    session_count_at_day = 0

# Map day of the week number to day name
day_names = {
    1: "Sunday",
    2: "Monday",
    3: "Tuesday",
    4: "Wednesday",
    5: "Thursday",
    6: "Friday",
    7: "Saturday",
}
most_active_day_name = day_names.get(most_active_day, "Unknown")

# Print results
print(f"Total Time Spent: {total_time_spent:.2f} minutes")
print(f"Total Sessions: {total_sessions}")
print(f"Average Session Duration: {average_session_duration:.2f} minutes")
print(f"Most Active Hour: {most_active_hour}:00 ({session_count_at_hour} sessions)")
print(f"Most Active Day: {most_active_day_name} ({session_count_at_day} sessions)")

# Visualization: Session Distribution by Hour
hourly_sessions = list(
    collection.aggregate(
        [
            {"$match": {"userId": user_id}},
            {"$unwind": "$sessions"},
            {
                "$project": {
                    "hour": {"$hour": "$sessions"},
                }
            },
            {
                "$group": {
                    "_id": "$hour",
                    "sessionCount": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
    )
)

# Prepare data for visualization
hours = [x["_id"] for x in hourly_sessions]
session_counts = [x["sessionCount"] for x in hourly_sessions]

# Plot session distribution by hour
plt.figure(figsize=(10, 6))
sns.barplot(x=hours, y=session_counts, palette="viridis")
plt.title(f"Session Distribution by Hour for User {user_id}")
plt.xlabel("Hour of the Day")
plt.ylabel("Number of Sessions")
plt.xticks(range(24))

# Save the plot to a file
plt.savefig("session_distribution_by_hour.png")
print("Plot saved to 'session_distribution_by_hour.png'")
