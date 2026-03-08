// ==========================================
//  SCRAMBLOX — STATS MODULE (localStorage)
// ==========================================
// Shared stats tracker used by game.js, leaderboard, achievements.
// No backend — everything lives in localStorage.

var ScrambloxStats = (function () {
    'use strict';

    var STORAGE_KEY = 'scramblox_stats';

    // Default stats structure
    function defaultStats() {
        return {
            totalGames: 0,
            totalScore: 0,
            totalWords: 0,
            bestScore: { easy: 0, medium: 0, hard: 0 },
            bestStreak: 0,
            fastestSolve: Infinity,    // seconds
            longestWord: '',
            gamesHistory: [],          // last 50 sessions
            wordsSolved: [],           // last 200 words {word, time, diff, date}
            achievements: {},          // { id: { unlocked: true, date: '...' } }
            createdAt: new Date().toISOString()
        };
    }

    // Load stats
    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultStats();
            var s = JSON.parse(raw);
            // Merge with defaults (in case we add new fields later)
            var d = defaultStats();
            for (var key in d) {
                if (!(key in s)) s[key] = d[key];
            }
            return s;
        } catch (e) {
            return defaultStats();
        }
    }

    // Save stats
    function save(stats) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        } catch (e) {
            // Storage full or unavailable — fail silently
        }
    }

    // Record a completed game session
    function recordGame(difficulty, score, wordsFound, bestStreak) {
        var stats = load();

        stats.totalGames++;
        stats.totalScore += score;
        stats.totalWords += wordsFound;

        if (score > stats.bestScore[difficulty]) {
            stats.bestScore[difficulty] = score;
        }
        if (bestStreak > stats.bestStreak) {
            stats.bestStreak = bestStreak;
        }

        // Keep last 50 game sessions
        stats.gamesHistory.unshift({
            difficulty: difficulty,
            score: score,
            words: wordsFound,
            streak: bestStreak,
            date: new Date().toISOString()
        });
        if (stats.gamesHistory.length > 50) stats.gamesHistory.length = 50;

        save(stats);
        return stats;
    }

    // Record a single word solve
    function recordWord(word, solveTime, difficulty) {
        var stats = load();

        if (solveTime < stats.fastestSolve) {
            stats.fastestSolve = solveTime;
        }
        if (word.length > stats.longestWord.length) {
            stats.longestWord = word;
        }

        stats.wordsSolved.unshift({
            word: word,
            time: parseFloat(solveTime.toFixed(2)),
            diff: difficulty,
            date: new Date().toISOString()
        });
        if (stats.wordsSolved.length > 200) stats.wordsSolved.length = 200;

        save(stats);
        return stats;
    }

    // Unlock an achievement
    function unlockAchievement(id) {
        var stats = load();
        if (!stats.achievements[id]) {
            stats.achievements[id] = {
                unlocked: true,
                date: new Date().toISOString()
            };
            save(stats);
            return true; // newly unlocked
        }
        return false; // already had it
    }

    // Check if achievement is unlocked
    function hasAchievement(id) {
        var stats = load();
        return !!(stats.achievements[id] && stats.achievements[id].unlocked);
    }

    // Get tier based on total score
    function getTier(totalScore) {
        if (totalScore >= 10000) return { name: 'Diamond', icon: '💎' };
        if (totalScore >= 5000) return { name: 'Gold', icon: '🥇' };
        if (totalScore >= 2000) return { name: 'Silver', icon: '🥈' };
        return { name: 'Bronze', icon: '🥉' };
    }

    // Get win rate (% of games with score > 0)
    function getWinRate() {
        var stats = load();
        if (stats.totalGames === 0) return 0;
        var wins = stats.gamesHistory.filter(function (g) { return g.words > 0; }).length;
        return Math.round((wins / Math.min(stats.totalGames, stats.gamesHistory.length)) * 100);
    }

    // Format a number with commas
    function formatNumber(n) {
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Relative time string
    function timeAgo(dateStr) {
        var diff = Date.now() - new Date(dateStr).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        var hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        var days = Math.floor(hrs / 24);
        if (days < 7) return days + 'd ago';
        return Math.floor(days / 7) + 'w ago';
    }

    return {
        load: load,
        save: save,
        recordGame: recordGame,
        recordWord: recordWord,
        unlockAchievement: unlockAchievement,
        hasAchievement: hasAchievement,
        getTier: getTier,
        getWinRate: getWinRate,
        formatNumber: formatNumber,
        timeAgo: timeAgo
    };

})();
