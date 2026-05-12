import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering','Design','Marketing','Sales','HR','Finance','Operations','Support','Management'];
const CURRENCIES   = ['INR','USD','EUR','GBP','AUD','CAD','SGD','AED'];

// Defined at module scope so they are never redefined on re-render.
// Defining these inside the component body causes React to treat them as
// new component types on every render, which unmounts/remounts the input
// DOM node and drops focus after every keystroke.
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

const Section = ({ num, title, subtitle }) => (
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
  name: '', email: '', password: '', phone: '', gender: '', date_of_birth: '',
  department: '', position: '', employment_type: 'full_time', date_of_joining: '', work_location: '',
  salary: '', salary_type: 'annual', currency: 'INR',
  ec_contact_name: '', ec_relationship: '', ec_phone: '', ec_alternate_phone: '', ec_address: '',
};

export default function CreateEmployee() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const isEdit      = Boolean(id);
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]   = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    employeeService.getById(id).then(res => {
      const e = res.data;
      const ec = e.emergency_contact || {};
      setForm({
        name: e.name || '', email: e.email || '', password: '', phone: e.phone || '',
        gender: e.gender || '', date_of_birth: e.date_of_birth ? e.date_of_birth.split('T')[0] : '',
        department: e.department || '', position: e.position || '',
        employment_type: e.employment_type || 'full_time',
        date_of_joining: e.date_of_joining ? e.date_of_joining.split('T')[0] : '',
        work_location: e.work_location || '',
        salary: e.salary || '', salary_type: e.salary_type || 'annual', currency: e.currency || 'USD',
        ec_contact_name: ec.contact_name || '', ec_relationship: ec.relationship || '',
        ec_phone: ec.phone || '', ec_alternate_phone: ec.alternate_phone || '',
        ec_address: ec.address || '',
      });
    }).catch(() => toast.error('Failed to load employee')).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!isEdit && !form.password) e.password = 'Required for new employee';
    if (form.password && form.password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the form errors'); return; }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone || undefined,
        gender: form.gender || undefined, date_of_birth: form.date_of_birth || undefined,
        department: form.department || undefined, position: form.position || undefined,
        employment_type: form.employment_type, date_of_joining: form.date_of_joining || undefined,
        work_location: form.work_location || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        salary_type: form.salary_type, currency: form.currency,
        emergency_contact: form.ec_contact_name ? {
          contact_name: form.ec_contact_name, relationship: form.ec_relationship || undefined,
          phone: form.ec_phone || undefined, alternate_phone: form.ec_alternate_phone || undefined,
          address: form.ec_address || undefined,
        } : undefined,
      };
      if (!isEdit) payload.password = form.password;
      else if (form.password) payload.password = form.password;

      if (isEdit) await employeeService.update(id, payload);
      else await employeeService.create(payload);
      toast.success(isEdit ? 'Employee updated!' : 'Employee created!');
      navigate('/employees');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p>{isEdit ? 'Update employee information' : 'Fill in the details to create a new employee account'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/employees')}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1 — Personal Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <Section num={1} title="Personal Information" subtitle="Name, credentials, and personal details" />
              <Field form={form} errors={errors} set={set} label="Full Name" name="name" required placeholder="Jane Smith" />
              <Field form={form} errors={errors} set={set} label="Email Address" name="email" type="email" required placeholder="jane@company.com" />
              <Field form={form} errors={errors} set={set} label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} name="password" required={!isEdit}>
                <input type="password" value={form.password} onChange={ev => set('password', ev.target.value)}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                  style={errors.password ? { borderColor: 'var(--danger)' } : {}} />
                {errors.password && <span className="error-msg">{errors.password}</span>}
              </Field>
              <Field form={form} errors={errors} set={set} label="Phone Number" name="phone" placeholder="+1-555-0100" />
              <Field form={form} errors={errors} set={set} label="Gender" name="gender">
                <select value={form.gender} onChange={ev => set('gender', ev.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Date of Birth" name="date_of_birth" type="date" />
            </div>
          </div>
        </div>

        {/* Section 2 — Job Details */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <Section num={2} title="Job Details" subtitle="Role, department and employment information" />
              <Field form={form} errors={errors} set={set} label="Department" name="department">
                <select value={form.department} onChange={ev => set('department', ev.target.value)}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Position / Job Title" name="position" placeholder="e.g. Senior Developer" />
              <Field form={form} errors={errors} set={set} label="Employment Type" name="employment_type">
                <select value={form.employment_type} onChange={ev => set('employment_type', ev.target.value)}>
                  <option value="full_time">Full-Time</option>
                  <option value="part_time">Part-Time</option>
                  <option value="contract">Contract</option>
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Date of Joining" name="date_of_joining" type="date" />
              <Field form={form} errors={errors} set={set} label="Work Location" name="work_location" placeholder="e.g. New York HQ / Remote" span />
            </div>
          </div>
        </div>

        {/* Section 3 — Salary */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <Section num={3} title="Salary Details" subtitle="Compensation and currency information" />
              <Field form={form} errors={errors} set={set} label="Salary Amount" name="salary">
                <input type="number" min="0" value={form.salary} onChange={ev => set('salary', ev.target.value)} placeholder="e.g. 60000" />
              </Field>
              <Field form={form} errors={errors} set={set} label="Salary Type" name="salary_type">
                <select value={form.salary_type} onChange={ev => set('salary_type', ev.target.value)}>
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Currency" name="currency">
                <select value={form.currency} onChange={ev => set('currency', ev.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Section 4 — Emergency Contact */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-grid form-grid-2">
              <Section num={4} title="Emergency Contact" subtitle="Person to contact in case of emergency" />
              <Field form={form} errors={errors} set={set} label="Contact Name" name="ec_contact_name" placeholder="Full name" />
              <Field form={form} errors={errors} set={set} label="Relationship" name="ec_relationship">
                <select value={form.ec_relationship} onChange={ev => set('ec_relationship', ev.target.value)}>
                  <option value="">Select Relationship</option>
                  {['Spouse','Parent','Sibling','Child','Friend','Partner','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field form={form} errors={errors} set={set} label="Phone Number" name="ec_phone" placeholder="+1-555-0100" />
              <Field form={form} errors={errors} set={set} label="Alternate Phone" name="ec_alternate_phone" placeholder="Optional" />
              <Field form={form} errors={errors} set={set} label="Address" name="ec_address" span>
                <textarea value={form.ec_address} onChange={ev => set('ec_address', ev.target.value)}
                  placeholder="Street, City, State, Country" rows={2} style={{ resize: 'vertical' }} />
              </Field>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/employees')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: 180 }}>
            {submitting ? 'Saving...' : (isEdit ? '✓ Update Employee' : '✓ Create Employee')}
          </button>
        </div>
      </form>
    </div>
  );
}
