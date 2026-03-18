import React from 'react';

export const AboutAppModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', padding: 32, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 28, fontWeight: 800 }}>T</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>TriageGo</h1>
            <p style={{ fontSize: 14, opacity: 0.9 }}>AI-Ranked Medical Centers</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#fff', padding: 0, opacity: 0.8, transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.target.style.opacity = '1'}
            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 32 }}>
          
          {/* Version & Description */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: 99 }}>v1.0.0</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: '#f0fdf4', color: '#15803d', padding: '4px 12px', borderRadius: 99 }}>Production</span>
            </div>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, marginTop: 12 }}>
              TriageGo is an intelligent healthcare platform that uses AI-powered ranking to help you find the best medical centers based on your symptoms, services, or hospital preferences.
            </p>
          </div>

          {/* Key Features */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⭐ Key Features
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { icon: '🤖', title: 'AI Ranking', desc: 'Smart algorithm ranks hospitals by relevance to your needs' },
                { icon: '📍', title: 'Location-Based', desc: 'Find hospitals near you with real-time distance & ETA' },
                { icon: '📞', title: 'Contact Details', desc: 'Direct phone numbers, websites, and hours of operation' },
                { icon: '🚗', title: 'Ride Integration', desc: 'Book Uber or Ola directly to your chosen hospital' },
                { icon: '❤️', title: 'Save Favorites', desc: 'Bookmark hospitals for quick access later' },
                { icon: '🔍', title: 'Search History', desc: 'Auto-save searches and get instant suggestions' },
                { icon: '📊', title: 'Analytics', desc: 'Track your medical searches and preferences' },
                { icon: '🚨', title: 'SOS Emergency', desc: '24/7 emergency response to nearest hospitals' },
              ].map((feature, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{feature.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#111827', fontSize: 13, marginBottom: 2 }}>{feature.title}</p>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, textAlign: 'center' }}>By The Numbers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>500+</p>
                <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Hospitals</p>
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>50+</p>
                <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Services</p>
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>24/7</p>
                <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Availability</p>
              </div>
            </div>
          </div>

          {/* Team */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              👥 Built By
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
              TriageGo is developed by a dedicated team of healthcare and technology professionals passionate about making quality healthcare accessible to everyone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { role: '🧠 AI & Ranking', name: 'Algorithm Team', desc: 'Smart ranking engine' },
                { role: '🗺️ Location Tech', name: 'Geo Team', desc: 'Real-time location services' },
                { role: '🎨 UI/UX Design', name: 'Design Team', desc: 'Intuitive user experience' },
                { role: '🛡️ Security', name: 'Security Team', desc: 'Data protection & privacy' },
              ].map((member, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{member.role}</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>{member.name}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{member.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🚀 Technology
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { category: 'Backend', tech: 'FastAPI, Python, PostgreSQL' },
                { category: 'Frontend', tech: 'React, Vite, Tailwind CSS' },
                { category: 'APIs', tech: 'Google Maps, Places, Distance Matrix' },
                { category: 'DevOps', tech: 'Docker, AWS, CI/CD Pipeline' },
              ].map((stack, i) => (
                <div key={i} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>{stack.category}</p>
                  <p style={{ fontSize: 11, color: '#374151' }}>{stack.tech}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Links */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              🤝 Connect With Us
            </h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { icon: '📧', label: 'Email', value: 'support@triagego.com', href: 'mailto:support@triagego.com' },
                { icon: '🌐', label: 'Website', value: 'www.triagego.com', href: 'https://triagego.com' },
                { icon: '📱', label: 'Phone', value: '+91-XXXX-XXXX-XX', href: 'tel:+911234567890' },
                { icon: '🐙', label: 'GitHub', value: 'github.com/triagego', href: 'https://github.com/triagego' },
              ].map((link, i) => (
                <a key={i} href={link.href} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <span style={{ fontSize: 18, minWidth: 24 }}>{link.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{link.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.value}</p>
                  </div>
                  <span style={{ color: '#2563eb', fontSize: 14 }}>→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Privacy & Legal */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚖️ Legal
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {[
                { label: 'Privacy Policy', url: '#' },
                { label: 'Terms of Service', url: '#' },
                { label: 'Cookie Policy', url: '#' },
                { label: 'Disclaimer', url: '#' },
              ].map((item, i) => (
                <a key={i} href={item.url}
                  style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.color = '#2563eb'}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 1.6 }}>
              © 2024-2025 TriageGo. All rights reserved. TriageGo is not a substitute for professional medical advice. Always consult with qualified healthcare professionals.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
