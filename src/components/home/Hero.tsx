export default function Hero() {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.07] bg-center [mask-image:linear-gradient(to_bottom,white,transparent_30%)]"></div>
       <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      <div className="container relative text-center animate-in fade-in-0 duration-1000">
        <div className="flex flex-col items-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-headline tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
            Un Encuentro Sagrado con Medicinas Ancestrales
          </h1>
          <div className="max-w-3xl space-y-4 text-lg text-foreground/80 font-body">
            <p>
              👋 Hola, soy Wilson Alfaro, formado en la selva del Amazonas, Perú 🇵🇪🌿. Junto a un círculo de 3 guías espirituales, sostendremos un espacio de sanación profunda, cuidado y transformación ✨
            </p>
            <p>
              ¿Sientes el llamado a sanar y despertar? 🦋 Este encuentro sagrado es para quienes desean soltar cargas, sanar heridas profundas y recordar su verdadero propósito.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
