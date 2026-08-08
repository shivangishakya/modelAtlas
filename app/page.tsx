"use client";

import { useMemo, useState } from "react";

type Model = {
  id: string; name: string; maker: string; mark: string; tone: string; type: string;
  access: "API" | "Open weights" | "App + API"; best: string; limits: string;
  tags: string[]; scores: Record<string, number>; link: string; featured?: boolean;
};

const models: Model[] = [
  { id:"gpt", name:"GPT-5.6 Sol", maker:"OpenAI", mark:"◎", tone:"lime", type:"Frontier reasoning", access:"App + API", best:"Complex reasoning, production coding, agentic workflows", limits:"Cloud-hosted; verify domain facts and high-stakes outputs.", tags:["Reasoning","Code","Vision","Tools"], scores:{medical:94,software:98,construction:91,creative:88,research:96}, link:"https://developers.openai.com/api/docs/models", featured:true },
  { id:"claude", name:"Claude Opus 4.8", maker:"Anthropic", mark:"A", tone:"coral", type:"Frontier reasoning", access:"App + API", best:"Long-form analysis, codebases, careful writing", limits:"Cloud-hosted; can be conservative and usage limits vary.", tags:["Reasoning","Code","Documents","Tools"], scores:{medical:92,software:97,construction:89,creative:95,research:95}, link:"https://docs.anthropic.com/en/docs/about-claude/models" },
  { id:"gemini", name:"Gemini 3.1 Pro", maker:"Google", mark:"✦", tone:"blue", type:"Multimodal frontier", access:"App + API", best:"Multimodal research, huge contexts, Google ecosystem", limits:"Preview/stable variants change; validate long-context retrieval.", tags:["Vision","Video","Long context","Tools"], scores:{medical:93,software:94,construction:96,creative:90,research:97}, link:"https://ai.google.dev/gemini-api/docs/models" },
  { id:"llama", name:"Llama 4 Maverick", maker:"Meta", mark:"∞", tone:"violet", type:"Open-weight multimodal", access:"Open weights", best:"Private deployments, customization, multimodal apps", limits:"Serious hardware and safety engineering required for self-hosting.", tags:["Open weights","Vision","Fine-tune"], scores:{medical:79,software:88,construction:83,creative:86,research:82}, link:"https://huggingface.co/meta-llama/models" },
  { id:"deepseek", name:"DeepSeek R1", maker:"DeepSeek", mark:"D", tone:"blue", type:"Open reasoning", access:"Open weights", best:"Math, reasoning research, cost-controlled deployment", limits:"High inference cost locally; governance needs independent review.", tags:["Reasoning","Math","Open weights"], scores:{medical:78,software:92,construction:80,creative:72,research:89}, link:"https://huggingface.co/deepseek-ai" },
  { id:"mistral", name:"Mistral Large", maker:"Mistral AI", mark:"M", tone:"coral", type:"General purpose", access:"App + API", best:"Enterprise multilingual work and European deployment", limits:"Smaller ecosystem than the largest platforms.", tags:["Multilingual","Code","Tools"], scores:{medical:81,software:90,construction:86,creative:85,research:84}, link:"https://docs.mistral.ai/getting-started/models/" },
  { id:"qwen", name:"Qwen 3", maker:"Alibaba", mark:"Q", tone:"violet", type:"Open reasoning", access:"Open weights", best:"Multilingual and Chinese-language applications", limits:"License, deployment and regional compliance require review.", tags:["Open weights","Multilingual","Code"], scores:{medical:80,software:91,construction:82,creative:82,research:87}, link:"https://huggingface.co/Qwen" },
  { id:"gemma", name:"Gemma 4", maker:"Google", mark:"G", tone:"lime", type:"Efficient open model", access:"Open weights", best:"On-device experiments, tuning, efficient private apps", limits:"Not a replacement for frontier models on the hardest tasks.", tags:["Open weights","Efficient","Fine-tune"], scores:{medical:72,software:84,construction:75,creative:80,research:76}, link:"https://ai.google.dev/gemma/docs" },
];

