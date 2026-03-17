"use client";

import { useEffect, useMemo, useState } from "react";
import { trioData } from "../lib/trios-data";

const STATUS_ORDER = ["new", "review", "known"];
const STEP_ORDER = ["theme", "argument", "work-0", "work-1", "work-2", "recap"];

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "new", label: "Inconnus" },
  { key: "review", label: "À revoir" },
  { key: "known", label: "Acquis" }
];

const STATUS_LABELS = {
  new: "Inconnu",
  review: "À revoir",
  known: "Acquis"
};

export default function Page() {
  const [statuses, setStatuses] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(trioData[0].id);
  const [step, setStep] = useState("theme");
  const [search, setSearch] = useState("");
  const [revealedWorks, setRevealedWorks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Load state from localStorage client-side
    const saved = localStorage.getItem("trio_statuses");
    if (saved) {
      try {
        setStatuses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse statuses", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const enrichedTrios = useMemo(
    () =>
      trioData.map((trio) => ({
        ...trio,
        status: statuses[trio.id] || "new"
      })),
    [statuses]
  );

  const filteredTrios = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enrichedTrios.filter((trio) => {
      const statusMatch = selectedFilter === "all" || trio.status === selectedFilter;
      if (!statusMatch) return false;
      if (!term) return true;

      const haystack = [
        trio.theme,
        trio.argument,
        ...trio.works.flatMap((work) => [work.name, work.idea, work.quote, work.page])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [enrichedTrios, selectedFilter, search]);

  useEffect(() => {
    if (!filteredTrios.length) return;
    if (!filteredTrios.some((trio) => trio.id === selectedId)) {
      setSelectedId(filteredTrios[0].id);
      setStep("theme");
      setRevealedWorks([]);
    }
  }, [filteredTrios, selectedId]);

  const current = filteredTrios.find((trio) => trio.id === selectedId) || filteredTrios[0];
  const currentIndex = filteredTrios.findIndex((trio) => trio.id === selectedId);

  const counts = useMemo(
    () =>
      enrichedTrios.reduce(
        (acc, trio) => {
          acc[trio.status] += 1;
          return acc;
        },
        { new: 0, review: 0, known: 0 }
      ),
    [enrichedTrios]
  );

  const progress = Math.round((counts.known / trioData.length) * 100);

  function updateStatus(id, nextStatus) {
    const newStatuses = { ...statuses, [id]: nextStatus };
    setStatuses(newStatuses);
    localStorage.setItem("trio_statuses", JSON.stringify(newStatuses));
  }

  function openTrio(id) {
    setSelectedId(id);
    setStep("theme");
    setRevealedWorks([]);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  }

  function moveSelection(direction) {
    if (!filteredTrios.length) return;
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1 + filteredTrios.length) % filteredTrios.length
        : (currentIndex - 1 + filteredTrios.length) % filteredTrios.length;
    openTrio(filteredTrios[nextIndex].id);
  }

  function advanceStep() {
    const index = STEP_ORDER.indexOf(step);
    if (index < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[index + 1]);
      return;
    }
    moveSelection("next");
  }

  function goBackStep() {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) {
      setStep(STEP_ORDER[index - 1]);
      return;
    }
    moveSelection("prev");
  }

  function revealAllQuotes() {
    if (!current) return;
    setRevealedWorks(current.works.map((work) => work.name));
  }

  function restartCurrentTrio() {
    setStep("theme");
    setRevealedWorks([]);
  }

  function resetStatuses() {
    if (confirm("Voulez-vous vraiment réinitialiser toute votre progression ?")) {
      setStatuses({});
      localStorage.removeItem("trio_statuses");
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (window.innerWidth <= 800) return;

      const target = event.target;
      const isTypingField =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTypingField) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        advanceStep();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBackStep();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection("prev");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection("next");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, filteredTrios, currentIndex]);

  // Prevent hydration mismatch by not rendering until localStorage is loaded
  if (!isLoaded) return null;

  return (
    <div className="app-container">
      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <h1 className="logo">La Nature <span>Sprint</span></h1>
        <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-area">
            <h1 className="logo hide-on-mobile">La Nature <span>Sprint</span></h1>
            <div className="sidebar-actions">
              <button className="reset-btn" onClick={resetStatuses} title="Réinitialiser">
                Reset
              </button>
              <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="global-progress">
            <div className="progress-labels">
              <span>{counts.known}/{trioData.length} Acquis</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="sidebar-search">
          <input
            type="search"
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par thème, auteur..."
          />
        </div>

        <div className="sidebar-filters">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`filter-btn ${selectedFilter === filter.key ? "active" : ""}`}
              onClick={() => setSelectedFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="sidebar-list">
          {filteredTrios.map((trio) => (
            <button
              key={trio.id}
              type="button"
              className={`trio-item ${current?.id === trio.id ? "active" : ""}`}
              onClick={() => openTrio(trio.id)}
            >
              <div className="trio-item-left">
                <span className="trio-id">{String(trio.id).padStart(2, "0")}</span>
                <span className="trio-theme-title">{trio.theme}</span>
              </div>
              <span className={`status-dot ${trio.status}`} />
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {current ? (
          <div className="flashcard-wrapper">
            {/* Header */}
            <header className="fc-header">
              <div className="fc-meta">
                <span className="fc-badge">Trio {String(current.id).padStart(2, "0")}</span>
                <span className="label-sup" style={{ marginBottom: 0 }}>
                  {currentIndex + 1} / {filteredTrios.length}
                </span>
              </div>
              <div className="fc-nav-actions">
                <button className="nav-btn" onClick={() => moveSelection("prev")} title="Précédent">
                  ←
                </button>
                <button className="nav-btn" onClick={() => moveSelection("next")} title="Suivant">
                  →
                </button>
              </div>
            </header>

            {/* Content Body */}
            <div className="fc-body">
              {/* Step Dashes */}
              <div className="step-indicator">
                {STEP_ORDER.map((item, index) => {
                  const isActive = step === item;
                  const isDone = STEP_ORDER.indexOf(step) > index;
                  return (
                    <div
                      key={item}
                      className={`step-dash ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                      onClick={() => setStep(item)}
                    />
                  );
                })}
              </div>

              {/* Step: Theme */}
              {step === "theme" && (
                <div key="theme" className="content-stage">
                  <span className="label-sup">Thème</span>
                  <h2 className="typography-serif">{current.theme}</h2>
                </div>
              )}

              {/* Step: Argument */}
              {step === "argument" && (
                <div key="argument" className="content-stage">
                  <span className="label-sup">Argument Général</span>
                  <p className="typography-serif">{current.argument}</p>
                </div>
              )}

              {/* Step: Works individual */}
              {step.startsWith("work-") && (
                <div key={step} className="content-stage works-grid">
                  <span className="label-sup">Œuvre {parseInt(step.split("-")[1]) + 1} / 3</span>
                  {(() => {
                    const work = current.works[parseInt(step.split("-")[1])];
                    return (
                      <div className="work-card">
                        <div className="work-header">
                          <div>
                            <h3 className="work-title">{work.name}</h3>
                            <span className="work-page">{work.page}</span>
                          </div>
                        </div>
                        <p className="work-idea">{work.idea}</p>
                        <blockquote className="work-quote">
                          {work.quote}
                        </blockquote>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Step: Recap */}
              {step === "recap" && (
                <div key="recap" className="content-stage works-grid">
                  <span className="label-sup">Récapitulatif</span>
                  {current.works.map((work) => {
                    const isRevealed = revealedWorks.includes(work.name);
                    return (
                      <div key={work.name} className="work-card">
                        <div className="work-header">
                          <div>
                            <h3 className="work-title">{work.name}</h3>
                            <span className="work-page">{work.page}</span>
                          </div>
                          <button
                            className="reveal-btn"
                            onClick={() =>
                              setRevealedWorks((prev) =>
                                isRevealed
                                  ? prev.filter((v) => v !== work.name)
                                  : [...prev, work.name]
                              )
                            }
                          >
                            {isRevealed ? "Masquer" : "Révéler"}
                          </button>
                        </div>
                        <p className="work-idea">{work.idea}</p>
                        {isRevealed && (
                          <blockquote className="work-quote">
                            {work.quote}
                          </blockquote>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="fc-footer">
              <div className="status-selector">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    className={`status-btn ${status} ${current.status === status ? "active" : ""}`}
                    onClick={() => updateStatus(current.id, status)}
                  >
                    <span className="dot" />
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              {step === "recap" ? (
                <div className="actions-row">
                  <button className="primary-action outline" onClick={restartCurrentTrio}>
                    Redemarrer
                  </button>
                  <button className="primary-action outline" onClick={revealAllQuotes}>
                    Tout révéler
                  </button>
                  <button className="primary-action" onClick={() => moveSelection("next")}>
                    Trio suivant →
                  </button>
                </div>
              ) : (
                <button className="primary-action full-width" onClick={advanceStep}>
                  Continuer →
                </button>
              )}
            </footer>
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucun trio trouvé pour cette recherche.</p>
          </div>
        )}
      </main>
    </div>
  );
}
