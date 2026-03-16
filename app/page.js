"use client";

import { useEffect, useMemo, useState } from "react";
import { trioData } from "../lib/trios-data";

const STATUS_ORDER = ["new", "review", "known"];
const STEP_ORDER = ["theme", "argument", "works"];

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

  useEffect(() => {
    fetch("/api/statuses")
      .then((response) => response.json())
      .then((data) => {
        setStatuses(data.statuses || {});
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
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
    setStatuses((prev) => ({ ...prev, [id]: nextStatus }));
    fetch(`/api/statuses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    }).catch(() => null);
  }

  function openTrio(id) {
    setSelectedId(id);
    setStep("theme");
    setRevealedWorks([]);
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

  function revealAllQuotes() {
    if (!current) return;
    setRevealedWorks(current.works.map((work) => work.name));
  }

  function resetStatuses() {
    setStatuses({});
    fetch("/api/statuses", { method: "DELETE" }).catch(() => null);
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-area">
            <h1 className="logo">La Nature <span>Sprint</span></h1>
            <button className="reset-btn" onClick={resetStatuses} title="Réinitialiser">
              Reset
            </button>
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
            placeholder="Rechercher par thème, auteur, citation..."
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

              {/* Step: Works */}
              {step === "works" && (
                <div key="works" className="content-stage works-grid">
                  <span className="label-sup">Citations</span>
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

              {step === "works" ? (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="primary-action outline" onClick={revealAllQuotes}>
                    Tout révéler
                  </button>
                  <button className="primary-action" onClick={() => moveSelection("next")}>
                    Trio suivant →
                  </button>
                </div>
              ) : (
                <button className="primary-action" onClick={advanceStep}>
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
