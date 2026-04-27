"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { trioData } from "../../lib/trios-data";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── constants ───────────────────────────────────────────────────────────── */

// phases within a single card
const PHASE = {
  THEME:  "theme",   // show theme + argument, hide works
  WORKS:  "works",   // show works, reveal quotes individually
  SCORE:  "score",   // user grades themselves
};

/* ─── reducer ─────────────────────────────────────────────────────────────── */

function init(trios) {
  return {
    queue:    shuffle(trios),     // randomised list to go through
    index:    0,                  // current position in queue
    phase:    PHASE.THEME,
    revealed: [],                 // work names whose quote is revealed
    results:  {},                 // id → "known" | "review"
    done:     false,
  };
}

function reducer(state, action) {
  switch (action.type) {

    case "SHOW_WORKS":
      return { ...state, phase: PHASE.WORKS };

    case "TOGGLE_REVEAL": {
      const name = action.name;
      const revealed = state.revealed.includes(name)
        ? state.revealed.filter((n) => n !== name)
        : [...state.revealed, name];
      return { ...state, revealed };
    }

    case "REVEAL_ALL": {
      const all = state.queue[state.index].works.map((w) => w.name);
      return { ...state, revealed: all };
    }

    case "GRADE": {
      const trio = state.queue[state.index];
      const results = { ...state.results, [trio.id]: action.grade };
      const nextIndex = state.index + 1;
      const done = nextIndex >= state.queue.length;
      return {
        ...state,
        results,
        index:    done ? state.index : nextIndex,
        phase:    PHASE.THEME,
        revealed: [],
        done,
      };
    }

    case "RESTART":
      return init(trios);

    default:
      return state;
  }
}

/* ─── icons ───────────────────────────────────────────────────────────────── */

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── component ───────────────────────────────────────────────────────────── */

export default function LearnPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, trioData, init);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { setIsLoaded(true); }, []);
  if (!isLoaded) return null;

  const { queue, index, phase, revealed, results, done } = state;
  const trio    = queue[index];
  const total   = queue.length;
  const current = index + 1;

  const knownCount  = Object.values(results).filter((v) => v === "known").length;
  const reviewCount = Object.values(results).filter((v) => v === "review").length;

  /* ── DONE screen ──────────────────────────────────────────────────────── */
  if (done) {
    const pct = Math.round((knownCount / total) * 100);
    // collect trios to review
    const toReview = trioData.filter((t) => results[t.id] === "review");

    return (
      <div className="learn-shell">
        <div className="learn-done">
          <span className="learn-kicker">Session terminée</span>
          <h1 className="learn-done-score">{knownCount}<span>/{total}</span></h1>
          <p className="learn-done-label">connus de tête</p>

          <div className="learn-done-bar">
            <div className="learn-done-bar-fill" style={{ width: `${pct}%` }} />
          </div>

          {toReview.length > 0 && (
            <div className="learn-review-list">
              <p className="learn-review-title">À retravailler :</p>
              {toReview.map((t) => (
                <div key={t.id} className="learn-review-item">
                  <span className="learn-review-num">{String(t.id).padStart(2, "0")}</span>
                  <span className="learn-review-theme">{t.theme}</span>
                </div>
              ))}
            </div>
          )}

          <div className="learn-done-actions">
            <button className="learn-btn-primary" onClick={() => dispatch({ type: "RESTART" })}>
              Recommencer
            </button>
            <button className="learn-btn-outline" onClick={() => router.push("/")}>
              Retour révision
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN card ────────────────────────────────────────────────────────── */
  const progress = ((current - 1) / total) * 100;

  return (
    <div className="learn-shell">
      {/* top bar */}
      <header className="learn-topbar">
        <button className="learn-back" onClick={() => router.push("/")} title="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Révision
        </button>

        <div className="learn-progress-wrap">
          <div className="learn-progress-bar">
            <div className="learn-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="learn-counter">{current} / {total}</span>
        </div>

        <div className="learn-session-score">
          <span className="learn-score-known">{knownCount} ✓</span>
          <span className="learn-score-review">{reviewCount} ↺</span>
        </div>
      </header>

      {/* card */}
      <main className="learn-main">
        <div className="learn-card" key={trio.id + phase}>

          {/* ── phase THEME ─────────────────────────────────────────── */}
          {phase === PHASE.THEME && (
            <>
              <div className="learn-card-body">
                <span className="learn-tag">Trio {String(trio.id).padStart(2, "0")} · Thème</span>
                <h2 className="learn-theme">{trio.theme}</h2>
                <div className="learn-divider" />
                <p className="learn-argument">{trio.argument}</p>
                <p className="learn-hint">Retrouve les 3 œuvres et leurs citations…</p>
              </div>
              <div className="learn-card-footer">
                <button
                  className="learn-btn-primary full"
                  onClick={() => dispatch({ type: "SHOW_WORKS" })}
                >
                  Révéler les œuvres →
                </button>
              </div>
            </>
          )}

          {/* ── phase WORKS ─────────────────────────────────────────── */}
          {phase === PHASE.WORKS && (
            <>
              <div className="learn-card-body">
                <span className="learn-tag">Trio {String(trio.id).padStart(2, "0")} · Œuvres</span>
                <h2 className="learn-theme learn-theme-sm">{trio.theme}</h2>

                <div className="learn-works">
                  {trio.works.map((work) => {
                    const isRevealed = revealed.includes(work.name);
                    return (
                      <div key={work.name} className="learn-work-card">
                        <div className="learn-work-head">
                          <div>
                            <span className="learn-work-name">{work.name}</span>
                            <span className="learn-work-page">{work.page}</span>
                          </div>
                          <button
                            className="learn-reveal-btn"
                            onClick={() => dispatch({ type: "TOGGLE_REVEAL", name: work.name })}
                            aria-label={isRevealed ? "Masquer la citation" : "Révéler la citation"}
                          >
                            {isRevealed ? <EyeOffIcon /> : <EyeIcon />}
                            {isRevealed ? "Masquer" : "Citation"}
                          </button>
                        </div>
                        <p className="learn-work-idea">{work.idea}</p>
                        {isRevealed && (
                          <blockquote className="learn-work-quote">
                            {work.quote}
                          </blockquote>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="learn-card-footer">
                {revealed.length < trio.works.length && (
                  <button
                    className="learn-btn-outline"
                    onClick={() => dispatch({ type: "REVEAL_ALL" })}
                  >
                    Tout révéler
                  </button>
                )}
                <button
                  className="learn-btn-primary"
                  onClick={() => dispatch({ type: "GRADE", grade: "known" })}
                >
                  Je savais ✓
                </button>
                <button
                  className="learn-btn-review"
                  onClick={() => dispatch({ type: "GRADE", grade: "review" })}
                >
                  À revoir ↺
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
