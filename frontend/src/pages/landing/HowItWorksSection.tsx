import { useState } from 'react';
import { motion } from 'framer-motion';
import SectionHeading from './components/SectionHeading';
import { HOW_LABEL, HOW_TITLE, HOW_SUBTITLE, HOW_STEPS, LOOP_NODES, LOOP_DESCRIPTIONS, LOOP_CENTER_TEXT } from './data';

const LOOP_ARCS = LOOP_NODES.map((node, i) => {
  const next = LOOP_NODES[(i + 1) % LOOP_NODES.length];
  return { key: `${node.label}-${next.label}`, path: `M ${node.cx} ${node.cy} L ${next.cx} ${next.cy}` };
});

function OrbitalDiagram() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      <div className="relative w-[280px] h-[280px] flex-shrink-0">
        <svg viewBox="0 0 300 260" className="w-full h-full" aria-label="闭环训练流程图">
          {LOOP_ARCS.map((arc) => (
            <path key={arc.key} d={arc.path} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6 4" opacity="0.55" />
          ))}
          <circle cx="150" cy="135" r="38" fill="var(--color-primary)" opacity="0.12" />
          <text x="150" y="140" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-primary)">{LOOP_CENTER_TEXT}</text>
          {LOOP_NODES.map((node) => (
            <g key={node.label} className="cursor-pointer" onClick={() => setActive(active === node.label ? null : node.label)} role="button" tabIndex={0} aria-label={node.label}>
              <circle
                cx={node.cx} cy={node.cy} r="24"
                stroke="var(--color-primary)" strokeWidth="2"
                className="transition-all duration-500"
                style={{ fill: active === node.label ? 'var(--color-primary)' : 'var(--color-surface)' }}
              />
              <text
                x={node.cx} y={node.cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600"
                className={active === node.label ? 'fill-white' : 'fill-[var(--color-text)]'}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex-1 min-h-[100px] max-w-md">
        {active ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <h3 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">{active}</h3>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed text-sm">{LOOP_DESCRIPTIONS[active]}</p>
          </motion.div>
        ) : (
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] italic text-sm">点击节点查看说明</p>
        )}
      </div>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeading label={HOW_LABEL} title={HOW_TITLE} subtitle={HOW_SUBTITLE} />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr_1fr] gap-8 mb-16">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative text-center overflow-hidden"
              >
                <div className="text-[10rem] font-black leading-none text-[var(--color-primary)]/[0.06] select-none mb-[-5rem]">{step.num}</div>
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-8 sm:p-10"
        >
          <OrbitalDiagram />
        </motion.div>
      </div>
    </section>
  );
}
