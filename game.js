// ==================== DOM ELEMENTS ====================
const enterGameBtn = document.getElementById("enter-game-btn");
const gameContainer = document.getElementById("game-container");
const target = document.getElementById("target");
const gameArea = document.getElementById("game-area");
const scoreText = document.getElementById("score");
const timerText = document.getElementById("timer");
const levelText = document.getElementById("level");
const missesText = document.getElementById("misses");
const restartBtn = document.getElementById("restart-btn");
const pauseBtn = document.getElementById("pause-btn");
const gameOverScreen = document.getElementById("game-over");
const finalScoreText = document.getElementById("final-score");
const highestLevelText = document.getElementById("highest-level");
const gameOverReasonText = document.getElementById("game-over-reason");
const highScoreDisplay = document.getElementById("high-score");

// ==================== GAME STATE ====================
let score = 0;
let level = 1;
let timeRemaining = 30;
let missesRemaining = 5;
let gameActive = false;
let isPaused = false;
let gameInterval = null;
let moveInterval = null;
let targetSpeed = 2000; // Initial speed in milliseconds
let highScore = localStorage.getItem("highScore") || 0;
let maxLevel = 1;
let targetSize = 70; // Initial target size

// ==================== INITIALIZATION ====================
// Display high score on load
highScoreDisplay.textContent = `High Score: ${highScore}`;

// ==================== EVENT LISTENERS ====================

// Toggle game visibility
enterGameBtn.addEventListener("click", toggleGame);

// Restart game
restartBtn.addEventListener("click", startGame);

// Pause/Resume game
pauseBtn.addEventListener("click", togglePause);

// Target click handler
target.addEventListener("click", handleTargetHit);

// Game area click handler (for misses)
gameArea.addEventListener("click", handleMissedClick);

// ==================== MAIN GAME FUNCTIONS ====================

/**
 * Toggle game container visibility
 */
function toggleGame() {
    gameContainer.classList.toggle("active");
    
    if (gameContainer.classList.contains("active") && !gameActive) {
        startGame();
    }
}

/**
 * Start/Restart the game
 */
function startGame() {
    // Reset game state
    score = 0;
    level = 1;
    timeRemaining = 30;
    missesRemaining = 5;
    gameActive = true;
    isPaused = false;
    targetSpeed = 2000;
    maxLevel = 1;
    targetSize = 70;
    
    // Reset target size
    target.style.width = targetSize + "px";
    target.style.height = targetSize + "px";
    
    // Update UI
    updateScore();
    updateLevel();
    updateTimer();
    updateMisses();
    pauseBtn.textContent = "⏸️ Pause";
    pauseBtn.disabled = false;
    
    // Hide game over screen
    gameOverScreen.classList.remove("show");
    
    // Show and position target
    target.classList.remove("disabled");
    target.style.opacity = "1";
    moveTarget();
    
    // Start game timers
    startGameLoop();
}

/**
 * Start the main game loop (timer and target movement)
 */
function startGameLoop() {
    // Clear existing intervals
    clearInterval(gameInterval);
    clearInterval(moveInterval);
    
    // Timer countdown
    gameInterval = setInterval(() => {
        if (!isPaused && gameActive) {
            timeRemaining--;
            updateTimer();
            
            if (timeRemaining <= 0) {
                endGame("Time's up!");
            }
        }
    }, 1000);
    
    // Auto-move target (gets faster with levels)
    moveInterval = setInterval(() => {
        if (!isPaused && gameActive) {
            moveTarget();
        }
    }, targetSpeed);
}

/**
 * Handle target being hit
 */
function handleTargetHit(e) {
    if (!gameActive || isPaused) return;
    
    // Prevent event from bubbling to game area
    e.stopPropagation();
    
    // Increase score
    score++;
    updateScore();
    
    // Add hit animation
    target.classList.add("hit");
    
    // Create particle effect
    createParticles(e.clientX, e.clientY);
    
    // Check for level up (every 10 points)
    if (score % 10 === 0) {
        levelUp();
    }
    
    // Hide target briefly
    target.style.opacity = "0";
    
    setTimeout(() => {
        target.classList.remove("hit");
        target.style.opacity = "1";
        moveTarget();
    }, 200);
}

/**
 * Handle missed clicks (clicking game area but not target)
 */
function handleMissedClick(e) {
    if (!gameActive || isPaused) return;
    
    // Check if click was on target (if so, return - already handled)
    if (e.target === target) return;
    
    // Decrease misses
    missesRemaining--;
    updateMisses();
    
    // Show miss indicator
    showMissIndicator(e.clientX, e.clientY);
    
    // Screen shake effect
    gameArea.style.animation = "shake 0.3s ease";
    setTimeout(() => {
        gameArea.style.animation = "";
    }, 300);
    
    // Check if game over
    if (missesRemaining <= 0) {
        endGame("Too many misses!");
    }
}

/**
 * Show visual miss indicator
 */
function showMissIndicator(x, y) {
    const indicator = document.createElement("div");
    indicator.className = "miss-indicator";
    indicator.textContent = "✗";
    
    const rect = gameArea.getBoundingClientRect();
    indicator.style.left = (x - rect.left) + "px";
    indicator.style.top = (y - rect.top) + "px";
    
    gameArea.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1000);
}

/**
 * Move target to random position
 */
