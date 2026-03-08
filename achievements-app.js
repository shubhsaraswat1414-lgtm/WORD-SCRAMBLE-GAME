// ==========================================
//  SCRAMBLOX — ACHIEVEMENTS (localStorage)
// ==========================================
// Renders achievements from real gameplay data.

(function () {
    'use strict';

    if (typeof ScrambloxStats === 'undefined') return;

    // ---- Achievement Definitions ----
    var ACHIEVEMENTS = [
        {
            id: 'first_steps',
            badge: '👣',
            name: 'First Steps',
            desc: 'Solve your first word',
            check: function (s) { return s.totalWords >= 1; },
            progress: function (s) { return Math.min(100, (s.totalWords / 1) * 100); }
        },
        {
            id: 'speed_demon',
            badge: '⚡',
            name: 'Speed Demon',
            desc: 'Solve a word in under 3 seconds',
            check: function (s) { return s.fastestSolve < 3; },
            progress: function (s) {
                if (s.fastestSolve === Infinity) return 0;
                return s.fastestSolve < 3 ? 100 : Math.min(95, Math.round((3 / s.fastestSolve) * 100));
            }
        },
        {
            id: 'on_fire',
            badge: '🔥',
            name: 'On Fire',
            desc: 'Get a 5-word win streak',
            check: function (s) { return s.bestStreak >= 5; },
            progress: function (s) { return Math.min(100, (s.bestStreak / 5) * 100); }
        },
        {
            id: 'unstoppable',
            badge: '💥',
            name: 'Unstoppable',
            desc: 'Get a 10-word win streak',
            check: function (s) { return s.bestStreak >= 10; },
            progress: function (s) { return Math.min(100, (s.bestStreak / 10) * 100); }
        },
        {
            id: 'bookworm',
            badge: '📚',
            name: 'Bookworm',
            desc: 'Solve 50 words total',
            check: function (s) { return s.totalWords >= 50; },
            progress: function (s) { return Math.min(100, (s.totalWords / 50) * 100); }
        },
        {
            id: 'vocab_legend',
            badge: '🌟',
            name: 'Vocabulary Legend',
            desc: 'Solve 500 words total',
            check: function (s) { return s.totalWords >= 500; },
            progress: function (s) { return Math.min(100, (s.totalWords / 500) * 100); }
        },
        {
            id: 'sharp_shooter',
            badge: '🎯',
            name: 'Sharp Shooter',
            desc: '90%+ accuracy in a session (5+ words)',
            check: function (s) { return !!s.achievements.sharp_shooter; },
            progress: function (s) { return s.achievements.sharp_shooter ? 100 : Math.min(95, (s.bestStreak / 5) * 95); }
        },
        {
            id: 'word_warrior',
            badge: '⚔️',
            name: 'Word Warrior',
            desc: 'Play 10 games',
            check: function (s) { return s.totalGames >= 10; },
            progress: function (s) { return Math.min(100, (s.totalGames / 10) * 100); }
        },
        {
            id: 'hard_hero',
            badge: '🦸',
            name: 'Hard Mode Hero',
            desc: 'Solve a word on Hard difficulty',
            check: function (s) { return !!s.achievements.hard_hero; },
            progress: function (s) { return s.achievements.hard_hero ? 100 : 0; }
        },
        {
            id: 'polymorphist',
            badge: '🎭',
            name: 'Polymorphist',
            desc: 'Solve 10 Hard difficulty words',
            check: function (s) {
                var c = s.wordsSolved.filter(function (w) { return w.diff === 'hard'; }).length;
                return c >= 10;
            },
            progress: function (s) {
                var c = s.wordsSolved.filter(function (w) { return w.diff === 'hard'; }).length;
                return Math.min(100, (c / 10) * 100);
            }
        },
        {
            id: 'score_titan',
            badge: '🏅',
            name: 'Score Titan',
            desc: 'Score 1,000+ in a single game',
            check: function (s) {
                return s.gamesHistory.some(function (g) { return g.score >= 1000; });
            },
            progress: function (s) {
                var best = 0;
                s.gamesHistory.forEach(function (g) { if (g.score > best) best = g.score; });
                return Math.min(100, (best / 1000) * 100);
            }
        },
        {
            id: 'marathoner',
            badge: '🏃',
            name: 'Marathoner',
            desc: 'Solve 20 words in a single game',
            check: function (s) {
                return s.gamesHistory.some(function (g) { return g.words >= 20; });
            },
            progress: function (s) {
                var best = 0;
                s.gamesHistory.forEach(function (g) { if (g.words > best) best = g.words; });
                return Math.min(100, (best / 20) * 100);
            }
        },
        {
            id: 'summit_seeker',
            badge: '🏔️',
            name: 'Summit Seeker',
            desc: 'Reach 5,000 total score',
            check: function (s) { return s.totalScore >= 5000; },
            progress: function (s) { return Math.min(100, (s.totalScore / 5000) * 100); }
        },
        {
            id: 'diamond_mind',
            badge: '💎',
            name: 'Diamond Mind',
            desc: 'Reach 10,000 total score (Diamond tier)',
            check: function (s) { return s.totalScore >= 10000; },
            progress: function (s) { return Math.min(100, (s.totalScore / 10000) * 100); }
        }
    ];

    // ---- Render ----
    var stats = ScrambloxStats.load();

    // Sync — mark achievements as unlocked in stats if conditions are met
    ACHIEVEMENTS.forEach(function (a) {
        if (a.check(stats) && !stats.achievements[a.id]) {
            ScrambloxStats.unlockAchievement(a.id);
        }
    });
    // Reload after sync
    stats = ScrambloxStats.load();

    var unlocked = [];
    var locked = [];

    ACHIEVEMENTS.forEach(function (a) {
        var isUnlocked = !!(stats.achievements[a.id] && stats.achievements[a.id].unlocked);
        var prog = Math.round(a.progress(stats));
        var obj = {
            id: a.id,
            badge: a.badge,
            name: a.name,
            desc: a.desc,
            progress: prog,
            unlocked: isUnlocked,
            date: isUnlocked ? stats.achievements[a.id].date : null
        };
        if (isUnlocked) unlocked.push(obj);
        else locked.push(obj);
    });

    // ---- Progress Overview ----
    var totalAch = ACHIEVEMENTS.length;
    var unlockedCount = unlocked.length;
    var lockedCount = locked.length;
    var nearComplete = locked.filter(function (a) { return a.progress >= 60; }).length;
    var pct = totalAch > 0 ? Math.round((unlockedCount / totalAch) * 100) : 0;

    // Update progress ring
    var ringFill = document.querySelector('.progress-fill');
    if (ringFill) {
        var circumference = 2 * Math.PI * 52; // r=52
        var offset = circumference - (pct / 100) * circumference;
        ringFill.setAttribute('stroke-dasharray', circumference.toFixed(0));
        ringFill.setAttribute('stroke-dashoffset', offset.toFixed(0));
    }

    var pctEl = document.querySelector('.progress-percent');
    if (pctEl) pctEl.textContent = pct + '%';

    // Update stat values
    var statValues = document.querySelectorAll('.progress-stat-value');
    var statLabels = document.querySelectorAll('.progress-stat-label');
    if (statValues.length >= 3) {
        statValues[0].textContent = unlockedCount;
        statLabels[0].textContent = 'Unlocked';
        statValues[1].textContent = lockedCount;
        statLabels[1].textContent = 'Locked';
        statValues[2].textContent = nearComplete;
        statLabels[2].textContent = 'Near Complete';
    }

    // ---- Render Unlocked ----
    function renderCard(a, container) {
        var div = document.createElement('div');
        div.className = 'achievement-card ' + (a.unlocked ? 'unlocked' : 'locked');

        var badgeDiv = document.createElement('div');
        badgeDiv.className = 'achievement-badge' + (a.unlocked ? '' : ' locked-badge');
        badgeDiv.textContent = a.badge;

        var infoDiv = document.createElement('div');
        infoDiv.className = 'achievement-info';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'achievement-name';
        nameSpan.textContent = a.name;
        var descSpan = document.createElement('span');
        descSpan.className = 'achievement-desc';
        descSpan.textContent = a.desc;
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(descSpan);

        div.appendChild(badgeDiv);
        div.appendChild(infoDiv);

        if (a.unlocked && a.date) {
            var dateSpan = document.createElement('span');
            dateSpan.className = 'achievement-date';
            dateSpan.textContent = ScrambloxStats.timeAgo(a.date);
            div.appendChild(dateSpan);
        }

        if (!a.unlocked) {
            var progWrap = document.createElement('div');
            progWrap.className = 'achievement-progress';
            var bar = document.createElement('div');
            bar.className = 'achievement-bar';
            var fill = document.createElement('div');
            fill.className = 'achievement-bar-fill';
            fill.style.width = a.progress + '%';
            bar.appendChild(fill);
            var progText = document.createElement('span');
            progText.className = 'achievement-progress-text';
            progText.textContent = a.progress + '%';
            progWrap.appendChild(bar);
            progWrap.appendChild(progText);
            div.appendChild(progWrap);
        }

        container.appendChild(div);
    }

    // Find the grids
    var grids = document.querySelectorAll('.achievements-grid');
    var unlockedGrid = grids[0];
    var lockedGrid = grids[1];

    if (unlockedGrid) {
        unlockedGrid.innerHTML = '';
        if (unlocked.length === 0) {
            unlockedGrid.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:2rem;grid-column:1/-1;">No badges unlocked yet — go play some games! ⚔️</p>';
        } else {
            unlocked.forEach(function (a) { renderCard(a, unlockedGrid); });
        }
    }

    if (lockedGrid) {
        lockedGrid.innerHTML = '';
        if (locked.length === 0) {
            lockedGrid.innerHTML = '<p style="color:var(--accent);text-align:center;padding:2rem;grid-column:1/-1;">🎉 All achievements unlocked — you\'re a legend!</p>';
        } else {
            locked.forEach(function (a) { renderCard(a, lockedGrid); });
        }
    }

})();
