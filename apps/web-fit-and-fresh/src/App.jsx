import {
  brandValues,
  faqs,
  menuHighlights,
  packages,
} from "./data/landingData.js";
import { Button } from "./components/Button.jsx";
import { SectionHeading } from "./components/SectionHeading.jsx";
import { FeatureCard } from "./components/FeatureCard.jsx";
import { PackageCard } from "./components/PackageCard.jsx";
import { FaqItem } from "./components/FaqItem.jsx";
import { HeroVisual } from "./components/HeroVisual.jsx";

const benefitIcons = ["⏱", "🍲", "🗓", "🥕", "❄️", "🚚"];
const WHATSAPP_NUMBER = "5492615716433";

const createWhatsAppLink = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export default function App() {
  const waGeneral = createWhatsAppLink(
    "Hola! Quiero resolver mis almuerzos con Fit & Fresh. ¿Me compartís opciones de packs?",
  );

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Fit and Fresh inicio">
          <span className="brand__mark" aria-hidden="true">
            <img src="/images/brand/logo.webp" alt="" loading="eager" />
          </span>
          <span>
            <strong>Fit & Fresh</strong>
            <small>Equilibrio real para tu ritmo real</small>
          </span>
        </a>

        <nav className="topnav" aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#packs">Packs</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a
          className="topbar__contact"
          href={waGeneral}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp directo
        </a>
      </header>

      <section className="hero section" id="inicio">
        <div className="hero__content">
          <span className="eyebrow">Fit & Fresh · Mendoza, Argentina</span>
          <h1>RESOLVÉ TUS ALMUERZOS DE LA SEMANA EN 2 MINUTOS.</h1>
          <p className="hero__lead">
            Elegís pack, elegís platos y listo. Comida casera lista para
            calentar, sin suscripción y con entrega semanal.
          </p>

          <div className="hero__cta">
            <Button href="#packs" variant="secondary">
              Ver packs
            </Button>
            <Button
              href={waGeneral}
              variant="primary"
              target="_blank"
              rel="noreferrer"
            >
              Pedir por WhatsApp
            </Button>
          </div>

          <div className="hero__microtrust" aria-label="Condiciones de compra">
            <span>Entrega semanal</span>
            <span>Pago simple</span>
            <span>Sin suscripción</span>
          </div>

          <div className="hero__trust" aria-label="Mensajes clave de la marca">
            {brandValues.map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>

          <div className="hero__stats" aria-label="Datos destacados">
            <div>
              <strong>5 / 10</strong>
              <span>viandas por pack</span>
            </div>
            <div>
              <strong>450 g</strong>
              <span>aprox. por vianda</span>
            </div>
            <div>
              <strong>72 h</strong>
              <span>en heladera</span>
            </div>
          </div>
        </div>

        <HeroVisual />
      </section>

      <section className="section" id="beneficios">
        <SectionHeading
          eyebrow="Beneficios"
          title="Resolvé tu semana en menos tiempo"
          intro="Lo esencial para comer mejor sin cocinar todos los días."
        />

        <div className="benefit-grid">
          {menuHighlights.slice(0, 4).map((benefit, index) => (
            <FeatureCard
              key={benefit.title}
              icon={benefitIcons[index]}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </section>

      <section className="section" id="packs">
        <SectionHeading
          eyebrow="Packs"
          title="Elegí tu pack y cerrá por WhatsApp"
          intro="Precio claro, costo por vianda y opción recomendada para ahorrar más en la semana."
        />

        <div className="pack-grid">
          {packages.map((pack) => (
            <PackageCard
              key={pack.title}
              {...pack}
              featured={pack.featured}
              ctaHref={createWhatsAppLink(
                `Hola! Quiero pedir el ${pack.title} (${pack.price}). ¿Cómo coordinamos entrega y pago?`,
              )}
              ctaLabel={`Pedir ${pack.title}`}
            />
          ))}
        </div>

        <div className="purchase-notes" aria-label="Garantías de compra">
          <span>Atención directa por WhatsApp</span>
          <span>Entrega o retiro coordinado</span>
          <span>Opciones vegetarianas disponibles</span>
        </div>
      </section>

      <section className="section" id="faq">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Dudas clave antes de pedir"
          intro="Todo lo importante, sin vueltas."
        />

        <div className="faq-list">
          {faqs.slice(0, 4).map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      <section className="section cta-final">
        <span className="eyebrow">Último paso</span>
        <h2>Pedí tu pack y resolvé la semana</h2>
        <p>Sin vueltas: escribinos y te ayudamos a elegir la mejor opción.</p>
        <div className="hero__cta hero__cta--center">
          <Button
            href={createWhatsAppLink(
              "Hola! Quiero pedir el Pack 5. ¿Me pasás disponibilidad?",
            )}
            variant="secondary"
            target="_blank"
            rel="noreferrer"
          >
            Pedir Pack 5
          </Button>
          <Button
            href={createWhatsAppLink(
              "Hola! Quiero pedir el Pack 10. ¿Me pasás disponibilidad?",
            )}
            variant="primary"
            target="_blank"
            rel="noreferrer"
          >
            Pedir Pack 10
          </Button>
        </div>
      </section>

      <a
        className="sticky-wa"
        href={waGeneral}
        target="_blank"
        rel="noreferrer"
        aria-label="Pedir por WhatsApp"
      >
        Pedir por WhatsApp
      </a>

      <footer className="footer">
        <div>
          <strong>Fit & Fresh</strong>
          <p>Equilibrio real para tu ritmo real</p>
        </div>
        <div>
          <span>Instagram</span>
          <a
            href="https://instagram.com/fitandfresh.mza"
            target="_blank"
            rel="noreferrer"
          >
            @fitandfresh.mza
          </a>
        </div>
        <div>
          <span>Cobertura</span>
          <p>
            Quinta Sección, Barrio Bombal, Barrio Bancario y zonas aledañas.
          </p>
        </div>
        <div>
          <span>WhatsApp</span>
          <a href={waGeneral} target="_blank" rel="noreferrer">
            +54 9 2615 71-6433
          </a>
        </div>
      </footer>
    </main>
  );
}
