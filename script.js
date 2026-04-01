// ================================
// GLOBAL VARIABLES & STATE
// ================================

let currentPage = 'landing';
let heartsCaught = 0;
let gameAreaWidth = 0;
let gameAreaHeight = 0;
let basketX = 0;
let gameActive = false;
let isMusicPlaying = false;
let landingHeartsClicked = 0;

// Memory Match Game Variables
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let canFlip = true;
let memoryMatchTimeout = null;
let memorySessionId = 0;

// Photo Puzzle Game Variables
let puzzleMoves = 0;
let puzzleTileOrder = [];
let puzzleSelectedTile = null;
const puzzlePieces = [
    'images/puzzle/1.jpg',
    'images/puzzle/2.jpg',
    'images/puzzle/3.jpg',
    'images/puzzle/4.jpg',
    'images/puzzle/5.jpg',
    'images/puzzle/6.jpg',
    'images/puzzle/7.jpg',
    'images/puzzle/8.jpg',
    'images/puzzle/9.jpg'
];

// Quiz Game Variables
let quizQuestions = [
    {
        question: "What makes me smile?",
        answers: ["You do 😊", "Your laugh", "Your warmth"]
    },
    {
        question: "What's our vibe?",
        answers: ["Cozy & comfortable", "Adventurous & fun", "Quiet & peaceful"]
    },
    {
        question: "How do you make me feel?",
        answers: ["Loved 💕", "Understood", "Special ✨"]
    }
];
let currentQuizIndex = 0;

// Challenge Game Variables
let heartsChallengeCount = 0;
let challengeTimeLeft = 30;
let challengeInterval = null;

const cardEmojis = ['❤️', '🌸', '✨', '💕', '💖', '🎀'];
const fallbackPhoto = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&q=80';
const userPhotos = [
    'images/photo1.jpg',
    'images/photo2.jpg',
    'images/photo3.jpg',
    'images/photo4.jpg',
    'images/photo5.jpg',
    'images/photo6.jpg',
    'images/photo7.jpg',
    'images/photo8.jpg',
    'images/photo9.jpg',
    'images/photo10.jpg',
    'images/photo11.jpg',
    'images/photo12.jpg',
    'images/photo13.jpg'
];
const photoDecks = {
    general: [],
    floating: [],
    reward: [],
    strip: []
};
const lastDeckPick = {
    general: '',
    floating: '',
    reward: '',
    strip: ''
};

function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function shuffled(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function safePhoto(src) {
    return src || fallbackPhoto;
}

function bindPhotoFallback(imgEl) {
    imgEl.onerror = () => {
        imgEl.onerror = null;
        imgEl.src = fallbackPhoto;
    };
}

function refillDeck(deckName) {
    let nextDeck = shuffled(userPhotos).map(safePhoto);
    const lastPicked = lastDeckPick[deckName];

    // Avoid immediate repeat across deck boundaries when possible.
    if (nextDeck.length > 1 && lastPicked && nextDeck[nextDeck.length - 1] === lastPicked) {
        const swapIndex = Math.floor(Math.random() * (nextDeck.length - 1));
        [nextDeck[swapIndex], nextDeck[nextDeck.length - 1]] = [nextDeck[nextDeck.length - 1], nextDeck[swapIndex]];
    }

    photoDecks[deckName] = nextDeck;
}

function drawFromDeck(deckName) {
    if (!photoDecks[deckName] || photoDecks[deckName].length === 0) {
        refillDeck(deckName);
    }

    const picked = photoDecks[deckName].pop() || fallbackPhoto;
    lastDeckPick[deckName] = picked;
    return picked;
}

function drawManyFromDeck(deckName, count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(drawFromDeck(deckName));
    }
    return result;
}

function randomPhoto() {
    return drawFromDeck('general');
}

function floatingPhoto() {
    return drawFromDeck('floating');
}

function rewardPhoto() {
    return drawFromDeck('reward');
}

// ================================
// PAGE NAVIGATION
// ================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
}

function showGameSelect() {
    showPage('gameSelectPage');
}

function backToLanding() {
    showPage('landingPage');
    resetGame();
}

function backToGameSelect() {
    showPage('gameSelectPage');
    resetGame();
    if (challengeInterval) clearInterval(challengeInterval);
}

