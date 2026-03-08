// ==========================================
//  SCRAMBLOX — SOLO CHALLENGE GAME LOGIC
// ==========================================
// Requires: words.js (loaded before this file)
// Globals used from words.js: WORDS, TIMERS, POINTS

// ==========================================
//  ANIMATION EFFECTS (Confetti, Floating Score, Shake)
// ==========================================
var GameFX = {

    // --- Confetti Burst (#6) ---
    confetti: function (originX, originY, count) {
        count = count || 30;
        var container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        var colors = ['#4ade60', '#f0c040', '#60a0e0', '#ff6b9d', '#a060c0', '#80d8a0', '#ff8a50'];

        for (var i = 0; i < count; i++) {
            var p = document.createElement('div');
            p.className = 'confetti-particle';
            p.style.left = originX + 'px';
            p.style.top = originY + 'px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.width = (5 + Math.random() * 8) + 'px';
            p.style.height = (5 + Math.random() * 8) + 'px';
            p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

            var angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.8;
            var velocity = 80 + Math.random() * 140;
            var driftX = Math.cos(angle) * velocity;
            var driftY = Math.sin(angle) * velocity - 60;
            var spin = (Math.random() - 0.5) * 1440;
            var duration = 0.8 + Math.random() * 0.6;

            p.style.setProperty('--drift-x', driftX + 'px');
            p.style.setProperty('--drift-y', driftY + 'px');
            p.style.setProperty('--spin', spin + 'deg');
            p.style.setProperty('--fall-duration', duration + 's');
            p.style.animationDelay = (Math.random() * 0.1) + 's';

            container.appendChild(p);
        }

        setTimeout(function () { container.remove(); }, 2000);
    },

    // --- Floating Score Text (#6) ---
    floatingScore: function (text, anchorEl) {
        var rect = anchorEl.getBoundingClientRect();
        var gameBoard = document.querySelector('.game-board');
        if (!gameBoard) return;

        var boardRect = gameBoard.getBoundingClientRect();
        var el = document.createElement('div');
        el.className = 'floating-score';
        el.textContent = text;
        el.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
        el.style.top = (rect.top - boardRect.top) + 'px';
        gameBoard.appendChild(el);

        setTimeout(function () { el.remove(); }, 1300);
    },

    // --- Board Shake + Vignette (#7) ---
    shakeBoard: function () {
        var board = document.querySelector('.game-board');
        var arena = document.querySelector('.game-arena');
        if (board) {
            board.classList.remove('board-shake');
            void board.offsetWidth;
            board.classList.add('board-shake');
            setTimeout(function () { board.classList.remove('board-shake'); }, 500);
        }
        if (arena) {
            arena.classList.remove('vignette-flash');
            void arena.offsetWidth;
            arena.classList.add('vignette-flash');
            setTimeout(function () { arena.classList.remove('vignette-flash'); }, 600);
        }
    },

    // --- Game Over Count-Up (#11) ---
    countUp: function (el, targetVal, duration, callback) {
        duration = duration || 1200;
        var start = performance.now();
        var startVal = 0;
        el.classList.add('counting');

        function tick(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            // Ease-out quad
            var ease = 1 - (1 - progress) * (1 - progress);
            var current = Math.round(startVal + (targetVal - startVal) * ease);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = targetVal;
                el.classList.remove('counting');
                if (callback) callback();
            }
        }
        requestAnimationFrame(tick);
    }
};

