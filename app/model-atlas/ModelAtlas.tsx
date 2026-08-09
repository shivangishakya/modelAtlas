"use client";

import { useMemo, useState } from "react";
import { independent, models } from "./catalog";
import { caution, domains, presets, priorityDefs } from "./domains";
import { scoreFor } from "./recommendation";
import type { AdvisorResponse } from "./types";

const confidenceLabels: Record<AdvisorResponse["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export default function ModelAtlas() {
  const [domain, setDomain] = useState("medical");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>([
    "gpt",
    "claude",
    "gemini",
  ]);
  const [useText, setUseText] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [results, setResults] = useState<AdvisorResponse | null>(null);
  const [advisorError, setAdvisorError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const current = domains.find((d) => d.id === domain)!;
  const ranked = useMemo(
    () => [...models].sort((a, b) => scoreFor(b, domain) - scoreFor(a, domain)),
    [domain],
  );
  const visible = ranked.filter(
    (m) =>
      (filter === "All" || m.access === filter) &&
      `${m.name} ${m.maker} ${m.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const toggleCompare = (id: string) =>
    setSelected((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length < 4
          ? [...s, id]
          : s,
    );
  const runAdvisor = async () => {
    const description = useText.trim();
    if (description.length < 20 || isAnalyzing) return;

    setIsAnalyzing(true);
    setAdvisorError("");
    setResults(null);

    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, priorities }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | AdvisorResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "The AI advisor could not complete the analysis.",
        );
      }

      setResults(payload as AdvisorResponse);
      window.setTimeout(
        () =>
          document
            .getElementById("recommendation")
            ?.scrollIntoView({ behavior: "smooth", block: "center" }),
        50,
      );
    } catch (error) {
      setAdvisorError(
        error instanceof Error
          ? error.message
          : "The AI advisor is temporarily unavailable.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top">
          <span className="brand-mark">M</span>
          <span>Model Atlas</span>
        </a>
        <div className="navlinks">
          <a href="#advisor">Advisor</a>
          <a href="#catalog">Evidence</a>
          <a href="#compare">Compare</a>
        </div>
        <a className="nav-cta" href="#advisor">
          Describe your use <span>↘</span>
        </a>
      </nav>
      <section id="top" className="hero">
        <div className="eyebrow">
          <span>●</span> Evidence-led AI field guide · Research checked Aug 2026
        </div>
        <h1>
          The right model
          <br />
          for the <em>real work.</em>
        </h1>
        <p className="lede">
          Describe the job in plain language. Get a transparent recommendation,
          inspect the evidence, and compare the tradeoffs before you commit.
        </p>
        <div className="hero-actions">
          <a href="#advisor" className="primary">
            Ask the model advisor <span>→</span>
          </a>
          <a href="#catalog" className="text-link">
            Inspect the evidence <span>↓</span>
          </a>
        </div>
        <div className="statline">
          <span>
            <b>{models.length}</b> researched models
          </span>
          <span>
            <b>{models.reduce((n, m) => n + m.proofs.length, 0)}</b> cited proof
            points
          </span>
          <span>
            <b>{domains.length}</b> industries
          </span>
          <span className="method">
            No model is approved for autonomous high-stakes decisions
          </span>
        </div>
        <div className="orbit" aria-hidden="true">
          <div className="orb orb1">◎</div>
          <div className="orb orb2">A</div>
          <div className="orb orb3">✦</div>
          <div className="orb orb4">∞</div>
          <div className="orb center">?</div>
        </div>
      </section>

      <section id="advisor" className="advisor section-pad">
        <div className="section-head">
          <div>
            <span className="kicker">01 / MODEL ADVISOR</span>
            <h2>
              Tell us what
              <br />
              you need to do.
            </h2>
          </div>
          <p>
            An LLM analyzes the full meaning of your task, inputs, outputs and
            constraints. It ranks only catalog models, validates the result and
            shows the evidence behind the recommendation.
          </p>
        </div>
        <div className="advisor-shell">
          <div className="advisor-input">
            <label htmlFor="usecase">DESCRIBE THE WORK</label>
            <textarea
              id="usecase"
              value={useText}
              onChange={(e) => setUseText(e.target.value)}
              maxLength={2_000}
              placeholder="Example: I need to compare architectural drawings against a 300-page specification, identify conflicts, and draft RFIs. The documents are confidential…"
            />
            <div className="charhint">
              <span>Be specific about inputs, output, privacy and budget.</span>
              <b>{useText.length} chars</b>
            </div>
            <span className="mini-label">TRY AN EXAMPLE</span>
            <div className="preset-row">
              {presets.map((p) => (
                <button key={p} onClick={() => setUseText(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="advisor-controls">
            <span className="mini-label">WHAT MATTERS MOST?</span>
            <div className="priority-list">
              {priorityDefs.map((p) => (
                <button
                  key={p.id}
                  className={priorities.includes(p.id) ? "active" : ""}
                  onClick={() =>
                    setPriorities((s) =>
                      s.includes(p.id)
                        ? s.filter((x) => x !== p.id)
                        : [...s, p.id],
                    )
                  }
                >
                  <i>{priorities.includes(p.id) ? "✓" : "+"}</i>
                  {p.label}
                </button>
              ))}
            </div>
            <button
              className="analyze"
              disabled={useText.trim().length < 20 || isAnalyzing}
              onClick={runAdvisor}
              aria-busy={isAnalyzing}
            >
              {isAnalyzing
                ? "Reasoning over your use case…"
                : "Analyze with AI"}{" "}
              <span>{isAnalyzing ? "◌" : "→"}</span>
            </button>
            <p>
              Your description is sent to Gemini 3.6 Flash for analysis. Avoid
              personal, privileged or confidential data.
            </p>
          </div>
        </div>
        {advisorError && (
          <p className="advisor-error" role="alert">
            <b>Advisor unavailable.</b> {advisorError}
          </p>
        )}
        {results && (
          <div id="recommendation" className="recommendation">
            <div className="rec-head">
              <div>
                <span>RECOMMENDATION</span>
                <h3>{results.recommendations[0].model.name}</h3>
                <p>
                  {results.taskSummary} ·{" "}
                  <b>
                    {domains.find((d) => d.id === results.inferredDomain)?.name}
                  </b>
                </p>
              </div>
              <div className="confidence">
                <b>{confidenceLabels[results.confidence]}</b>
                <span>AI-assessed confidence · {results.analysisModel}</span>
              </div>
            </div>
            <div className="rec-body">
              <div className="rec-rank">
                <div
                  className={`big-mark ${results.recommendations[0].model.tone}`}
                >
                  {results.recommendations[0].model.mark}
                </div>
                <b>{results.recommendations[0].score}</b>
                <span>FIT SCORE</span>
              </div>
              <div className="rec-why">
                <span>WHY IT RANKED FIRST</span>
                <ul>
                  {results.recommendations[0].reasons.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <span>TRADEOFFS TO REVIEW</span>
                <ul className="tradeoff-list">
                  {results.recommendations[0].tradeoffs.map((tradeoff) => (
                    <li key={tradeoff}>{tradeoff}</li>
                  ))}
                </ul>
                {results.assumptions.length > 0 && (
                  <p className="rec-assumptions">
                    <b>Assumptions:</b> {results.assumptions.join(" · ")}
                  </p>
                )}
                <div className="proof-strip">
                  {results.recommendations[0].model.proofs
                    .slice(0, 2)
                    .map((p) => (
                      <a
                        key={p.label}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <b>{p.value}</b>
                        <span>{p.label}</span>
                        <small>{p.source} ↗</small>
                      </a>
                    ))}
                </div>
              </div>
              <div className="rec-next">
                <span>RUNNERS-UP</span>
                {results.recommendations.slice(1, 3).map((r, i) => (
                  <button
                    key={r.model.id}
                    onClick={() => {
                      if (!selected.includes(r.model.id)) {
                        toggleCompare(r.model.id);
                      }
                      document
                        .getElementById("compare")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <b>0{i + 2}</b>
                    <span>
                      {r.model.name}
                      <small>{r.score} fit · add to compare</small>
                    </span>
                    <em>+</em>
                  </button>
                ))}
              </div>
            </div>
            <div className="rec-warning">
              <b>AI guidance—not a guarantee</b>
              <span>{caution[results.inferredDomain]}</span>
            </div>
          </div>
        )}
      </section>

      <section id="finder" className="finder section-pad">
        <div className="section-head">
          <div>
            <span className="kicker">02 / DOMAIN MAP</span>
            <h2>
              Explore the work,
              <br />
              not the hype.
            </h2>
          </div>
          <p>
            Browse common workflows across {domains.length} industries. Rankings
            are editorial task-fit estimates—not universal benchmark scores.
          </p>
        </div>
        <div className="domain-tabs" role="tablist">
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => setDomain(d.id)}
              className={domain === d.id ? "active" : ""}
              role="tab"
              aria-selected={domain === d.id}
            >
              <span>{d.icon}</span>
              {d.name}
            </button>
          ))}
        </div>
        <div className="recommend-grid">
          <div className="domain-card">
            <div className="domain-title">
              <span className="domain-icon">{current.icon}</span>
              <div>
                <span>EXPLORE THE DOMAIN</span>
                <h3>{current.name}</h3>
                <p>{current.desc}</p>
              </div>
            </div>
            <div className="areas">
              {current.areas.map((a, i) => (
                <button key={a}>
                  <span>0{i + 1}</span>
                  {a}
                  <b>↗</b>
                </button>
              ))}
            </div>
            <div className="example">
              <span>EXAMPLE WORKFLOW</span>
              <p>“{current.example}”</p>
            </div>
          </div>
          <div className="winner-card">
            <div className="winner-top">
              <span>BEST EDITORIAL FIT</span>
              <span className="score">{scoreFor(ranked[0], domain)} / 100</span>
            </div>
            <div className={`big-mark ${ranked[0].tone}`}>{ranked[0].mark}</div>
            <p className="maker">{ranked[0].maker}</p>
            <h3>{ranked[0].name}</h3>
            <p className="bestfor">{ranked[0].best}</p>
            <div className="why">
              <span>EVIDENCE SNAPSHOT</span>
              <ul>
                {ranked[0].proofs.slice(0, 2).map((p) => (
                  <li key={p.label}>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      {p.label}: <b>{p.value}</b> · {p.source} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <a
              target="_blank"
              rel="noreferrer"
              href={ranked[0].link}
              className="access"
            >
              Open official page <span>↗</span>
            </a>
            <p className="micro">
              Recommendation is not approval for autonomous use.
            </p>
          </div>
        </div>
        <div className="caution">
          <span>!</span>
          <div>
            <b>{current.name} safety note</b>
            <p>{caution[domain as keyof typeof caution]}</p>
          </div>
        </div>
      </section>

      <section id="catalog" className="catalog section-pad">
        <div className="section-head dark">
          <div>
            <span className="kicker">
              03 / EVIDENCE LIBRARY · {models.length} MODELS
            </span>
            <h2>
              Claims you can
              <br />
              <em>open and inspect.</em>
            </h2>
          </div>
          <p>
            This catalog covers prominent current general-purpose model families
            and meaningful deployment tiers—not thousands of fine-tunes or
            deprecated snapshots. Every proof opens its source.
          </p>
        </div>
        <div className="catalog-tools">
          <label>
            ⌕
            <input
              aria-label="Search models"
              placeholder="Search models, providers or capabilities"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div>
            {["All", "App + API", "API", "Open weights"].map((f) => (
              <button
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
                key={f}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="model-grid">
          {visible.map((m, i) => (
            <article className="model-card" key={m.id}>
              <div className="model-num">
                {String(i + 1).padStart(2, "0")}
                <button
                  className={selected.includes(m.id) ? "checked" : ""}
                  onClick={() => toggleCompare(m.id)}
                  aria-label={`Compare ${m.name}`}
                >
                  {selected.includes(m.id) ? "✓" : "+"}
                </button>
              </div>
              <div className={`model-mark ${m.tone}`}>{m.mark}</div>
              <span className="model-type">{m.type}</span>
              <h3>{m.name}</h3>
              <p className="by">by {m.maker}</p>
              <div className="spec-row">
                <span>
                  <b>{m.context}</b> context
                </span>
                <span>
                  <b>{m.price}</b> / 1M tokens
                </span>
              </div>
              <div className="tagrow">
                {m.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <dl>
                <div>
                  <dt>SHINES AT</dt>
                  <dd>{m.best}</dd>
                </div>
                <div>
                  <dt>WATCH FOR</dt>
                  <dd>{m.limits}</dd>
                </div>
              </dl>
              <div className="card-proofs">
                {m.proofs.slice(0, 2).map((p) => (
                  <a
                    key={p.label}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <b>{p.value}</b>
                    <span>
                      {p.label}
                      <small>{p.source} ↗</small>
                    </span>
                  </a>
                ))}
              </div>
              <div className="card-foot">
                <span className={m.access === "Open weights" ? "open" : ""}>
                  {m.access}
                </span>
                <a href={m.link} target="_blank" rel="noreferrer">
                  {m.access === "Open weights" ? "Get weights" : "Open"} ↗
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="methodology">
          <b>How to read the proof</b>
          <p>
            Benchmark scores are not directly comparable unless the dataset,
            model version, prompting, tool access, reasoning effort and
            evaluation harness match. Treat them as evidence of a demonstrated
            capability—not a guarantee for your task.
          </p>
          <a href={independent} target="_blank" rel="noreferrer">
            Cross-check independent model evaluations ↗
          </a>
        </div>
      </section>

      <section id="compare" className="compare section-pad">
        <div className="section-head">
          <div>
            <span className="kicker">04 / EVIDENCE COMPARE</span>
            <h2>
              Select models.
              <br />
              Inspect the proof.
            </h2>
          </div>
          <p>
            Choose up to four from the full catalog. The comparison combines
            published specifications, editorial task fit and direct links to the
            underlying evidence.
          </p>
        </div>
        <div className="select-models">
          <span>SELECT MODELS ({selected.length}/4)</span>
          <div>
            {models.map((m) => (
              <button
                key={m.id}
                className={selected.includes(m.id) ? "active" : ""}
                onClick={() => toggleCompare(m.id)}
              >
                <i>{selected.includes(m.id) ? "✓" : "+"}</i>
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <div className="compare-wrap detailed">
          <div className="compare-labels">
            <b>MODEL</b>
            <span>Context</span>
            <span>Modalities</span>
            <span>Access / license</span>
            <span>{current.name} fit</span>
            <span>Published proof</span>
            <span>Official page</span>
          </div>
          {selected.map((id) => {
            const m = models.find((x) => x.id === id)!;
            const fit = scoreFor(m, domain);
            return (
              <div className="compare-col" key={id}>
                <div className="compare-model">
                  <span className={`tiny-mark ${m.tone}`}>{m.mark}</span>
                  <b>{m.name}</b>
                  <button onClick={() => toggleCompare(id)}>×</button>
                </div>
                <div className="compare-copy">
                  <b>{m.context}</b>
                  <small>tokens</small>
                </div>
                <div className="compare-copy">{m.modalities}</div>
                <div className="compare-copy">
                  <b>{m.access}</b>
                  <small>{m.license}</small>
                </div>
                <div className="bar-cell">
                  <span style={{ width: `${fit}%` }}></span>
                  <b>{fit}</b>
                </div>
                <div className="compare-proof">
                  {m.proofs.slice(0, 2).map((p) => (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      key={p.label}
                    >
                      <b>{p.value}</b> {p.label} ↗
                    </a>
                  ))}
                </div>
                <div className="access-cell">
                  <a href={m.link} target="_blank" rel="noreferrer">
                    Open source ↗
                  </a>
                </div>
              </div>
            );
          })}
          {selected.length === 0 && (
            <div className="empty">Choose models above to compare.</div>
          )}
        </div>
        <p className="compare-note">
          Comparison domain: <b>{current.name}</b>. Change it in the Domain Map
          above. Fit scores are Model Atlas editorial estimates; published proof
          points retain their original source and methodology.
        </p>
      </section>
      <footer>
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>Model Atlas</span>
        </div>
        <p>Choose with evidence. Deploy with oversight.</p>
        <div>
          <a href="#top">Back to top ↑</a>
          <span>Research checked · Aug 2026</span>
        </div>
      </footer>
    </main>
  );
}
