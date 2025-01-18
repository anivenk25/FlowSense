import random
import math
from faker import Faker
from pymongo import MongoClient

# Initialize Faker for generating fake data
fake = Faker()

# Connect to MongoDB (replace with your connection string)
client = MongoClient("mongodb+srv://mangarajanmol666:test123@cluster0.yq1bt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["developer_db"]
collection = db["users"]

# List of possible languages and technologies
languages = ["JavaScript", "Python", "Java", "C++", "Go", "Ruby", "TypeScript", "Swift", "Kotlin", "Rust"]
technologies = ["React", "Node.js", "Docker", "Kubernetes", "AWS", "TensorFlow", "Flask", "Django", "GraphQL", "PostgreSQL"]

# Central location (latitude and longitude)
central_latitude = 40.7128  # Latitude of New York, NY
central_longitude = -74.0060  # Longitude of New York, NY

# Earth's radius in kilometers
EARTH_RADIUS = 6371

# Function to generate a random point within a 100 km radius of the central location
def generate_point_within_radius(center_lat, center_lon, radius_km):
    # Convert latitude and longitude from degrees to radians
    center_lat_rad = math.radians(center_lat)
    center_lon_rad = math.radians(center_lon)

    # Generate a random distance within the radius (in kilometers)
    distance = random.uniform(0, radius_km)

    # Generate a random bearing (direction) in radians
    bearing = random.uniform(0, 2 * math.pi)

    # Calculate the new latitude and longitude using the Haversine formula
    new_lat_rad = math.asin(
        math.sin(center_lat_rad) * math.cos(distance / EARTH_RADIUS) +
        math.cos(center_lat_rad) * math.sin(distance / EARTH_RADIUS) * math.cos(bearing)
    )
    new_lon_rad = center_lon_rad + math.atan2(
        math.sin(bearing) * math.sin(distance / EARTH_RADIUS) * math.cos(center_lat_rad),
        math.cos(distance / EARTH_RADIUS) - math.sin(center_lat_rad) * math.sin(new_lat_rad)
    )

    # Convert back to degrees
    new_lat = math.degrees(new_lat_rad)
    new_lon = math.degrees(new_lon_rad)

    return new_lat, new_lon

# Function to generate dummy data for a developer
def generate_dummy_developer():
    # Generate a random point within a 100 km radius of the central location
    latitude, longitude = generate_point_within_radius(central_latitude, central_longitude, 100)

    return {
        "username": fake.user_name(),
        "email": fake.email(),
        "password": fake.password(),
        "developerScore": round(random.uniform(50, 100), 2),  # Random score between 50 and 100
        "totalSessions": random.randint(50, 500),  # Random number of sessions between 50 and 500
        "avgSessionLength": round(random.uniform(30, 120), 2),  # Random session length between 30 and 120 minutes
        "location": f"Near New York, NY",  # General location description
        "latitude": latitude,  # Latitude within 100 km radius
        "longitude": longitude,  # Longitude within 100 km radius
        "topLanguages": random.sample(languages, k=random.randint(1, 5)),  # Random selection of 1-5 languages
        "topTechnologies": random.sample(technologies, k=random.randint(1, 5)),  # Random selection of 1-5 technologies
        "createdAt": fake.date_time_between(start_date="-1y", end_date="now").isoformat(),
        "updatedAt": fake.date_time_between(start_date="-1y", end_date="now").isoformat(),
    }

# Generate and insert dummy data into MongoDB
def insert_dummy_data(num_developers=10):
    for _ in range(num_developers):
        developer = generate_dummy_developer()
        collection.insert_one(developer)
    print(f"Inserted {num_developers} dummy developers into the database.")

# Run the script
if __name__ == "__main__":
    insert_dummy_data(num_developers=200)  # Generate 200 dummy developers