function moveTarget() {
    if (!gameActive || isPaused) return;
    
    const maxX = gameArea.clientWidth - target.clientWidth;
    const maxY = gameArea.clientHeight - target.clientHeight;
    
    // Ensure valid boundaries
    const x = Math.max(0, Math.min(Math.random() * maxX, maxX));
    const y = Math.max(0, Math.min(Math.random() * maxY, maxY));
    
    target.style.left = x + "px";
    target.style.top = y + "px";
}

/**
 * Level up - SIGNIFICANTLY increase difficulty
 */
function levelUp() {
    level++;
    maxLevel = Math.max(maxLevel, level);
    updateLevel();
    
    // HARDER: Dramatically increase speed (faster reduction per level)
    targetSpeed = Math.max(400, targetSpeed - 200);
    
    // HARDER: More aggressive size reduction
    targetSize = Math.max(30, targetSize - 5);
    target.style.width = targetSize + "px";
    target.style.height = targetSize + "px";
    
    // HARDER: Less bonus time at higher levels
    const bonusTime = Math.max(2, 6 - Math.floor(level / 3));
    timeRemaining += bonusTime;
    updateTimer();
    
    // HARDER: Reduce misses allowed at higher levels (every 3 levels)
    if (level % 3 === 0 && level > 3) {
        missesRemaining = Math.max(3, missesRemaining - 1);
        updateMisses();
    }
    
    // Restart intervals with new speed
    startGameLoop();
    
    // Visual feedback
    showLevelUpMessage();
}

/**
 * Show level up message
 */
function showLevelUpMessage() {
    const message = document.createElement("div");
    message.textContent = `Level ${level}! 🔥`;
    message.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 36px;
        font-weight: bold;
        color: #667eea;
        text-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
        z-index: 15;
        pointer-events: none;
        animation: popIn 0.5s ease;
    `;
    
    gameArea.appendChild(message);
    
    setTimeout(() => {
        message.style.transition = "opacity 0.5s, transform 0.5s";
        message.style.opacity = "0";
        message.style.transform = "translate(-50%, -50%) scale(1.5)";
        setTimeout(() => message.remove(), 500);
    }, 1200);
}

/**
 * Toggle pause state
 */
function togglePause() {
    if (!gameActive) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.textContent = "▶️ Resume";
        target.classList.add("disabled");
    } else {
        pauseBtn.textContent = "⏸️ Pause";
        target.classList.remove("disabled");
    }
}

/**
 * End the game
 */
function endGame(reason = "Time's up!") {
    gameActive = false;
    isPaused = false;
    
    // Clear intervals
    clearInterval(gameInterval);
    clearInterval(moveInterval);
    
    // Disable controls
    pauseBtn.disabled = true;
    target.classList.add("disabled");
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        highScoreDisplay.textContent = `High Score: ${highScore} 🏆`;
    }
    
    // Show game over screen with reason
    gameOverReasonText.textContent = reason;
    finalScoreText.textContent = `Score: ${score}`;
    highestLevelText.textContent = `Highest Level: ${maxLevel}`;
    gameOverScreen.classList.add("show");
}

/**
 * Create particle effect at click position
 */
function createParticles(x, y) {
    const particleCount = 12;
    const rect = gameArea.getBoundingClientRect();
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        
        // Random direction
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 60 + Math.random() * 60;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        // Position relative to game area
        particle.style.left = (x - rect.left) + "px";
        particle.style.top = (y - rect.top) + "px";
        particle.style.setProperty("--tx", tx + "px");
        particle.style.setProperty("--ty", ty + "px");
        
        gameArea.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => particle.remove(), 800);
    }
}

// ==================== UI UPDATE FUNCTIONS ====================

/**
 * Update score display
 */
function updateScore() {
    scoreText.textContent = `Score: ${score}`;
}

/**
 * Update timer display
 */
function updateTimer() {
    timerText.textContent = `Time: ${timeRemaining}s`;
    
    // Change color when time is low
    if (timeRemaining <= 10) {
        timerText.style.color = "#f56565";
        timerText.style.borderColor = "#f56565";
    } else {
        timerText.style.color = "#48bb78";
        timerText.style.borderColor = "#48bb78";
    }
}

/**
 * Update level display
 */
function updateLevel() {
    levelText.textContent = `Level: ${level}`;
}

/**
 * Update misses display
 */
function updateMisses() {
    missesText.textContent = `❤️ ${missesRemaining}`;
    
    // Add warning animation when low
    if (missesRemaining <= 2) {
        missesText.classList.add("warning");
    } else {
        missesText.classList.remove("warning");
    }
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener("keydown", (e) => {
    // Space to pause/resume
    if (e.code === "Space" && gameActive) {
        e.preventDefault();
        togglePause();
    }
    
    // R to restart
    if (e.code === "KeyR" && !gameActive && gameContainer.classList.contains("active")) {
        startGame();
    }
    
    // Escape to close game
    if (e.code === "Escape" && gameContainer.classList.contains("active")) {
        gameContainer.classList.remove("active");
    }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Prevent accidental text selection during gameplay
 */
gameArea.addEventListener("mousedown", (e) => {
    if (gameActive) {
        e.preventDefault();
    }
});

/**
 * Handle window resize - reposition target if out of bounds
 */
window.addEventListener("resize", () => {
    if (gameActive && !isPaused) {
        const maxX = gameArea.clientWidth - target.clientWidth;
        const maxY = gameArea.clientHeight - target.clientHeight;
        const currentX = parseInt(target.style.left);
        const currentY = parseInt(target.style.top);
        
        if (currentX > maxX || currentY > maxY) {
            moveTarget();
        }
    }
});

// Add shake animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);
