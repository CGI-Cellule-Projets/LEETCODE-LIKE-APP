/**
 * Contest mock dataset used for UI/design verification in app pages.
 * This file intentionally exposes globals so plain script tags can reuse it.
 */
(function attachContestMocks(global) {
  const list = [
    {
      contest_id: 9001,
      title: 'Spring Sprint 2026',
      description: '6 problemes orientes tableaux et glouton avec classement en direct.',
      start_time: '2026-04-06T18:00:00Z',
      end_time: '2026-04-06T20:00:00Z',
      listing_type: 'upcoming'
    },
    {
      contest_id: 9002,
      title: 'Night Owl Challenge',
      description: 'Session rapide sur graphes et BFS en 90 minutes.',
      start_time: '2026-04-08T21:00:00Z',
      end_time: '2026-04-08T22:30:00Z',
      listing_type: 'upcoming'
    },
    {
      contest_id: 9003,
      title: 'Binary Cup Warmup',
      description: 'Competition active pour consolider recherches binaires et tris.',
      start_time: '2026-04-04T13:00:00Z',
      end_time: '2026-04-04T16:00:00Z',
      listing_type: 'active'
    },
    {
      contest_id: 9004,
      title: 'DP Arena Live',
      description: 'Round en cours dedie a la programmation dynamique par etapes.',
      start_time: '2026-04-04T15:00:00Z',
      end_time: '2026-04-04T18:00:00Z',
      listing_type: 'active'
    },
    {
      contest_id: 9005,
      title: 'Weekly Contest 117',
      description: 'Archive hebdomadaire avec analyse editoriale disponible.',
      start_time: '2026-03-30T19:00:00Z',
      end_time: '2026-03-30T21:00:00Z',
      listing_type: 'past'
    },
    {
      contest_id: 9006,
      title: 'Bug Bash Tournament',
      description: 'Edition terminee axee debugging et edge cases.',
      start_time: '2026-03-25T17:00:00Z',
      end_time: '2026-03-25T19:00:00Z',
      listing_type: 'past'
    }
  ];

  const details = [
    {
      contest_id: 9001,
      title: 'Spring Sprint 2026',
      description: 'Edition temporaire: 6 problemes progressifs orientes array, hash map et greedy.',
      start_time: '2026-04-06T18:00:00Z',
      end_time: '2026-04-06T20:00:00Z',
      problems: [
        { problem_id: 101, name: 'Pair Distance', points: 100, difficulty_level: 'easy' },
        { problem_id: 126, name: 'Window Overlap', points: 200, difficulty_level: 'med' },
        { problem_id: 167, name: 'Route Compression', points: 350, difficulty_level: 'hard' }
      ]
    },
    {
      contest_id: 9002,
      title: 'Night Owl Challenge',
      description: 'Edition nocturne orientee graphes, shortest path et parcours optimise.',
      start_time: '2026-04-08T21:00:00Z',
      end_time: '2026-04-08T22:30:00Z',
      problems: [
        { problem_id: 112, name: 'Signal Relay', points: 110, difficulty_level: 'easy' },
        { problem_id: 154, name: 'Metro Transfers', points: 230, difficulty_level: 'med' },
        { problem_id: 221, name: 'Weighted Shadows', points: 420, difficulty_level: 'hard' }
      ]
    },
    {
      contest_id: 9003,
      title: 'Binary Cup Warmup',
      description: 'Round de chauffe avec tri, recherche binaire et simulation.',
      start_time: '2026-04-04T13:00:00Z',
      end_time: '2026-04-04T16:00:00Z',
      problems: [
        { problem_id: 90, name: 'Median Bound', points: 120, difficulty_level: 'easy' },
        { problem_id: 142, name: 'Fast Packing', points: 240, difficulty_level: 'med' },
        { problem_id: 205, name: 'Nested Intervals', points: 400, difficulty_level: 'hard' }
      ]
    },
    {
      contest_id: 9004,
      title: 'DP Arena Live',
      description: 'Tour actif centre sur les transitions detat et optimisation memoire.',
      start_time: '2026-04-04T15:00:00Z',
      end_time: '2026-04-04T18:00:00Z',
      problems: [
        { problem_id: 133, name: 'Coin Ladder', points: 130, difficulty_level: 'easy' },
        { problem_id: 178, name: 'Segment Planner', points: 260, difficulty_level: 'med' },
        { problem_id: 244, name: 'Dual Sequence Merge', points: 450, difficulty_level: 'hard' }
      ]
    },
    {
      contest_id: 9005,
      title: 'Weekly Contest 117',
      description: 'Archive complete avec problemes classiques et set final expert.',
      start_time: '2026-03-30T19:00:00Z',
      end_time: '2026-03-30T21:00:00Z',
      problems: [
        { problem_id: 88, name: 'Array Pivot Plus', points: 100, difficulty_level: 'easy' },
        { problem_id: 161, name: 'Jump Corridor', points: 210, difficulty_level: 'med' },
        { problem_id: 237, name: 'Constraint Cascade', points: 390, difficulty_level: 'hard' }
      ]
    },
    {
      contest_id: 9006,
      title: 'Bug Bash Tournament',
      description: 'Archive debugging avec jeux de tests pieges et corner cases.',
      start_time: '2026-03-25T17:00:00Z',
      end_time: '2026-03-25T19:00:00Z',
      problems: [
        { problem_id: 74, name: 'Boundary Runner', points: 90, difficulty_level: 'easy' },
        { problem_id: 149, name: 'Null Matrix', points: 220, difficulty_level: 'med' },
        { problem_id: 229, name: 'Phantom Overflow', points: 410, difficulty_level: 'hard' }
      ]
    }
  ];

  global.CONTEST_MOCK_DATA = {
    list,
    details,
    detailsById: details.reduce((acc, item) => {
      acc[item.contest_id] = item;
      return acc;
    }, {}),
  };
})(window);
