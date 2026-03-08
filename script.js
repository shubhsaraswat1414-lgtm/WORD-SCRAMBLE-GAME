// ===== Sidebar Toggle =====
const sidebar = document.getElementById('sidebar');
const toggle = document.getElementById('sidebar-toggle');

// Create backdrop element
const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

function toggleSidebar() {
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('visible');
    if (toggle) toggle.classList.toggle('active');
}

function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
    if (toggle) toggle.classList.remove('active');
}

if (toggle) toggle.addEventListener('click', toggleSidebar);
backdrop.addEventListener('click', closeSidebar);


// ===== Top Nav — Active Page Highlighting =====
(function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.top-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
})();


// ===== Active Nav Highlighting =====
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Close sidebar after clicking a nav link
        closeSidebar();
    });
});

// Close sidebar on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});


// ===== Enter Game — Go to Solo Challenge =====
(function () {
    const enterBtn = document.getElementById('enter-game-btn');
    if (!enterBtn) return;

    enterBtn.addEventListener('click', () => {
        // 🌊 Shockwave ripple effect
        const btnRect = enterBtn.getBoundingClientRect();
        const wrapEl = enterBtn.parentElement;
        for (let r = 0; r < 3; r++) {
            const ring = document.createElement('div');
            ring.className = 'shockwave-ring';
            ring.style.left = (btnRect.width / 2 - 20) + 'px';
            ring.style.top = (btnRect.height / 2 - 20) + 'px';
            wrapEl.appendChild(ring);
            setTimeout(() => ring.remove(), 1200);
        }

        enterBtn.classList.add('btn-hidden');
        setTimeout(() => {
            window.location.href = 'play.html';
        }, 500);
    });
})();


// ===== Typewriter Scramble Title (#1) =====
(function () {
    const titleEl = document.getElementById('hero-title');
    if (!titleEl) return;

    const lines = [
        { text: 'UNSCRAMBLE.', highlight: false },
        { text: 'YOUR MIND.', highlight: true }
    ];

    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?#@&*';
    let lineIndex = 0;

    function typewriteLine(lineObj, callback) {
        const lineSpan = document.createElement('span');
        lineSpan.className = 'typewriter-line typing';
        if (lineObj.highlight) {
            lineSpan.classList.add('hero-highlight');
        }
        lineSpan.style.width = 'auto';
        lineSpan.innerHTML = '&nbsp;';
        titleEl.appendChild(lineSpan);

        const target = lineObj.text;
        let charIndex = 0;

        function typeNext() {
            if (charIndex >= target.length) {
                lineSpan.classList.remove('typing');
                lineSpan.classList.add('done');
                if (callback) callback();
                return;
            }

            const realChar = target[charIndex];
            let scrambleCount = 0;
            const maxScrambles = 2;

            function scramble() {
                if (scrambleCount < maxScrambles) {
                    scrambleCount++;
                    const randomChar = realChar === ' ' ? ' ' : scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                    lineSpan.textContent = target.slice(0, charIndex) + randomChar;
                    setTimeout(scramble, 40);
                } else {
                    charIndex++;
                    lineSpan.textContent = target.slice(0, charIndex);
                    setTimeout(typeNext, 50);
                }
            }
            scramble();
        }

        setTimeout(typeNext, lineIndex === 0 ? 400 : 200);
    }

    function startTypewriter() {
        typewriteLine(lines[0], function () {
            lineIndex = 1;
            typewriteLine(lines[1]);
        });
    }

    startTypewriter();
})();


// ===== Scroll-Triggered Section Reveals (#3) =====
(function () {
    if (!('IntersectionObserver' in window)) {
        // Fallback: show everything
        document.querySelectorAll('.step-card, .feature-card, .step-connector').forEach(function (el) {
            el.classList.add('reveal-visible');
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.step-card, .feature-card, .step-connector').forEach(function (el) {
        observer.observe(el);
    });
})();


// ===== Hero Live Stats Animation =====
(function () {
    var playersEl = document.getElementById('hero-stat-players');
    var wordsEl = document.getElementById('hero-stat-words');
    var dailyEl = document.getElementById('hero-stat-daily');

    if (!playersEl || !wordsEl || !dailyEl) return;

    // --- Players Online: fluctuate between 2300-2800 ---
    var playerCount = 2481;
    function updatePlayers() {
        var delta = Math.floor(Math.random() * 30) - 12; // -12 to +17
        playerCount = Math.max(2100, Math.min(3200, playerCount + delta));
        playersEl.textContent = playerCount.toLocaleString();
        setTimeout(updatePlayers, 2000 + Math.random() * 4000);
    }
    setTimeout(updatePlayers, 3000);

    // --- Words Solved Today: only ever goes up ---
    var wordCount = 14209;
    function updateWords() {
        wordCount += Math.floor(Math.random() * 8) + 1;
        wordsEl.textContent = wordCount.toLocaleString();
        setTimeout(updateWords, 1500 + Math.random() * 3500);
    }
    setTimeout(updateWords, 4000);

    // --- Daily Challenge Countdown ---
    var totalSec = 4 * 3600 + 32 * 60 + 18; // 04:32:18
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tickCountdown() {
        if (totalSec <= 0) { dailyEl.textContent = '00:00:00'; return; }
        totalSec--;
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var s = totalSec % 60;
        dailyEl.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
        setTimeout(tickCountdown, 1000);
    }
    setTimeout(tickCountdown, 1000);
})();
// ===== Twemoji — Game-style Emoji Rendering =====
// Replaces all OS emojis with Twitter/X style images (cleaner, game-like)
(function () {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = function () {
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(document.body, {
                folder: 'svg',
                ext: '.svg'
            });
        }
    };
    document.head.appendChild(s);
})();
