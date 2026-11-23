'use client';

import { useState, type ReactNode } from 'react';

type PersonaResult = {
  name: string;
  content: string;
  error?: string;
};

type AnalyzeResponse = {
  results: Record<string, PersonaResult>;
};

const PERSONA_ORDER = ['senior-engineer', 'security-engineer', 'architect'] as const;
type PersonaId = (typeof PERSONA_ORDER)[number];

const PERSONA_LABELS: Record<string, string> = {
  'senior-engineer': 'Senior Software Engineer',
  'security-engineer': 'Security Engineer',
  architect: 'Software Architect',
};
const PERSONA_ICONS: Record<string, string> = {
  'senior-engineer': '⚙️',
  'security-engineer': '🔒',
  architect: '🏗️',
};

export default function Home() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('senior-engineer');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalyzeResponse['results'] | null>(null);

  async function handleAnalyze() {
    if (!code.trim()) {
      setError('Please enter some code to analyze.');
      return;
    }
    setError(null);
    setResults(null);
    setLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }

      setResults(data.results ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network or server error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1 className="title">DevPersona AI</h1>
        <p className="subtitle">
          Get code reviews from Senior Engineer, Security Engineer, and Software Architect.
        </p>
      </header>

      <section className="input-section">
        <label htmlFor="code-input" className="label">
          Paste your code
        </label>
        <textarea
          id="code-input"
          className="code-input"
          placeholder="// Paste or type code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={12}
          disabled={loading}
        />
        <div className="persona-chooser" aria-label="Choose persona">
          {PERSONA_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className={
                'persona-pill' + (selectedPersonaId === id ? ' persona-pill--active' : '')
              }
              onClick={() => setSelectedPersonaId(id)}
              disabled={loading}
            >
              <span className="persona-pill-icon">{PERSONA_ICONS[id]}</span>
              <span className="persona-pill-label">{PERSONA_LABELS[id]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {results && (
        <section className="results">
          <h2 className="results-title">Persona response</h2>
          <div className="cards">
            {(() => {
              const r = results[selectedPersonaId];
              if (!r) return null;
              const hasError = Boolean(r.error);
              return (
                <article key={selectedPersonaId} className="card">
                  <div className="card-header">
                    <span className="card-icon">
                      {PERSONA_ICONS[selectedPersonaId] ?? '👤'}
                    </span>
                    <h3 className="card-title">{r.name}</h3>
                  </div>
                  <div className="card-body">
                    {hasError ? (
                      <p className="card-error">{r.error}</p>
                    ) : (
                      <div className="card-content markdown">
                        {renderReview(r.content)}
                      </div>
                    )}
                  </div>
                </article>
              );
            })()}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>DevPersona AI — Multi-persona code analysis</p>
      </footer>
    </main>
  );
}

function renderReview(markdown: string): ReactNode {
  const chunks: ReactNode[] = [];
  const codeFence = /```([^\n]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const renderText = (value: string) => {
    const lines = value.split('\n');
    const nodes: ReactNode[] = [];
    let paragraph: string[] = [];
    const flushParagraph = () => {
      if (paragraph.length) {
        nodes.push(<p key={key++}>{paragraph.join(' ')}</p>);
        paragraph = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
      } else if (trimmed.startsWith('## ')) {
        flushParagraph();
        nodes.push(<h4 key={key++}>{trimmed.slice(3)}</h4>);
      } else if (trimmed.startsWith('# ')) {
        flushParagraph();
        nodes.push(<h4 key={key++}>{trimmed.slice(2)}</h4>);
      } else if (/^[-*] /.test(trimmed)) {
        flushParagraph();
        nodes.push(<p key={key++}>• {trimmed.slice(2)}</p>);
      } else {
        paragraph.push(trimmed);
      }
    }
    flushParagraph();
    return nodes;
  };

  while ((match = codeFence.exec(markdown)) !== null) {
    if (match.index > cursor) {
      chunks.push(...renderText(markdown.slice(cursor, match.index)));
    }
    chunks.push(<pre key={key++}><code>{match[2]}</code></pre>);
    cursor = match.index + match[0].length;
  }

  if (cursor < markdown.length) {
    chunks.push(...renderText(markdown.slice(cursor)));
  }
  return chunks;
}
