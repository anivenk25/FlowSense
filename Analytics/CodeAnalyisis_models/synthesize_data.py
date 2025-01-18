import csv
import random
import numpy as np
from faker import Faker
from datetime import datetime, timedelta

# Initialize Faker for generating realistic data
fake = Faker()

# Define constants for generating synthetic data
NUM_RECORDS = 50000  # Number of records to generate
USER_IDS = [fake.uuid4() for _ in range(200)]  # Generate 20 unique user IDs
LANGUAGES = ["JavaScript", "Python", "Java", "C++", "Go", "TypeScript", "Ruby", "Rust"]
PROBLEM_TYPES = ["Algorithm", "Data Structure", "System Design", "API Design", "Debugging", "Optimization"]
DOMAINS = ["Backend", "Frontend", "Database", "DevOps", "Cloud", "Mobile"]
FUNCTIONALITIES = [
    "Sorting algorithm", "Search algorithm", "Authentication", "Data processing",
    "API integration", "Database query optimization", "UI rendering", "Error handling"
]
COMPLEXITY_LEVELS = ["Easy", "Medium", "Hard"]
DEVELOPER_EXPERTISE = ["Beginner", "Intermediate", "Expert"]

# Function to generate a random timestamp within a given range
def random_timestamp(start_date, end_date):
    delta = end_date - start_date
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_date + timedelta(seconds=random_seconds)

# Function to generate time and space complexity based on problem type and complexity level
def generate_complexity(problem_type, complexity_level):
    if problem_type == "Algorithm":
        if complexity_level == "Easy":
            return "O(n)", "O(1)"
        elif complexity_level == "Medium":
            return "O(n log n)", "O(n)"
        else:
            return "O(n^2)", "O(n)"
    elif problem_type == "Data Structure":
        if complexity_level == "Easy":
            return "O(1)", "O(n)"
        elif complexity_level == "Medium":
            return "O(log n)", "O(n)"
        else:
            return "O(n)", "O(n^2)"
    else:
        return "O(1)", "O(1)"

# Function to generate quality metrics based on problem complexity and developer expertise
def generate_quality(complexity_level, expertise):
    if expertise == "Beginner":
        readability = random.randint(50, 80)
        maintainability = random.randint(50, 80)
        modularity = random.randint(40, 70)
        documentation = random.randint(30, 60)
        error_handling = random.randint(40, 70)
        duplication = random.randint(50, 80)
    elif expertise == "Intermediate":
        readability = random.randint(70, 90)
        maintainability = random.randint(70, 90)
        modularity = random.randint(60, 80)
        documentation = random.randint(50, 80)
        error_handling = random.randint(60, 80)
        duplication = random.randint(40, 70)
    else:
        readability = random.randint(80, 100)
        maintainability = random.randint(80, 100)
        modularity = random.randint(70, 90)
        documentation = random.randint(70, 90)
        error_handling = random.randint(70, 90)
        duplication = random.randint(30, 60)

    # Adjust quality metrics based on complexity level
    if complexity_level == "Hard":
        readability = max(50, readability - 10)
        maintainability = max(50, maintainability - 10)
        modularity = max(40, modularity - 10)
        documentation = max(30, documentation - 10)
        error_handling = max(40, error_handling - 10)
        duplication = min(90, duplication + 10)

    # Introduce some noise to simulate LLM imperfections
    if random.random() < 0.1:  # 10% chance of noise
        readability = random.randint(0, 100)
        maintainability = random.randint(0, 100)

    return {
        "readability": readability,
        "maintainability": maintainability,
        "modularity": modularity,
        "documentation": documentation,
        "errorHandling": error_handling,
        "duplication": duplication
    }

# Function to generate synthetic data for a single record
def generate_record():
    # Generate base metrics with realistic relationships
    language = random.choice(LANGUAGES)
    problem_type = random.choice(PROBLEM_TYPES)
    domain = random.choice(DOMAINS)
    functionality = random.choice(FUNCTIONALITIES)
    complexity_level = random.choice(COMPLEXITY_LEVELS)
    expertise = random.choice(DEVELOPER_EXPERTISE)

    # Generate complexity metrics
    time_complexity, space_complexity = generate_complexity(problem_type, complexity_level)

    # Introduce some noise to simulate LLM imperfections
    if random.random() < 0.05:  # 5% chance of noise
        time_complexity = random.choice(["O(1)", "O(n)", "O(n log n)", "O(n^2)"])
        space_complexity = random.choice(["O(1)", "O(n)", "O(n^2)"])

    # Generate quality metrics
    quality = generate_quality(complexity_level, expertise)

    # Generate timestamps
    timestamp = random_timestamp(datetime(2023, 1, 1), datetime(2023, 12, 31))
    created_at = timestamp
    updated_at = timestamp

    # Create the record
    record = {
        "_id": {"$oid": fake.uuid4()},
        "userId": random.choice(USER_IDS),
        "language": language,
        "problem": {
            "type": problem_type,
            "domain": domain,
            "functionality": functionality,
            "complexity": complexity_level
        },
        "complexity": {
            "time": time_complexity,
            "space": space_complexity
        },
        "quality": {
            "readability": {"$numberInt": str(quality["readability"])},
            "maintainability": {"$numberInt": str(quality["maintainability"])},
            "modularity": {"$numberInt": str(quality["modularity"])},
            "documentation": {"$numberInt": str(quality["documentation"])},
            "errorHandling": {"$numberInt": str(quality["errorHandling"])},
            "duplication": {"$numberInt": str(quality["duplication"])}
        },
        "timestamp": {"$date": {"$numberLong": str(int(timestamp.timestamp() * 1000))}},
        "createdAt": {"$date": {"$numberLong": str(int(created_at.timestamp() * 1000))}},
        "updatedAt": {"$date": {"$numberLong": str(int(updated_at.timestamp() * 1000))}},
        "__v": {"$numberInt": "0"}
    }
    return record

# Function to flatten nested JSON structure for CSV
def flatten_record(record):
    flat_record = {
        "_id": record["_id"]["$oid"],
        "userId": record["userId"],
        "language": record["language"],
        "problem_type": record["problem"]["type"],
        "problem_domain": record["problem"]["domain"],
        "problem_functionality": record["problem"]["functionality"],
        "problem_complexity": record["problem"]["complexity"],
        "complexity_time": record["complexity"]["time"],
        "complexity_space": record["complexity"]["space"],
        "quality_readability": record["quality"]["readability"]["$numberInt"],
        "quality_maintainability": record["quality"]["maintainability"]["$numberInt"],
        "quality_modularity": record["quality"]["modularity"]["$numberInt"],
        "quality_documentation": record["quality"]["documentation"]["$numberInt"],
        "quality_errorHandling": record["quality"]["errorHandling"]["$numberInt"],
        "quality_duplication": record["quality"]["duplication"]["$numberInt"],
        "timestamp": record["timestamp"]["$date"]["$numberLong"],
        "createdAt": record["createdAt"]["$date"]["$numberLong"],
        "updatedAt": record["updatedAt"]["$date"]["$numberLong"],
        "__v": record["__v"]["$numberInt"]
    }
    return flat_record

# Generate synthetic dataset
synthetic_data = [flatten_record(generate_record()) for _ in range(NUM_RECORDS)]

# Write synthetic dataset to CSV
csv_file = "synthetic_code_quality_dataset.csv"
with open(csv_file, mode="w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=synthetic_data[0].keys())
    writer.writeheader()
    writer.writerows(synthetic_data)

print(f"Synthetic dataset generated and saved to {csv_file}")
