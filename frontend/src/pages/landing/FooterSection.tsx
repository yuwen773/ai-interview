import { FOOTER_TAGLINE, FOOTER_PRODUCT_LINKS, FOOTER_RESOURCE_LINKS, FOOTER_COPYRIGHT } from './data';

function FooterLinkColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] uppercase tracking-wider mb-3">{title}</div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link} className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary)] cursor-pointer transition-colors">{link}</li>
        ))}
      </ul>
    </div>
  );
}

export default function FooterSection() {
  return (
    <footer className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-8 items-start">
          <div>
            <div className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-1">
              <span style={{ fontFamily: "'Kaushan Script', cursive" }}>AI Interview</span>
              <span className="text-sm font-medium ml-1.5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">面试教练</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{FOOTER_TAGLINE}</p>
          </div>
          <FooterLinkColumn title="产品" links={FOOTER_PRODUCT_LINKS} />
          <FooterLinkColumn title="资源" links={FOOTER_RESOURCE_LINKS} />
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-center">
          <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{FOOTER_COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  );
}
