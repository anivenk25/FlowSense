import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Parameters
NUM_DAYS = 100  # Simulate 30 days of data
SESSIONS_PER_DAY = 5  # 5 coding sessions per day
METRICS = [
    'typing_rhythm', 'tab_switches', 'errors', 'debugging', 'active_file_duration', 'idle_time'
]

# Generate timestamps
start_date = datetime.now() - timedelta(days=NUM_DAYS)
timestamps = pd.date_range(start_date, periods=NUM_DAYS * SESSIONS_PER_DAY, freq='H')

# Generate synthetic data
data = []
for timestamp in timestamps:
    # Simulate time-of-day effects (e.g., more productive in the morning)
    hour = timestamp.hour
    if 9 <= hour <= 12:  # Morning
        typing_rhythm = np.random.normal(90, 5)  # High consistency
        tab_switches = np.random.poisson(2)  # Few tab switches
        errors = np.random.poisson(1)  # Few errors
        debugging = np.random.poisson(0.5)  # Minimal debugging
        active_file_duration = np.random.normal(20, 5)  # Long focus
        idle_time = np.random.normal(1, 0.5)  # Minimal idle time
    elif 13 <= hour <= 17:  # Afternoon
        typing_rhythm = np.random.normal(70, 10)
        tab_switches = np.random.poisson(5)
        errors = np.random.poisson(3)
        debugging = np.random.poisson(2)
        active_file_duration = np.random.normal(15, 5)
        idle_time = np.random.normal(3, 1)
    else:  # Evening/Night
        typing_rhythm = np.random.normal(60, 15)
        tab_switches = np.random.poisson(10)
        errors = np.random.poisson(5)
        debugging = np.random.poisson(3)
        active_file_duration = np.random.normal(10, 5)
        idle_time = np.random.normal(5, 2)

    # Add noise to simulate variability
    metrics = {
        'timestamp': timestamp,
        'typing_rhythm': max(0, min(100, typing_rhythm)),
        'tab_switches': max(0, tab_switches),
        'errors': max(0, errors),
        'debugging': max(0, debugging),
        'active_file_duration': max(0, active_file_duration),
        'idle_time': max(0, idle_time),
    }
    data.append(metrics)

# Convert to DataFrame
df = pd.DataFrame(data)
df.to_csv('new_developer_data.csv', index=False)
print("Synthetic data saved to 'synthetic_developer_data.csv'")
