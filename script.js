const player = document.getElementById("player");
let playerx = 190;
let playery = 400;
let movedist = 3;
let moving = {
    w: false,
    a: false,
    s: false,
    d: false
};
const walls = document.querySelectorAll(".wall");
let velocityY = 0;
const gravity = 0.1;
const jumpStrength = -7;
let onGround = false;
const projectileFallSpeed = 0.1;
let projectilespawnrate = 1500;
let gameOver = false;
let timeAlive = 0;
let spawnInterval;
const projectiles = [];
const timerElement = document.getElementById("timer");

function initGame() {
    // Reset game state
    gameOver = false;
    timeAlive = 0;
    playerx = 190;
    playery = 200;
    velocityY = 0;
    projectilespawnrate = 1500;

    // Clear all projectiles
    projectiles.forEach(proj => proj.element.remove());
    projectiles.length = 0;

    // Reset player position
    player.style.left = `${playerx}px`;
    player.style.top = `${playery}px`;

    // Start projectile spawning
    spawnInterval = setInterval(spawnProjectile, projectilespawnrate);

    // Hide game over screen
    document.getElementById("gameOverScreen").style.display = "none";
}

function adjustSpawnRate() {
    if (gameOver) return;

    timeAlive += 0.005;

    // Calculate the new spawn rate (linearly decrease from 1500ms to 250ms over 100 seconds)
    const minSpawnRate = 150;
    const maxSpawnRate = 1000;
    const spawnRateProgress = Math.min(timeAlive / 60, 1);
    const newSpawnRate = maxSpawnRate - (maxSpawnRate - minSpawnRate) * spawnRateProgress;

    // Only update if there's a significant change
    if (Math.abs(newSpawnRate - projectilespawnrate) > 50) {
        projectilespawnrate = newSpawnRate;
        clearInterval(spawnInterval);
        spawnInterval = setInterval(spawnProjectile, projectilespawnrate);
    }

    // Update timer display
    timerElement.textContent = `time alive: ${timeAlive.toFixed(1)}s`;
}

function moveplayer() {
    if (gameOver) return;

    // Horizontal movement
    let newPlayerX = playerx;
    if (moving.a) newPlayerX -= movedist;
    if (moving.d) newPlayerX += movedist;

    let collidedX = false;
    walls.forEach((wall) => {
        const wallRect = wall.getBoundingClientRect();
        const playerRect = {
            left: newPlayerX,
            top: playery,
            right: newPlayerX + player.offsetWidth,
            bottom: playery + player.offsetHeight,
        };

        if (
            playerRect.right > wallRect.left &&
            playerRect.left < wallRect.right &&
            playerRect.bottom > wallRect.top &&
            playerRect.top < wallRect.bottom
        ) {
            collidedX = true;
        }
    });

    if (!collidedX) playerx = newPlayerX;

    // Vertical movement
    velocityY += gravity;
    let newPlayerY = playery + velocityY;

    onGround = false;
    let collidedY = false;

    walls.forEach((wall) => {
        const wallRect = wall.getBoundingClientRect();
        const playerRect = {
            left: playerx,
            top: newPlayerY,
            right: playerx + player.offsetWidth,
            bottom: newPlayerY + player.offsetHeight,
        };

        if (
            playerRect.right > wallRect.left &&
            playerRect.left < wallRect.right &&
            playerRect.bottom > wallRect.top &&
            playerRect.top < wallRect.bottom
        ) {
            collidedY = true;

            if (velocityY > 0) {
                // Falling
                newPlayerY = wallRect.top - player.offsetHeight;
                onGround = true;
            } else if (velocityY < 0) {
                // Jumping up
                newPlayerY = wallRect.bottom;
            }

            velocityY = 0;
        }
    });

    playery = newPlayerY;

    // Update player position
    player.style.left = `${playerx}px`;
    player.style.top = `${playery}px`;
}

function spawnProjectile() {
    if (gameOver) return;

    const proj = document.createElement("div");
    proj.className = "projectile";
    proj.style.left = `${Math.random() * (370)+(5)}px`;
    console.log(proj.style.left);
    document.body.appendChild(proj);

    projectiles.push({
        element: proj,
        x: parseFloat(proj.style.left),
        y: 0,
        vy: 0
    });
}

function updateProjectiles() {
    if (gameOver) return;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.vy += gravity * projectileFallSpeed;
        proj.y += proj.vy;
        proj.element.style.top = `${proj.y}px`;

        // Collision detection with player
        const projRect = proj.element.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        if (
            projRect.right > playerRect.left &&
            projRect.left < playerRect.right &&
            projRect.bottom > playerRect.top &&
            projRect.top < playerRect.bottom
        ) {
            endGame();
            return;
        }

        // Remove projectile if off-screen
        if (proj.y > window.innerHeight) {
            proj.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

function endGame() {
    gameOver = true;
    clearInterval(spawnInterval);

    const finalTime = timeAlive.toFixed(1);
    document.getElementById("finalTime").textContent = finalTime;

    // Get the saved best time from localStorage
    const savedBestTime = parseFloat(localStorage.getItem("bestTime")) || 0;

    // Update best time if current time is better
    if (parseFloat(finalTime) > savedBestTime) {
        localStorage.setItem("bestTime", finalTime);
    }

    // Update best time display
    document.getElementById("bestTime").textContent = `best time: ${localStorage.getItem("bestTime") || '0.0'}s`;

    // Show game over screen
    document.getElementById("gameOverScreen").style.display = "flex";
}

// Event listeners
document.addEventListener("keydown", function(event) {
    if (gameOver) return;
    if (event.key === "a") moving.a = true;
    if (event.key === "d") moving.d = true;
    if ((event.key === "w" || event.key === " ") && onGround) {
        velocityY = jumpStrength;
    }
});

document.addEventListener("keyup", function(event) {
    if (gameOver) return;
    if (event.key === "a") moving.a = false;
    if (event.key === "d") moving.d = false;
});

// Initialize game
window.onload = function() {
    const bestTime = localStorage.getItem("bestTime") || '0.0';
    document.getElementById("bestTime").textContent = `best time: ${bestTime}s`;
    initGame();

    // Main game loop
    setInterval(() => {
        if (gameOver) return;
        moveplayer();
        updateProjectiles();
        adjustSpawnRate();
    }, 5);
};

document.getElementById("tryagainbutton").addEventListener("click", () => {
    location.reload();
});