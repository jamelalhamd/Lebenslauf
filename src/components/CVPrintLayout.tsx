import type { CVData } from '../types';
import { getProfilePhotoUrl } from '../lib/cloudinary';
import { useLanguage } from '../contexts/LanguageContext';

// ── colour palette (matches the PDF design) ────────────────────────────────
const C_NAVY    = '#1b3a6b';
const C_ORANGE  = '#e89820';
const C_BLUE    = '#1a56b0';
const C_SIDE    = '#c0d4ea';
const C_MUTED   = '#8aaac8';
const C_SKILL   = 'rgba(255,255,255,0.13)';

const LANG_BARS: Record<string, { color: string; w: string }> = {
  native:       { color: '#4caf50', w: '100%' },
  advanced:     { color: '#2196f3', w: '85%'  },
  intermediate: { color: '#2196f3', w: '65%'  },
  beginner:     { color: '#9e9e9e', w: '35%'  },
};

// ── helpers ────────────────────────────────────────────────────────────────
function fmtDate(d: string): string {
  if (!d) return '';
  const [yr, mo] = d.split('-');
  if (!mo || mo === '01' || mo === '12') return yr;
  return `${mo}/${yr}`;
}

const PRESENT_VALUES = new Set(['present', 'gegenwart', 'حتى الآن']);

function fmtRange(s: string, e: string, presentLabel: string) {
  const endDisplay = (!e || PRESENT_VALUES.has(e.toLowerCase())) ? presentLabel : fmtDate(e);
  return `${fmtDate(s)} – ${endDisplay}`;
}

function parseBullets(text: string): string[] {
  const byNewline = text.split('\n').map(s => s.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const byDot = text.split(/\.\s+/).map(s => s.trim()).filter(Boolean);
  return byDot.length > 1 ? byDot : [text.trim()];
}

function parseProject(desc: string): { tech: string; body: string } {
  const lines = desc.split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length >= 2) return { tech: lines[0], body: lines.slice(1).join(' ') };
  const m = desc.match(/^([^.]*[|·][^.]*)\.\s*(.+)$/s);
  if (m) return { tech: m[1].trim(), body: m[2].trim() };
  return { tech: '', body: desc };
}

// ── sidebar building blocks ────────────────────────────────────────────────
function SideSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        <div style={{ width: 3, height: 16, background: C_ORANGE, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '8pt', fontWeight: 700, color: 'white', letterSpacing: '0.6px' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 4, fontSize: '7.5pt' }}>
      <span style={{ color: C_MUTED, minWidth: 30, fontWeight: 700, flexShrink: 0 }}>{k}</span>
      <span style={{ color: C_SIDE, wordBreak: 'break-all', lineHeight: '1.3' }}>{v}</span>
    </div>
  );
}

function LangBar({ name, level }: { name: string; level: string }) {
  const bar = LANG_BARS[level] ?? { color: '#2196f3', w: '60%' };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: '7.5pt', color: 'white', marginBottom: 3 }}>{name}</div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: bar.w, background: bar.color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ── main column building blocks ────────────────────────────────────────────
function MainSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <h2 style={{ fontSize: '10pt', fontWeight: 700, color: C_BLUE, margin: 0, letterSpacing: '0.3px' }}>
        {label}
      </h2>
      <div style={{ height: 1.5, background: C_BLUE, margin: '3px 0 7px', opacity: 0.7 }} />
      {children}
    </div>
  );
}

