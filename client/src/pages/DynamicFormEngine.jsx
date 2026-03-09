import { useState, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { HiCode, HiPencil, HiEye, HiPlus, HiTrash } from 'react-icons/hi';

// F6.5: Physics Tutor form schemas — schema-to-form engine
const SCHEMAS = [
  {
    id: 'physics-lab-report',
    title: 'Physics Lab Report',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true, minLength: 2 },
      { name: 'experimentTitle', label: 'Experiment Title', type: 'text', required: true },
      { name: 'topic', label: 'Physics Topic', type: 'select', options: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Waves', 'Nuclear Physics'], required: true },
      { name: 'date', label: 'Experiment Date', type: 'text', required: true },
      { name: 'hasEquipmentIssue', label: 'Equipment Issue?', type: 'checkbox' },
      { name: 'equipmentNote', label: 'Equipment Issue Details', type: 'textarea', show_if: { field: 'hasEquipmentIssue', value: true }, required: true },
      { name: 'observations', label: 'Observations & Results', type: 'textarea', required: true, minLength: 10 },
      { name: 'conclusion', label: 'Conclusion', type: 'textarea', required: true, minLength: 10 },
    ],
  },
  {
    id: 'tutoring-session-log',
    title: 'Tutoring Session Log',
    fields: [
      { name: 'className', label: 'Class Name', type: 'text', required: true },
      { name: 'subject', label: 'Subject Area', type: 'select', options: ['Physics', 'Applied Physics', 'Astronomy', 'Engineering Physics'], required: true },
      { name: 'sessionType', label: 'Session Type', type: 'select', options: ['Lecture', 'Lab', 'Review', 'Exam Prep', 'One-on-One'], required: true },
      { name: 'isOnline', label: 'Online Session?', type: 'checkbox' },
      { name: 'meetingUrl', label: 'Meeting URL', type: 'text', show_if: { field: 'isOnline', value: true }, required: true },
      { name: 'studentsCount', label: 'Number of Students', type: 'number', min: 1, max: 200, required: true },
      { name: 'topicsCovered', label: 'Topics Covered', type: 'textarea', required: true },
      { name: 'homework', label: 'Assigned Homework', type: 'textarea' },
    ],
  },
  {
    id: 'student-feedback',
    title: 'Student Feedback',
    fields: [
      { name: 'studentName', label: 'Student Name', type: 'text', required: true },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true, min: 1, max: 5 },
      { name: 'category', label: 'Category', type: 'select', options: ['Teaching Clarity', 'Problem Solving', 'Lab Work', 'Exam Preparation', 'Overall Experience'], required: true },
      { name: 'isAnonymous', label: 'Submit Anonymously?', type: 'checkbox' },
      { name: 'contactEmail', label: 'Contact Email', type: 'email', show_if: { field: 'isAnonymous', value: false } },
      // F6.5: nested group field — FieldRenderer calls itself recursively for sub-fields
      {
        name: 'scores',
        label: 'Score Breakdown',
        type: 'group',
        fields: [
          { name: 'clarity', label: 'Clarity Score (1-10)', type: 'number', min: 1, max: 10, required: true },
          { name: 'pacing', label: 'Pacing Score (1-10)', type: 'number', min: 1, max: 10, required: true },
          { name: 'engagement', label: 'Engagement Score (1-10)', type: 'number', min: 1, max: 10 },
        ],
      },
      { name: 'feedback', label: 'Feedback', type: 'textarea', required: true, minLength: 10 },
    ],
  },
];

// F6.5: Runtime Zod schema generation from JSON config (supports nested groups)
function buildZodSchema(fields, watchValues) {
  const shape = {};
  for (const field of fields) {
    // Skip conditionally hidden fields
    if (field.show_if) {
      const depVal = watchValues?.[field.show_if.field];
      if (depVal !== field.show_if.value) continue;
    }
    // F6.5: Recurse into group sub-fields and flatten into top-level shape
    if (field.type === 'group' && Array.isArray(field.fields)) {
      const subShape = buildZodSchema(field.fields, watchValues);
      Object.assign(shape, subShape.shape);
      continue;
    }
    let fieldSchema;
    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.min != null) fieldSchema = fieldSchema.min(field.min);
        if (field.max != null) fieldSchema = fieldSchema.max(field.max);
        if (!field.required) fieldSchema = fieldSchema.optional();
        break;
      case 'checkbox':
        fieldSchema = z.boolean().optional();
        break;
      case 'email':
        fieldSchema = z.string().email('Invalid email');
        if (!field.required) fieldSchema = fieldSchema.optional().or(z.literal(''));
        break;
      default:
        fieldSchema = z.string();
        if (field.minLength) fieldSchema = fieldSchema.min(field.minLength, `Min ${field.minLength} chars`);
        if (field.required) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        else fieldSchema = fieldSchema.optional().or(z.literal(''));
    }
    shape[field.name] = fieldSchema;
  }
  return z.object(shape);
}

