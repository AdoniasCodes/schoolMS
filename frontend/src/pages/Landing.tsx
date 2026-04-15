import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/i18n/LanguageProvider'
import {
  CheckCircle2, Users, MessageCircle, ClipboardList,
  BarChart3, Megaphone, Camera, Shield, Globe, ArrowRight,
  BookOpen, Clock, Heart, Star
} from 'lucide-react'

export default function Landing() {
  const { t, language, setLanguage } = useLanguage()
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
      <a href="#main" className="skip-link">{t('landing.skipToContent')}</a>

      {/* Grain overlay */}
      <div className="lp-grain" aria-hidden />

      {/* Header */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <div className="lp-brand">
            <img src="/images/logo.webp" alt="Abogida" style={{ width: 110, height: 'auto', borderRadius: 10 }} />
          </div>
          <nav className="lp-nav" aria-label="Primary">
            <a href="#features">{t('landing.features')}</a>
            <a href="#how-it-works">{t('landing.howItWorks')}</a>
            <a href="#for-schools">{t('landing.forSchools')}</a>
            <a href="#testimonials">{t('landing.stories')}</a>
            <button
              className="lp-lang-toggle"
              onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
              aria-label="Switch language"
              style={{
                background: 'transparent',
                border: '1px solid rgba(26,58,74,0.2)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'var(--lp-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'border-color 0.2s',
              }}
            >
              <Globe size={14} />
              {language === 'en' ? 'አማ' : 'EN'}
            </button>
            <Link to="/login" className="lp-nav-cta">{t('landing.getStarted')} <ArrowRight size={14} /></Link>
          </nav>
          <button className="lp-hamburger" aria-label={t('nav.openMenu')} onClick={() => setMenuOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`offcanvas ${menuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="offcanvas-panel">
          <img src="/images/logo.webp" alt="Abogida" style={{ width: 100, borderRadius: 10, marginBottom: 16 }} />
          <a href="#features" onClick={() => setMenuOpen(false)}>{t('landing.features')}</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>{t('landing.howItWorks')}</a>
          <a href="#for-schools" onClick={() => setMenuOpen(false)}>{t('landing.forSchools')}</a>
          <a href="#testimonials" onClick={() => setMenuOpen(false)}>{t('landing.stories')}</a>
          <button
            className="btn btn-secondary"
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
          >
            <Globe size={14} />
            {language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
          </button>
          <Link to="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)} style={{ marginTop: 8 }}>{t('landing.getStarted')}</Link>
          <button className="btn btn-secondary" onClick={() => setMenuOpen(false)} style={{ marginTop: 4 }}>{t('common.close')}</button>
        </div>
        <div className="offcanvas-backdrop" onClick={() => setMenuOpen(false)} />
      </div>

      <main id="main" tabIndex={-1}>

        {/* ===== HERO ===== */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-content">
              <div className="lp-hero-badge">
                <Globe size={14} /> {t('landing.heroTag')}
              </div>
              <h1 className="lp-hero-title">
                {t('landing.heroTitle')}
              </h1>
              <p className="lp-hero-sub">
                {t('landing.heroDesc')}
              </p>
              <div className="lp-hero-ctas">
                <Link to="/login" className="lp-btn-primary">
                  {t('landing.startTrial')} <ArrowRight size={16} />
                </Link>
                <a href="#features" className="lp-btn-outline">{t('landing.seeHow')}</a>
              </div>
              <div className="lp-hero-stats">
                <div className="lp-stat">
                  <div className="lp-stat-num">K&ndash;8</div>
                  <div className="lp-stat-label">{t('landing.gradeLevels')}</div>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <div className="lp-stat-num">2</div>
                  <div className="lp-stat-label">{t('landing.languages')}</div>
                </div>
                <div className="lp-stat-divider" />
                <div className="lp-stat">
                  <div className="lp-stat-num">30</div>
                  <div className="lp-stat-label">{t('landing.freeTrialDays')}</div>
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
                  <span>{t('landing.presentToday')}</span>
                </div>
                <div className="lp-hero-float lp-hero-float-2">
                  <Camera size={18} style={{ color: '#f59e0b' }} />
                  <span>{t('landing.newPhotos')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="lp-trust" id="trust-bar" data-animate>
          <div className={`lp-trust-inner ${isVisible('trust-bar') ? 'lp-visible' : ''}`}>
            {[
              { icon: <Shield size={20} />, text: t('landing.security') },
              { icon: <Globe size={20} />, text: t('landing.bilingualSupport') },
              { icon: <Clock size={20} />, text: t('landing.realtimeUpdates') },
              { icon: <Heart size={20} />, text: t('landing.builtWithCare') },
            ].map((item, i) => (
              <div key={i} className="lp-trust-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-trust-icon">{item.icon}</div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="lp-features" data-animate>
          <div className={`lp-section-inner ${isVisible('features') ? 'lp-visible' : ''}`}>
            <div className="lp-section-header">
              <span className="lp-tag">{t('landing.platformFeatures')}</span>
              <h2 className="lp-section-title">{t('landing.featuresTitle')}</h2>
              <p className="lp-section-sub">
                {t('landing.featuresDesc')}
              </p>
            </div>

            <div className="lp-features-grid">
              {[
                { icon: <ClipboardList size={24} />, color: '#22c55e', title: t('landing.attendanceTracking'), desc: t('landing.attendanceDesc') },
                { icon: <Camera size={24} />, color: '#3b82f6', title: t('landing.photoUpdates'), desc: t('landing.photoUpdatesDesc') },
                { icon: <MessageCircle size={24} />, color: '#f59e0b', title: t('landing.directMessaging'), desc: t('landing.directMessagingDesc') },
                { icon: <Megaphone size={24} />, color: '#ef4444', title: t('landing.announcementsFeature'), desc: t('landing.announcementsDesc') },
                { icon: <BarChart3 size={24} />, color: '#8b5cf6', title: t('landing.progressReports'), desc: t('landing.progressReportsDesc') },
                { icon: <BookOpen size={24} />, color: '#06b6d4', title: t('landing.classManagement'), desc: t('landing.classManagementDesc') },
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
              <span className="lp-tag">{t('landing.howItWorksTitle')}</span>
              <h2 className="lp-section-title">{t('landing.threeRoles')}</h2>
              <p className="lp-section-sub">
                {t('landing.threeRolesDesc')}
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
                  <div className="lp-role-label">{t('landing.forAdmins')}</div>
                  <h3>{t('landing.completeOversight')}</h3>
                  <ul>
                    <li>{t('landing.adminFeature1')}</li>
                    <li>{t('landing.adminFeature2')}</li>
                    <li>{t('landing.adminFeature3')}</li>
                    <li>{t('landing.adminFeature4')}</li>
                    <li>{t('landing.adminFeature5')}</li>
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
                  <div className="lp-role-label">{t('landing.forTeachers')}</div>
                  <h3>{t('landing.lessWork')}</h3>
                  <ul>
                    <li>{t('landing.teacherFeature1')}</li>
                    <li>{t('landing.teacherFeature2')}</li>
                    <li>{t('landing.teacherFeature3')}</li>
                    <li>{t('landing.teacherFeature4')}</li>
                    <li>{t('landing.teacherFeature5')}</li>
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
                  <div className="lp-role-label">{t('landing.forParents')}</div>
                  <h3>{t('landing.neverMiss')}</h3>
                  <ul>
                    <li>{t('landing.parentFeature1')}</li>
                    <li>{t('landing.parentFeature2')}</li>
                    <li>{t('landing.parentFeature3')}</li>
                    <li>{t('landing.parentFeature4')}</li>
                    <li>{t('landing.parentFeature5')}</li>
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
                <span className="lp-tag">{t('landing.forSchools')}</span>
                <h2 className="lp-section-title">{t('landing.standOut')}</h2>
                <p>
                  {t('landing.standOutDesc')}
                </p>
                <div className="lp-check-list">
                  {[
                    t('landing.benefit1'),
                    t('landing.benefit2'),
                    t('landing.benefit3'),
                    t('landing.benefit4'),
                    t('landing.benefit5'),
                    t('landing.benefit6'),
                  ].map((item, i) => (
                    <div key={i} className="lp-check-item">
                      <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/login" className="lp-btn-primary" style={{ marginTop: 24 }}>
                  {t('landing.startTrialBtn')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section id="testimonials" className="lp-testimonials" data-animate>
          <div className={`lp-section-inner ${isVisible('testimonials') ? 'lp-visible' : ''}`}>
            <div className="lp-section-header">
              <span className="lp-tag">{t('landing.testimonials')}</span>
              <h2 className="lp-section-title">{t('landing.testimonialsDesc')}</h2>
            </div>
            <div className="lp-testimonials-grid">
              {[
                {
                  quote: t('landing.testimonial1'),
                  name: t('landing.testimonial1Author'),
                  role: t('landing.testimonial1School'),
                  stars: 5,
                },
                {
                  quote: t('landing.testimonial2'),
                  name: t('landing.testimonial2Author'),
                  role: t('landing.testimonial2School'),
                  stars: 5,
                },
                {
                  quote: t('landing.testimonial3'),
                  name: t('landing.testimonial3Author'),
                  role: t('landing.testimonial3School'),
                  stars: 5,
                },
              ].map((item, i) => (
                <div key={i} className="lp-testimonial-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="lp-testimonial-stars">
                    {Array.from({ length: item.stars }).map((_, j) => (
                      <Star key={j} size={16} fill="#f59e0b" stroke="#f59e0b" />
                    ))}
                  </div>
                  <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                  <div className="lp-testimonial-author">
                    <div className="lp-testimonial-avatar" aria-hidden />
                    <div>
                      <div className="lp-testimonial-name">{item.name}</div>
                      <div className="lp-testimonial-role">{item.role}</div>
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
            <h2>{t('landing.ctaTitle')}</h2>
            <p>
              {t('landing.ctaDesc')}
            </p>
            <div className="lp-cta-buttons">
              <Link to="/login" className="lp-btn-white">
                {t('landing.startTrial')} <ArrowRight size={16} />
              </Link>
              <a href="mailto:info@abogida.com" className="lp-btn-ghost">{t('landing.contactSales')}</a>
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
            <h4>{t('landing.platform')}</h4>
            <a href="#features">{t('landing.features')}</a>
            <a href="#how-it-works">{t('landing.howItWorks')}</a>
            <a href="#for-schools">{t('landing.forSchools')}</a>
            <Link to="/login">{t('landing.signIn')}</Link>
          </div>
          <div className="lp-footer-links">
            <h4>{t('landing.support')}</h4>
            <a href="mailto:info@abogida.com">info@abogida.com</a>
            <a href="#contact">{t('landing.contactUs')}</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          &copy; {new Date().getFullYear()} {t('landing.footer')}
        </div>
      </footer>
    </div>
  )
}
