const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 30;
let snake = [{ x: 10, y: 10 }];
let food = {};
let score = 0;
let direction = 'right';
let changingDirection = false;
let gameRunning = true;
let particles = [];
let hue = 0;
let gameTick = 0;
const moveSpeed = 6; // 60fps에서 6프레임마다 움직임 (초당 10회)

// TOP3 기록 저장을 위한 변수
let topScores = JSON.parse(localStorage.getItem('wormGameTopScores')) || [];
let lastResetDate = localStorage.getItem('wormGameLastResetDate') || new Date().toDateString();

// 매일 아침 6시에 TOP3 기록 초기화
function checkAndResetScores() {
    const now = new Date();
    const today = now.toDateString();
    
    if (lastResetDate !== today && now.getHours() >= 6) {
        topScores = [];
        localStorage.setItem('wormGameTopScores', JSON.stringify(topScores));
        localStorage.setItem('wormGameLastResetDate', today);
        lastResetDate = today;
    }
}

// 페이지 로드 시 초기화 체크
checkAndResetScores();

function createFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
    for (let i = 0; i < snake.length; i++) {
        if (food.x === snake[i].x && food.y === snake[i].y) {
            createFood();
            return;
        }
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // drawGrid(); // Grid removed for a clean background
    hue++;

    // Draw connections
    for (let i = 1; i < snake.length; i++) {
        const prev = snake[i-1];
        const curr = snake[i];
        
        if (score === 0) {
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'white';
        } else {
            const segmentHue = (hue + (i-1) * 10) % 360;
            ctx.fillStyle = `hsl(${segmentHue}, 100%, 50%)`;
            ctx.shadowColor = `hsl(${segmentHue}, 100%, 50%)`;
        }
        ctx.shadowBlur = 15;

        const x1 = prev.x * gridSize + gridSize / 2;
        const y1 = prev.y * gridSize + gridSize / 2;
        const x2 = curr.x * gridSize + gridSize / 2;
        const y2 = curr.y * gridSize + gridSize / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = gridSize;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.stroke();
    }

    // Draw segments (circles)
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (score === 0) {
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'white';
        } else {
            const segmentHue = (hue + i * 10) % 360;
            ctx.fillStyle = `hsl(${segmentHue}, 100%, 50%)`;
            ctx.shadowColor = `hsl(${segmentHue}, 100%, 50%)`;
        }
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw eyes on head
        if (i === 0) {
            const eyeSize = gridSize / 4;
            const pupilSize = gridSize / 8;
            let eye1_x, eye1_y, eye2_x, eye2_y;

            const headX = segment.x * gridSize + gridSize / 2;
            const headY = segment.y * gridSize + gridSize / 2;

            switch (direction) {
                case 'up':
                    eye1_x = headX - eyeSize;
                    eye1_y = headY - eyeSize;
                    eye2_x = headX + eyeSize;
                    eye2_y = headY - eyeSize;
                    break;
                case 'down':
                    eye1_x = headX - eyeSize;
                    eye1_y = headY + eyeSize;
                    eye2_x = headX + eyeSize;
                    eye2_y = headY + eyeSize;
                    break;
                case 'left':
                    eye1_x = headX - eyeSize;
                    eye1_y = headY - eyeSize;
                    eye2_x = headX - eyeSize;
                    eye2_y = headY + eyeSize;
                    break;
                case 'right':
                    eye1_x = headX + eyeSize;
                    eye1_y = headY - eyeSize;
                    eye2_x = headX + eyeSize;
                    eye2_y = headY + eyeSize;
                    break;
            }
            // Sclera (white part)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(eye1_x, eye1_y, eyeSize, 0, 2 * Math.PI);
            ctx.arc(eye2_x, eye2_y, eyeSize, 0, 2 * Math.PI);
            ctx.fill();

            // Pupil (black part)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(eye1_x, eye1_y, pupilSize, 0, 2 * Math.PI);
            ctx.arc(eye2_x, eye2_y, pupilSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.size *= 0.95;
        if (p.size < 0.5) particles.splice(i, 1);
    }

    ctx.fillStyle = 'white';
    ctx.font = '24px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: ' + score, 10, 30);
}

function createParticles(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push({ x: x * gridSize + gridSize / 2, y: y * gridSize + gridSize / 2, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, size: Math.random() * 3 + 1, color: '#ff0055' });
    }
}

function update() {
    if (!gameRunning) return;
    gameTick++;
    if (gameTick % moveSpeed !== 0) {
        draw(); // 화면은 계속 그림
        return;
    }

    changingDirection = false;
    const head = { x: snake[0].x, y: snake[0].y };
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    if (head.x < 0 || head.x >= canvas.width / gridSize || head.y < 0 || head.y >= canvas.height / gridSize || checkCollision(head)) {
        gameOver();
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        createParticles(food.x, food.y);
        createFood();
    } else {
        snake.pop();
    }
    draw();
}

function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return false;
}

function gameOver() {
    gameRunning = false;
    topScores.push(score);
    topScores.sort((a, b) => b - a);
    topScores = topScores.slice(0, 3);
    localStorage.setItem('wormGameTopScores', JSON.stringify(topScores));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0055';
    ctx.font = '50px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 100);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    ctx.font = '20px Orbitron';
    ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '24px Orbitron';
    ctx.fillStyle = '#00ffde';
    ctx.fillText('TOP 3 SCORES', canvas.width / 2, canvas.height / 2);
    ctx.font = '18px Orbitron';
    for (let i = 0; i < topScores.length; i++) {
        const rank = i + 1;
        const scoreText = `${rank}. ${topScores[i]}`;
        ctx.fillText(scoreText, canvas.width / 2, canvas.height / 2 + 30 + i * 25);
    }
    ctx.fillStyle = 'white';
    ctx.font = '20px Orbitron';
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 120);
}

function restartGame() {
    snake = [{ x: 10, y: 10 }];
    score = 0;
    direction = 'right';
    gameRunning = true;
    particles = [];
    hue = 0;
    gameTick = 0;
    createFood();
    main();
}

document.addEventListener('keydown', e => {
    if (changingDirection) return;
    const keyPressed = e.key;
    let newDirection = direction;
    if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && direction !== 'down') newDirection = 'up';
    if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && direction !== 'up') newDirection = 'down';
    if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && direction !== 'right') newDirection = 'left';
    if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && direction !== 'left') newDirection = 'right';
    if (newDirection !== direction) {
        direction = newDirection;
        changingDirection = true;
    }
    if (!gameRunning && keyPressed === 'Enter') restartGame();
});

function main() {
    if (gameRunning) {
        setTimeout(() => {
            requestAnimationFrame(main);
            update();
        }, 1000 / 60); // 60 FPS for smooth rendering
    }
}

createFood();
main();