function resetGame() {
    heartsCaught = 0;
    gameActive = false;
    resetMemoryGameState(false);
    puzzleMoves = 0;
    puzzleTileOrder = [];
    puzzleSelectedTile = null;
    currentQuizIndex = 0;
    heartsChallengeCount = 0;
    challengeTimeLeft = 30;
}

function resetMemoryGameState(resetBoard) {
    if (memoryMatchTimeout) {
        clearTimeout(memoryMatchTimeout);
        memoryMatchTimeout = null;
    }

    matchedPairs = 0;
    flippedCards = [];
    canFlip = true;

    if (resetBoard) {
        const cardGrid = document.getElementById('cardGrid');
        if (cardGrid) {
            cardGrid.innerHTML = '';
        }
    }
}

// ================================
// FLOATING HEARTS ANIMATION
// ================================

function createFloatingHearts() {
    const container = document.querySelector('.floating-hearts-container');
    
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = '❤️';
        
        const randomX = Math.random() * window.innerWidth;
        const randomDelay = Math.random() * 2;
        const randomDuration = 8 + Math.random() * 4;
        
        heart.style.left = randomX + 'px';
        heart.style.top = '100vh';
        heart.style.animationDuration = randomDuration + 's';
        heart.style.animationDelay = randomDelay + 's';
        
        container.appendChild(heart);
        
        setTimeout(() => heart.remove(), (randomDuration + randomDelay) * 1000);
    }, 800);
}

function renderLandingPhotoStrip() {
    const strip = document.getElementById('landingPhotoStrip');
    if (!strip) return;

    strip.innerHTML = '';
    const photos = drawManyFromDeck('strip', 8);
    for (let i = 0; i < photos.length; i++) {
        const photo = document.createElement('img');
        photo.className = 'strip-photo';
        photo.src = photos[i];
        photo.style.setProperty('--rot', `${Math.floor(Math.random() * 10) - 5}deg`);
        photo.alt = 'Memory photo';
        bindPhotoFallback(photo);
        strip.appendChild(photo);
    }
}

function startFloatingPhotos() {
    const layer = document.getElementById('photoFloatLayer');
    if (!layer) return;

    setInterval(() => {
        const photo = document.createElement('img');
        photo.className = 'floating-photo';
        photo.src = floatingPhoto();
        photo.alt = 'Floating memory';
        photo.style.left = `${Math.random() * 100}%`;
        photo.style.animationDuration = `${12 + Math.random() * 8}s`;
        bindPhotoFallback(photo);
        layer.appendChild(photo);

        setTimeout(() => {
            photo.remove();
        }, 21000);
    }, 2100);
}

// ================================
// LANDING PAGE INTERACTIVE GAME
// ================================

function initializeLandingGame() {
    const container = document.getElementById('landingHearts');
    container.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const heartBtn = document.createElement('button');
        heartBtn.className = 'landing-heart-btn';
        heartBtn.textContent = '❤️';
        heartBtn.setAttribute('data-id', i);
        heartBtn.onclick = (e) => clickLandingHeart(e, i);
        container.appendChild(heartBtn);
    }
}

function clickLandingHeart(e, id) {
    const btn = e.target;
    btn.classList.add('clicked');
    landingHeartsClicked++;
    document.getElementById('landingProgress').textContent = landingHeartsClicked + '/5 Hearts';
    
    if (landingHeartsClicked >= 5) {
        document.getElementById('landingStartBtn').classList.remove('hidden');
        if (!isMusicPlaying) {
            playBackgroundMusic();
        }
    }
}

// ================================
// HEART CATCH GAME LOGIC
// ================================

function startHeartCatch() {
    showPage('heartCatchPage');
    heartsCaught = 0;
    gameActive = true;
    document.getElementById('heartCount').textContent = '0';
    
    const gameArea = document.getElementById('gameArea');
    gameAreaWidth = gameArea.offsetWidth;
    gameAreaHeight = gameArea.offsetHeight;
    basketX = gameAreaWidth / 2;
    
    gameArea.addEventListener('mousemove', moveBasket);
    gameArea.addEventListener('touchmove', moveBasketTouch);
    
    spawnHearts();
}

function moveBasket(e) {
    const gameArea = document.getElementById('gameArea');
    const rect = gameArea.getBoundingClientRect();
    basketX = e.clientX - rect.left;
    
    const basket = document.getElementById('basket');
    basket.style.left = basketX + 'px';
}

