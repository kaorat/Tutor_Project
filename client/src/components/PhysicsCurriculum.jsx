// F1.4: Recursive component — Physics curriculum tree structure
import { useMemo, useState } from 'react';
import { HiChevronRight, HiChevronDown, HiBookOpen, HiPlusCircle } from 'react-icons/hi';

const DEFAULT_TREE = {
  id: 'physics',
  label: 'Physics',
  icon: '⚛',
  children: [
    {
      id: 'mechanics',
      label: 'Mechanics',
      icon: '⚙️',
      children: [
        {
          id: 'motion',
          label: 'Motion',
          icon: '🏃',
          children: [
            { id: 'kinematics', label: 'Kinematics', icon: '📐', children: [] },
            { id: 'projectile', label: 'Projectile Motion', icon: '🎯', children: [] },
            { id: 'circular', label: 'Circular Motion', icon: '🔄', children: [] },
          ],
        },
        {
          id: 'forces',
          label: 'Forces & Newton\'s Laws',
          icon: '💪',
          children: [
            { id: 'newtons-laws', label: 'Newton\'s Laws', icon: '🔭', children: [] },
            { id: 'friction', label: 'Friction', icon: '🧲', children: [] },
            { id: 'gravity', label: 'Gravity', icon: '🌍', children: [] },
          ],
        },
        { id: 'energy', label: 'Work & Energy', icon: '⚡', children: [] },
        { id: 'momentum', label: 'Momentum', icon: '💥', children: [] },
      ],
    },
    {
      id: 'thermodynamics',
      label: 'Thermodynamics',
      icon: '🌡️',
      children: [
        { id: 'heat-transfer', label: 'Heat Transfer', icon: '🔥', children: [] },
        { id: 'gas-laws', label: 'Gas Laws', icon: '💨', children: [] },
        { id: 'entropy', label: 'Entropy', icon: '📊', children: [] },
      ],
    },
    {
      id: 'electromagnetism',
      label: 'Electromagnetism',
      icon: '⚡',
      children: [
        {
          id: 'electricity',
          label: 'Electricity',
          icon: '🔌',
          children: [
            { id: 'electric-fields', label: 'Electric Fields', icon: '⚡', children: [] },
            { id: 'circuits', label: 'Circuits', icon: '🔋', children: [] },
          ],
        },
        { id: 'magnetism', label: 'Magnetism', icon: '🧲', children: [] },
        { id: 'em-waves', label: 'Electromagnetic Waves', icon: '🌊', children: [] },
      ],
    },
    {
      id: 'waves-optics',
      label: 'Waves & Optics',
      icon: '🌊',
      children: [
        { id: 'waves', label: 'Wave Motion', icon: '〰️', children: [] },
        { id: 'sound', label: 'Sound', icon: '🔊', children: [] },
        { id: 'light', label: 'Light & Reflection', icon: '💡', children: [] },
        { id: 'optics', label: 'Optics & Lenses', icon: '🔬', children: [] },
      ],
    },
    {
      id: 'modern-physics',
      label: 'Modern Physics',
      icon: '⚛',
      children: [
        { id: 'quantum', label: 'Quantum Mechanics', icon: '🔭', children: [] },
        { id: 'nuclear', label: 'Nuclear Physics', icon: '☢️', children: [] },
        { id: 'relativity', label: 'Special Relativity', icon: '🕐', children: [] },
      ],
    },
  ],
};

const flattenNodes = (node, prefix = '') => {
  const currentPath = prefix ? `${prefix} › ${node.label}` : node.label;
  const nodes = [{ id: node.id, label: currentPath }];
  node.children?.forEach(child => {
    nodes.push(...flattenNodes(child, currentPath));
  });
  return nodes;
};

const insertNode = (tree, parentId, newNode) => {
  if (tree.id === parentId) {
    return { ...tree, children: [...tree.children, newNode] };
  }
  return {
    ...tree,
    children: tree.children.map(child => insertNode(child, parentId, newNode)),
  };
};

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `topic-${Date.now()}`;

// F1.4: Recursive CurriculumNode — calls itself for each child
function CurriculumNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-[var(--glass-border)] pl-3' : ''}>
      <button
        type="button"
        onClick={() => hasChildren && setExpanded(e => !e)}
        className={`flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg transition-colors text-sm
          ${hasChildren ? 'hover:bg-[var(--primary)]/10 cursor-pointer' : 'cursor-default opacity-75'}
          ${depth === 0 ? 'font-bold text-base text-[var(--primary)]' : ''}
        `}
      >
        {hasChildren ? (
          expanded
            ? <HiChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
            : <HiChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{node.icon}</span>
        <span>{node.label}</span>
        {hasChildren && (
          <span className="ml-auto text-[10px] text-[var(--text-tertiary)] bg-[var(--glass-border)] px-1.5 py-0.5 rounded-full">
            {node.children.length}
          </span>
        )}
      </button>

      {/* Recursion: render each child as another CurriculumNode */}
      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <CurriculumNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhysicsCurriculum() {
  const [curriculum, setCurriculum] = useState(DEFAULT_TREE);
  const [form, setForm] = useState({ label: '', icon: '📘', parentId: 'physics' });
  const [feedback, setFeedback] = useState(null);

  const parentOptions = useMemo(() => flattenNodes(curriculum), [curriculum]);

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!form.label.trim()) {
      setFeedback({ type: 'error', message: 'Topic name is required.' });
      return;
    }
    const newNode = {
      id: slugify(form.label),
      label: form.label.trim(),
      icon: form.icon?.trim() || '📘',
      children: [],
    };
    setCurriculum(prev => insertNode(prev, form.parentId, newNode));
    setForm({ ...form, label: '' });
    setFeedback({ type: 'success', message: 'Topic added. It will disappear on refresh (demo data).' });
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <HiBookOpen className="text-[var(--primary)] text-xl" />
        <h3 className="font-bold text-lg">Physics Curriculum</h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">Recursive Tree w/ Dynamic Topics</span>
      </div>

      <form className="grid gap-3 md:grid-cols-[1fr,1fr,auto] items-end" onSubmit={handleAddTopic}>
        <label className="text-xs font-semibold text-[var(--text-tertiary)] flex flex-col gap-1">
          Parent Topic
          <select
            className="form-control"
            value={form.parentId}
            onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
          >
            {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>
        </label>

        <label className="text-xs font-semibold text-[var(--text-tertiary)] flex flex-col gap-1">
          Topic Label
          <input
            className="form-control"
            placeholder="e.g. Fluid Dynamics"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />
        </label>

        <label className="text-xs font-semibold text-[var(--text-tertiary)] flex flex-col gap-1">
          Icon (Emoji)
          <input
            className="form-control"
            maxLength={2}
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
          />
        </label>

        <button type="submit" className="btn btn-primary flex items-center gap-2">
          <HiPlusCircle /> Add Topic
        </button>
      </form>

      {feedback && (
        <div className={`text-xs rounded-lg px-3 py-2 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
          {feedback.message}
        </div>
      )}

      <CurriculumNode node={curriculum} depth={0} />
    </div>
  );
}