const domains = [
  {id:"medical", icon:"✚", name:"Medical & Health", desc:"Clinical support, research, operations", areas:["Clinical decision support","Medical imaging review","Patient education","Literature synthesis"], example:"Summarize a longitudinal record and flag missing evidence—always reviewed by a licensed clinician."},
  {id:"software", icon:"⌘", name:"Technology", desc:"Engineering, data, cybersecurity", areas:["Software engineering","Data analysis","Security review","Product research"], example:"Trace a failing integration test across a repository and propose a minimal, testable patch."},
  {id:"construction", icon:"▰", name:"Construction", desc:"Planning, design, field operations", areas:["Drawing & image review","Bid document analysis","Safety planning","Schedule risk"], example:"Compare plan sheets with a specification package and create an RFI draft for inconsistencies."},
  {id:"creative", icon:"✦", name:"Creative Work", desc:"Writing, design, media", areas:["Campaign concepts","Editorial writing","Visual ideation","Video pre-production"], example:"Turn a product brief into three distinct campaign territories with channel-ready copy."},
  {id:"research", icon:"◫", name:"Research & Education", desc:"Discovery, synthesis, tutoring", areas:["Evidence synthesis","Data interpretation","Adaptive tutoring","Grant research"], example:"Build a sourced evidence map, clearly separating findings, uncertainty, and open questions."},
];

const caution = {
  medical:"Not a medical device or clinician. Use approved, privacy-safe systems; require expert review and source verification.",
  software:"Generated code may be insecure or subtly wrong. Run tests, scans, and human review before deployment.",
  construction:"Never use unverified output as stamped design, code compliance, or site-safety instruction.",
  creative:"Check originality, rights, brand voice, and factual claims before publishing.",
  research:"Models can fabricate citations and flatten disagreement. Open every source and inspect the underlying evidence.",
};

