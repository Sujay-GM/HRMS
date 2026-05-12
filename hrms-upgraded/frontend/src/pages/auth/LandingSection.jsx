export default function LandingSection({ onGetStarted }) {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Employee Management',
      desc: 'Centralized profiles, onboarding, and role-based access across departments.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
          <path d="M7 15h2M11 15h4"/>
        </svg>
      ),
      title: 'Payroll & Salary Tracking',
      desc: 'Automated INR payroll, tax calculations, and detailed salary breakdowns.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
        </svg>
      ),
      title: 'Attendance System',
      desc: 'Real-time check-in tracking, leave approvals, and attendance analytics.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Multi-Company Support',
      desc: 'Manage multiple entities from a single dashboard with isolated data.',
    },
  ];

  return (
    <div className="landing-section">
      {/* Background decorative blobs */}
      <div className="landing-blob landing-blob-1" />
      <div className="landing-blob landing-blob-2" />
      <div className="landing-blob landing-blob-3" />

      <div className="landing-content">
        {/* Badge */}
        <div className="landing-badge">
          <span className="landing-badge-dot" />
          Workforce Platform
        </div>

        {/* Headline */}
        <h1 className="landing-headline">
          Gully HR –{' '}
          <span className="landing-headline-accent">Smart Workforce</span>{' '}
          Management
        </h1>

        {/* Subtext */}
        <p className="landing-subtext">
          Manage employees, payroll, attendance, and operations in one unified platform built for modern teams.
        </p>

        {/* Feature highlights */}
        <ul className="landing-features">
          {features.map((f) => (
            <li key={f.title} className="landing-feature-item">
              <div className="landing-feature-icon">{f.icon}</div>
              <div className="landing-feature-text">
                <span className="landing-feature-title">{f.title}</span>
                <span className="landing-feature-desc">{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button className="landing-cta" onClick={onGetStarted}>
          Get Started
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Trust strip */}
        <p className="landing-trust">
          Trusted by HR teams · Secure & Scalable · INR Payroll Ready
        </p>
      </div>
    </div>
  );
}
