import type { Metadata } from "next";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import "./styles/home.css";

export const metadata: Metadata = {
  title: "VetRetire - Find Your Perfect Retirement Destination",
};

// Ported 1:1 from locations/templates/locations/home.html
export default function Home() {
  return (
    // .home-page scopes home.css's reset to this page; see app/globals.css.
    <div className="home-page">
      <PublicNav active="home" />

      <section className="hero">
        <div className="hero-content">
          <h1>Find Your Perfect Retirement Destination</h1>
          <p>
            Discover the ideal place to enjoy your well-earned retirement.
            Filter by climate, lifestyle, cost of living, and more to find
            communities built for veterans like you.
          </p>
          <Link href="/explore" className="cta-button">
            Start Exploring
          </Link>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features-container">
          <h2 className="section-title">Filter Your Perfect Match</h2>
          <p className="section-subtitle">
            Use our comprehensive filters to find locations that match your
            retirement vision
          </p>

          <div className="filter-grid">
            <div className="filter-card">
              <div className="filter-icon">☀️</div>
              <h3>Climate</h3>
              <p>
                Find warm beaches, cool mountains, or four-season variety.
                Filter by temperature, precipitation, and seasonal preferences.
              </p>
            </div>

            <div className="filter-card">
              <div className="filter-icon">🏡</div>
              <h3>Lifestyle</h3>
              <p>
                Choose between urban excitement, quiet suburbs, or peaceful
                rural settings. Match your activity level and interests.
              </p>
            </div>

            <div className="filter-card">
              <div className="filter-icon">💰</div>
              <h3>Economy</h3>
              <p>
                Compare cost of living, tax rates, and housing prices. Make your
                retirement savings go further.
              </p>
            </div>

            <div className="filter-card">
              <div className="filter-icon">🏥</div>
              <h3>Healthcare</h3>
              <p>
                Access to VA facilities, quality hospitals, and specialized
                care. Your health comes first.
              </p>
            </div>

            <div className="filter-card">
              <div className="filter-icon">🎯</div>
              <h3>Activities</h3>
              <p>
                Golf, fishing, hiking, arts, or culture. Find communities that
                match your hobbies and passions.
              </p>
            </div>

            <div className="filter-card">
              <div className="filter-icon">🤝</div>
              <h3>Community</h3>
              <p>
                Connect with fellow veterans. Find areas with strong veteran
                communities and support networks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="features-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Three simple steps to find your retirement paradise
          </p>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Set Your Preferences</h3>
              <p>
                Tell us what matters most to you. Climate, budget, activities,
                and lifestyle preferences.
              </p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Explore Matches</h3>
              <p>
                Browse personalized location recommendations with detailed
                insights and veteran-specific information.
              </p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Plan Your Visit</h3>
              <p>
                Get connected with local resources, veteran organizations, and
                community information to make your decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to Find Your Next Chapter?</h2>
        <p>
          Join thousands of veterans who&apos;ve found their perfect retirement
          destination
        </p>
        <Link href="/explore" className="cta-button">
          Get Started Today
        </Link>
      </section>

      <footer>
        <p>&copy; 2025 VetRetire. Serving those who served. All rights reserved.</p>
      </footer>
    </div>
  );
}
