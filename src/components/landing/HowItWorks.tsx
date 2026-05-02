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

import { SectionDivider } from "./SectionDivider";

export function HowItWorks() {
  return (
    <>
      <SectionDivider title="Cómo Funciona" subtitle="Tu carrera en 3 pasos" />
      <section className="relative py-8 sm:py-12 px-4 bg-black/40">
        <div className="container mx-auto max-w-5xl">
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
    </>
  );
}

export default HowItWorks;
