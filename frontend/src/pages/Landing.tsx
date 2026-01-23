import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, School, Globe, Timer, Users, ClipboardList, Megaphone, MessageCircle, BarChart3, CheckCircle2 } from 'lucide-react'

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Prevent body scroll when menu open (mobile)
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  return (
    <div className="landing">
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="brand" style={{ gap: 10 }}>
            <img src="/images/logo.webp" alt="Abogida logo" style={{ width: 120, height: 'auto', borderRadius: 12, display:'block', aspectRatio: '500 / 178', maxHeight: 42.72 }} />
          </div>
          <nav className="landing-nav" aria-label="Primary">
            <a href="#product" aria-label="Go to Product section">Product</a>
            <a href="#how" aria-label="Go to How It Works section">How It Works</a>
            <a href="#schools" aria-label="Go to Schools section">Schools</a>
            <a href="#contact" aria-label="Go to Contact section">Contact</a>
            <Link to="/login" className="btn btn-primary" aria-label="Sign in to Abogida">Sign In</Link>
          </nav>
          <button className="hamburger" aria-label="Open menu" aria-controls="mobile-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Off-canvas Mobile Menu */}
      <div className={`offcanvas ${menuOpen ? 'open' : ''}`} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
        <div className="offcanvas-panel">
          <div className="brand" style={{ gap: 10, padding: '16px 8px' }}>
            <img src="/images/logo.webp" alt="Abogida logo" style={{ width: 120, height: 'auto', borderRadius: 12, display:'block', aspectRatio: '500 / 178', maxHeight: 42.72 }} />
          </div>
          <a href="#product" onClick={() => setMenuOpen(false)} aria-label="Go to Product section">Product</a>
          <a href="#how" onClick={() => setMenuOpen(false)} aria-label="Go to How It Works section">How It Works</a>
          <a href="#schools" onClick={() => setMenuOpen(false)} aria-label="Go to Schools section">Schools</a>
          <a href="#contact" onClick={() => setMenuOpen(false)} aria-label="Go to Contact section">Contact</a>
          <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)} aria-label="Sign in to Abogida">Sign In</Link>
          <button className="btn btn-secondary" onClick={() => setMenuOpen(false)} style={{ marginTop: 8 }} aria-label="Close menu">Close</button>
        </div>
        <div className="offcanvas-backdrop" onClick={() => setMenuOpen(false)} />
      </div>

      <main id="main" tabIndex={-1}>
        {/* Hero */}
        <section className="hero">
          <div className="hero-inner grid cols-2">
            <div className="hero-copy">
              <h1>Smarter School Management</h1>
              <p>Everything schools need, without the paperwork.</p>
              <div className="hero-ctas">
                <Link to="/login" className="btn btn-primary">Sign In</Link>
                <a href="#product" className="btn btn-secondary">Learn More</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="shape shape-1" />
              <div className="shape shape-2" />
              <div className="hero-card card" style={{ overflow: 'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img
                  src="/images/hero.webp"
                  alt="Teacher using tablet – Abogida school platform"
                  loading="eager"
                  style={{ width: '100%', height: 'auto', objectFit: 'contain', objectPosition: 'center', display:'block', maxHeight: 320 }}
                />
              </div>
              <div className="hero-row">
                <div className="card" style={{ flex: 1 }}>
                  <Users aria-hidden style={{ width: 32, height: 32, color: 'var(--primary)' }} />
                  <div className="helper" style={{ marginTop: 6 }}>Students</div>
                </div>
                <div className="card" style={{ flex: 1 }}>
                  <MessageCircle aria-hidden style={{ width: 32, height: 32, color: 'var(--accent)' }} />
                  <div className="helper" style={{ marginTop: 6 }}>Parent on phone</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="trust-strip">
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><Timer size={18} /></div>
            <div className="trust-label">4+ Years Experience</div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><School size={18} /></div>
            <div className="trust-label">Built for Schools</div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><ShieldCheck size={18} /></div>
            <div className="trust-label">Secure by Design</div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><Globe size={18} /></div>
            <div className="trust-label">Ethiopian-first Focus</div>
          </div>
        </section>

        {/* Product overview grid */}
        <section id="product" className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#22c55e' }} aria-hidden><ClipboardList size={22} /></div>
            <div className="feature-title">Attendance</div>
          </div>
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#3b82f6' }} aria-hidden><Users size={22} /></div>
            <div className="feature-title">Daily Updates</div>
          </div>
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#f59e0b' }} aria-hidden><MessageCircle size={22} /></div>
            <div className="feature-title">Parent Messaging</div>
          </div>
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#06b6d4' }} aria-hidden><Megaphone size={22} /></div>
            <div className="feature-title">Announcements</div>
          </div>
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#8b5cf6' }} aria-hidden><CheckCircle2 size={22} /></div>
            <div className="feature-title">Progress Reports</div>
          </div>
          <div className="feature-card card">
            <div className="feature-icon" style={{ background: '#ef4444' }} aria-hidden><BarChart3 size={22} /></div>
            <div className="feature-title">Admin Dashboard</div>
          </div>
        </section>

        {/* How it helps */}
        <section id="how" className="how">
          <div className="grid cols-2" style={{ alignItems: 'center' }}>
            <div className="card" style={{ minHeight: 220, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img
                src="/images/admin.webp"
                alt="School administration dashboard illustration"
                loading="lazy"
                style={{ width: '100%', height: 'auto', objectFit: 'contain', objectPosition: 'center', display:'block', maxHeight: 320, borderRadius: 12, boxShadow: 'var(--shadow)' }}
              />
            </div>
            <div className="how-list">
              <div className="how-item">
                <div className="how-icon" aria-hidden><ClipboardList size={18} /></div>
                <div className="how-label">Less paperwork</div>
              </div>
              <div className="how-item">
                <div className="how-icon" aria-hidden><MessageCircle size={18} /></div>
                <div className="how-label">Better communication</div>
              </div>
              <div className="how-item">
                <div className="how-icon" aria-hidden><Timer size={18} /></div>
                <div className="how-label">More time for teaching</div>
              </div>
              <div className="how-item">
                <div className="how-icon" aria-hidden><Users size={18} /></div>
                <div className="how-label">Happier parents</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="testimonials">
          <h2>What People Say (Examples)</h2>
          <div className="grid cols-3 testimonials-grid">
            {[
              { role: 'Principal', quote: 'Paperwork dropped dramatically; transparency improved.' },
              { role: 'Teacher', quote: 'I take attendance in seconds and share updates instantly.' },
              { role: 'Parent', quote: 'I finally see what’s happening at school—no lost papers.' }
            ].map((t) => (
              <div className="testimonial-card card" key={t.role}>
                <div className="avatar" aria-hidden />
                <div className="badge">{t.role} (Demo)</div>
                <p>“{t.quote}”</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <h2>Let Schools Focus on Education</h2>
          <p className="helper">We handle the systems.</p>
          <Link to="/login" className="btn btn-primary">Sign In</Link>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="landing-footer">
        <div><strong>Abogida</strong> — Built for schools</div>
        <div className="helper">Contact: info@example.com</div>
        <div className="helper">© Abogida. All rights reserved.</div>
      </footer>
    </div>
  )
}
