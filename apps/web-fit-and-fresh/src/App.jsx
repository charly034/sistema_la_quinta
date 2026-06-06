import {
  brandValues,
  dishes,
  faqs,
  packagingHighlights,
  menuHighlights,
  packages,
  problemCards,
  steps,
  testimonials,
} from "./data/landingData.js";
import { Button } from "./components/Button.jsx";
import { SectionHeading } from "./components/SectionHeading.jsx";
import { FeatureCard } from "./components/FeatureCard.jsx";
import { PackageCard } from "./components/PackageCard.jsx";
import { TestimonialCard } from "./components/TestimonialCard.jsx";
import { FaqItem } from "./components/FaqItem.jsx";
import { HeroVisual } from "./components/HeroVisual.jsx";

const benefitIcons = ["⏱", "🍲", "🗓", "🥕", "❄️", "🚚"];

export default function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Fit and Fresh inicio">
          <span className="brand__mark" aria-hidden="true">
            <img src="/images/brand/logo.jpg" alt="" loading="eager" />
          </span>
          <span>
            <strong>Fit & Fresh</strong>
            <small>Equilibrio real para tu ritmo real</small>
          </span>
        </a>

        <nav className="topnav" aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#packs">Packs</a>
          <a href="#menu">Menú</a>
          <a href="#faq">FAQ</a>
        </nav>

        <a
          className="topbar__contact"
          href="https://instagram.com/fitandfresh.mza"
          target="_blank"
          rel="noreferrer"
        >
          @fitandfresh.mza
        </a>
      </header>

      <section className="hero section" id="inicio">
        <div className="hero__content">
          <span className="eyebrow">Fit & Fresh · Mendoza, Argentina</span>
          <h1>COMÉ BIEN TODA LA SEMANA SIN COCINAR.</h1>
          <p className="hero__lead">
            Viandas caseras, equilibradas y listas para disfrutar. Elegí tus
            platos y resolvé tus almuerzos de la semana en minutos.
          </p>

          <div className="hero__cta">
            <Button href="#menu" variant="secondary">
              Ver menú semanal
            </Button>
            <Button href="#packs" variant="primary">
              Pedir mi pack
            </Button>
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

      <section className="section" id="problema">
        <SectionHeading
          eyebrow="¿Te pasa esto?"
          title="Tu semana no debería depender de improvisar la comida"
          intro="Llegás cansado, no sabés qué cocinar, terminás pidiendo delivery y sentís que perdés tiempo todos los días pensando qué comer."
        />

        <div className="card-grid card-grid--problem">
          {problemCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <section className="section section--split" id="solucion">
        <div>
          <SectionHeading
            eyebrow="Solución"
            title="Nosotros cocinamos. Vos disfrutás."
            intro="Un flujo simple pensado para personas ocupadas: elegís tu pack, seleccionás tus platos, recibís tus viandas y listo."
          />

          <div className="steps">
            {steps.map((step, index) => (
              <div className="step" key={step.title}>
                <span className="step__index">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="solution-panel">
          <p className="solution-panel__eyebrow">Lo que realmente vendemos</p>
          <h3>Tiempo, organización y tranquilidad.</h3>
          <p>
            No vendemos simplemente comida. Vendemos una semana más liviana, con
            comida casera resuelta y sin perder horas en la cocina.
          </p>
          <ul>
            <li>Ahorro de tiempo real.</li>
            <li>Variedad semanal sin pensar de más.</li>
            <li>Comida lista para recalentar o freezer.</li>
          </ul>
        </aside>
      </section>

      <section className="section" id="beneficios">
        <SectionHeading
          eyebrow="Beneficios"
          title="Todo lo que necesitás para comer mejor sin complicarte"
          intro="Pensado para rutinas intensas, oficinas, home office y parejas o personas que viven solas y quieren resolver la semana con anticipación."
        />

        <div className="benefit-grid">
          {menuHighlights.map((benefit, index) => (
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
          title="Elegí el pack que mejor acompaña tu ritmo"
          intro="Pack 10 destacado para quienes buscan más organización, más ahorro y más tranquilidad."
        />

        <div className="pack-grid">
          {packages.map((pack) => (
            <PackageCard key={pack.title} {...pack} featured={pack.featured} />
          ))}
        </div>
      </section>

      <section className="section" id="menu">
        <SectionHeading
          eyebrow="Menú semanal"
          title="Variedad real para no aburrirte"
          intro="El menú cambia todas las semanas para ofrecer variedad y mantener una alimentación organizada sin pensar de más."
        />

        <div className="menu-grid">
          {menuHighlights.map((dish) => (
            <article className="menu-card" key={dish.title}>
              <div
                className={`menu-card__art menu-card__art--${dish.slug}`}
                aria-hidden="true"
              />
              <h3>{dish.title}</h3>
              <p>{dish.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="packaging">
        <SectionHeading
          eyebrow="Packaging"
          title="Diseñado para hacerte la vida más fácil"
          intro="Bolsa kraft, etiquetas reales y viandas listas para freezer o microondas. La experiencia completa importa tanto como la comida."
        />

        <div className="packaging-layout">
          <div className="packaging-visual">
            <img
              src="/images/sections/packaging-real.png"
              alt="Packaging real de viandas Fit and Fresh"
              loading="lazy"
            />
          </div>

          <div className="packaging-panel">
            <ul>
              {packagingHighlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="comidas">
        <SectionHeading
          eyebrow="Comidas"
          title="Platos que dan ganas de volver a elegir"
          intro="El menú cambia todas las semanas para que siempre tengas variedad."
        />

        <div className="dish-grid">
          {dishes.map((dish) => (
            <article className="dish-card" key={dish.name}>
              <div
                className="dish-card__art"
                style={{ backgroundImage: `url(${dish.image})` }}
                aria-hidden="true"
              />
              <strong>{dish.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--storage">
        <div>
          <SectionHeading
            eyebrow="Conservación"
            title="Preparadas para acompañarte toda la semana"
            intro="Packaging apto freezer y microondas, pensado para una experiencia práctica y sin complicaciones."
          />

          <div className="storage-list">
            <div>
              <strong>Heladera</strong>
              <span>Hasta 72 horas.</span>
            </div>
            <div>
              <strong>Freezer</strong>
              <span>Hasta 3 meses.</span>
            </div>
            <div>
              <strong>Packaging</strong>
              <span>Apto microondas y freezer.</span>
            </div>
          </div>
        </div>

        <div className="storage-note">
          <h3>Caseras, frescas y hechas en el día.</h3>
          <p>
            Elaboración artesanal, porciones abundantes, sin ultraprocesados y
            con opciones vegetarianas para sumar flexibilidad a tu semana.
          </p>
          <img
            className="storage-note__media"
            src="/images/sections/freezer.png"
            alt="Viandas Fit and Fresh organizadas para freezer"
            loading="lazy"
          />
        </div>
      </section>

      <section className="section" id="testimonios">
        <SectionHeading
          eyebrow="Confianza"
          title="Personas reales, rutinas reales"
          intro="Experiencias de clientes que resolvieron su semana con más organización y menos estrés."
        />

        <div className="card-grid">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>
      </section>

      <section className="section referral">
        <SectionHeading
          eyebrow="Referidos"
          title="Invitá a alguien y ganá beneficios"
          intro="Si una persona que recomendaste realiza una compra, obtenés 10% OFF en tu próximo pack."
        />
        <div className="referral__box">
          <div className="referral__copy">
            <p>
              Compartí Fit & Fresh con alguien que también quiera resolver su
              semana con más organización y menos cocina improvisada.
            </p>
            <Button href="#packs" variant="primary">
              Quiero mi beneficio
            </Button>
          </div>
          <img
            className="referral__media"
            src="/images/packs/pack-5.png"
            alt="Pack de 5 viandas Fit and Fresh"
            loading="lazy"
          />
        </div>
      </section>

      <section className="section" id="faq">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Resolvé tus dudas antes de comprar"
          intro="Respuestas claras para bajar fricción y ayudar a la conversión."
        />

        <div className="faq-list">
          {faqs.map((faq) => (
            <FaqItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      <section className="section cta-final">
        <span className="eyebrow">Último paso</span>
        <h2>Recuperá tiempo para lo que realmente importa</h2>
        <p>Nosotros cocinamos. Vos disfrutás.</p>
        <div className="hero__cta hero__cta--center">
          <Button href="#packs" variant="secondary">
            Elegir Pack 5
          </Button>
          <Button href="#packs" variant="primary">
            Elegir Pack 10
          </Button>
        </div>
      </section>

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
          <p>Consultá por Instagram y coordinamos tu compra.</p>
        </div>
      </footer>
    </main>
  );
}
