'use client';

import { useState } from 'react';

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
                      <div
                        className="card-content markdown"
                        dangerouslySetInnerHTML={{
                          __html: simpleMarkdown(r.content),
                        }}
                      />
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

function simpleMarkdown(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = escape(text)
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  const lines = out.split('\n');
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('<')) {
      blocks.push(line);
      i++;
    } else if (line.trim() === '') {
      blocks.push('<br/>');
      i++;
    } else {
      blocks.push('<p>' + line + '</p>');
      i++;
    }
  }
  return blocks.join('');
}
