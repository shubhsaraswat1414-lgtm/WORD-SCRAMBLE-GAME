// ==========================================
//  SCRAMBLOX — LEADERBOARD (localStorage)
// ==========================================
// Populates leaderboard from real gameplay data.
// NPC players are seeded once and persist.

(function () {
    'use strict';

    if (typeof ScrambloxStats === 'undefined') return;

    var NPC_KEY = 'scramblox_npc_players';

    // ---- NPC Name Pool ----
    var NPC_NAMES = [
        'WordMaster99', 'ScrabbleKing', 'VocabNinja', 'LetterStorm',
        'SyntaxSolver', 'AnagramAce', 'ShuffleQueen', 'PuzzlePro',
        'LexiconLord', 'WordWizard42', 'AlphabetBoss', 'GrammarGuru',
        'SpellCaster', 'LetterLegend', 'WordSmith77', 'ScrambleBot',
        'BrainFlash', 'QuizWhiz', 'TypeTitan', 'LanguageLion'
    ];

    // ---- Seed NPC players once ----
    function seedNPCs() {
        var existing = localStorage.getItem(NPC_KEY);
        if (existing) return JSON.parse(existing);

        var npcs = [];
        // Generate 15 NPC players with varying scores
        var used = {};
        for (var i = 0; i < 15; i++) {
            var name;
            do {
                name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
            } while (used[name]);
            used[name] = true;

            // Score range: top players 8000-13000, lower 1000-5000
            var baseScore = i < 3
                ? Math.floor(Math.random() * 5000) + 8000
                : Math.floor(Math.random() * 5000) + 1000;

            npcs.push({
                name: name,
                score: baseScore,
                winRate: Math.floor(Math.random() * 30) + 60, // 60-90%
                isNPC: true
            });
        }

        localStorage.setItem(NPC_KEY, JSON.stringify(npcs));
        return npcs;
    }

    // ---- Slightly change NPC scores each visit so it feels alive ----
    function evolveNPCs(npcs) {
        npcs.forEach(function (npc) {
            var drift = Math.floor(Math.random() * 300) - 100; // -100 to +200
            npc.score = Math.max(500, npc.score + drift);
            npc.winRate = Math.min(99, Math.max(50, npc.winRate + Math.floor(Math.random() * 5) - 2));
        });
        localStorage.setItem(NPC_KEY, JSON.stringify(npcs));
        return npcs;
    }

    // ---- Get tier for a score ----
    function getTier(score) {
        if (score >= 10000) return '💎 Diamond';
        if (score >= 5000)  return '🥇 Gold';
        if (score >= 2000)  return '🥈 Silver';
        return '🥉 Bronze';
    }

    // ---- Build merged & sorted leaderboard ----
    function buildLeaderboard() {
        var stats = ScrambloxStats.load();
        var npcs = evolveNPCs(seedNPCs());

        // Your entry
        var you = {
            name: '🎯 You',
            score: stats.totalScore,
            winRate: ScrambloxStats.getWinRate(),
            isNPC: false
        };

        var all = npcs.concat([you]);

        // Sort by score descending
        all.sort(function (a, b) { return b.score - a.score; });

        return all;
    }

    // ---- Render Podium ----
    function renderPodium(entries) {
        var podiumSection = document.querySelector('.podium');
        if (!podiumSection || entries.length < 3) return;

        var top3 = entries.slice(0, 3);
        // Podium order: 2nd, 1st, 3rd (left, center, right)
        var order = [top3[1], top3[0], top3[2]];
        var classes = ['podium-2nd', 'podium-1st', 'podium-3rd'];
        var bars = ['bar-2nd', 'bar-1st', 'bar-3rd'];
        var medals = ['🥈', '🥇', '🥉'];

        var html = '';
        for (var i = 0; i < 3; i++) {
            var entry = order[i];
            var initial = entry.isNPC ? entry.name.charAt(0) : 'Y';
            var avatarClass = i === 1 ? 'podium-avatar avatar-gold' : 'podium-avatar';
            var crown = i === 1 ? '<div class="podium-crown">👑</div>' : '';
            var nameClass = entry.isNPC ? '' : ' style="color:var(--accent);font-weight:700"';

            html += '<div class="podium-place ' + classes[i] + '">';
            html += crown;
            html += '<div class="' + avatarClass + '">' + initial + '</div>';
            html += '<span class="podium-name"' + nameClass + '>' + entry.name + '</span>';
            html += '<span class="podium-score">' + ScrambloxStats.formatNumber(entry.score) + '</span>';
            html += '<div class="podium-bar ' + bars[i] + '">';
            html += '<span class="podium-rank">' + medals[i] + '</span>';
            html += '</div></div>';
        }

        podiumSection.innerHTML = html;
    }

    // ---- Render Table ----
    function renderTable(entries) {
        var tbody = document.querySelector('#leaderboard-table tbody');
        if (!tbody) return;

        var html = '';
        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            var rank = i + 1;
            var rowClass = '';

            if (rank === 1) rowClass = 'lb-row-gold';
            else if (rank === 2) rowClass = 'lb-row-silver';
            else if (rank === 3) rowClass = 'lb-row-bronze';
            if (!e.isNPC) rowClass += ' lb-row-you';

            var name = e.isNPC ? e.name : '🎯 You';

            html += '<tr class="' + rowClass.trim() + '">';
            html += '<td>' + rank + '</td>';
            html += '<td>' + name + '</td>';
            html += '<td>' + ScrambloxStats.formatNumber(e.score) + '</td>';
            html += '<td>' + getTier(e.score) + '</td>';
            html += '<td>' + e.winRate + '%</td>';
            html += '</tr>';
        }

        tbody.innerHTML = html;
    }

    // ---- Tab switching (Global / Weekly / Friends) ----
    function setupTabs(entries) {
        var tabs = document.querySelectorAll('.lb-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');

                var type = tab.getAttribute('data-tab');
                var filtered;

                if (type === 'weekly') {
                    // Show games from last 7 days — NPC scores slightly reduced
                    filtered = entries.map(function (e) {
                        if (e.isNPC) {
                            return {
                                name: e.name,
                                score: Math.floor(e.score * (0.3 + Math.random() * 0.3)),
                                winRate: e.winRate,
                                isNPC: true
                            };
                        }
                        // Your weekly: only games in last 7 days
                        var stats = ScrambloxStats.load();
                        var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                        var weeklyScore = 0;
                        stats.gamesHistory.forEach(function (g) {
                            if (new Date(g.date).getTime() >= weekAgo) weeklyScore += g.score;
                        });
                        return {
                            name: '🎯 You',
                            score: weeklyScore,
                            winRate: ScrambloxStats.getWinRate(),
                            isNPC: false
                        };
                    });
                    filtered.sort(function (a, b) { return b.score - a.score; });
                } else if (type === 'friends') {
                    // Show top 5 NPCs + you as "friends"
                    filtered = entries.filter(function (e, idx) {
                        return !e.isNPC || idx < 5;
                    });
                } else {
                    filtered = entries;
                }

                renderPodium(filtered);
                renderTable(filtered);
            });
        });
    }

    // ---- Init ----
    var entries = buildLeaderboard();
    renderPodium(entries);
    renderTable(entries);
    setupTabs(entries);

})();
