"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

type Options = {
  brands: string[];
  models: Record<string, string[]>;
  fuel_types: string[];
  transmissions: Record<string, string[]>;
  body_types: string[];
  variant_tiers: string[];
};

type FormData = {
  brand: string;
  model: string;
  body_type: string;
  variant_tier: string;
  year: string;
  engine_size: string;
  battery_kwh: string;
  fuel_type: string;
  transmission: string;
  mileage: string;
  seats: string;
  owner_count: string;
};

type Result = { predicted_price: number; formatted_price: string };

const initialForm: FormData = {
  brand: "",
  model: "",
  body_type: "",
  variant_tier: "",
  year: "2022",
  engine_size: "",
  battery_kwh: "",
  fuel_type: "",
  transmission: "",
  mileage: "50000",
  seats: "5",
  owner_count: "1",
};

const YEAR_MIN = 2015;
const YEAR_MAX = 2026;
const MILEAGE_MAX = 250000;
const SEAT_OPTIONS = ["2", "4", "5", "6", "7", "8"];
const OWNER_OPTIONS = ["1", "2", "3", "4"];

const pct = (value: string, min: number, max: number) =>
  `${Math.min(100, Math.max(0, ((Number(value) - min) / (max - min)) * 100))}%`;

const Arrow = () => (
  <span className="arrow" aria-hidden>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </span>
);

