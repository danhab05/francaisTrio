"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { trioData } from "../../lib/trios-data";
import { bonusQuotes } from "../../lib/bonus-quotes";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Flatten trios into individual works, plus bonus standalone quotes.
 *  Result count: 27 trio-works + N bonus = 27+N total (filtered by author). */
function flattenWorks(trios, author = "all") {
  const items = [];
  trios.forEach((trio) => {
    trio.works.forEach((work) => {
      if (author !== "all" && work.name !== author) return;
      items.push({
        id:       `${trio.id}-${work.name}`,
        trioId:   trio.id,
        bonus:    false,
        theme:    trio.theme,
        argument: trio.argument,
        name:     work.name,
        page:     work.page,
        idea:     work.idea,
        quote:    work.quote,
      });
    });
  });
  // Append bonus quotes (no trio attached)
  bonusQuotes.forEach((b) => {
    if (author !== "all" && b.name !== author) return;
    items.push({
      id:       b.id,
      trioId:   null,
      bonus:    true,
      theme:    null,
      argument: null,
      name:     b.name,
      page:     b.page,
      idea:     b.idea,
      quote:    b.quote,
    });
  });
  return items;
}

/** Extract the first N words of a quote, stripping guillemets. */
function firstWords(quote, n = 2) {
  if (!quote) return "";
  // remove « » and leading/trailing punctuation, take first n tokens
  const cleaned = quote
    .replace(/^[«"\s]+/, "")
    .replace(/[»"\s]+$/, "")
    .trim();
  const words = cleaned.split(/\s+/).slice(0, n);
  return words.join(" ");
}

/* ─── constants ───────────────────────────────────────────────────────────── */

const MODE    = { TRIO: "trio", WORK: "work" };
const AUTHORS = ["all", "Verne", "Haushofer", "Canguilhem"];

// phases within a trio-mode card (work-mode has no phases, only reveal)
const PHASE = { THEME: "theme", WORKS: "works" };

/* ─── reducer ─────────────────────────────────────────────────────────────── */

function makeQueue(mode, author) {
  return mode === MODE.WORK
    ? shuffle(flattenWorks(trioData, author))
    : shuffle(trioData);
}

function init({ mode, author = "all" }) {
  return {
    mode,
    author,
    queue:    makeQueue(mode, author),
    index:    0,
    phase:    PHASE.THEME,
    revealed: [],     // trio-mode: work names ; work-mode: bool via "revealed[0]"
    results:  {},     // item id → "known" | "review"
    done:     false,
  };
}

function reducer(state, action) {
  switch (action.type) {

    case "SET_MODE":
      return init({ mode: action.mode, author: state.author });

    case "SET_AUTHOR":
      return init({ mode: state.mode, author: action.author });

    case "SHOW_WORKS":
      return { ...state, phase: PHASE.WORKS };

    case "TOGGLE_REVEAL_WORK":
      // work-mode: simple boolean toggle
      return { ...state, revealed: state.revealed.length ? [] : ["revealed"] };

    case "TOGGLE_REVEAL": {
      const name = action.name;
      const revealed = state.revealed.includes(name)
        ? state.revealed.filter((n) => n !== name)
        : [...state.revealed, name];
      return { ...state, revealed };
    }

    case "REVEAL_ALL": {
      const cur = state.queue[state.index];
      const all = cur.works ? cur.works.map((w) => w.name) : [];
      return { ...state, revealed: all };
    }

    case "GRADE": {
      const item = state.queue[state.index];
      const results = { ...state.results, [item.id]: action.grade };
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
      return init({ mode: state.mode, author: state.author });

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
  const [state, dispatch] = useReducer(
    reducer,
    { mode: MODE.TRIO, author: "all" },
    init
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Remember last chosen mode + author
  useEffect(() => {
    const savedMode   = localStorage.getItem("learn_mode");
    const savedAuthor = localStorage.getItem("learn_author");
    const mode   = (savedMode === MODE.WORK || savedMode === MODE.TRIO) ? savedMode : MODE.TRIO;
    const author = AUTHORS.includes(savedAuthor) ? savedAuthor : "all";
    if (mode !== MODE.TRIO || author !== "all") {
      // SET_MODE resets with author too; build init in one go
      dispatch({ type: "SET_MODE", mode });
      if (author !== "all") dispatch({ type: "SET_AUTHOR", author });
    }
    setIsLoaded(true);
  }, []);

  function changeMode(mode) {
    localStorage.setItem("learn_mode", mode);
    dispatch({ type: "SET_MODE", mode });
  }

  function changeAuthor(author) {
    localStorage.setItem("learn_author", author);
    dispatch({ type: "SET_AUTHOR", author });
  }

  if (!isLoaded) return null;

  const { mode, author, queue, index, phase, revealed, results, done } = state;
  const total    = queue.length;
  const current  = index + 1;
  const item     = queue[index];

  const knownCount  = Object.values(results).filter((v) => v === "known").length;
  const reviewCount = Object.values(results).filter((v) => v === "review").length;

  /* ── DONE screen ──────────────────────────────────────────────────────── */
  if (done) {
    const pct = Math.round((knownCount / total) * 100);

    const toReview =
      mode === MODE.TRIO
        ? trioData.filter((t) => results[t.id] === "review")
        : flattenWorks(trioData, author).filter((w) => results[w.id] === "review");

    return (
      <div className="learn-shell">
        <main className="learn-main">
          <div className="learn-done">
            <span className="learn-kicker">Session terminée</span>
            <h1 className="learn-done-score">{knownCount}<span>/{total}</span></h1>
            <p className="learn-done-label">
              {mode === MODE.WORK ? "citations sues" : "trios sus"}
            </p>

            <div className="learn-done-bar">
              <div className="learn-done-bar-fill" style={{ width: `${pct}%` }} />
            </div>

            {toReview.length > 0 && (
              <div className="learn-review-list">
                <p className="learn-review-title">À retravailler :</p>
                {toReview.map((t) => {
                  const isBonus = t.bonus || typeof t.id === "string" && t.id.startsWith("bonus-");
                  const num = isBonus
                    ? "BN"
                    : String(t.trioId || t.id).padStart(2, "0");
                  const label =
                    mode === MODE.WORK
                      ? (isBonus ? `${t.name} — bonus` : `${t.name} — ${t.theme}`)
                      : t.theme;
                  return (
                    <div key={t.id} className="learn-review-item">
                      <span className="learn-review-num">{num}</span>
                      <span className="learn-review-theme">{label}</span>
                    </div>
                  );
                })}
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
        </main>
      </div>
    );
  }

  /* ── card renderer ──────────────────────────────────────────────────── */
  const progress = ((current - 1) / total) * 100;
  const isWorkMode = mode === MODE.WORK;
  const isQuoteRevealed = isWorkMode && revealed.length > 0;

  return (
    <div className="learn-shell">
      {/* top bar */}
      <header className="learn-topbar">
        <button className="learn-back" onClick={() => router.push("/")} title="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span className="learn-back-label">Révision</span>
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

      {/* mode switcher */}
      <div className="learn-mode-switch">
        <button
          className={`learn-mode-tab ${mode === MODE.TRIO ? "active" : ""}`}
          onClick={() => changeMode(MODE.TRIO)}
        >
          Par trio
          <span>9 cartes</span>
        </button>
        <button
          className={`learn-mode-tab ${mode === MODE.WORK ? "active" : ""}`}
          onClick={() => changeMode(MODE.WORK)}
        >
          Par œuvre
          <span>
            {mode === MODE.WORK
              ? `${total} carte${total > 1 ? "s" : ""}`
              : "27 cartes"}
          </span>
        </button>
      </div>

      {/* author filter — work mode only */}
      {mode === MODE.WORK && (
        <div className="learn-author-filter">
          {AUTHORS.map((a) => (
            <button
              key={a}
              className={`learn-author-chip ${author === a ? "active" : ""}`}
              onClick={() => changeAuthor(a)}
            >
              {a === "all" ? "Tous" : a}
            </button>
          ))}
        </div>
      )}

      {/* main scroll area */}
      <main className="learn-main">
        <div className="learn-card" key={`${mode}-${item.id}-${phase}`}>

          {/* ───── TRIO MODE ───────────────────────────────────────────── */}
          {mode === MODE.TRIO && phase === PHASE.THEME && (
            <>
              <div className="learn-card-body">
                <span className="learn-tag">
                  Trio {String(item.id).padStart(2, "0")} · Thème
                </span>
                <h2 className="learn-theme">{item.theme}</h2>
                <div className="learn-divider" />
                <p className="learn-argument">{item.argument}</p>
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

          {mode === MODE.TRIO && phase === PHASE.WORKS && (
            <>
              <div className="learn-card-body">
                <span className="learn-tag">
                  Trio {String(item.id).padStart(2, "0")} · Œuvres
                </span>
                <h2 className="learn-theme learn-theme-sm">{item.theme}</h2>

                <div className="learn-works">
                  {item.works.map((work) => {
                    const isR = revealed.includes(work.name);
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
                          >
                            {isR ? <EyeOffIcon /> : <EyeIcon />}
                            {isR ? "Masquer" : "Citation"}
                          </button>
                        </div>
                        <p className="learn-work-idea">{work.idea}</p>
                        {isR && <blockquote className="learn-work-quote">{work.quote}</blockquote>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="learn-card-footer">
                {revealed.length < item.works.length && (
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

          {/* ───── WORK MODE ───────────────────────────────────────────── */}
          {isWorkMode && (
            <>
              <div className="learn-card-body">
                <span className={`learn-tag ${item.bonus ? "is-bonus" : ""}`}>
                  {item.bonus
                    ? `Bonus · ${item.name}`
                    : `Trio ${String(item.trioId).padStart(2, "0")} · ${item.name}`}
                </span>
                {item.theme && (
                  <h2 className="learn-theme learn-theme-sm">{item.theme}</h2>
                )}

                <div className="learn-work-card learn-work-card-solo">
                  <div className="learn-work-head">
                    <div>
                      <span className="learn-work-name">{item.name}</span>
                      {item.page && (
                        <span className="learn-work-page">{item.page}</span>
                      )}
                    </div>
                  </div>
                  <p className="learn-work-idea">{item.idea}</p>

                  {isQuoteRevealed ? (
                    <blockquote className="learn-work-quote">{item.quote}</blockquote>
                  ) : (
                    <div className="learn-quote-placeholder">
                      <span>Indice · 2 premiers mots</span>
                      <p>« {firstWords(item.quote, 2)}…&nbsp;»</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="learn-card-footer">
                {!isQuoteRevealed ? (
                  <button
                    className="learn-btn-primary full"
                    onClick={() => dispatch({ type: "TOGGLE_REVEAL_WORK" })}
                  >
                    <EyeIcon /> Révéler la citation
                  </button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