function JobEntry({
  position, company, startDate, endDate, description, presentLabel,
}: { position: string; company: string; startDate: string; endDate: string; description: string; presentLabel: string }) {
  const bullets = parseBullets(description);
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <strong style={{ fontSize: '9pt', flex: 1, paddingRight: 8, lineHeight: '1.3' }}>
          {position}
        </strong>
        <span style={{
          fontSize: '7.5pt', color: '#444', background: '#deeaf8',
          borderRadius: 3, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {fmtRange(startDate, endDate, presentLabel)}
        </span>
      </div>
      <div style={{ fontSize: '7.5pt', color: C_BLUE, fontStyle: 'italic', margin: '2px 0 4px' }}>
        {company}
      </div>
      <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ fontSize: '8pt', marginBottom: 2, color: '#333', lineHeight: '1.45' }}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectEntry({ company, description }: { company: string; description: string }) {
  const name = company.replace(/^Projekt:\s*/i, '');
  const { tech, body } = parseProject(description);
  return (
    <div style={{ marginBottom: 11 }}>
      <strong style={{ fontSize: '8.5pt', display: 'block', marginBottom: 2 }}>{name}</strong>
      {tech && (
        <div style={{ fontSize: '7.5pt', color: C_BLUE, fontStyle: 'italic', marginBottom: 3 }}>
          {tech}
        </div>
      )}
      <div style={{ fontSize: '8pt', color: '#333', lineHeight: '1.4' }}>{body || description}</div>
    </div>
  );
}

// ── root component ─────────────────────────────────────────────────────────
export default function CVPrintLayout({ data }: { data: CVData }) {
  const { t } = useLanguage();
  const p = data.personalInfo;
  const jobs     = data.experiences.filter(e => !e.company.toLowerCase().startsWith('projekt:'));
  const projects = data.experiences.filter(e =>  e.company.toLowerCase().startsWith('projekt:'));

  const githubDisplay   = p.github?.replace(/^https?:\/\//, '')   ?? '';
  const linkedinDisplay = p.linkedin?.replace(/^https?:\/\//, '') ?? '';
  const presentLabel = t('experience.present');

  return (
    <div id="cv-print-root" style={{
      width: '210mm', minHeight: '297mm', margin: 0,
      fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
      fontSize: '9pt', lineHeight: '1.4', color: '#1a1a1a',
      background: 'white', display: 'flex', flexDirection: 'column',
    }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: C_NAVY, color: 'white',
        display: 'flex', alignItems: 'center', padding: '16px 22px', gap: 18,
      }}>
        {/* photo */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%', border: `3px solid ${C_ORANGE}`,
          overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {p.photoUrl
            ? <img src={getProfilePhotoUrl(p.photoUrl, 168)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 30, fontWeight: 700, color: 'white' }}>{p.name.charAt(0)}</span>
          }
        </div>

        {/* name + contact */}
        <div>
          <h1 style={{ fontSize: '20pt', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
            {p.name}
          </h1>
          <p style={{ fontSize: '10.5pt', margin: '3px 0 6px', color: C_SIDE, fontWeight: 300 }}>
            {p.title}
          </p>
          <p style={{ fontSize: '8pt', margin: '1px 0', color: C_MUTED }}>
            {[[p.street, p.houseNumber].filter(Boolean).join(' '), p.address].filter(Boolean).join(', ')}
          </p>
          <p style={{ fontSize: '8pt', margin: '1px 0', color: C_MUTED }}>
            {p.phone}&nbsp;&nbsp;|&nbsp;&nbsp;{p.email}
          </p>
          <p style={{ fontSize: '8pt', margin: '1px 0', color: C_MUTED }}>
            {linkedinDisplay}&nbsp;&nbsp;|&nbsp;&nbsp;{githubDisplay}
          </p>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{
          width: '65mm', background: C_NAVY, color: 'white',
          padding: '16px 14px', flexShrink: 0,
        }}>
          <SideSection label={t('cv.contact')}>
            <KV k={t('cv.tel')}  v={p.phone} />
            <KV k={t('cv.mail')} v={p.email} />
            <KV k={t('cv.web')}  v={githubDisplay} />
            <KV k={t('cv.city')} v={[[p.street, p.houseNumber].filter(Boolean).join(' '), p.address].filter(Boolean).join(', ')} />
          </SideSection>

          <SideSection label={t('cv.languages')}>
            {data.languages.map(l => (
              <LangBar key={l.id} name={l.name} level={l.level} />
            ))}
          </SideSection>

          <SideSection label={t('cv.skills')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {data.skills.map(s => (
                <span key={s.id} style={{
                  background: C_SKILL, borderRadius: 3,
                  padding: '2px 5px', fontSize: '7pt', color: 'white',
                }}>{s.name}</span>
              ))}
            </div>
          </SideSection>

          <SideSection label={t('cv.certificates')}>
            {data.certificates.map(c => (
              <div key={c.id} style={{ marginBottom: 11 }}>
                <div style={{ fontSize: '8pt', fontWeight: 700, color: 'white' }}>{c.name}</div>
                <div style={{ fontSize: '7.5pt', color: C_MUTED, marginTop: 2 }}>
                  {c.issuer}{c.date ? `  ${c.date.slice(0, 4)}` : ''}
                </div>
              </div>
            ))}
          </SideSection>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, background: 'white', padding: '16px 20px' }}>

          <MainSection label={t('cv.profile')}>
            <p style={{ fontSize: '8.5pt', lineHeight: '1.55', textAlign: 'justify', margin: 0 }}>
              {p.bio}
            </p>
          </MainSection>

          <MainSection label={t('cv.experience')}>
            {jobs.map(j => (
              <JobEntry
                key={j.id}
                position={j.position}
                company={j.company}
                startDate={j.startDate}
                endDate={j.endDate}
                description={j.description}
                presentLabel={presentLabel}
              />
            ))}
          </MainSection>

          {projects.length > 0 && (
            <MainSection label={t('cv.projects')}>
              {projects.map(proj => (
                <ProjectEntry key={proj.id} company={proj.company} description={proj.description} />
              ))}
            </MainSection>
          )}
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#f4f4f4', borderTop: '1px solid #ddd',
        padding: '5px 22px', display: 'flex', justifyContent: 'center',
        gap: 14, fontSize: '7.5pt', color: '#666',
      }}>
        <span>{p.name}</span>
        <span>|</span>
        <span>{p.email}</span>
        <span>|</span>
        <span>{githubDisplay}</span>
      </div>
    </div>
  );
}
