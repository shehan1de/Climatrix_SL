from flask import Flask, request, jsonify
import pandas as pd
import pickle
from utils import (
    predict_user_weather,
    generate_forecast_message,
    generate_forecast_plot,
    send_history_to_node
)
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

with open("models/xgb_best_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

df_clean = pd.read_csv("models/cleaned_dataset.csv")

feature_cols = [
    c for c in df_clean.columns
    if c not in [
        "rain_sum",
        "windspeed_10m_max",
        "windgusts_10m_max",
        "precipitation_hours",
        "city",
        "time"
    ]
]

city_mapping = {
    city: idx for idx, city in enumerate(sorted(df_clean["city"].unique()))
}

PARAMETER_NAMES = {
    "rain_sum": "Rainfall",
    "windspeed_10m_max": "Wind Speed",
    "windgusts_10m_max": "Wind Gusts"
}

@app.route("/")
def home():
    return "ClimatrixSL Flask API running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        city = data["city"]
        parameter = data["parameter"]
        timeframe = data["timeframe"]
        min_or_max = data["min_or_max"]
        userId = data.get("userId")  # <-- get userId from frontend

        last_rows = df_clean[df_clean["city"] == city].tail(10)
        if last_rows.empty:
            return jsonify({"error": "City not found"}), 400

        predictions, value, risk = predict_user_weather(
            city,
            parameter,
            timeframe,
            min_or_max,
            last_rows,
            model,
            scaler,
            city_mapping,
            feature_cols
        )

        friendly_parameter = PARAMETER_NAMES[parameter]

        result = {
            "city": city,
            "parameter": friendly_parameter,
            "timeframe": timeframe,
            "min_or_max": min_or_max,
            "predicted_value": round(float(value), 2),
            "disaster_risk": risk,
            "forecast_message": generate_forecast_message(
                city, friendly_parameter, value, risk, timeframe
            ),
            "forecast_series": predictions[
                :, {"rain_sum": 0, "windspeed_10m_max": 1, "windgusts_10m_max": 2}[parameter]
            ].tolist(),
            "forecast_plot": generate_forecast_plot(predictions, parameter)
        }

        # -------------------- Save to Node backend --------------------
        if userId is not None:
            send_history_to_node(result, userId=userId)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
