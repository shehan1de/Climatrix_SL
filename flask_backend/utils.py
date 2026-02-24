import numpy as np
import pandas as pd
import io
import base64
import requests
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

def predict_user_weather(
    city_name, parameter, timeframe, min_or_max,
    last_known_df, model, scaler, city_mapping, feature_cols
):
    """
    Predict future weather parameter values for a city.
    """
    days = {"day": 1, "week": 7, "month": 30}[timeframe]
    predictions = []
    temp_df = last_known_df.copy().reset_index(drop=True)

    for _ in range(days):
        X = temp_df.iloc[-1:].copy()
        X["city_encoded"] = city_mapping[city_name]
        X_scaled = scaler.transform(X[feature_cols])
        y_pred = model.predict(X_scaled)[0]
        predictions.append(y_pred)

        # Update lag columns
        for i, col in enumerate([
            "rain_sum", "windspeed_10m_max",
            "windgusts_10m_max", "precipitation_hours"
        ]):
            for lag in range(3, 0, -1):
                lag_col = f"{col}_lag{lag}"
                if lag_col in X.columns:
                    X[lag_col] = y_pred[i] if lag == 1 else X[f"{col}_lag{lag-1}"].values[0]

        temp_df = pd.concat([temp_df, X], ignore_index=True)

    predictions = np.array(predictions)
    idx = {"rain_sum": 0, "windspeed_10m_max": 1, "windgusts_10m_max": 2}[parameter]
    values = predictions[:, idx]
    value = values.min() if min_or_max == "min" else values.max()

    rain, wind, gust = predictions[:, 0].max(), predictions[:, 1].max(), predictions[:, 2].max()
    risk = "Low Risk"
    if rain > 50 or wind > 50 or gust > 70:
        risk = "High Risk"
    elif rain > 20 or wind > 20 or gust > 30:
        risk = "Moderate Risk"

    return predictions, value, risk

def generate_forecast_message(city, parameter, value, risk, timeframe):
    msg = f"In {city}, the forecast for {parameter} over the next {timeframe} "
    if risk == "High Risk":
        msg += f"is very severe ({value:.2f}). Take immediate precautions!"
    elif risk == "Moderate Risk":
        msg += f"is moderate ({value:.2f}). Plan activities carefully."
    else:
        msg += f"is normal ({value:.2f}). Conditions are generally safe."

    if parameter == "Rainfall":
        msg += " Heavy rain may affect paddy fields and outdoor work."
    else:
        msg += " Strong winds may affect fishing, boats, and tall crops."

    return msg

def generate_forecast_plot(predictions, parameter):
    names = {
        "rain_sum": "Rainfall",
        "windspeed_10m_max": "Wind Speed",
        "windgusts_10m_max": "Wind Gusts"
    }
    idx = {"rain_sum": 0, "windspeed_10m_max": 1, "windgusts_10m_max": 2}[parameter]

    plt.figure(figsize=(8, 4))
    plt.plot(predictions[:, idx], marker="o")
    plt.title(f"{names[parameter]} Forecast")
    plt.xlabel("Days")
    plt.ylabel(names[parameter])
    plt.grid(True)

    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode()

def send_history_to_node(data, userId):
    """
    Send prediction history to Node backend with correct userId.
    """
    try:
        payload = data.copy()
        payload["userId"] = int(userId)

        payload.setdefault("forecast_plot", None)

        requests.post(
            "http://localhost:5001/api/predictions/save_history",
            json=payload,
            timeout=10
        )
    except Exception as e:
        print(f"Warning: Could not send history to Node backend: {e}")