(function () {
    'use strict';

    // ==========================================
    //  DOM ELEMENTS
    // ==========================================
    var elScore       = document.getElementById('score');
    var elTimer       = document.getElementById('timer');
    var elTimerBadge  = document.getElementById('timer-badge');
    var elScrambled   = document.getElementById('scrambled-word');
    var elInput       = document.getElementById('answer-input');
    var elSubmit      = document.getElementById('submit-btn');
    var elSolution    = document.getElementById('solution-btn');
    var elSkip        = document.getElementById('skip-btn');
    var elStreak      = document.getElementById('streak');
    var elBestStreak  = document.getElementById('best-streak');
    var elWordsFound  = document.getElementById('words-found');
    var elRestart     = document.getElementById('restart-btn');
    var elEndGame     = document.getElementById('end-game-btn');
    var elLevel       = document.getElementById('game-level');
    var elFoundList   = document.getElementById('found-words-list');

    // Game Over elements
    var elOverlay     = document.getElementById('game-over-overlay');
    var elGoScore     = document.getElementById('go-score');
    var elGoWords     = document.getElementById('go-words');
    var elGoStreak    = document.getElementById('go-streak');
    var elGoHighscore = document.getElementById('go-highscore');
    var elGoLastWord  = document.getElementById('go-last-word');
    var elPlayAgain   = document.getElementById('play-again-btn');

    // Solution reveal elements
    var elSolutionReveal = document.getElementById('solution-reveal');
    var elSolutionWord   = document.getElementById('solution-word');
    var solutionTimer    = null;

    // Difficulty tabs
    var diffTabs      = document.querySelectorAll('.diff-tab');

    // ==========================================
    //  GAME STATE
    // ==========================================
    var currentDifficulty = 'easy';
    var currentWord       = '';
    var score             = 0;
    var streak            = 0;
    var bestStreak        = 0;
    var wordsFoundCount   = 0;
    var timeLeft          = 30;
    var timerInterval     = null;
    var gameActive        = false;
    var usedWords         = [];    // Track used words in current session
    var wordStartTime     = 0;     // When the current word was shown

    // ==========================================
    //  AUTO-DIFFICULTY ESCALATION (pool-based)
    // ==========================================
    function updateDifficultyUI(newDiff) {
        diffTabs.forEach(function (t) {
            t.classList.remove('active');
            if (t.getAttribute('data-diff') === newDiff) {
                t.classList.add('active');
            }
        });
    }

    function checkAndEscalateDifficulty() {
        // Check if current pool is exhausted
        var pool = WORDS[currentDifficulty];
        var available = pool.filter(function (w) {
            return usedWords.indexOf(w) === -1;
        });

        if (available.length === 0) {
            if (currentDifficulty === 'easy') {
                // Auto-shift to medium
                currentDifficulty = 'medium';
                usedWords = [];
                updateDifficultyUI('medium');

                // Flash the difficulty badge to notify the player
                var activeTab = document.querySelector('.diff-tab.active');
                if (activeTab) {
                    activeTab.classList.add('diff-escalate-flash');
                    setTimeout(function () {
                        activeTab.classList.remove('diff-escalate-flash');
                    }, 1500);
                }
            } else if (currentDifficulty === 'medium') {
                // Auto-shift to hard
                currentDifficulty = 'hard';
                usedWords = [];
                updateDifficultyUI('hard');

                var activeTab2 = document.querySelector('.diff-tab.active');
                if (activeTab2) {
                    activeTab2.classList.add('diff-escalate-flash');
                    setTimeout(function () {
                        activeTab2.classList.remove('diff-escalate-flash');
                    }, 1500);
                }
            } else {
                // All hard words done — reset pool and keep going
                usedWords = [];
            }
        }
    }

    // ==========================================
    //  FISHER-YATES SHUFFLE (for characters)
    // ==========================================
    function fisherYatesShuffle(arr) {
        var shuffled = arr.slice();
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = shuffled[i];
            shuffled[i] = shuffled[j];
            shuffled[j] = temp;
        }
        return shuffled;
    }

    // ==========================================
    //  SHUFFLE WORD — ensures result ≠ original
    // ==========================================
    function shuffleWord(word) {
        var chars = word.split('');
        var attempts = 0;
        var shuffled;
        do {
            shuffled = fisherYatesShuffle(chars);
            attempts++;
        } while (shuffled.join('') === word && attempts < 20);
        return shuffled.join('');
    }

    // ==========================================
    //  PICK RANDOM WORD (avoid repeats)
    // ==========================================
    function pickWord() {
        var pool = WORDS[currentDifficulty];
        var available = pool.filter(function (w) {
            return usedWords.indexOf(w) === -1;
        });
        // If all used, return null — let escalation logic handle it
        if (available.length === 0) {
            return null;
        }
        var word = available[Math.floor(Math.random() * available.length)];
        usedWords.push(word);
        return word;
    }

    // ==========================================
    //  DISPLAY SCRAMBLED WORD
    // ==========================================
    function displayScrambled(word) {
        var scrambled = shuffleWord(word);
        // Letter Tile Flip Animation (#5)
        elScrambled.innerHTML = '';
        var letters = scrambled.split('');
        for (var i = 0; i < letters.length; i++) {
            var tile = document.createElement('span');
            tile.className = 'letter-tile';
            var inner = document.createElement('span');
            inner.className = 'letter-tile-inner';
            inner.textContent = letters[i];
            inner.style.animationDelay = (i * 0.06) + 's';
            tile.appendChild(inner);
            elScrambled.appendChild(tile);
        }
    }

    // ==========================================
    //  SHOW / HIDE SOLUTION
    // ==========================================
    function showSolution(word) {
        elSolutionWord.textContent = word;
        elSolutionReveal.classList.add('visible');
    }

    function hideSolution() {
        elSolutionReveal.classList.remove('visible');
        if (solutionTimer) clearTimeout(solutionTimer);
    }

    // ==========================================
    //  REVEAL SOLUTION (Solution button click)
    // ==========================================
    function revealSolution() {
        if (!gameActive) return;

        var timeTaken = (Date.now() - wordStartTime) / 1000;
        var revealedWord = currentWord;

        // Log it as a skipped/revealed word
        logFoundWord(revealedWord, timeTaken, 0, 'skip');
        updateStreak(false);

        // Show the solution briefly, then move on
        showSolution(revealedWord);
        solutionTimer = setTimeout(function () {
            hideSolution();
            loadNewWord();
        }, 1500);

        elInput.value = '';
        elInput.focus();
    }

    // ==========================================
    //  UPDATE SCORE
    // ==========================================
    function updateScore(points) {
        score += points;
        elScore.textContent = score;
        // Pop animation
        elScore.classList.remove('score-pop');
        void elScore.offsetWidth; // force reflow
        elScore.classList.add('score-pop');
    }

    // ==========================================
    //  UPDATE STREAK
    // ==========================================
    function updateStreak(correct) {
        if (correct) {
            streak++;
            if (streak > bestStreak) bestStreak = streak;
        } else {
            streak = 0;
        }
        elStreak.textContent = streak;
        elBestStreak.textContent = bestStreak;

        if (correct && streak > 1) {
            elStreak.classList.remove('streak-fire');
            void elStreak.offsetWidth;
            elStreak.classList.add('streak-fire');

            if (streak === 3 || streak === 5 || streak % 10 === 0) {
            }
        }
    }

    // ==========================================
    //  UPDATE LEVEL (every 3 words)
    // ==========================================
    function updateLevel() {
        var level = Math.floor(wordsFoundCount / 3) + 1;
        elLevel.textContent = level;
    }

    // ==========================================
    //  LOG FOUND WORD
    // ==========================================
    function logFoundWord(word, timeTaken, points, status) {
        // Clear "empty" message if it's the first word
        if (wordsFoundCount === 0 && status !== 'skip') {
            elFoundList.innerHTML = '';
        } else if (elFoundList.querySelector('.scroll-body-empty')) {
            elFoundList.innerHTML = '';
        }

        var div = document.createElement('div');
        div.className = 'found-word ' + (status === 'correct' ? 'fw-correct' : 'fw-timeout');

        var wordSpan = document.createElement('span');
        wordSpan.className = 'fw-text';
        wordSpan.textContent = word;

        var timeSpan = document.createElement('span');
        timeSpan.className = 'fw-time';
        timeSpan.textContent = timeTaken.toFixed(1) + 's';

        var coinsSpan = document.createElement('span');
        coinsSpan.className = 'fw-coins';
        if (status === 'correct') {
            coinsSpan.textContent = '+' + points + ' 🪙';
        } else {
            coinsSpan.textContent = '💡 ' + word;
        }

        div.appendChild(wordSpan);
        div.appendChild(timeSpan);
        div.appendChild(coinsSpan);

        // Prepend (newest first)
        elFoundList.insertBefore(div, elFoundList.firstChild);
    }

    // ==========================================
    //  CHECK ANSWER
    // ==========================================
    function checkAnswer() {
        if (!gameActive) return;

        var answer = elInput.value.trim().toUpperCase();
        if (answer === '') return;

        var timeTaken = (Date.now() - wordStartTime) / 1000;

        if (answer === currentWord) {
            // CORRECT ✅

            var pts = POINTS[currentDifficulty];
            // Bonus for speed: +50% if under 5 seconds
            if (timeTaken < 5) pts = Math.round(pts * 1.5);
            // Streak bonus: +20 per streak
            pts += streak * 20;

            updateScore(pts);
            updateStreak(true);
            wordsFoundCount++;
            elWordsFound.textContent = wordsFoundCount;
            updateLevel();
            logFoundWord(currentWord, timeTaken, pts, 'correct');

            // Record to stats
            if (typeof ScrambloxStats !== 'undefined') {
                ScrambloxStats.recordWord(currentWord, timeTaken, currentDifficulty);
                // Check achievements on the fly
                checkLiveAchievements(timeTaken);
            }

            // Flash correct
            elInput.classList.add('correct-flash');
            setTimeout(function () {
                elInput.classList.remove('correct-flash');
            }, 400);

            // 🎉 Confetti burst (#6)
            var inputRect = elInput.getBoundingClientRect();
            GameFX.confetti(
                inputRect.left + inputRect.width / 2,
                inputRect.top,
                streak >= 3 ? 45 : 25
            );

            // 💰 Floating score text (#6)
            var bonusText = '+' + pts;
            if (timeTaken < 5) bonusText += ' ⚡';
            if (streak >= 3) bonusText += ' 🔥';
            GameFX.floatingScore(bonusText, elInput);

            // Load next word
            loadNewWord();
        } else {
            // WRONG ❌
            updateStreak(false);

            // Flash wrong
            elInput.classList.add('wrong-flash');
            setTimeout(function () {
                elInput.classList.remove('wrong-flash');
            }, 400);

            // 💥 Board shake + red vignette (#7)
            GameFX.shakeBoard();
        }

        elInput.value = '';
        elInput.focus();
    }

    // ==========================================
    //  SKIP WORD
    // ==========================================
    function skipWord() {
        if (!gameActive) return;

        var timeTaken = (Date.now() - wordStartTime) / 1000;
        var skippedWord = currentWord;
        logFoundWord(skippedWord, timeTaken, 0, 'skip');
        updateStreak(false);

        // Show the solution briefly before loading next word
        showSolution(skippedWord);
        solutionTimer = setTimeout(function () {
            hideSolution();
            loadNewWord();
        }, 1200);

        elInput.value = '';
        elInput.focus();
    }

    // ==========================================
    //  LOAD NEW WORD
    // ==========================================
    function loadNewWord() {
        currentWord = pickWord();
        // If pool is empty, escalate difficulty and try again
        if (currentWord === null) {
            checkAndEscalateDifficulty();
            if (!gameActive) return;  // endGame() was called
            currentWord = pickWord();
            if (currentWord === null) {
                endGame();
                return;
            }
        }
        displayScrambled(currentWord);
        wordStartTime = Date.now();
        elInput.value = '';
        // Reset the timer for the new word
        startTimer();
    }

    // ==========================================
    //  START TIMER (per-word countdown)
    // ==========================================
    function startTimer() {
        // Clear any existing timer
        if (timerInterval) clearInterval(timerInterval);

        timeLeft = TIMERS[currentDifficulty];
        elTimer.textContent = timeLeft;
        elTimerBadge.classList.remove('timer-warning');

        timerInterval = setInterval(function () {
            timeLeft--;
            elTimer.textContent = timeLeft;

            // Warning when ≤ 10 seconds
            if (timeLeft <= 10) {
                elTimerBadge.classList.add('timer-warning');

                if (timeLeft <= 5 && timeLeft > 0) {
                } else if (timeLeft > 5) {
                }
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);

                // Time ran out for this word — reveal answer & move to next
                var expiredWord = currentWord;
                logFoundWord(expiredWord, TIMERS[currentDifficulty], 0, 'skip');
                updateStreak(false);
                showSolution(expiredWord);
                solutionTimer = setTimeout(function () {
                    hideSolution();
                    loadNewWord();
                }, 1500);
            }
        }, 1000);
    }

    // ==========================================
    //  START GAME
    // ==========================================
    function startGame() {
        // 🎮 Game start fanfare

        // Reset state
        score = 0;
        streak = 0;
        bestStreak = 0;
        wordsFoundCount = 0;
        usedWords = [];
        gameActive = true;
        // Keep currentDifficulty as set by the tab click (don't reset)

        // Reset UI
        elScore.textContent = '0';
        elStreak.textContent = '0';
        elBestStreak.textContent = '0';
        elWordsFound.textContent = '0';
        elLevel.textContent = '1';
        elFoundList.innerHTML = '<p class="scroll-body-empty">Start playing to see your solved words here!</p>';

        // Enable inputs
        elInput.disabled = false;
        elSubmit.disabled = false;
        elSolution.disabled = false;
        elSkip.disabled = false;
        elInput.value = '';

        // Hide game-over overlay
        elOverlay.classList.remove('visible');
        elTimerBadge.classList.remove('timer-warning');
        hideSolution();

        // Clear old timer
        if (timerInterval) clearInterval(timerInterval);

        // Load first word (this also starts the per-word timer)
        loadNewWord();
        elInput.focus();
    }

    // ==========================================
    //  END GAME
    // ==========================================
    function endGame() {
        gameActive = false;
        clearInterval(timerInterval);


        // Disable inputs
        elInput.disabled = true;
        elSubmit.disabled = true;
        elSolution.disabled = true;
        elSkip.disabled = true;

        // High score logic (localStorage)
        var hsKey = 'scramblox_highscore_' + currentDifficulty;
        var savedHS = parseInt(localStorage.getItem(hsKey)) || 0;
        var isNewHS = score > savedHS;
        if (isNewHS) {
            localStorage.setItem(hsKey, score);
        }

        // Show the last unanswered word
        if (currentWord) {
            elGoLastWord.innerHTML = '💡 The word was: <span class="go-last-answer">' + currentWord + '</span>';
        } else {
            elGoLastWord.textContent = '';
        }

        // Reset values before count-up
        elGoScore.textContent = '0';
        elGoWords.textContent = '0';
        elGoStreak.textContent = '0';
        elGoHighscore.textContent = '';

        // Remove previous highscore glow
        document.querySelector('.game-over-card').classList.remove('highscore-glow');

        // Show overlay
        elOverlay.classList.add('visible');

        // 🎬 Staggered count-up animation (#11)
        var finalScore = score;
        var finalWords = wordsFoundCount;
        var finalStreak = bestStreak;

        setTimeout(function () {
            GameFX.countUp(elGoScore, finalScore, 1200);
        }, 300);

        setTimeout(function () {
            GameFX.countUp(elGoWords, finalWords, 800);
        }, 600);

        setTimeout(function () {
            GameFX.countUp(elGoStreak, finalStreak, 600, function () {
                // After all counts finish, show high score
                if (isNewHS) {
                    elGoHighscore.innerHTML = '🎉 <span class="new-badge">New High Score!</span> Previous: ' + savedHS;
                    document.querySelector('.game-over-card').classList.add('highscore-glow');
                    // Golden confetti shower for new high score
                    GameFX.confetti(window.innerWidth / 2, window.innerHeight / 3, 60);
                } else {
                    elGoHighscore.textContent = '🏆 High Score: ' + savedHS;
                }
            });
        }, 900);

        // Record session to stats
        if (typeof ScrambloxStats !== 'undefined') {
            ScrambloxStats.recordGame(currentDifficulty, score, wordsFoundCount, bestStreak);
        }
    }

    // ==========================================
    //  LIVE ACHIEVEMENT CHECKS (during gameplay)
    // ==========================================
    function checkLiveAchievements(solveTime) {
        if (typeof ScrambloxStats === 'undefined') return;
        var s = ScrambloxStats.load();

        // Speed Demon — solve in under 3s
        if (solveTime < 3) ScrambloxStats.unlockAchievement('speed_demon');

        // On Fire — 5-word streak (use current live streak)
        if (streak >= 5) ScrambloxStats.unlockAchievement('on_fire');

        // Unstoppable — 10-word streak
        if (streak >= 10) ScrambloxStats.unlockAchievement('unstoppable');

        // Bookworm — 50 total words
        if (s.totalWords + wordsFoundCount >= 50) ScrambloxStats.unlockAchievement('bookworm');

        // Vocabulary Legend — 500 total words
        if (s.totalWords + wordsFoundCount >= 500) ScrambloxStats.unlockAchievement('vocab_legend');

        // Sharp Shooter — 5+ words with no wrong in this session (wordsFound === streak)
        if (wordsFoundCount >= 5 && streak === wordsFoundCount) ScrambloxStats.unlockAchievement('sharp_shooter');

        // First Steps — solve 1 word ever
        if (s.totalWords + wordsFoundCount >= 1) ScrambloxStats.unlockAchievement('first_steps');

        // Word Warrior — 10 games played
        if (s.totalGames >= 10) ScrambloxStats.unlockAchievement('word_warrior');

        // Marathoner — 20 words in a single game
        if (wordsFoundCount >= 20) ScrambloxStats.unlockAchievement('marathoner');

        // Hard Mode Hero — solve a hard word
        if (currentDifficulty === 'hard') ScrambloxStats.unlockAchievement('hard_hero');

        // Polymorphist — solve 10+ hard words total
        var hardCount = s.wordsSolved.filter(function (w) { return w.diff === 'hard'; }).length;
        if (currentDifficulty === 'hard') hardCount++;
        if (hardCount >= 10) ScrambloxStats.unlockAchievement('polymorphist');

        // Score Titan — reach 1000+ in a single game
        if (score >= 1000) ScrambloxStats.unlockAchievement('score_titan');

        // Summit Seeker — total score 5000+
        if (s.totalScore + score >= 5000) ScrambloxStats.unlockAchievement('summit_seeker');

        // Diamond Mind — total score 10000+
        if (s.totalScore + score >= 10000) ScrambloxStats.unlockAchievement('diamond_mind');
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================

    // Submit button
    elSubmit.addEventListener('click', checkAnswer);

    // Enter key submits
    elInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
    });

    elInput.addEventListener('input', function () {
    });

    // Skip button
    elSkip.addEventListener('click', skipWord);

    // Solution button
    elSolution.addEventListener('click', revealSolution);

    // Restart / New Match button
    elRestart.addEventListener('click', startGame);

    // End Game button — save stats & go to achievements
    if (elEndGame) {
        elEndGame.addEventListener('click', function () {
            if (gameActive) {
                gameActive = false;
                clearInterval(timerInterval);
                // Record session to stats
                if (typeof ScrambloxStats !== 'undefined') {
                    ScrambloxStats.recordGame(currentDifficulty, score, wordsFoundCount, bestStreak);
                }
            }
            window.location.href = 'achievements.html';
        });
    }

    // Play Again button (from game-over overlay)
    elPlayAgain.addEventListener('click', startGame);

    // Difficulty tabs
    diffTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var diff = tab.getAttribute('data-diff');
            if (diff === currentDifficulty && gameActive) return;

            // Switch active tab
            diffTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentDifficulty = diff;

            // Restart game with new difficulty
            startGame();
        });
    });

    // ==========================================
    //  INIT — Auto-start on page load
    // ==========================================
    startGame();

})();
