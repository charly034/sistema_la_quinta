import { faqs, packages } from "./data/landingData.js";
import { Button } from "./components/Button.jsx";
import { SectionHeading } from "./components/SectionHeading.jsx";
import { PackageCard } from "./components/PackageCard.jsx";
import { FaqItem } from "./components/FaqItem.jsx";
import { HeroVisual } from "./components/HeroVisual.jsx";

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
          <h1>Comida casera lista para tu semana.</h1>
          <p className="hero__lead">
            Elegi Pack 5 o Pack 10 viandas y resolve tus almuerzos sin cocinar
            todos los dias.
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
            <span>Porciones abundantes</span>
          </div>

          <div className="hero__stats" aria-label="Datos destacados">
            <div>
              <strong>5 / 10</strong>
              <span>viandas por pack</span>
            </div>
            <div>
              <strong>72 h</strong>
              <span>en heladera</span>
            </div>
            <div>
              <strong>3 meses</strong>
              <span>apto freezer</span>
            </div>
          </div>
        </div>

        <HeroVisual />
      </section>

      <section className="section" id="packs">
        <SectionHeading
          eyebrow="Packs"
          title="Dos opciones simples para vender"
          intro="Pack semanal de 5 viandas o pack de 10 viandas para mejor costo por unidad."
        />

        <div className="pack-grid">
          {packages.slice(0, 2).map((pack) => (
            <PackageCard
              key={pack.title}
              {...pack}
              featured={pack.featured}
              ctaHref={createWhatsAppLink(
                `Hola! Quiero pedir el ${pack.title} (${pack.price}). ¿Cómo coordinamos entrega y pago?`,
              )}
              ctaLabel={`Reservar ${pack.title}`}
            />
          ))}
        </div>

        <div className="purchase-notes" aria-label="Garantías de compra">
          <span>Atención directa por WhatsApp</span>
          <span>Entrega o retiro coordinado</span>
          <span>Pack 5 o Pack 10</span>
          <span>Sin suscripcion</span>
        </div>
      </section>

      <section className="section" id="faq">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Dudas clave antes de pedir"
          intro="Informacion basica para decidir rapido."
        />

        <div className="faq-list">
          {faqs.slice(0, 3).map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      <section className="section cta-final">
        <span className="eyebrow">Último paso</span>
        <h2>Pedí tu pack hoy</h2>
        <p>Te asesoramos por WhatsApp y coordinamos entrega o retiro.</p>
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
