/**
 * Lightweight ambient backdrop.
 *
 * Replaces the previous implementation that painted four fixed `blur-3xl`
 * orbs (350–500 px each) — a major source of jank on low-end Android GPUs
 * (Adreno 5xx, Mali-G52). This version uses a single non-animated CSS
 * radial gradient, costing zero blur passes per frame.
 */
const UrbanDecorations = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 20% 0%, hsl(0 84% 44% / 0.08), transparent 60%),' +
          'radial-gradient(ellipse 50% 50% at 80% 100%, hsl(0 84% 30% / 0.06), transparent 65%)',
      }}
    />
  );
};

export default UrbanDecorations;
