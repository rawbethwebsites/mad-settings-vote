'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayer, Player } from '@/lib/player';

interface Movie {
  id: string;
  title: string;
  description?: string;
  year?: number;
}

interface VoteRecord {
  roomId: string;
  movieId: string;
  voterName: string;
}

const SAMPLE_MOVIES: Movie[] = [
  { id: '1', title: 'The Dark Knight', year: 2008, description: 'Batman faces the Joker' },
  { id: '2', title: 'Inception', year: 2010, description: 'Dreams within dreams' },
  { id: '3', title: 'Interstellar', year: 2014, description: 'Space exploration epic' },
  { id: '4', title: 'Mad Max: Fury Road', year: 2015, description: 'Post-apocalyptic chase' },
];

export default function MovieVotePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [mounted, setMounted] = useState(false);
  const [movies, setMovies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [voterName, setVoterName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const p = getPlayer();
    if (!p) {
      router.push('/join');
      return;
    }
    setRoomCode(p.roomCode);
    setVoterName(p.name);
    setPlayer(p);
    setMounted(true);
  }, [router]);

  const votedFor = (movieId: string) =>
    votes.some((v) => v.roomId === roomCode && v.movieId === movieId);

  const addMovie = () => {
    if (!newTitle.trim()) return;
    const movie: Movie = {
      id: `movie-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      year: parseInt(newYear) || undefined,
    };
    setMovies([...movies, movie]);
    setNewTitle('');
    setNewDescription('');
    setNewYear(new Date().getFullYear().toString());
  };

  const removeMovie = (id: string) => {
    setMovies(movies.filter((m) => m.id !== id));
    setVotes(votes.filter((v) => v.movieId !== id));
  };

  const vote = (movieId: string) => {
    if (!roomCode || !voterName) {
      alert('Please enter your room code and name above');
      return;
    }
    if (votedFor(movieId)) {
      setVotes(votes.filter((v) => !(v.roomId === roomCode && v.movieId === movieId)));
    } else {
      setVotes([...votes, { roomId: roomCode, movieId, voterName }]);
    }
  };

  const getVoteCount = (movieId: string) =>
    votes.filter((v) => v.movieId === movieId).length;

  const sortedMovies = [...movies].sort((a, b) =>
    getVoteCount(b.id) - getVoteCount(a.id)
  );

  const winner =
    sortedMovies[0] && getVoteCount(sortedMovies[0].id) > 0
      ? sortedMovies[0]
      : null;

  if (!mounted || !player) return null;

  return (
    <main className="min-h-screen bg-brand-cream p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block px-6 py-3 bg-brand-black text-brand-cream font-display font-black text-2xl uppercase tracking-tighter poster-border poster-shadow">
            🎬 Movie Vote
          </div>
          <p className="mt-4 font-body text-lg opacity-70">
            Pick the next film. Host adds movies. Everyone votes.
          </p>
        </div>

        {/* Player Info */}
        <div className="mb-6 p-4 poster-border poster-shadow bg-brand-purple text-brand-cream flex items-center gap-4">
          <div className="text-4xl">{player.avatar}</div>
          <div>
            <div className="font-display font-black text-xl uppercase">{player.name}</div>
            <div className="font-display font-bold text-sm uppercase tracking-widest opacity-70">
              Room: {player.roomCode}
            </div>
          </div>
        </div>

        {/* Host Controls */}
        <div className="mb-8 p-6 poster-border poster-shadow bg-brand-cream">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-xl uppercase">Host Controls</h2>
            <button
              onClick={() => setIsHost(!isHost)}
              className={`px-4 py-2 font-display font-bold uppercase text-xs tracking-widest ${
                isHost
                  ? 'bg-brand-acid text-brand-black'
                  : 'bg-brand-black text-brand-cream'
              }`}
            >
              {isHost ? 'Host Mode ON' : 'Host Mode OFF'}
            </button>
          </div>

          {isHost && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMovie();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Movie title"
                required
                className="px-4 py-3 border-3 border-brand-black font-display font-bold uppercase"
              />
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="Year"
                min="1900"
                max="2030"
                className="px-4 py-3 border-3 border-brand-black font-display font-bold uppercase"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="md:col-span-2 px-4 py-3 border-3 border-brand-black font-body"
              />
              <button
                type="submit"
                className="md:col-span-2 px-6 py-4 bg-brand-acid text-brand-black font-display font-black uppercase tracking-widest poster-border poster-shadow hover:-translate-y-1 hover:-translate-x-1 transition-all"
              >
                + Add Movie
              </button>
            </form>
          )}
        </div>

        {/* Movie List */}
        <div className="space-y-4 mb-8">
          {sortedMovies.map((movie, index) => {
            const count = getVoteCount(movie.id);
            const hasVoted = votedFor(movie.id);
            const isWinner = winner?.id === movie.id && count > 0;

            return (
              <div
                key={movie.id}
                className={`p-6 poster-border poster-shadow transition-all ${
                  isWinner
                    ? 'bg-brand-acid scale-105'
                    : hasVoted
                    ? 'bg-brand-purple text-brand-cream'
                    : 'bg-brand-cream'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🎬</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display font-black text-2xl uppercase">
                          {movie.title}
                        </h3>
                        {movie.year && (
                          <p className={`font-display font-bold text-sm uppercase ${isWinner ? 'text-brand-black' : 'opacity-60'}`}>
                            {movie.year}
                          </p>
                        )}
                        {movie.description && (
                          <p className={`font-body mt-2 ${isWinner ? 'text-brand-black' : 'opacity-80'}`}>
                            {movie.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-4xl">{count}</div>
                        <div className={`font-display font-bold text-xs uppercase ${isWinner ? 'text-brand-black' : 'opacity-60'}`}>
                          votes
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4">
                      {!isHost && (
                        <button
                          onClick={() => vote(movie.id)}
                          className={`px-6 py-3 font-display font-black uppercase tracking-widest ${
                            hasVoted
                              ? 'bg-brand-black text-brand-cream'
                              : 'bg-brand-acid text-brand-black'
                          }`}
                        >
                          {hasVoted ? '✓ Voted' : 'Vote'}
                        </button>
                      )}
                      {isHost && (
                        <button
                          onClick={() => removeMovie(movie.id)}
                          className="px-6 py-3 bg-brand-coral text-brand-black font-display font-black uppercase tracking-widest"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="p-6 bg-brand-acid poster-border poster-shadow text-center">
            <div className="text-5xl mb-2">🏆</div>
            <div className="font-display font-black text-3xl uppercase">
              {winner.title}
            </div>
            <div className="font-display font-bold text-lg uppercase opacity-70 mt-2">
              Winning with {getVoteCount(winner.id)} votes!
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/games')}
            className="px-8 py-4 bg-brand-black text-brand-cream font-display font-black uppercase tracking-widest hover:bg-brand-purple transition-colors"
          >
            ← Back to Games
          </button>
        </div>
      </div>
    </main>
  );
}