// F6.5: Recursive field renderer — handles group type by calling itself for each sub-field
function FieldRenderer({ field, control, errors, watch }) {
  const watchValues = watch();

  // Conditional display: show_if
  if (field.show_if) {
    const depVal = watchValues[field.show_if.field];
    if (depVal !== field.show_if.value) return null;
  }

  // F6.5: Group type — render a titled card with recursive FieldRenderer calls for each child
  if (field.type === 'group' && Array.isArray(field.fields)) {
    return (
      <div className="glass-card p-4 space-y-3">
        <h4 className="text-sm font-semibold text-[var(--primary)] border-b border-[var(--glass-border)] pb-2">{field.label}</h4>
        {field.fields.map(subField => (
          <FieldRenderer key={subField.name} field={subField} control={control} errors={errors} watch={watch} />
        ))}
      </div>
    );
  }

  const error = errors[field.name];

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-3">
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <input type="checkbox" checked={!!f.value} onChange={e => f.onChange(e.target.checked)}
              className="w-5 h-5 rounded accent-[var(--accent-color)]" />
          )}
        />
        <label className="form-label mb-0">{field.label}</label>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="form-group">
        <label className="form-label">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label>
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <select className="form-control" {...f}>
              <option value="">Select...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        <label className="form-label">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label>
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <textarea className="form-control" rows={3} {...f} />
          )}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</label>
      <Controller
        name={field.name}
        control={control}
        render={({ field: f }) => (
          <input className="form-control" type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
            {...f} min={field.min} max={field.max} />
        )}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

// F6.5: Flatten fields (including group sub-fields) for defaultValues
function flattenFields(fields) {
  const result = [];
  for (const f of fields) {
    if (f.type === 'group' && Array.isArray(f.fields)) {
      result.push(...flattenFields(f.fields));
    } else {
      result.push(f);
    }
  }
  return result;
}

export default function DynamicFormEngine() {
  const [selectedSchema, setSelectedSchema] = useState(SCHEMAS[0]);
  const [view, setView] = useState('form'); // form | json | preview
  const [customSchema, setCustomSchema] = useState('');
  const [submissions, setSubmissions] = useState([]);

  // Build runtime Zod from selected schema
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(buildZodSchema(selectedSchema.fields, undefined)),
    defaultValues: flattenFields(selectedSchema.fields).reduce((acc, f) => {
      acc[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? '' : '';
      return acc;
    }, {}),
    mode: 'onBlur',
  });

  const onSubmit = (data) => {
    setSubmissions(prev => [...prev, { schema: selectedSchema.title, data, at: new Date().toISOString() }]);
    toast.success('Form submitted successfully');
    reset();
  };

  const switchSchema = (schema) => {
    setSelectedSchema(schema);
    reset(flattenFields(schema.fields).reduce((acc, f) => {
      acc[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? '' : '';
      return acc;
    }, {}));
  };

  const loadCustom = () => {
    try {
      const parsed = JSON.parse(customSchema);
      if (!parsed.title || !Array.isArray(parsed.fields)) throw new Error('Need title and fields array');
      switchSchema(parsed);
      setView('form');
      toast.success('Custom schema loaded');
    } catch (e) {
      toast.error('Invalid JSON: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold">Dynamic Form Engine</h2>
          <p className="subtitle">F6.5 — Schema-to-form with runtime Zod, recursive rendering, conditional show_if</p>
        </div>
      </div>

      {/* Schema selector */}
      <div className="flex flex-wrap gap-2">
        {SCHEMAS.map(s => (
          <button key={s.id} className={`btn ${selectedSchema.id === s.id ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => switchSchema(s)}>
            {s.title}
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        <button className={`btn ${view === 'form' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('form')}>
          <HiPencil /> Form
        </button>
        <button className={`btn ${view === 'json' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('json')}>
          <HiCode /> JSON Schema
        </button>
        <button className={`btn ${view === 'custom' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('custom')}>
          <HiPlus /> Custom Schema
        </button>
        <button className={`btn ${view === 'preview' ? 'btn-primary' : 'btn-glass'}`} onClick={() => setView('preview')}>
          <HiEye /> Submissions ({submissions.length})
        </button>
      </div>

      {/* Form view */}
      {view === 'form' && (
        <div className="glass-card p-8 max-w-lg mx-auto">
          <h3 className="text-lg font-bold mb-6">{selectedSchema.title}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {selectedSchema.fields.map(field => (
              <FieldRenderer key={field.name} field={field} control={control} errors={errors} watch={watch} />
            ))}
            <button type="submit" className="btn btn-primary w-full">Submit</button>
          </form>
        </div>
      )}

      {/* JSON view */}
      {view === 'json' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Schema JSON</h3>
          <pre className="p-4 rounded-lg text-sm overflow-auto max-h-96" style={{ background: 'var(--glass-bg)' }}>
            {JSON.stringify(selectedSchema, null, 2)}
          </pre>
        </div>
      )}

      {/* Custom schema input */}
      {view === 'custom' && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-4">Load Custom Schema</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Paste JSON with <code>title</code> and <code>fields</code> array. Each field needs: name, label, type. Optional: required, min, max, minLength, options, show_if.
          </p>
          <textarea
            className="form-control font-mono text-sm"
            rows={10}
            value={customSchema}
            onChange={e => setCustomSchema(e.target.value)}
            placeholder='{"title":"My Form","fields":[{"name":"test","label":"Test","type":"text","required":true}]}'
          />
          <button className="btn btn-primary mt-3" onClick={loadCustom}>Load Schema</button>
        </div>
      )}

      {/* Submissions */}
      {view === 'preview' && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="glass-card p-8 text-center text-[var(--text-secondary)]">No submissions yet.</div>
          ) : (
            submissions.map((s, i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{s.schema}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(s.at).toLocaleString()}</span>
                </div>
                <pre className="text-xs p-3 rounded-lg overflow-auto" style={{ background: 'var(--glass-bg)' }}>
                  {JSON.stringify(s.data, null, 2)}
                </pre>
              </div>
            ))
          )}
          {submissions.length > 0 && (
            <button className="btn btn-glass" onClick={() => setSubmissions([])}><HiTrash /> Clear All</button>
          )}
        </div>
      )}
    </div>
  );
}