function moveBasketTouch(e) {
    const gameArea = document.getElementById('gameArea');
    const rect = gameArea.getBoundingClientRect();
    basketX = e.touches[0].clientX - rect.left;
    
    const basket = document.getElementById('basket');
    basket.style.left = basketX + 'px';
}

function spawnHearts() {
    if (!gameActive) return;
    
    const gameArea = document.getElementById('gameArea');
    const heart = document.createElement('div');
    heart.className = 'falling-heart';
    heart.textContent = '❤️';
    
    const randomX = Math.random() * gameAreaWidth;
    const fallDuration = 4 + Math.random() * 2;
    
    heart.style.left = randomX + 'px';
    heart.style.top = '0';
    heart.style.animationDuration = fallDuration + 's';
    
    gameArea.appendChild(heart);
    
    checkHeartCatch(heart, randomX, fallDuration);
    
    setTimeout(spawnHearts, 800);
}

function checkHeartCatch(heart, heartX, duration) {
    const heartWidth = 32;
    const basketWidth = 50;
    const checkInterval = 50;
    const basketY = gameAreaHeight - 80;
    
    let elapsed = 0;
    
    const interval = setInterval(() => {
        if (!gameActive) {
            clearInterval(interval);
            return;
        }
        
        elapsed += checkInterval;
        const progress = elapsed / (duration * 1000);
        const currentY = progress * gameAreaHeight;
        
        if (currentY >= basketY && 
            heartX >= basketX - basketWidth &&
            heartX <= basketX + basketWidth) {
            
            heartsCaught++;
            document.getElementById('heartCount').textContent = heartsCaught;
            heart.remove();
            clearInterval(interval);
            
            if (heartsCaught >= 10) {
                endHeartCatchGame();
            }
        }
        
        if (currentY >= gameAreaHeight) {
            clearInterval(interval);
        }
    }, checkInterval);
}

function endHeartCatchGame() {
    gameActive = false;
    showRewardOverlay(
        'You Caught My Heart! 💕',
        'You have such a gentle touch... You caught every single one of these hearts. Just like you\'ve caught mine.',
        rewardPhoto()
    );
}

// ================================
// MEMORY MATCH GAME LOGIC
// ================================

function startMemoryMatch() {
    showPage('memoryMatchPage');
    memorySessionId++;
    resetMemoryGameState(false);
    document.getElementById('matchCount').textContent = '0';
    
    initializeMemoryGame();
}

function initializeMemoryGame() {
    const cardGrid = document.getElementById('cardGrid');
    cardGrid.innerHTML = '';

    const cardSet = shuffled([...cardEmojis, ...cardEmojis]);
    
    cards = cardSet.map((emoji, index) => ({
        emoji,
        id: index,
        flipped: false,
        matched: false
    }));
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('button');
        cardElement.className = 'card';
        cardElement.setAttribute('data-id', index);
        cardElement.textContent = '?';
        
        cardElement.addEventListener('click', () => flipCard(index, cardElement));
        cardGrid.appendChild(cardElement);
    });
}

function flipCard(index, element) {
    if (currentPage !== 'memoryMatchPage') return;
    if (!canFlip || !cards[index] || cards[index].matched || flippedCards.includes(index)) return;
    
    const card = cards[index];
    card.flipped = true;
    element.textContent = card.emoji;
    element.classList.add('flipped');
    flippedCards.push(index);
    
    if (flippedCards.length === 2) {
        canFlip = false;
        checkMatch(memorySessionId);
    }
}

function checkMatch(sessionId) {
    const [index1, index2] = flippedCards;
    if (index1 === undefined || index2 === undefined) {
        canFlip = true;
        return;
    }

    const card1 = cards[index1];
    const card2 = cards[index2];
    const el1 = document.querySelector(`[data-id="${index1}"]`);
    const el2 = document.querySelector(`[data-id="${index2}"]`);
    if (!card1 || !card2 || !el1 || !el2) {
        flippedCards = [];
        canFlip = true;
        return;
    }
    
    const isMatch = card1.emoji === card2.emoji;

    memoryMatchTimeout = setTimeout(() => {
        memoryMatchTimeout = null;
        if (sessionId !== memorySessionId || currentPage !== 'memoryMatchPage') {
            flippedCards = [];
            canFlip = true;
            return;
        }

        if (isMatch) {
            card1.matched = true;
            card2.matched = true;

            el1.classList.add('matched');
            el2.classList.add('matched');
            
            matchedPairs++;
            document.getElementById('matchCount').textContent = matchedPairs;
            
            flippedCards = [];
            canFlip = true;
            
            if (matchedPairs === cardEmojis.length) {
                endMemoryMatchGame();
            }
        } else {
            el1.textContent = '?';
            el1.classList.remove('flipped');
            el2.textContent = '?';
            el2.classList.remove('flipped');
            
            card1.flipped = false;
            card2.flipped = false;
            
            flippedCards = [];
            canFlip = true;
        }
    }, 800);
}

