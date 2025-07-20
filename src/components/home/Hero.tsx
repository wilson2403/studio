export default function Hero() {
  return (
    <section className="bg-secondary/30">
      <div className="container py-12 md:py-24 animate-in fade-in-0 duration-1000">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-headline tracking-tight text-primary">
              Un Encuentro Sagrado con Medicinas Ancestrales
            </h1>
            <div className="space-y-4 text-lg text-foreground/80 font-body">
              <p>
                👋 Hola, soy Wilson Alfaro, formado en la selva del Amazonas, Perú 🇵🇪🌿
                Junto a un círculo de 3 guías espirituales, sostendremos un espacio de sanación profunda, cuidado y transformación ✨
              </p>
              <p>
                🌌 Te invito a un encuentro sagrado con medicinas ancestrales, donde podrás reconectar con tu alma, soltar lo que ya no necesitas y abrir tu corazón.
              </p>
              <p>
                ¿Sientes el llamado a sanar y despertar?🦋 Este encuentro sagrado es para quienes desean soltar cargas, sanar heridas profundas y recordar su verdadero propósito.
              </p>
               <p>
                🎥 Te invito a ver este pequeño video en TikTok que explico un poco la medicina ancestral: {' '}
                <a href="https://vm.tiktok.com/ZMSCvToKr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  👉 Ver video
                </a>
              </p>
            </div>
          </div>
          <div className="shadow-2xl rounded-lg overflow-hidden">
            <div className="aspect-[9/16] w-full max-w-sm mx-auto bg-muted">
              <iframe
                className="w-full h-full"
                src="https://www.tiktok.com/embed/v2/7382705609355529477?lang=es-ES"
                allow="autoplay; encrypted-media;"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="TikTok video sobre medicina ancestral"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
