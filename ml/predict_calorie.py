import sys
import json
import joblib
import numpy as np
import os
import pandas as pd
import xgboost as xgb


# --- Load model & scaler ---
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "model.json")
scaler_path = os.path.join(base_dir, "scaler.pkl")

booster = xgb.Booster()
booster.load_model(model_path)
scaler = joblib.load(scaler_path)

# --- Read input JSON from Node.js ---
input_json = sys.stdin.read()
data = json.loads(input_json)

# --- Extract raw features ---
age = int(data["age"])
gender = 1 if data["gender"] == "Male" else 0
height = float(data["height"])        # cm
weight = float(data["weight"])        # kg
body_temp = float(data["body_temp"])  # °C
duration = float(data["duration"])    # minutes
heart_rate = float(data["heart_rate"])  # bpm

# --- Feature Engineering ---
height_m = height / 100
bmi = weight / (height_m ** 2)
duration_x_hr = duration * heart_rate
duration_x_temp = duration * body_temp
hr_x_temp = heart_rate * body_temp
hr_per_min = heart_rate / duration
temp_per_min = body_temp / duration
hr_per_weight = heart_rate / weight

# --- Construct feature vector as DataFrame ---
features = {
    "Gender": gender,
    "Age": age,
    "Duration": duration,
    "Heart_Rate": heart_rate,
    "Body_Temp": body_temp,
    "duration_x_hr": duration_x_hr,
    "duration_x_temp": duration_x_temp,
    "hr_x_temp": hr_x_temp,
    "hr_per_min": hr_per_min,
    "temp_per_min": temp_per_min,
    "BMI": bmi,
    "HR_per_Weight": hr_per_weight
}

# --- Scale input ---
df_input = pd.DataFrame([features])
scaled_input = scaler.transform(df_input)

# --- Predict calories ---
dtest = xgb.DMatrix(scaled_input)
calories = booster.predict(dtest)[0]


# --- Output result to Node.js ---
print(json.dumps({
    "calories": float(round(calories, 2)),
    "bmi" : float(round(bmi, 2))
}))
