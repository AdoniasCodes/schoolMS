import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Users, MessageCircle, ClipboardList,
  BarChart3, Megaphone, Camera, Shield, Globe, ArrowRight,
  BookOpen, Clock, Heart, Star
} from 'lucide-react'

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  // Intersection observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.15 }
    )

    document.querySelectorAll('[data-animate]').forEach(el => {
      observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  const isVisible = (id: string) => visibleSections.has(id)

  return (
    <div className="lp">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Grain overlay */}
      <div className="lp-grain" aria-hidden />

      {/* Header */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-brand">
            <img src="/images/logo.webp" alt="Abogida" style={{ width: 110, height: 'auto', borderRadius: 10 }} />
          </div>
          <nav className="lp-nav" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#for-schools">For Schools</a>
            <a href="#testimonials">Stories</a>
            <Link to="/login" className="lp-nav-cta">Get Started <ArrowRight size={14} /></Link>
          </nav>
          <button className="lp-hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`offcanvas ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="offcanvas-panel">
          <img src="/images/logo.webp" alt="Abogida" style={{ width: 100, borderRadius: 10, marginBottom: 16 }} />
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#for-schools" onClick={() => setMenuOpen(false)}>For Schools</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)}>Stories</a>
          <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)} style={{ marginTop: 8 }}>Get Started</Link>
          <button className="btn btn-secondary" onClick={() => setMenuOpen(false)} style={{ marginTop: 4 }}>Close</button>
        </div>
        <div className="offcanvas-backdrop" onClick={() => setMenuOpen(false)} />
      </div>

      <main id="main" tabIndex={-1}>

        {/* ===== HERO ===== */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-content">
              <div className="lp-hero-badge">
                <Globe size={14} /> Built for Ethiopian Schools
              </div>
              <h1 className="lp-hero-title">
                Where Every Child's
                <span className="lp-hero-accent"> Journey </span>
                is Seen
              </h1>
              <p className="lp-hero-sub">
                Abogida brings teachers and parents together with real-time attendance,
                daily photo updates, instant messaging, and progress reports &mdash;
                so no moment in your child's education goes unnoticed.
              </p>
              <div className="lp-hero-ctas">
                <Link to="/login" className="lp-btn-primary">
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <a href="#features" className="lp-btn-outline">See How It Works</a>
              </div>
              <div className="lp-hero-stats">
                <div className="lp-stat">
                  <div className="lp-stat-num">K&ndash;8</div>
                  <div className="lp-stat-label">Grade Levels</div>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <div className="lp-stat-num">2</div>
                  <div className="lp-stat-label">Languages</div>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <div className="lp-stat-num">30</div>
                  <div className="lp-stat-label">Day Free Trial</div>
                </div>
              </div>
            </div>
            <div className="lp-hero-visual">
              <div className="lp-hero-img-wrap">
                <img
                  src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=720&h=540&fit=crop&crop=faces"
                  alt="Young student smiling in classroom"
                  loading="eager"
                  className="lp-hero-img"
                />
                <div className="lp-hero-float lp-hero-float-1">
                  <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                  <span>Present today</span>
                </div>
                <div className="lp-hero-float lp-hero-float-2">
                  <Camera size={18} style={{ color: '#f59e0b' }} />
                  <span>3 new photos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="lp-trust" id="trust-bar" data-animate>
          <div className={`lp-trust-inner ${isVisible('trust-bar') ? 'lp-visible' : ''}`}>
            {[
              { icon: <Shield size={20} />, text: 'Bank-level Security' },
              { icon: <Globe size={20} />, text: 'English & Amharic' },
              { icon: <Clock size={20} />, text: 'Real-time Updates' },
              { icon: <Heart size={20} />, text: 'Built with Care' },
            ].map((t, i) => (
              <div key={i} className="lp-trust-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-trust-icon">{t.icon}</div>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="lp-features" data-animate>
          <div className={`lp-section-inner ${isVisible('features') ? 'lp-visible' : ''}`}>
            <div className="lp-section-header">
              <span className="lp-tag">Platform Features</span>
              <h2 className="lp-section-title">Everything Your School Needs, <em>Nothing It Doesn't</em></h2>
              <p className="lp-section-sub">
                From morning attendance to end-of-term reports, Abogida replaces
                scattered paper systems with one intuitive platform.
              </p>
            </div>

            <div className="lp-features-grid">
              {[
                { icon: <ClipboardList size={24} />, color: '#22c55e', title: 'Attendance Tracking', desc: 'Mark attendance in seconds. Parents see their child\'s status instantly. Historical records at a glance.' },
                { icon: <Camera size={24} />, color: '#3b82f6', title: 'Daily Photo Updates', desc: 'Teachers share classroom moments with photos and videos. Parents feel connected to their child\'s day.' },
                { icon: <MessageCircle size={24} />, color: '#f59e0b', title: 'Direct Messaging', desc: 'Private 1-on-1 messaging between parents and teachers. Admin can broadcast to all parents at once.' },
                { icon: <Megaphone size={24} />, color: '#ef4444', title: 'Announcements', desc: 'School-wide or class-specific announcements with optional file attachments. Target specific parents.' },
                { icon: <BarChart3 size={24} />, color: '#8b5cf6', title: 'Progress Reports', desc: 'Track reading, writing, math, social skills, and behavior with visual metric cards each term.' },
                { icon: <BookOpen size={24} />, color: '#06b6d4', title: 'Class Management', desc: 'Manage classes, enrollments, and student records. Bulk import via Excel. Quick-enroll wizards.' },
              ].map((f, i) => (
                <div key={i} className="lp-feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="lp-feature-icon" style={{ background: f.color }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="lp-how" data-animate>
          <div className={`lp-section-inner ${isVisible('how-it-works') ? 'lp-visible' : ''}`}>
            <div className="lp-section-header">
              <span className="lp-tag">How It Works</span>
              <h2 className="lp-section-title">Three Roles, One Platform</h2>
              <p className="lp-section-sub">
                Abogida gives every stakeholder the right view at the right time.
              </p>
            </div>

            <div className="lp-roles-grid">
              <div className="lp-role-card">
                <div className="lp-role-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=480&h=320&fit=crop"
                    alt="School administrator working at desk"
                    loading="lazy"
                  />
                </div>
                <div className="lp-role-body">
                  <div className="lp-role-label">For School Admins</div>
                  <h3>Complete Oversight</h3>
                  <ul>
                    <li>Student and teacher management</li>
                    <li>School-wide announcements</li>
                    <li>Direct messaging to any parent</li>
                    <li>Attendance and enrollment reports</li>
                    <li>Subscription and billing controls</li>
                  </ul>
                </div>
              </div>

              <div className="lp-role-card">
                <div className="lp-role-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?w=480&h=320&fit=crop"
                    alt="Teacher helping students in classroom"
                    loading="lazy"
                  />
                </div>
                <div className="lp-role-body">
                  <div className="lp-role-label">For Teachers</div>
                  <h3>Less Paperwork, More Teaching</h3>
                  <ul>
                    <li>One-tap attendance marking</li>
                    <li>Post daily updates with photos</li>
                    <li>Message parents directly</li>
                    <li>Create progress reports with metrics</li>
                    <li>Class-level announcements</li>
                  </ul>
                </div>
              </div>

              <div className="lp-role-card">
                <div className="lp-role-img-wrap">
                  <img
                    src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=480&h=320&fit=crop"
                    alt="Parent looking at phone with child"
                    loading="lazy"
                  />
                </div>
                <div className="lp-role-body">
                  <div className="lp-role-label">For Parents</div>
                  <h3>Never Miss a Moment</h3>
                  <ul>
                    <li>See today's attendance status instantly</li>
                    <li>Browse classroom photos and updates</li>
                    <li>Chat with teachers and admin</li>
                    <li>View progress reports and metrics</li>
                    <li>Get school and class announcements</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FOR SCHOOLS ===== */}
        <section id="for-schools" className="lp-schools" data-animate>
          <div className={`lp-section-inner ${isVisible('for-schools') ? 'lp-visible' : ''}`}>
            <div className="lp-schools-split">
              <div className="lp-schools-img">
                <img
                  src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=640&h=480&fit=crop"
                  alt="Stack of books representing education"
                  loading="lazy"
                />
              </div>
              <div className="lp-schools-content">
                <span className="lp-tag">For Schools</span>
                <h2 className="lp-section-title">Stand Out From <em>Every Other School</em></h2>
                <p>
                  In a competitive education landscape, parents choose schools that offer
                  transparency and communication. Abogida gives your school a modern edge
                  that parents can see and feel every day.
                </p>
                <div className="lp-check-list">
                  {[
                    'Advertise your platform access as a school benefit',
                    'Reduce administrative burden by 60%+',
                    'Increase parent engagement and satisfaction',
                    'Digitize attendance, reports, and records',
                    'Support English and Amharic languages',
                    'No hardware needed — works on any phone or computer',
                  ].map((item, i) => (
                    <div key={i} className="lp-check-item">
                      <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/login" className="lp-btn-primary" style={{ marginTop: 24 }}>
                  Start Your Free Trial <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section id="testimonials" className="lp-testimonials" data-animate>
          <div className={`lp-section-inner ${isVisible('testimonials') ? 'lp-visible' : ''}`}>
            <div className="lp-section-header">
              <span className="lp-tag">What People Are Saying</span>
              <h2 className="lp-section-title">Trusted by Schools That <em>Put Children First</em></h2>
            </div>
            <div className="lp-testimonials-grid">
              {[
                {
                  quote: 'Since we adopted Abogida, parent complaints about lack of communication dropped to nearly zero. They can see everything in real time.',
                  name: 'School Principal',
                  role: 'Primary School, Addis Ababa',
                  stars: 5,
                },
                {
                  quote: 'I used to spend 30 minutes on attendance and notes each morning. Now it takes me under 2 minutes and parents see it instantly.',
                  name: 'Grade 3 Teacher',
                  role: 'International Academy',
                  stars: 5,
                },
                {
                  quote: 'I finally know what my daughter is learning each day. The photos from class make me feel like I\'m there with her.',
                  name: 'Parent',
                  role: 'Mother of 2nd Grader',
                  stars: 5,
                },
              ].map((t, i) => (
                <div key={i} className="lp-testimonial-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="lp-testimonial-stars">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} size={16} fill="#f59e0b" stroke="#f59e0b" />
                    ))}
                  </div>
                  <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="lp-testimonial-author">
                    <div className="lp-testimonial-avatar" aria-hidden />
                    <div>
                      <div className="lp-testimonial-name">{t.name}</div>
                      <div className="lp-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="lp-cta" data-animate id="cta-section">
          <div className={`lp-cta-inner ${isVisible('cta-section') ? 'lp-visible' : ''}`}>
            <h2>Ready to Transform Your School?</h2>
            <p>
              Join schools across Ethiopia that are building stronger connections
              between teachers and parents. Start your 30-day free trial today.
            </p>
            <div className="lp-cta-buttons">
              <Link to="/login" className="lp-btn-white">
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <a href="mailto:info@abogida.com" className="lp-btn-ghost">Contact Sales</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/images/logo.webp" alt="Abogida" style={{ width: 100, borderRadius: 10 }} />
            <p>Connecting schools, teachers, and parents across Ethiopia.</p>
          </div>
          <div className="lp-footer-links">
            <h4>Platform</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#for-schools">For Schools</a>
            <Link to="/login">Sign In</Link>
          </div>
          <div className="lp-footer-links">
            <h4>Support</h4>
            <a href="mailto:info@abogida.com">info@abogida.com</a>
            <a href="#contact">Contact Us</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          &copy; {new Date().getFullYear()} Abogida. All rights reserved. Built in Ethiopia.
        </div>
      </footer>
    </div>
  )
}