function endMemoryMatchGame() {
    canFlip = false;
    showRewardOverlay(
        'Perfect Match! 💕',
        'Every piece of you is perfect to me. You matched them all with such grace and precision. You\'re simply amazing.',
        rewardPhoto()
    );
}

// ================================
// PHOTO PUZZLE GAME
// ================================

function startPhotoPuzzle() {
    showPage('photoPuzzlePage');
    puzzleMoves = 0;
    puzzleSelectedTile = null;
    document.getElementById('puzzleCount').textContent = '0';

    initializePuzzleGame();
}

function initializePuzzleGame() {
    const puzzleGrid = document.getElementById('puzzleGrid');
    puzzleGrid.innerHTML = '';

    puzzleTileOrder = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    while (isPuzzleSolved()) {
        puzzleTileOrder = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }

    renderPuzzleBoard();
}

function renderPuzzleBoard() {
    const puzzleGrid = document.getElementById('puzzleGrid');
    puzzleGrid.innerHTML = '';

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        const tileNumber = puzzleTileOrder[boardIndex];
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.setAttribute('data-id', boardIndex);
        if (puzzleSelectedTile === boardIndex) {
            piece.classList.add('selected');
        }

        const img = document.createElement('img');
        img.src = puzzlePieces[tileNumber - 1];
        img.style.opacity = '1';
        bindPhotoFallback(img);

        const badge = document.createElement('span');
        badge.className = 'puzzle-piece-number';
        badge.textContent = String(tileNumber);

        piece.appendChild(img);
        piece.appendChild(badge);
        piece.addEventListener('click', () => selectPuzzleTile(boardIndex));
        puzzleGrid.appendChild(piece);
    }
}

function selectPuzzleTile(index) {
    if (puzzleSelectedTile === null) {
        puzzleSelectedTile = index;
        renderPuzzleBoard();
        return;
    }

    if (puzzleSelectedTile === index) {
        puzzleSelectedTile = null;
        renderPuzzleBoard();
        return;
    }

    const first = puzzleSelectedTile;
    [puzzleTileOrder[first], puzzleTileOrder[index]] = [puzzleTileOrder[index], puzzleTileOrder[first]];
    puzzleSelectedTile = null;
    puzzleMoves++;
    document.getElementById('puzzleCount').textContent = puzzleMoves;
    renderPuzzleBoard();

    if (isPuzzleSolved()) {
        endPhotoPuzzleGame();
    }
}

function isPuzzleSolved() {
    if (!puzzleTileOrder || puzzleTileOrder.length !== 9) return false;
    return puzzleTileOrder.every((value, index) => value === index + 1);
}

function endPhotoPuzzleGame() {
    showRewardOverlay(
        'Picture Perfect! 🖼️',
        `Every piece of you is perfect to me. You rebuilt this memory in ${puzzleMoves} moves.`,
        puzzlePieces[4]
    );
}

// ================================
// LOVE QUIZ GAME
// ================================

function startLoveQuiz() {
    showPage('loveQuizPage');
    currentQuizIndex = 0;
    document.getElementById('quizProgress').textContent = '1';
    
    showQuizQuestion();
}

function showQuizQuestion() {
    const question = quizQuestions[currentQuizIndex];
    document.getElementById('quizQuestion').textContent = question.question;
    
    const answersContainer = document.getElementById('quizAnswers');
    answersContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-answer-btn';
        btn.textContent = answer;
        btn.onclick = () => answerQuiz(index);
        answersContainer.appendChild(btn);
    });
}

function answerQuiz(answerIndex) {
    currentQuizIndex++;
    document.getElementById('quizProgress').textContent = currentQuizIndex + 1;
    
    if (currentQuizIndex >= quizQuestions.length) {
        endLoveQuizGame();
    } else {
        showQuizQuestion();
    }
}