export default function CarPredictor() {
  const [options, setOptions] = useState<Options | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [carImageOk, setCarImageOk] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // ---------- load options ----------
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_URL}/options`);
        if (!response.ok) throw new Error("Failed to load vehicle options.");
        const data = await response.json();
        if (!Array.isArray(data.brands) || !data.models || !Array.isArray(data.body_types)) {
          throw new Error("The prediction server returned an invalid options response.");
        }
        setOptions(data);
      } catch (err) {
        setError(
          err instanceof Error && err.message.includes("invalid options")
            ? err.message
            : "Unable to connect to the prediction server. Set NEXT_PUBLIC_API_URL to your deployed API URL."
        );
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, []);

  const availableModels = useMemo(
    () => (options && form.brand ? options.models[form.brand] || [] : []),
    [options, form.brand]
  );

  const availableTransmissions = useMemo(
    () =>
      options && form.fuel_type
        ? options.transmissions[form.fuel_type] || []
        : [],
    [options, form.fuel_type]
  );

  const isEV = form.fuel_type === "EV";

  const isComplete =
    !!form.brand &&
    !!form.model &&
    !!form.body_type &&
    !!form.variant_tier &&
    !!form.fuel_type &&
    !!form.transmission &&
    (isEV ? Number(form.battery_kwh) > 0 : Number(form.engine_size) > 0);

  // ---------- updaters ----------
  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setError("");
  };

  const handleBrandChange = (value: string) => {
    setForm((prev) => ({ ...prev, brand: value, model: "" }));
    setResult(null);
    setError("");
  };

  const handleFuelChange = (value: string) => {
    const transmissions = options?.transmissions[value] || [];
    const ev = value === "EV";
    setForm((prev) => ({
      ...prev,
      fuel_type: value,
      transmission: transmissions.length === 1 ? transmissions[0] : "",
      engine_size: ev ? "0" : prev.engine_size === "0" ? "" : prev.engine_size,
      battery_kwh: ev ? (prev.battery_kwh === "0" ? "" : prev.battery_kwh) : "0",
    }));
    setResult(null);
    setError("");
  };

  // ---------- predict ----------
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isComplete) return;

    setPredicting(true);
    setResult(null);
    setError("");

    try {
      const payload = {
        brand: form.brand,
        model: form.model,
        body_type: form.body_type,
        variant_tier: form.variant_tier,
        year: Number(form.year),
        engine_size: isEV ? 0 : Number(form.engine_size),
        battery_kwh: isEV ? Number(form.battery_kwh) : 0,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        mileage: Number(form.mileage),
        seats: Number(form.seats),
        owner_count: Number(form.owner_count),
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Prediction failed.");

      setResult(data);
      // on small screens the panel sits below the form
      setTimeout(() => {
        if (window.innerWidth < 1024)
          panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPredicting(false);
    }
  };

  // ---------- loading ----------
  if (loadingOptions) {
    return (
      <div className="glass-card mx-auto max-w-md p-10 text-center text-[var(--muted)]">
        {error || "Loading vehicle options…"}
      </div>
    );
  }

  if (!options) {
    return (
      <div className="glass-card mx-auto max-w-xl p-8 text-center" role="alert">
        <p className="font-semibold">Vehicle options are unavailable</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
      </div>
    );
  }

  // ---------- derived preview data ----------
  const vehicleName = [form.brand, form.model].filter(Boolean).join(" ");
  const mileageText = `${Number(form.mileage).toLocaleString("en-IN")} km`;
  const subtitle = [form.year, form.fuel_type, form.transmission]
    .filter(Boolean)
    .join(" • ");

  const details: { label: string; value: string }[] = [
    { label: "Vehicle", value: vehicleName || "—" },
    { label: "Year", value: form.year },
    { label: "Fuel", value: form.fuel_type || "—" },
    { label: "Transmission", value: form.transmission || "—" },
    { label: "Mileage", value: mileageText },
  ];

  // The moment the button is clicked the hero image goes away and the
  // panel switches to the result view (with a loading state).
  const showResultView = predicting || !!result;

  // ---------- UI ----------
  return (
    <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">
        <h2 className="text-xl font-semibold">Car details</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Fill in your car&apos;s details to see what it&apos;s worth on the used market.
        </p>

        <div className="mt-7 grid gap-x-6 gap-y-6 md:grid-cols-2">
          {/* Brand | Model */}
          <div>
            <label className="label" htmlFor="brand">Brand</label>
            <select id="brand" className="field" value={form.brand} onChange={(e) => handleBrandChange(e.target.value)}>
              <option value="">Select brand</option>
              {options?.brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="model">Model</label>
            <select id="model" className="field" value={form.model} disabled={!form.brand} onChange={(e) => updateField("model", e.target.value)}>
              <option value="">{form.brand ? "Select model" : "Select brand first"}</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Body type | Variant */}
          <div>
            <label className="label" htmlFor="body">Body type</label>
            <select id="body" className="field" value={form.body_type} onChange={(e) => updateField("body_type", e.target.value)}>
              <option value="">Select body type</option>
              {options?.body_types.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Variant</span>
            <div className="flex flex-wrap gap-2">
              {options?.variant_tiers.map((v) => (
                <button type="button" key={v} className="pill !px-4 !py-2.5" aria-pressed={form.variant_tier === v} onClick={() => updateField("variant_tier", v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Year | Mileage */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <label className="label !mb-0" htmlFor="year">Manufacturing year</label>
              <span className="font-semibold tabular-nums">{form.year}</span>
            </div>
            <input id="year" type="range" className="slider" min={YEAR_MIN} max={YEAR_MAX} step={1} value={form.year}
              style={{ ["--p" as string]: pct(form.year, YEAR_MIN, YEAR_MAX) }}
              onChange={(e) => updateField("year", e.target.value)} />
            <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
              <span>{YEAR_MIN}</span><span>{YEAR_MAX}</span>
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <label className="label !mb-0" htmlFor="mileage">Kilometres driven</label>
              <span className="font-semibold tabular-nums">{mileageText}</span>
            </div>
            <input id="mileage" type="range" className="slider" min={0} max={MILEAGE_MAX} step={1000} value={form.mileage}
              style={{ ["--p" as string]: pct(form.mileage, 0, MILEAGE_MAX) }}
              onChange={(e) => updateField("mileage", e.target.value)} />
            <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
              <span>0 km</span><span>2,50,000 km</span>
            </div>
          </div>

          {/* Fuel | Transmission */}
          <div>
            <span className="label">Fuel type</span>
            <div className="flex flex-wrap gap-2">
              {options?.fuel_types.map((f) => (
                <button type="button" key={f} className="pill !px-4 !py-2.5" aria-pressed={form.fuel_type === f} onClick={() => handleFuelChange(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Transmission</span>
            {form.fuel_type ? (
              <div className="flex flex-wrap gap-2">
                {availableTransmissions.map((t) => (
                  <button type="button" key={t} className="pill !px-4 !py-2.5" aria-pressed={form.transmission === t} onClick={() => updateField("transmission", t)}>
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-2.5 text-sm text-[var(--muted)]">Choose a fuel type first.</p>
            )}
          </div>

          {/* Engine / Battery | Seats */}
          <div>
            {isEV ? (
              <>
                <label className="label" htmlFor="battery">Battery capacity (kWh)</label>
                <input id="battery" type="number" step="0.1" min="1" className="field" placeholder="e.g. 40.5"
                  value={form.battery_kwh} onChange={(e) => updateField("battery_kwh", e.target.value)} />
              </>
            ) : (
              <>
                <label className="label" htmlFor="engine">Engine size (L)</label>
                <input id="engine" type="number" step="0.1" min="0.1" className="field"
                  placeholder={form.fuel_type ? "e.g. 1.2" : "Select fuel type first"}
                  disabled={!form.fuel_type}
                  value={form.engine_size} onChange={(e) => updateField("engine_size", e.target.value)} />
              </>
            )}
          </div>
          <div>
            <span className="label">Seats</span>
            <div className="flex flex-wrap gap-2">
              {SEAT_OPTIONS.map((s) => (
                <button type="button" key={s} className="pill min-w-11 !px-3.5 !py-2.5" aria-pressed={form.seats === s} onClick={() => updateField("seats", s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Owners (full width) */}
          <div className="md:col-span-2">
            <span className="label">Previous owners</span>
            <div className="flex flex-wrap gap-2">
              {OWNER_OPTIONS.map((o) => (
                <button type="button" key={o} className="pill !px-4 !py-2.5" aria-pressed={form.owner_count === o} onClick={() => updateField("owner_count", o)}>
                  {o === "1" ? "1 owner" : `${o} owners`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button type="submit" disabled={predicting || !isComplete} className="btn-primary">
            {predicting ? "Estimating…" : "Get price estimate"}
            {!predicting && <Arrow />}
          </button>
        </div>
      </form>

      {/* ================= RIGHT PANEL ================= */}
      <div ref={panelRef} className="min-h-[560px]">
        {showResultView ? (
          /* ---------- RESULT VIEW: image gone, only price + details ---------- */
          <div className="result-card flex h-full flex-col justify-center p-8 md:p-12" aria-live="polite">
            <p className="text-sm font-medium text-white/80">Estimated market value</p>

            {result ? (
              <p className="mt-3 text-6xl font-semibold tracking-tight md:text-7xl">
                {result.formatted_price}
              </p>
            ) : (
              <div className="mt-4 h-16 w-64 animate-pulse rounded-2xl bg-white/25" />
            )}

            <p className="mt-5 text-sm text-white/80">
              Based on {[form.year, mileageText, form.fuel_type, form.transmission].join(" • ")}
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-3">
              {details.map((d, i) => (
                <div
                  key={d.label}
                  className={`rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20 ${i === 0 ? "col-span-2" : ""}`}
                >
                  <dt className="text-xs text-white/70">{d.label}</dt>
                  <dd className="mt-0.5 text-base font-semibold">{d.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 text-xs leading-relaxed text-white/70">
              Generated by the Carlytics AI model. Actual offers vary with the car&apos;s
              condition, location and demand.
            </p>
          </div>
        ) : (
          /* ---------- PREVIEW VIEW: live vehicle preview + how it works ---------- */
          <div className="glass-card flex h-full flex-col overflow-hidden p-8">
            <p className="text-sm text-[var(--muted)]">Selected vehicle</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {vehicleName || "Choose your car"}
            </h2>
            <p className="mt-1 min-h-5 text-sm text-[var(--muted)]">{subtitle}</p>

            {/* Single hero image – put your PNG at /public/car.png */}
            <div className="my-4 flex flex-1 items-center justify-center">
              {carImageOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/civic.avif"
                  alt=""
                  onError={() => setCarImageOk(false)}
                  className="max-h-[300px] w-full object-contain drop-shadow-[0_24px_30px_rgba(179,33,59,0.25)]"
                />
              ) : (
                <div className="h-40 w-full rounded-3xl border border-dashed border-[#ecd5d8]" />
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#f0dcdf] pt-5 sm:grid-cols-3">
              {details.slice(1).map((d) => (
                <div key={d.label}>
                  <dt className="text-xs text-[var(--muted)]">{d.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">{d.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-2xl bg-white/70 p-5 ring-1 ring-[#f0dcdf]">
              <h3 className="text-sm font-semibold">How it works</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                Our model learned from thousands of used-car listings. Fill in the
                details, press <span className="font-medium text-[var(--ink)]">Get price estimate</span>,
                and see a fair market value in seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}