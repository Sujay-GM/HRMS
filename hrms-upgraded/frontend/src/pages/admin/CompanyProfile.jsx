import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import { PRESET_THEMES, DEFAULT_THEME, applyTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const INDUSTRIES = ['Technology','Finance','Healthcare','Retail','Education','Manufacturing','Logistics','Media','Real Estate','Other'];

export default function CompanyProfile() {
  const { user, updateUser } = useAuth();
  const [company, setCompany]   = useState(null);
  const [tab, setTab]           = useState('info');
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);

  // Theme state
  const [themeMode, setThemeMode]     = useState('default');
  const [themePreset, setThemePreset] = useState(0);
  const [themeCustom, setThemeCustom] = useState({ ...DEFAULT_THEME });

  useEffect(() => {
    if (!user?.company_id) return;
    companyService.getById(user.company_id).then(res => {
      const c = res.data;
      setCompany(c);
      setForm({
        name: c.name || '', email: c.email || '', phone: c.phone || '',
        website: c.website || '', industry: c.industry || '',
        founded: c.founded || '', description: c.description || '',
        address_line: c.address_line || '', city: c.city || '',
        state: c.state || '', country: c.country || '',
      });
      // Parse saved theme
      if (c.theme) {
        try {
          const t = typeof c.theme === 'string' ? JSON.parse(c.theme) : c.theme;
          const presetIdx = PRESET_THEMES.findIndex(p => p.primary === t.primary && p.secondary === t.secondary);
          if (presetIdx >= 0) { setThemeMode('preset'); setThemePreset(presetIdx); }
          else { setThemeMode('custom'); setThemeCustom({ ...DEFAULT_THEME, ...t }); }
        } catch { setThemeMode('default'); }
      }
    }).catch(() => toast.error('Could not load company data'));
  }, [user?.company_id]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await companyService.update(company.id, form);
      setCompany(prev => ({ ...prev, ...form }));
      toast.success('Company info updated!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const getThemePayload = () => {
    if (themeMode === 'default') return null;
    if (themeMode === 'preset') {
      const p = PRESET_THEMES[themePreset];
      return { primary: p.primary, secondary: p.secondary, accent: p.accent, danger: p.danger };
    }
    return themeCustom;
  };

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      const themePayload = getThemePayload();
      await companyService.update(company.id, { theme: themePayload ? JSON.stringify(themePayload) : null });
      // Apply immediately so admin sees effect right away
      applyTheme(themePayload || DEFAULT_THEME);
      // Persist in user object so it survives nav
      updateUser({ ...user, company_theme: themePayload ? JSON.stringify(themePayload) : null });
      toast.success('Theme saved and applied!');
    } catch { toast.error('Failed to save theme'); }
    setSaving(false);
  };

  const previewTheme = () => {
    const t = getThemePayload();
    applyTheme(t || DEFAULT_THEME);
  };

  if (!company) return <div className="loading-overlay"><div className="spinner" /></div>;

  const activeColors = themeMode === 'preset'
    ? PRESET_THEMES[themePreset]
    : themeMode === 'custom' ? themeCustom : DEFAULT_THEME;

  return (
    <div>
      <div className="page-header">
        <div><h1>Company Profile</h1><p>Manage company details and branding</p></div>
      </div>

      {/* Company card header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 68, height: 68, background: 'var(--primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>
            {company.name?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{company.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{company.industry} · {company.city}{company.country ? `, ${company.country}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{company.employee_count || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Employees</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary)' }}>{company.founded || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Founded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['info','Company Info'],['theme','Brand Theme']].map(([key, label]) => (
          <button key={key} className={`tab-btn${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="card">
          <div className="card-header"><h3>Edit Company Information</h3></div>
          <div className="card-body">
            <form onSubmit={handleSaveInfo}>
              <div className="form-grid form-grid-2">
                {[
                  ['name','Company Name','text',true],['email','Email','email',true],
                  ['phone','Phone','text'],['website','Website','text'],
                  ['industry','Industry','select'],['founded','Founded Year','text'],
                  ['address_line','Address','text',false,true],['city','City','text'],
                  ['state','State','text'],['country','Country','text'],
                ].map(([key, label, type, required, span]) => (
                  <div key={key} className="form-group" style={span ? { gridColumn: '1/-1' } : {}}>
                    <label>{label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
                    {key === 'industry' ? (
                      <select value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    )}
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Description</label>
                  <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setForm(company)}>Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {tab === 'theme' && (
        <div className="card">
          <div className="card-header">
            <h3>Brand Theme</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Colors applied across the employee portal</span>
          </div>
          <div className="card-body">
            {/* Mode Selector */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Theme Mode</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {[['default','Default'],['preset','Preset'],['custom','Custom']].map(([val, label]) => (
                  <label key={val} onClick={() => setThemeMode(val)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', border: `2px solid ${themeMode === val ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: themeMode === val ? 'var(--primary-light)' : 'var(--surface)', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: themeMode === val ? 'var(--primary-dark)' : 'var(--text-muted)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preset Grid */}
            {themeMode === 'preset' && (
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Choose Preset</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                  {PRESET_THEMES.map((preset, idx) => (
                    <div key={idx}
                      onClick={() => { setThemePreset(idx); applyTheme(preset); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: `2px solid ${themePreset === idx ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', background: themePreset === idx ? 'var(--primary-light)' : 'var(--surface)', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[preset.primary, preset.secondary, preset.accent, preset.danger].map((c, i) => (
                          <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{preset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Pickers */}
            {themeMode === 'custom' && (
              <div className="form-grid form-grid-2" style={{ marginBottom: 20 }}>
                {[['primary','Primary'],['secondary','Secondary'],['accent','Accent'],['danger','Danger']].map(([key, label]) => (
                  <div className="form-group" key={key}>
                    <label>{label} Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={themeCustom[key]}
                        onChange={e => { setThemeCustom(p => ({ ...p, [key]: e.target.value })); }}
                        onInput={e => { const next = { ...themeCustom, [key]: e.target.value }; applyTheme(next); }}
                        style={{ width: 44, height: 36, padding: 2, cursor: 'pointer', border: '1.5px solid var(--border)', borderRadius: 8 }} />
                      <input type="text" value={themeCustom[key]}
                        onChange={e => { const c = e.target.value; setThemeCustom(p => ({ ...p, [key]: c })); if (/^#[0-9a-fA-F]{6}$/.test(c)) applyTheme({ ...themeCustom, [key]: c }); }}
                        style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Preview Bar */}
            <div style={{ background: 'var(--background)', borderRadius: 10, padding: 16, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Live Preview</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: activeColors.primary }} title="Primary" />
                <div style={{ width: 36, height: 36, borderRadius: 10, background: activeColors.secondary }} title="Secondary" />
                <div style={{ width: 36, height: 36, borderRadius: 10, background: activeColors.accent }} title="Accent" />
                <div style={{ width: 36, height: 36, borderRadius: 10, background: activeColors.danger }} title="Danger" />
                <div style={{ marginLeft: 8, display: 'flex', gap: 8 }}>
                  <span style={{ padding: '7px 16px', background: activeColors.primary, color: 'white', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>Primary</span>
                  <span style={{ padding: '7px 16px', background: activeColors.secondary, color: 'white', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>Secondary</span>
                  <span style={{ padding: '7px 16px', background: activeColors.danger, color: 'white', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>Danger</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSaveTheme} disabled={saving}>{saving ? 'Saving...' : 'Save Theme'}</button>
              <button className="btn btn-secondary" onClick={previewTheme}>Preview</button>
              <button className="btn btn-ghost" onClick={() => { setThemeMode('default'); applyTheme(DEFAULT_THEME); }}>Reset to Default</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
