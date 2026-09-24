from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware


# ============================================================
# App Configuration
# ============================================================

app = FastAPI(
    title="Carlytics AI API",
    description="AI-powered used car price prediction API",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Paths
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "car_price_model.pkl"
DATA_PATH = BASE_DIR / "data" / "india_used_car_prices_dataset.csv"


# ============================================================
# Load Model and Dataset
# ============================================================

model = joblib.load(MODEL_PATH)
car_data = pd.read_csv(DATA_PATH)


# ============================================================
# Dataset Options / Mappings
# ============================================================

VALID_TRANSMISSIONS = (
    car_data.groupby("Fuel_Type")["Transmission"]
    .unique()
    .apply(list)
    .to_dict()
)

BRAND_MODELS = (
    car_data.groupby("Brand")["Model"]
    .unique()
    .apply(list)
    .to_dict()
)


# ============================================================
# Request Model
# ============================================================

class CarInput(BaseModel):
    brand: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    body_type: str = Field(..., min_length=1)
    variant_tier: str = Field(..., min_length=1)

    year: int = Field(
        ...,
        ge=2015,
        le=2026,
    )

    engine_size: float = Field(
        ...,
        ge=0,
    )

    battery_kwh: float = Field(
        ...,
        ge=0,
    )

    fuel_type: str = Field(
        ...,
        min_length=1,
    )

    transmission: str = Field(
        ...,
        min_length=1,
    )

    mileage: float = Field(
        ...,
        ge=0,
    )

    seats: int = Field(
        ...,
        ge=2,
        le=10,
    )

    owner_count: int = Field(
        ...,
        ge=1,
        le=4,
    )


# ============================================================
# Root Endpoint
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AutoValue AI API is running",
        "version": "2.0.0",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
    }


# ============================================================
# Available Options
# ============================================================

@app.get("/options")
def get_options():
    return {
        "brands": sorted(
            car_data["Brand"].dropna().unique().tolist()
        ),

        "models": {
            brand: sorted(models)
            for brand, models in BRAND_MODELS.items()
        },

        "fuel_types": sorted(
            car_data["Fuel_Type"].dropna().unique().tolist()
        ),

        "transmissions": {
            fuel: sorted(transmissions)
            for fuel, transmissions in VALID_TRANSMISSIONS.items()
        },

        "body_types": sorted(
            car_data["Body_Type"].dropna().unique().tolist()
        ),

        "variant_tiers": sorted(
            car_data["Variant_Tier"].dropna().unique().tolist()
        ),
    }


# ============================================================
# Prediction Endpoint
# ============================================================

@app.post("/predict")
def predict_price(car: CarInput):

    # --------------------------------------------------------
    # Validate Fuel Type
    # --------------------------------------------------------

    if car.fuel_type not in VALID_TRANSMISSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid fuel type: {car.fuel_type}",
        )

    # --------------------------------------------------------
    # Validate Transmission
    # --------------------------------------------------------

    if car.transmission not in VALID_TRANSMISSIONS[car.fuel_type]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Transmission '{car.transmission}' "
                f"is not valid for fuel type '{car.fuel_type}'."
            ),
        )

    # --------------------------------------------------------
    # --------------------------------------------------------
    # EV / Non-EV Validation
    # --------------------------------------------------------

    if car.fuel_type == "EV":

        if car.battery_kwh <= 0:
            raise HTTPException(
                status_code=400,
                detail="Battery capacity is required for EVs.",
            )

        engine_size = 0.0

    else:

        if car.battery_kwh != 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Battery capacity must be 0 "
                    "for non-EV vehicles."
                ),
            )

        engine_size = car.engine_size

    # --------------------------------------------------------
    # Calculate Engineered Features
    # --------------------------------------------------------

    car_age = 2026 - car.year

    mileage_per_year = (
        car.mileage / max(car_age, 1)
    )

    # --------------------------------------------------------
    # Prepare Model Input
    # --------------------------------------------------------

    input_data = pd.DataFrame(
        [
            {
                "Brand": car.brand,
                "Model": car.model,
                "Body_Type": car.body_type,
                "Variant_Tier": car.variant_tier,
                "Year": car.year,
                "Engine_Size": engine_size,
                "Battery_kWh": car.battery_kwh,
                "Fuel_Type": car.fuel_type,
                "Transmission": car.transmission,
                "Mileage": car.mileage,
                "Seats": car.seats,
                "Owner_Count": car.owner_count,
                "Car_Age": car_age,
                "Mileage_Per_Year": mileage_per_year,
            }
        ]
    )

    # --------------------------------------------------------
    # Make Prediction
    # --------------------------------------------------------

    try:
        predicted_price = model.predict(input_data)[0]

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(exc)}",
        ) from exc

    # --------------------------------------------------------
    # Prevent Negative Prediction
    # --------------------------------------------------------

    predicted_price = max(
        0,
        float(predicted_price),
    )

    # --------------------------------------------------------
    # Format Price
    # --------------------------------------------------------

    lakh_price = predicted_price / 100_000

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "predicted_price": round(
            predicted_price,
            2,
        ),

        "formatted_price": (
            f"₹{lakh_price:.2f} Lakh"
        ),

        "currency": "INR",

        "input": {
            "brand": car.brand,
            "model": car.model,
            "year": car.year,
            "fuel_type": car.fuel_type,
            "transmission": car.transmission,
        },
    }
