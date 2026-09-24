# 🚗 Carlytics — Used Car Price Predictor

> An AI-powered used-car valuation platform that predicts the estimated market price of vehicles using machine learning, vehicle specifications, ownership history, mileage, and other key attributes.

Carlytics is a full-stack machine learning application built to estimate used-car prices in the Indian automobile market. The project combines a trained **XGBoost regression model**, a **FastAPI backend**, and a **Next.js frontend** to provide an interactive car valuation experience.

<!-- Add a screenshot of the app here, e.g. ![Carlytics screenshot](docs/screenshot.png) -->

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Dataset](#-dataset)
- [Machine Learning Pipeline](#-machine-learning-pipeline)
- [Model Comparison](#-model-comparison)
- [Final Model Performance](#-final-model-performance)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [API Documentation](#-api-documentation)
- [EV Handling](#-ev-handling)
- [Feature Engineering at Prediction Time](#-feature-engineering-at-prediction-time)
- [Model Serialization](#-model-serialization)
- [Frontend Experience](#-frontend-experience)
- [Testing](#-testing)
- [Limitations](#-limitations)
- [Future Improvements](#-future-improvements)
- [Example Prediction Workflow](#-example-prediction-workflow)
- [Why This Project?](#-why-this-project)
- [Author](#-author)
- [License](#-license)

---

## ✨ Overview

Buying or selling a used car can be difficult because prices vary significantly based on the vehicle's age, mileage, brand, model, fuel type, transmission, variant, and ownership history.

Carlytics addresses this problem by allowing users to enter their vehicle details and receive an estimated used-car market value within seconds.

The application is designed as a complete ML product rather than only a prediction notebook:

- 🧠 Machine learning price prediction
- 📊 Exploratory data analysis and model evaluation
- ⚡ XGBoost regression model
- 🚀 FastAPI prediction API
- 🎨 Modern Next.js interface
- 🔄 Dynamic vehicle options
- ⚙️ Fuel and transmission validation
- 🔋 EV-specific battery handling
- 📱 Responsive user interface
- 🌐 Ready for cloud deployment

---

## 🎯 Key Features

### 🚘 Vehicle Price Prediction

Users can provide:

- Brand
- Model
- Body Type
- Variant
- Manufacturing Year
- Engine Size
- Battery Capacity
- Fuel Type
- Transmission
- Mileage
- Seats
- Previous Owners

The trained ML model then generates an estimated used-car price.

### 🧠 Machine Learning

The prediction engine uses **XGBoost Regression** with a complete preprocessing pipeline.

The pipeline handles:

- Numerical feature preprocessing
- Categorical feature encoding
- Missing-value handling
- Feature engineering
- Model prediction

The complete preprocessing + model pipeline is saved using `joblib`, allowing the same transformation logic to be used by the FastAPI backend.

### ⚡ Smart Vehicle Input Logic

Carlytics dynamically handles vehicle-specific fields.

#### Internal Combustion Vehicles

For Petrol, Diesel and CNG vehicles:

```text
Engine Size      → Required
Battery Capacity → Not required
```

#### Electric Vehicles

For EVs:

```text
Engine Size      → Not required
Battery Capacity → Required
Transmission     → Automatic
```

This prevents users from entering physically inconsistent vehicle specifications.

### 🔄 Dynamic Transmission Options

Transmission options are based on the supported fuel types and application rules.

| Fuel Type | Available Transmissions |
| --- | --- |
| EV | Automatic |
| CNG | Manual |
| Petrol | Manual / AMT / Automatic / DCT / CVT / IVT / iMT |
| Petrol Hybrid | e-CVT / Manual |

The backend also validates these rules before generating a prediction.

### 🛡️ Backend Validation

Validation is performed server-side using **FastAPI** and **Pydantic**.

The API checks:

- Valid fuel type
- Valid transmission
- EV battery requirements
- ICE battery restrictions
- Engine size handling
- Mileage values
- Manufacturing year
- Seat count
- Ownership count

Frontend validation is therefore backed by server-side validation as well.

---

## 📊 Dataset

The project uses a **synthetic Indian used-car dataset** containing **20,000 vehicle records** with **13 original columns**.

### Dataset Features

| Feature | Description |
| --- | --- |
| `Brand` | Vehicle manufacturer |
| `Model` | Vehicle model |
| `Body_Type` | Hatchback, Sedan, SUV, etc. |
| `Variant_Tier` | Base, Mid or Top |
| `Year` | Manufacturing year |
| `Engine_Size` | Engine displacement in litres |
| `Battery_kWh` | Battery capacity for EVs |
| `Fuel_Type` | Petrol, Diesel, CNG, EV or Petrol Hybrid |
| `Transmission` | Manual, Automatic, AMT, DCT, CVT, etc. |
| `Mileage` | Distance driven in kilometres |
| `Seats` | Number of seats |
| `Owner_Count` | Number of previous owners |
| `Price` | Target used-car price in INR |

### Dataset Statistics

```text
Rows:              20,000
Columns:           13
Brands:            25
Models:            164
Years:             2015–2026
Missing values:    0
Duplicate rows:    0
```

The dataset contains vehicles across budget, mid-range, premium and luxury segments.

---

## 🧪 Machine Learning Pipeline

The ML workflow was developed using **Jupyter Notebook**.

### 1. Data Loading

The dataset is loaded and inspected for:

- Missing values
- Duplicate records
- Data types
- Statistical distributions
- Categorical distributions
- Price ranges

### 2. Exploratory Data Analysis

The analysis includes:

- Price distribution
- Brand distribution
- Median price by brand
- Price by manufacturing year
- Mileage vs price
- Fuel type vs price
- Transmission vs price
- Vehicle segment analysis

### 3. Feature Engineering

Two additional features are created.

**Car Age**

```python
Car_Age = 2026 - Year
```

**Mileage Per Year**

```python
Mileage_Per_Year = Mileage / Car_Age
```

These features help the model understand vehicle age and usage intensity.

### 4. Categorical Encoding

Categorical variables are processed using `OneHotEncoder` with:

```python
handle_unknown="ignore"
```

This allows the API to safely process previously unseen categorical values without crashing the preprocessing pipeline.

### 5. Train/Test Split

The dataset is divided into:

```text
Training: 80%
Testing:  20%
random_state = 42
```

Result:

```text
Training samples: 16,000
Testing samples:   4,000
```

---

## 🤖 Model Comparison

Multiple regression approaches were evaluated.

| Model | MAE | RMSE | R² |
| --- | --- | --- | --- |
| Random Forest | ₹86,758.64 | ₹175,224.24 | 0.9713 |
| **XGBoost (final)** | **₹74,829.64** | **₹139,105.79** | **0.9819** |
| Tuned XGBoost | ₹73,209.53 | ₹139,634.88 | 0.9818 |

The tuned XGBoost configuration slightly reduced MAE but produced slightly worse RMSE and R². Therefore, the **original XGBoost configuration was retained as the final model** because it provided the better overall evaluation profile.

---

## 📈 Final Model Performance

| Metric | Result |
| --- | --- |
| MAE | ₹74,829.64 |
| RMSE | ₹139,105.79 |
| R² | 0.9819 |

### Error by Price Segment

| Price Segment | MAE |
| --- | --- |
| Below ₹5L | ₹31K |
| ₹5L–₹10L | ₹48K |
| ₹10L–₹20L | ₹90K |
| ₹20L–₹50L | ₹2.09L |
| Above ₹50L | ₹5.35L |

The model performs particularly well across the common budget and mid-range used-car segments. Higher-priced luxury vehicles show larger absolute errors because the dataset contains fewer examples in those segments and luxury vehicle prices have greater variation.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Next.js UI      │
                    │                      │
                    │  Car Details Form    │
                    │  Dynamic Inputs      │
                    │  Price Result        │
                    └──────────┬───────────┘
                               │
                               │ HTTP / JSON
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI API      │
                    │                      │
                    │  Input Validation    │
                    │  Vehicle Rules       │
                    │  Feature Engineering │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     ML Pipeline      │
                    │                      │
                    │  Preprocessing       │
                    │  OneHotEncoder       │
                    │  XGBoost             │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Estimated Price    │
                    │                      │
                    │     ₹XX.XX Lakh      │
                    └──────────────────────┘
```

---

## 🛠️ Technology Stack

**Machine Learning**

- Python, Pandas, NumPy
- Scikit-learn, XGBoost, Joblib
- Matplotlib, Seaborn
- Jupyter Notebook

**Backend**

- FastAPI, Uvicorn, Pydantic
- Pandas, Joblib, Scikit-learn, XGBoost

**Frontend**

- Next.js, React
- TypeScript
- Tailwind CSS

**Development & Deployment**

- Git, GitHub
- Vercel
- FastAPI-compatible cloud hosting

---

## 📁 Project Structure

```text
car-price-predictor/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── data/
│   └── india_car_price_prediction.csv
│
├── models/
│   └── car_price_model.pkl
│
├── notebooks/
│   └── car_price_prediction.ipynb
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── src/
│   │   └── components/
│   │       └── CarPredictor.tsx
│   │
│   ├── public/
│   │   └── car.png
│   ├── package.json
│   └── .env.local
│
├── .gitignore
└── README.md
```

> The exact frontend directory structure may vary depending on the Next.js project setup.

---

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/car-price-predictor.git
cd car-price-predictor
```

### 🐍 Backend Setup

#### 2. Create a Virtual Environment

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

> **Important:** the model was trained using **scikit-learn 1.5.1**, so the backend should use the same compatible version:
>
> ```bash
> pip install scikit-learn==1.5.1
> ```
>
> This avoids model deserialization issues when loading the saved `.pkl` pipeline.

#### ▶️ Run the Backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload
```

| Resource | URL |
| --- | --- |
| API | http://127.0.0.1:8000 |
| Swagger docs | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/health |

### ⚛️ Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env.local` and add:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔌 API Documentation

### `GET /`

Returns basic API information.

```json
{
  "message": "Carlytics API is running",
  "version": "2.0.0"
}
```

### `GET /health`

Checks whether the API and ML model are available.

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `GET /options`

Returns supported vehicle options used by the frontend (brands, models per brand, fuel types, transmissions per fuel type, body types and variant tiers).

```json
{
  "fuel_types": [
    "CNG",
    "Diesel",
    "EV",
    "Petrol",
    "Petrol Hybrid"
  ]
}
```

The frontend uses this endpoint to dynamically populate vehicle selection fields.

### `POST /predict`

Generates a used-car price prediction.

**Example request**

```json
{
  "brand": "Hyundai",
  "model": "i20",
  "body_type": "Hatchback",
  "variant_tier": "Mid",
  "year": 2019,
  "engine_size": 1.2,
  "battery_kwh": 0,
  "fuel_type": "Petrol",
  "transmission": "Manual",
  "mileage": 60000,
  "seats": 5,
  "owner_count": 1
}
```

**Example response**

```json
{
  "predicted_price": 475438.0,
  "formatted_price": "₹4.75 Lakh",
  "currency": "INR"
}
```

---

## 🔋 EV Handling

Electric vehicles are handled differently from internal-combustion vehicles.

```text
EV
  Engine Size      = 0
  Battery Capacity > 0
  Transmission     = Automatic

Petrol / Diesel / CNG
  Engine Size      > 0
  Battery Capacity = 0
```

This prevents incompatible input combinations from being sent to the model.

---

## 🧮 Feature Engineering at Prediction Time

The API recreates the same engineered features used during training.

```python
car_age = 2026 - year
mileage_per_year = mileage / max(car_age, 1)
```

Keeping the training and prediction feature transformations consistent is essential for reliable model inference.

---

## 🔐 Model Serialization

The trained model is saved as `models/car_price_model.pkl`.

The saved pipeline contains:

```text
Input Features
      ↓
Imputation
      ↓
One-Hot Encoding
      ↓
XGBoost Regression
      ↓
Predicted Price
```

This allows the backend to load the complete ML pipeline without rebuilding preprocessing manually.

---

## 🎨 Frontend Experience

The Carlytics interface focuses on a clean and modern valuation workflow, laid out as a two-panel desktop dashboard that stacks on mobile.

**Car details form**

- Brand and model selection
- Body type and variant selection
- Manufacturing year and mileage sliders
- Fuel type and transmission
- Engine / battery details
- Seats and previous owners

**Live vehicle preview panel**

- Shows the selected vehicle and its key details as the form is filled in
- After the user requests an estimate, the panel switches to a highlighted result card showing the estimated market value and the vehicle details it was based on

The UI also dynamically adjusts fields based on the selected fuel type.

---

## 🧪 Testing

The project was tested through the following.

**ML Testing**

- Train/test evaluation (MAE, RMSE, R²)
- Price-segment error analysis
- Manual sanity checks
- Luxury vehicle error analysis

**API Testing**

FastAPI Swagger UI was used to test `/`, `/health`, `/options` and `/predict`, covering:

- Valid vehicle inputs
- EV inputs
- Invalid EV + Manual combinations
- Battery validation

**Frontend Testing**

- API connectivity
- Dynamic model selection
- Fuel selection
- Transmission selection
- EV battery handling
- Prediction requests
- Error handling
- Responsive layout

---

## ⚠️ Limitations

Carlytics is an ML-based estimation system and should not be considered a guaranteed market valuation.

- The training dataset is **synthetic**.
- Real used-car prices depend on additional factors such as city, dealership, service history, accident history, insurance status, cosmetic condition and market demand.
- Luxury vehicles have fewer examples in the dataset and therefore show larger absolute prediction errors.
- The model estimates a price based only on the information provided by the user.
- The prediction should be treated as an approximate valuation rather than a guaranteed selling price.

---

## 🔮 Future Improvements

- [ ] Add city/location-based pricing
- [ ] Integrate real used-car listing datasets
- [ ] Add service history
- [ ] Add accident history
- [ ] Add insurance status
- [ ] Add vehicle condition scoring
- [ ] Add owner/service history analysis
- [ ] Add price range estimation
- [ ] Add model explainability
- [ ] Add SHAP-based feature explanations
- [ ] Add historical price trends
- [ ] Add comparable vehicle listings
- [ ] Improve luxury vehicle prediction
- [ ] Add authentication and user profiles
- [ ] Deploy the production API
- [ ] Deploy the Next.js application
- [ ] Add automated CI/CD

---

## 📌 Example Prediction Workflow

```text
User enters vehicle details
          ↓
Frontend validates input
          ↓
Request sent to FastAPI
          ↓
FastAPI validates vehicle rules
          ↓
Feature engineering
          ↓
Saved ML pipeline
          ↓
XGBoost prediction
          ↓
Price returned to frontend
          ↓
Estimated market value displayed
```

---

## 💡 Why This Project?

This project demonstrates more than simply training a regression model.

It combines:

```text
Machine Learning
      +
Data Analysis
      +
Feature Engineering
      +
Model Evaluation
      +
FastAPI
      +
REST API
      +
Next.js
      +
TypeScript
      +
Tailwind CSS
      +
Deployment
```

The goal is to demonstrate how a machine learning model can be transformed into a usable end-to-end product.

---

## 👨‍💻 Author

**Sathwik Sandesh**
Artificial Intelligence & Data Science Student

**Interests:** Artificial Intelligence · Machine Learning · Data Science · Generative AI · Full-Stack Development · AI-powered Applications

---

## ⭐ Support

If you found this project interesting, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is available for educational and portfolio purposes.

Add an appropriate open-source license (for example MIT) to the repository if you plan to distribute or reuse the project publicly.