function endLoveQuizGame() {
    showRewardOverlay(
        'No Matter What! 💌',
        'No matter what you choose, it\'s always you. You complete me in every way. Thank you for being you.',
        rewardPhoto()
    );
}

// ================================
// HEART CHALLENGE GAME
// ================================

function startHeartChallenge() {
    showPage('heartChallengePage');
    heartsChallengeCount = 0;
    challengeTimeLeft = 30;
    document.getElementById('heartsChallengeCount').textContent = '0';
    document.getElementById('challengeTimer').textContent = '30';
    
    const challengeArea = document.getElementById('challengeArea');
    challengeArea.innerHTML = '';
    
    spawnChallengeHearts();
    
    challengeInterval = setInterval(() => {
        challengeTimeLeft--;
        document.getElementById('challengeTimer').textContent = challengeTimeLeft;
        
        if (challengeTimeLeft <= 0) {
            endHeartChallenge();
        }
    }, 1000);
}

function spawnChallengeHearts() {
    if (challengeTimeLeft <= 0) return;
    
    const challengeArea = document.getElementById('challengeArea');
    const heart = document.createElement('div');
    heart.className = 'challenge-heart';
    heart.textContent = '❤️';
    
    const randomX = Math.random() * (challengeArea.offsetWidth - 40);
    const randomY = Math.random() * (challengeArea.offsetHeight - 40);
    
    heart.style.left = randomX + 'px';
    heart.style.top = randomY + 'px';
    
    heart.onclick = () => clickChallengeHeart(heart);
    challengeArea.appendChild(heart);
    
    setTimeout(() => spawnChallengeHearts(), 300);
}

function clickChallengeHeart(heart) {
    heart.classList.add('clicked');
    heartsChallengeCount++;
    document.getElementById('heartsChallengeCount').textContent = heartsChallengeCount;
    
    setTimeout(() => heart.remove(), 300);
    
    if (heartsChallengeCount >= 10) {
        endHeartChallenge();
    }
}

function endHeartChallenge() {
    clearInterval(challengeInterval);
    
    if (heartsChallengeCount >= 10) {
        showRewardOverlay(
            'You Always Find Me! 🎯',
            'You always find your way to me. No matter where I hide, you seek me out. That\'s what I love about you.',
            rewardPhoto()
        );
    } else {
        showRewardOverlay(
            'Time\'s Up! ⏰',
            'You caught ' + heartsChallengeCount + ' hearts! Try again if you\'d like - I\'ll always love you no matter what.',
            rewardPhoto()
        );
    }
}

// ================================
// REWARD OVERLAY
// ================================

function showRewardOverlay(title, message, imageUrl) {
    document.getElementById('rewardTitle').textContent = title;
    document.getElementById('rewardMessage').textContent = message;
    const rewardImage = document.getElementById('rewardImage');
    rewardImage.src = safePhoto(imageUrl);
    bindPhotoFallback(rewardImage);
    
    const overlay = document.getElementById('rewardOverlay');
    overlay.classList.remove('hidden');
}

function closeReward() {
    const overlay = document.getElementById('rewardOverlay');
    overlay.classList.add('hidden');
    backToGameSelect();
}

// ================================
// MUSIC FUNCTIONALITY
// ================================

function syncMusicButton() {
    const musicBtn = document.getElementById('musicBtn');
    if (!musicBtn) return;

    if (isMusicPlaying) {
        musicBtn.classList.remove('muted');
        musicBtn.textContent = '🔊';
    } else {
        musicBtn.classList.add('muted');
        musicBtn.textContent = '🔇';
    }
}

function playBackgroundMusic() {
    const audio = document.getElementById('backgroundMusic');
    if (!audio) return;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise
            .then(() => {
                isMusicPlaying = true;
                syncMusicButton();
            })
            .catch(() => {
                isMusicPlaying = false;
                syncMusicButton();
            });
    } else {
        isMusicPlaying = true;
        syncMusicButton();
    }
}

function toggleMusic() {
    const audio = document.getElementById('backgroundMusic');
    if (!audio) return;
    
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
        syncMusicButton();
    } else {
        playBackgroundMusic();
    }
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    createFloatingHearts();
    startFloatingPhotos();
    renderLandingPhotoStrip();
    initializeLandingGame();
    syncMusicButton();
    document.getElementById('musicBtn').addEventListener('click', toggleMusic);
    showPage('landingPage');
});
