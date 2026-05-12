import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { PRESET_THEMES } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const INDUSTRIES = ['Technology','Finance','Healthcare','Retail','Education','Manufacturing','Logistics','Media','Real Estate','Other'];
const COMPANY_SIZES = ['1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+'];

const DEFAULT_THEME_VALS = { primary: '#3ac4ee', secondary: '#30b67d', accent: '#e9b029', danger: '#df205b' };

// Defined at module scope — prevents remount/focus-loss on every keystroke.
const Field = ({ label, name, form, errors, set, type = 'text', required, children, span, placeholder }) => (
  <div className="form-group" style={span ? { gridColumn: 'span 2' } : {}}>
    <label>{label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
    {children || (
      <input type={type} value={form[name]} placeholder={placeholder}
        onChange={ev => set(name, ev.target.value)}
        style={errors[name] ? { borderColor: 'var(--danger)' } : {}} />
    )}
    {errors[name] && <span className="error-msg">{errors[name]}</span>}
  </div>
);

const SectionHeader = ({ num, title, subtitle }) => (
  <div className="form-section">
    <div className="form-section-inner">
      <div className="form-section-num">{num}</div>
      <div>
        <div className="form-section-title">{title}</div>
        {subtitle && <div className="form-section-sub">{subtitle}</div>}
      </div>
    </div>
  </div>
);

const emptyForm = {
  name: '', email: '', phone: '', website: '',
  address_line: '', city: '', state: '', country: '', zip_code: '',
  industry: '', company_size: '', registration_number: '',
  founded: '', description: '',
  admin_name: '', admin_email: '', admin_password: '',
  theme_mode: 'default',      // 'default' | 'preset' | 'custom'
  theme_preset: 0,            // index into PRESET_THEMES
  theme_custom: { ...DEFAULT_THEME_VALS },
};

export default function CreateCompany() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]   = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    companyService.getById(id).then(res => {
      const c = res.data;
      let themeMode = 'default', themePreset = 0, themeCustom = { ...DEFAULT_THEME_VALS };
      if (c.theme) {
        const t = typeof c.theme === 'string' ? JSON.parse(c.theme) : c.theme;
        themeCustom = { ...DEFAULT_THEME_VALS, ...t };
        const presetIdx = PRESET_THEMES.findIndex(p =>
          p.primary === t.primary && p.secondary === t.secondary
        );
        if (presetIdx >= 0) { themeMode = 'preset'; themePreset = presetIdx; }
        else themeMode = 'custom';
      }
      setForm(f => ({
        ...f,
        name: c.name || '', email: c.email || '', phone: c.phone || '', website: c.website || '',
        address_line: c.address_line || '', city: c.city || '', state: c.state || '',
        country: c.country || '', zip_code: c.zip_code || '',
        industry: c.industry || '', company_size: c.company_size || '',
        registration_number: c.registration_number || '',
        founded: c.founded || '', description: c.description || '',
        theme_mode: themeMode, theme_preset: themePreset, theme_custom: themeCustom,
      }));
    }).catch(() => toast.error('Failed to load company')).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };
  const setCustomColor = (key, val) => setForm(p => ({ ...p, theme_custom: { ...p.theme_custom, [key]: val } }));

  const getThemePayload = () => {
    if (form.theme_mode === 'default') return null;
    if (form.theme_mode === 'preset') {
      const p = PRESET_THEMES[form.theme_preset];
      return { primary: p.primary, secondary: p.secondary, accent: p.accent, danger: p.danger };
    }
    return form.theme_custom;
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!isEdit && form.admin_email && !form.admin_password) e.admin_password = 'Password required when admin email is provided';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error('Please fix the form errors'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone, website: form.website,
        address_line: form.address_line, city: form.city, state: form.state,
        country: form.country, zip_code: form.zip_code,
        industry: form.industry, company_size: form.company_size,
        registration_number: form.registration_number,
        founded: form.founded, description: form.description,
        theme: getThemePayload() ? JSON.stringify(getThemePayload()) : null,
      };
      if (!isEdit) {
        payload.admin_name = form.admin_name;
        payload.admin_email = form.admin_email;
        payload.admin_password = form.admin_password;
      }
      if (isEdit) await companyService.update(id, payload);
      else await companyService.create(payload);
      toast.success(isEdit ? 'Company updated!' : 'Company created!');
      navigate('/companies');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  const activeThemeColors = form.theme_mode === 'preset'
    ? PRESET_THEMES[form.theme_preset]
    : form.theme_mode === 'custom'
    ? form.theme_custom
    : DEFAULT_THEME_VALS;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Company' : 'Add New Company'}</h1>
          <p>{isEdit ? 'Update company details and branding' : 'Register a new company and configure its theme'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/companies')}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Company Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <SectionHeader num={1} title="Company Information" subtitle="Basic company profile" />
              <Field form={form} errors={errors} set={set} label="Company Name" name="name" required placeholder="Acme Corporation" />
              <Field form={form} errors={errors} set={set} label="Company Email" name="email" type="email" required placeholder="info@acme.com" />
              <Field form={form} errors={errors} set={set} label="Contact Number" name="phone" placeholder="+1-555-0100" />
              <Field form={form} errors={errors} set={set} label="Website" name="website" placeholder="https://acme.com" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <SectionHeader num={2} title="Address" subtitle="Company's registered address" />
              <Field form={form} errors={errors} set={set} label="Address Line" name="address_line" span placeholder="123 Main Street, Suite 400" />
              <Field form={form} errors={errors} set={set} label="City" name="city" placeholder="New York" />
              <Field form={form} errors={errors} set={set} label="State / Province" name="state" placeholder="NY" />
              <Field form={form} errors={errors} set={set} label="Country" name="country" placeholder="USA" />
              <Field form={form} errors={errors} set={set} label="Zip / Postal Code" name="zip_code" placeholder="10001" />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <SectionHeader num={3} title="Business Details" subtitle="Industry and organizational info" />
              <Field form={form} errors={errors} set={set} label="Industry" name="industry">
                <select value={form.industry} onChange={ev => set('industry', ev.target.value)}>
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Company Size" name="company_size">
                <select value={form.company_size} onChange={ev => set('company_size', ev.target.value)}>
                  <option value="">Select Size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Registration Number" name="registration_number" placeholder="Optional" />
              <Field form={form} errors={errors} set={set} label="Founded Year" name="founded" placeholder="2020" />
              <Field form={form} errors={errors} set={set} label="Description" name="description" span>
                <textarea value={form.description} onChange={ev => set('description', ev.target.value)}
                  placeholder="Brief description of the company..." rows={3}
                  style={{ resize: 'vertical' }} />
              </Field>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <SectionHeader num={4} title="Company Theme" subtitle="Brand colors applied to the employee portal" />

              {/* Theme Mode Selector */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Theme Mode</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {[['default','Default Theme'],['preset','Preset Themes'],['custom','Custom Colors']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `2px solid ${form.theme_mode === val ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: form.theme_mode === val ? 'var(--primary-light)' : 'var(--surface)', transition: 'all 0.15s' }}>
                      <input type="radio" name="theme_mode" value={val} checked={form.theme_mode === val} onChange={() => set('theme_mode', val)} style={{ display: 'none' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: form.theme_mode === val ? 'var(--primary-dark)' : 'var(--text-muted)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preset picker */}
              {form.theme_mode === 'preset' && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select Preset</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                    {PRESET_THEMES.map((preset, idx) => (
                      <div key={idx} className={`theme-preview${form.theme_preset === idx ? ' selected' : ''}`}
                        onClick={() => set('theme_preset', idx)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[preset.primary, preset.secondary, preset.accent, preset.danger].map((c, i) => (
                            <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{preset.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom color pickers */}
              {form.theme_mode === 'custom' && (
                <>
                  {[['primary','Primary Color'],['secondary','Secondary Color'],['accent','Accent Color'],['danger','Danger Color']].map(([key, label]) => (
                    <div className="form-group" key={key}>
                      <label>{label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={form.theme_custom[key]}
                          onChange={ev => setCustomColor(key, ev.target.value)}
                          style={{ width: 44, height: 36, padding: 2, cursor: 'pointer', border: '1.5px solid var(--border)', borderRadius: 8 }} />
                        <input type="text" value={form.theme_custom[key]}
                          onChange={ev => setCustomColor(key, ev.target.value)}
                          style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase' }} />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Live preview */}
              {form.theme_mode !== 'default' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>PREVIEW</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 14, background: 'var(--background)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {[['primary','Primary'],['secondary','Secondary'],['accent','Accent'],['danger','Danger']].map(([key, label]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: activeThemeColors[key] || '#ccc', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                      </div>
                    ))}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <div style={{ padding: '6px 14px', borderRadius: 6, background: activeThemeColors.primary || '#ccc', color: 'white', fontSize: 12, fontWeight: 600 }}>Button</div>
                      <div style={{ padding: '6px 14px', borderRadius: 6, background: activeThemeColors.secondary || '#ccc', color: 'white', fontSize: 12, fontWeight: 600 }}>Active</div>
                      <div style={{ padding: '6px 14px', borderRadius: 6, background: activeThemeColors.danger || '#ccc', color: 'white', fontSize: 12, fontWeight: 600 }}>Alert</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Setup */}
        {!isEdit && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="form-grid form-grid-2">
                <SectionHeader num={5} title="Admin Setup" subtitle="Create the primary admin account for this company (optional)" />
                <Field form={form} errors={errors} set={set} label="Admin Name" name="admin_name" placeholder="John Smith" />
                <Field form={form} errors={errors} set={set} label="Admin Email" name="admin_email" type="email" placeholder="admin@acme.com" />
                <Field form={form} errors={errors} set={set} label="Admin Password" name="admin_password">
                  <input type="password" value={form.admin_password}
                    onChange={ev => set('admin_password', ev.target.value)}
                    placeholder="Minimum 6 characters"
                    style={errors.admin_password ? { borderColor: 'var(--danger)' } : {}} />
                  {errors.admin_password && <span className="error-msg">{errors.admin_password}</span>}
                </Field>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/companies')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: 180 }}>
            {submitting ? 'Saving...' : (isEdit ? 'Update Company' : 'Create Company')}
          </button>
        </div>
      </form>
    </div>
  );
}
