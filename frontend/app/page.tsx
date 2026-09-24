import CarPredictor from "../src/components/CarPredictor";

export default function Home() {
  return (
    <main className="mx-auto w-[calc(100%-2rem)] max-w-[1400px] pb-20 pt-10 md:w-[calc(100%-80px)] md:pt-14">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="font-semibold tracking-tight">
          <span className="block text-4xl text-[var(--crimson)] md:text-5xl">Carlytics</span>
          <span className="mt-1 block text-3xl text-[var(--ink)] md:text-4xl">Used Car Price Predictor</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          AI-powered used-car valuation based on your vehicle&apos;s specifications, age, mileage and ownership history.
        </p>
      </header>

      <CarPredictor />

      <footer className="mt-16 flex flex-col items-center justify-center gap-2 border-t border-[rgba(179,33,59,0.12)] pt-6 text-center text-sm text-[var(--muted)] sm:flex-row sm:gap-4">
        <span>&copy; 2026 Carlytics</span>
        <span className="hidden text-[var(--crimson-soft)] sm:inline" aria-hidden="true">•</span>
        <span>Made with <span className="text-[var(--crimson)]" aria-label="love">❤️</span> by Siddhantam Sathwik Sandesh</span>
      </footer>
    </main>
  );
}