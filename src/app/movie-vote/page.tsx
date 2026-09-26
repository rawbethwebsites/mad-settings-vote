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

// Sample movies - host will add more via a separate admin flow
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

  useEffect(() => {
    const p = getPlayer();
    if (!p) {
      router.push('/join');
      return;
    }
    setRoomCode(p.roomCode);
    setPlayer(p);
    setMounted(true);
  }, [router]);

  const votedFor = (movieId: string) =>
    votes.some((v) => v.roomId === roomCode && v.movieId === movieId);

  const vote = (movieId: string) => {
    if (votedFor(movieId)) {
      // Remove vote
      setVotes(votes.filter((v) => !(v.roomId === roomCode && v.movieId === movieId)));
    } else {
      setVotes([...votes, { roomId: roomCode, movieId, voterName: player?.name || 'Anonymous' }]);
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
            Pick the next film. Vote once per movie.
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

        {/* Movie List */}
        <div className="space-y-4 mb-8">
          {sortedMovies.map((movie, index) => {
            const count = getVoteCount(movie.id);
            const hasVoted = votedFor(movie.id);
            const isWinner = winner?.id === movie.id && count > 0;

            return (
              <div
                key={movie.id}
                className={`p-6 poster-border poster-shadow transition-all cursor-pointer hover:-translate-y-1 hover:-translate-x-1 ${
                  isWinner
                    ? 'bg-brand-acid scale-[1.02]'
                    : hasVoted
                    ? 'bg-brand-purple text-brand-cream'
                    : 'bg-brand-cream'
                }`}
                onClick={() => vote(movie.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{isWinner ? '🏆' : '🎬'}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-display font-black text-2xl uppercase">
                            {movie.title}
                          </h3>
                          {isWinner && (
                            <span className="px-3 py-1 bg-brand-black text-brand-acid font-display font-black text-xs uppercase">
                              Leading
                            </span>
                          )}
                        </div>
                        {movie.year && (
                          <p className={`font-display font-bold text-sm uppercase mt-1 ${isWinner ? 'text-brand-black' : 'opacity-60'}`}>
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
                          vote{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        className={`px-6 py-3 font-display font-black uppercase tracking-widest ${
                          hasVoted
                            ? 'bg-brand-black text-brand-cream'
                            : 'bg-brand-acid text-brand-black'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          vote(movie.id);
                        }}
                      >
                        {hasVoted ? '✓ Voted' : 'Vote Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="p-6 bg-brand-acid poster-border poster-shadow text-center mb-8">
            <div className="text-5xl mb-2">🏆</div>
            <div className="font-display font-black text-3xl uppercase">
              {winner.title}
            </div>
            <div className="font-display font-bold text-lg uppercase opacity-70 mt-2">
              Currently winning with {getVoteCount(winner.id)} vote{getVoteCount(winner.id) !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="text-center">
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
