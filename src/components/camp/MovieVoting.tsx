import { useState } from "react";
import type { CampState } from "../../lib/camp/types";
import { voteForMovie, addMovie, removeMovie } from "../../lib/camp/storage";
import { PosterButton } from "./CampApp";
import styles from "./CampApp.module.css";

function MovieCard({
  movie,
  isHost,
  onVote,
  votedMovieId,
  voteCount,
  onRemove,
}: {
  movie: { id: string; title: string; description?: string; year?: number };
  isHost: boolean;
  onVote?: () => void;
  votedMovieId?: string;
  voteCount: number;
  onRemove?: () => void;
}) {
  const hasVoted = votedMovieId === movie.id;
  return (
    <article
      className={styles.movieCard}
      data-voted={hasVoted}
      role="button"
      tabIndex={0}
      onClick={onVote}
      onKeyDown={(e) => e.key === "Enter" && onVote?.()}
      aria-pressed={hasVoted}
    >
      <div className={styles.moviePoster}>🎬</div>
      <div className={styles.movieMeta}>
        <strong>{movie.title}</strong>
        {movie.year && <p>{movie.year}</p>}
        {movie.description && <p>{movie.description}</p>}
      </div>
      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span className={styles.movieVoteCount}>{voteCount}</span>
        <small>votes</small>
        {isHost && onRemove && (
          <button
            className={styles.movieRemoveBtn}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label={`Remove ${movie.title}`}
          >
            ✕ Remove
          </button>
        )}
      </div>
    </article>
  );
}

export function MovieVoting({
  state,
  updateState,
  isHost,
}: {
  state: CampState;
  updateState: (next: CampState) => void;
  isHost: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const currentCamper = state.campers.find((c) => c.id === state.currentPlayerId);
  const currentVote = state.movieVotes.get(state.currentPlayerId ?? "");
  const movies = state.pendingMovies;

  const handleVote = (movieId: string) => {
    if (!currentCamper) return;
    updateState(require("../../lib/camp/storage").voteForMovie(state, state.currentPlayerId!, movieId));
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const yearNum = year ? parseInt(year, 10) : undefined;
    updateState(require("../../lib/camp/storage").addMovie(state, title.trim(), description.trim() || undefined, yearNum));
    setTitle("");
    setDescription("");
    setYear("");
    setShowAdd(false);
  };

  const handleRemove = (movieId: string) => {
    updateState(require("../../lib/camp/storage").removeMovie(state, movieId));
  };

  const getVoteCount = (movieId: string) => {
    return Array.from(state.movieVotes.values()).filter((id) => id === movieId).length;
  };

  if (movies.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.pageHeading}>
          <span aria-hidden="true">🎬</span>
          <div>
            <small>Movie Night</small>
            <h1>Select a Movie</h1>
            <p>No movies added yet.</p>
          </div>
        </div>
        {isHost && (
          <button className={styles.posterButton} onClick={() => setShowAdd(true)}>
            Add Movie
          </button>
        )}
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageHeading}>
        <span aria-hidden="true">🎬</span>
        <div>
          <small>Movie Night</small>
          <h1>Select a Movie</h1>
          <p>Pick your film. One vote per camper. Host controls the lineup.</p>
        </div>
      </div>

      {isHost && (
        <section className={styles.hostSection}>
          <div className={styles.sectionTitle}>
            <h2>Manage Movies</h2>
            <button className={styles.posterButton} onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? "Cancel" : "Add Movie"}
            </button>
          </div>
          {showAdd && (
            <form
              className={styles.movieAddForm}
              onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Movie title"
                required
              />
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Year (optional)"
                min="1900"
                max="2030"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <PosterButton type="submit" variant="acid">Add to Lineup</PosterButton>
            </form>
          )}
        </section>
      )}

      <section className={styles.movieList}>
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isHost={isHost}
            onVote={!isHost ? () => handleVote(movie.id) : undefined}
            votedMovieId={currentVote}
            voteCount={getVoteCount(movie.id)}
            onRemove={isHost ? () => handleRemove(movie.id) : undefined}
          />
        ))}
      </section>

      {currentVote && (
        <p style={{ textAlign: "center", marginTop: 16, fontWeight: 700 }}>
          Your vote: {movies.find((m) => m.id === currentVote)?.title}
        </p>
      )}
    </main>
  );
}
