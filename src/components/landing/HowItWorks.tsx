/**
 * Lightweight Swiss-Brutalist 3-step strip for the public landing page.
 * Pure CSS, no images, no animations on low-end devices.
 */
const STEPS = [
  {
    n: '01',
    title: 'Crea tu cuenta',
    body: 'Regístrate gratis. Tu Fighter ID se genera al instante.',
  },
  {
    n: '02',
    title: 'Verifica tu licencia',
    body: 'Sube tus documentos. Validamos en menos de 48 horas.',
  },
  {
    n: '03',
    title: 'Compite y escala',
    body: 'Aparece en rankings oficiales y postula a eventos.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-10 sm:py-14 px-4 border-y border-primary/15 bg-black/40">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8 sm:mb-10 text-center">
          <p className="ufc-label text-[11px] sm:text-xs tracking-[0.25em] text-primary mb-2">
            CÓMO FUNCIONA
          </p>
          <h2 className="ufc-label text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-display text-white">
            Tu carrera, en <span className="text-primary">3 pasos</span>
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="combat-cut relative bg-black/60 border border-white/10 p-5 sm:p-6"
            >
              <div className="ufc-label text-4xl sm:text-5xl font-extrabold text-primary/30 leading-none mb-3">
                {s.n}
              </div>
              <h3 className="ufc-label text-base sm:text-lg font-bold text-white mb-1.5 tracking-wider">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