export default function Home() {
  const [domain, setDomain] = useState("medical");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<string[]>(["gpt","claude"]);
  const current = domains.find(d=>d.id===domain)!;
  const ranked = useMemo(()=>[...models].sort((a,b)=>b.scores[domain]-a.scores[domain]),[domain]);
  const visible = ranked.filter(m => (filter === "All" || m.access === filter) && `${m.name} ${m.maker} ${m.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const toggleCompare=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<3?[...s,id]:s);

  return <main>
    <nav className="nav"><a className="brand" href="#top"><span className="brand-mark">M</span><span>Model Atlas</span></a><div className="navlinks"><a href="#finder">Finder</a><a href="#catalog">Models</a><a href="#compare">Compare</a></div><a className="nav-cta" href="#finder">Find your model <span>↘</span></a></nav>

    <section id="top" className="hero">
      <div className="eyebrow"><span>●</span> Independent AI field guide · Updated Aug 2026</div>
      <h1>The right model<br/>for the <em>real work.</em></h1>
      <p className="lede">Explore what leading AI models can do, where they fall short, and which one fits the job—from clinical research to construction planning.</p>
      <div className="hero-actions"><a href="#finder" className="primary">Start with your use case <span>→</span></a><a href="#catalog" className="text-link">Browse all models <span>↓</span></a></div>
      <div className="statline"><span><b>8</b> leading models</span><span><b>5</b> industries</span><span><b>20+</b> practical workflows</span><span className="method">Rankings are directional, not benchmarks</span></div>
      <div className="orbit" aria-hidden="true"><div className="orb orb1">◎</div><div className="orb orb2">A</div><div className="orb orb3">✦</div><div className="orb orb4">∞</div><div className="orb center">?</div></div>
    </section>

    <section id="finder" className="finder section-pad">
      <div className="section-head"><div><span className="kicker">01 / USE-CASE FINDER</span><h2>Start with the work,<br/>not the hype.</h2></div><p>Pick an industry. We’ll map the job, surface the risks, and rank models using capability fit—not popularity.</p></div>
      <div className="domain-tabs" role="tablist">{domains.map(d=><button key={d.id} onClick={()=>setDomain(d.id)} className={domain===d.id?"active":""} role="tab" aria-selected={domain===d.id}><span>{d.icon}</span>{d.name}</button>)}</div>
      <div className="recommend-grid">
        <div className="domain-card">
          <div className="domain-title"><span className="domain-icon">{current.icon}</span><div><span>EXPLORE THE DOMAIN</span><h3>{current.name}</h3><p>{current.desc}</p></div></div>
          <div className="areas">{current.areas.map((a,i)=><button key={a}><span>0{i+1}</span>{a}<b>↗</b></button>)}</div>
          <div className="example"><span>EXAMPLE WORKFLOW</span><p>“{current.example}”</p></div>
        </div>
        <div className="winner-card">
          <div className="winner-top"><span>BEST OVERALL FIT</span><span className="score">{ranked[0].scores[domain]} / 100</span></div>
          <div className={`big-mark ${ranked[0].tone}`}>{ranked[0].mark}</div><p className="maker">{ranked[0].maker}</p><h3>{ranked[0].name}</h3><p className="bestfor">{ranked[0].best}</p>
          <div className="why"><span>WHY IT FITS</span><ul><li>Strongest capability match in this guide</li><li>Supports the input types this workflow needs</li><li>Mature tooling for review and integration</li></ul></div>
          <a target="_blank" rel="noreferrer" href={ranked[0].link} className="access">Open official page <span>↗</span></a>
          <p className="micro">A model recommendation—not approval for autonomous use.</p>
        </div>
      </div>
      <div className="caution"><span>!</span><div><b>{current.name} safety note</b><p>{caution[domain as keyof typeof caution]}</p></div></div>
    </section>

    <section id="catalog" className="catalog section-pad">
      <div className="section-head dark"><div><span className="kicker">02 / MODEL FIELD GUIDE</span><h2>Know the players.<br/><em>Know the tradeoffs.</em></h2></div><p>A curated view of widely used model families. Product names and availability change—follow official links for current terms.</p></div>
      <div className="catalog-tools"><label>⌕<input aria-label="Search models" placeholder="Search models or capabilities" value={query} onChange={e=>setQuery(e.target.value)}/></label><div>{["All","App + API","API","Open weights"].map(f=><button className={filter===f?"active":""} onClick={()=>setFilter(f)} key={f}>{f}</button>)}</div></div>
      <div className="model-grid">{visible.map((m,i)=><article className="model-card" key={m.id}>
        <div className="model-num">{String(i+1).padStart(2,"0")}<button className={selected.includes(m.id)?"checked":""} onClick={()=>toggleCompare(m.id)} aria-label={`Compare ${m.name}`}>{selected.includes(m.id)?"✓":"+"}</button></div>
        <div className={`model-mark ${m.tone}`}>{m.mark}</div><span className="model-type">{m.type}</span><h3>{m.name}</h3><p className="by">by {m.maker}</p>
        <div className="tagrow">{m.tags.map(t=><span key={t}>{t}</span>)}</div>
        <dl><div><dt>SHINES AT</dt><dd>{m.best}</dd></div><div><dt>WATCH FOR</dt><dd>{m.limits}</dd></div></dl>
        <div className="card-foot"><span className={m.access==="Open weights"?"open":""}>{m.access}</span><a href={m.link} target="_blank" rel="noreferrer">{m.access==="Open weights"?"Download":"Open"} ↗</a></div>
      </article>)}</div>
    </section>

    <section id="compare" className="compare section-pad">
      <div className="section-head"><div><span className="kicker">03 / QUICK COMPARE</span><h2>See the tradeoffs<br/>side by side.</h2></div><p>Select up to three models using the + on any card. Scores are editorial fit estimates, not laboratory benchmarks.</p></div>
      <div className="compare-wrap"><div className="compare-labels"><b>MODEL</b><span>Medical</span><span>Technology</span><span>Construction</span><span>Creative</span><span>Research</span><span>Access</span></div>{selected.map(id=>{const m=models.find(x=>x.id===id)!;return <div className="compare-col" key={id}><div className="compare-model"><span className={`tiny-mark ${m.tone}`}>{m.mark}</span><b>{m.name}</b><button onClick={()=>toggleCompare(id)}>×</button></div>{["medical","software","construction","creative","research"].map(k=><div className="bar-cell" key={k}><span style={{width:`${m.scores[k]}%`}}></span><b>{m.scores[k]}</b></div>)}<div className="access-cell">{m.access}</div></div>})}{selected.length===0&&<div className="empty">Choose models above to compare.</div>}</div>
    </section>

    <footer><div className="brand"><span className="brand-mark">M</span><span>Model Atlas</span></div><p>Choose with context. Deploy with oversight.</p><div><a href="#top">Back to top ↑</a><span>Editorial guide · Aug 2026</span></div></footer>
  </main>
}
