// F1.4: Recursive component — Physics curriculum tree structure
import { useState } from 'react';
import { HiChevronRight, HiChevronDown, HiBookOpen, HiBeaker, HiLightningBolt } from 'react-icons/hi';

const CURRICULUM_TREE = {
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
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <HiBookOpen className="text-[var(--primary)] text-xl" />
        <h3 className="font-bold text-lg">Physics Curriculum</h3>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">Recursive Tree</span>
      </div>
      <CurriculumNode node={CURRICULUM_TREE} depth={0} />
    </div>
  );
}
