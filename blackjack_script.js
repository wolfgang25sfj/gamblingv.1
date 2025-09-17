const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let playerHands = [];
let dealerHand = [];
let gameActive = false;
let playerWallet = 1000;
let houseWallet = 10000;
let handBets = [];
let numHands = 1;
let currentHandIndex = 0;
let splitActive = false;
let currentBet = 0;

const messageEl = document.getElementById('message');
const dealerCardsEl = document.getElementById('dealer-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerHand1TitleEl = document.getElementById('player-hand1-title');
const playerCardsEl1 = document.getElementById('player-cards1');
const playerHand2El = document.getElementById('player-hand2');
const playerHand2TitleEl = document.getElementById('player-hand2-title');
const playerCardsEl2 = document.getElementById('player-cards2');
const playerWalletEl = document.getElementById('player-wallet');
const houseWalletEl = document.getElementById('house-wallet');
const betInputEl = document.getElementById('bet-input');
const chipsEl = document.getElementById('chips-container');
const newGameBtn = document.getElementById('new-game');
const hitBtn = document.getElementById('hit');
const standBtn = document.getElementById('stand');
const doubleBtn = document.getElementById('double');
const splitBtn = document.getElementById('split');
const rulesBtn = document.getElementById('rules');
const closeModal = document.getElementById('close-modal');

// deck creation
function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    deck = deck.sort(() => Math.random() - 0.5);
}

// value of face cards
function getCardValue(card) {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
}

// value of hand
function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (let card of hand) {
        if (card.value === 'A') aces++;
        score += getCardValue(card);
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

// display function
function displayCard(card, container, hidden = false) {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    cardEl.textContent = hidden ? '🂠' : `${card.value}${card.suit}`;
    container.appendChild(cardEl);
}

// update display
function updateDisplay() {
    dealerCardsEl.innerHTML = '';
    dealerHand.forEach((card, index) => {
        displayCard(card, dealerCardsEl, index === 0 && gameActive);
    });
    dealerScoreEl.textContent = gameActive ? '?' : calculateScore(dealerHand);

    // player hand 1
    playerCardsEl1.innerHTML = '';
    playerHands[0].forEach(card => displayCard(card, playerCardsEl1));
    const score1 = calculateScore(playerHands[0]);

    if (splitActive) {
        playerHand1TitleEl.innerHTML = `Player's Hand 1: <span id="player-score1">${score1}</span>`;
        playerHand2El.style.display = 'block';
        playerCardsEl2.innerHTML = '';
        playerHands[1].forEach(card => displayCard(card, playerCardsEl2));
        const score2 = calculateScore(playerHands[1]);
        playerHand2TitleEl.innerHTML = `Player's Hand 2: <span id="player-score2">${score2}</span>`;
    } else {
        playerHand1TitleEl.innerHTML = `Player's Hand: <span id="player-score1">${score1}</span>`;
        playerHand2El.style.display = 'none';
    }
}

// display chips
function displayChips(amount) {
    chipsEl.innerHTML = '';
    if (amount > 0) {
        const chip = document.createElement('img');
        chip.classList.add('chip');
        chip.src = 'chip.png'; // Replace with actual path to poker chip image
        chip.alt = 'Poker Chip';
        chipsEl.appendChild(chip);

        const betLabel = document.createElement('div');
        betLabel.classList.add('bet-label');
        betLabel.textContent = `$${amount}`;
        chipsEl.appendChild(betLabel);
    }
}

// update wallets
function updateWallets() {
    playerWalletEl.textContent = playerWallet;
    houseWalletEl.textContent = houseWallet;
}

// complete player turn and evaluate
function completePlayerTurn() {
    gameActive = false;
    let anyBlackjack = false;
    for (let i = 0; i < numHands; i++) {
        if (!splitActive && i === 0 && playerHands[i].length === 2 && calculateScore(playerHands[i]) === 21) {
            anyBlackjack = true;
            break;
        }
    }

    let dealerScore = calculateScore(dealerHand);
    if (!anyBlackjack) {
        while (dealerScore < 17) {
            dealerHand.push(deck.pop());
            dealerScore = calculateScore(dealerHand);
        }
    }
    updateDisplay();

    let totalMessage = '';
    for (let i = 0; i < numHands; i++) {
        const pScore = calculateScore(playerHands[i]);
        let handMsg = '';
        let multiplier = 0;
        const isBlackjack = (!splitActive && i === 0 && playerHands[i].length === 2 && pScore === 21);
        const isDealerBlackjack = (dealerHand.length === 2 && dealerScore === 21);

        if (pScore > 21) {
            handMsg = 'Bust! You lose.';
            multiplier = 0;
        } else if (isBlackjack) {
            if (isDealerBlackjack) {
                handMsg = 'Both Blackjack! Push (tie).';
                multiplier = 1;
            } else {
                handMsg = 'Blackjack! You win!';
                multiplier = 2.5;
            }
        } else {
            if (dealerScore > 21) {
                handMsg = 'Dealer busts! You win!';
                multiplier = 2;
            } else if (dealerScore > pScore) {
                handMsg = 'Dealer wins.';
                multiplier = 0;
            } else if (pScore > dealerScore) {
                handMsg = 'You win!';
                multiplier = 2;
            } else {
                handMsg = 'Push (tie).';
                multiplier = 1;
            }
        }
        totalMessage += `Hand ${i + 1}: ${handMsg} `;

        const thisBet = handBets[i];
        playerWallet += multiplier * thisBet;
        if (multiplier === 0) {
            houseWallet += thisBet;
        } else if (multiplier > 1) {
            houseWallet -= (multiplier - 1) * thisBet;
        }
    }

    messageEl.textContent = totalMessage;
    updateWallets();
    updateDisplay();

    // Check bankruptcy
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    splitBtn.disabled = true;
    newGameBtn.disabled = false;
    if (playerWallet <= 0) {
        messageEl.textContent += ' You are bankrupt! Game Over.';
        newGameBtn.disabled = true;
    } else if (houseWallet <= 0) {
        messageEl.textContent = 'You bankrupted the house! Congratulations!';
        newGameBtn.disabled = true;
    }
}

// next hand
function nextHand() {
    currentHandIndex++;
    if (currentHandIndex < numHands) {
        messageEl.textContent = `Now play Hand ${currentHandIndex + 1}. Hit or Stand?`;
        hitBtn.disabled = false;
        standBtn.disabled = false;
        const handLength = playerHands[currentHandIndex].length;
        doubleBtn.disabled = !((handLength === 1 || handLength === 2) && playerWallet >= handBets[currentHandIndex]);
        splitBtn.disabled = !(handLength === 2 && getCardValue(playerHands[currentHandIndex][0]) === getCardValue(playerHands[currentHandIndex][1]) && playerWallet >= handBets[currentHandIndex]);
        updateDisplay();
    } else {
        completePlayerTurn();
    }
}

// finish current hand
function finishCurrentHand(isBust = false) {
    if (isBust) {
        messageEl.textContent = `Bust on Hand ${currentHandIndex + 1}!`;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        splitBtn.disabled = true;
    } else {
        messageEl.textContent = `Stand on Hand ${currentHandIndex + 1}.`;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        splitBtn.disabled = true;
    }
    if (splitActive && currentHandIndex < numHands - 1) {
        nextHand();
    } else {
        completePlayerTurn();
    }
}

// start function
function startGame() {
    const bet = parseInt(betInputEl.value);
    if (isNaN(bet) || bet < 5 || bet > playerWallet) {
        alert('Invalid bet! Must be at least $5 and not exceed your wallet.');
        return;
    }
    currentBet = bet;
    createDeck();
    playerHands = [[deck.pop(), deck.pop()]];
    dealerHand = [deck.pop(), deck.pop()];
    playerWallet -= bet;
    handBets = [bet];
    numHands = 1;
    currentHandIndex = 0;
    splitActive = false;
    gameActive = true;
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = !(playerHands[0].length === 2 && playerWallet >= bet);
    splitBtn.disabled = true;
    newGameBtn.disabled = true;
    messageEl.textContent = 'Hit or Stand?';
    displayChips(bet);
    updateWallets();
    updateDisplay();

    const playerScore = calculateScore(playerHands[0]);
    if (playerScore === 21 && playerHands[0].length === 2) {
        completePlayerTurn();
        return;
    }

    const card1Val = getCardValue(playerHands[0][0]);
    const card2Val = getCardValue(playerHands[0][1]);
    if (card1Val === card2Val) {
        splitBtn.disabled = !(playerWallet >= bet);
    }

    const dealerScore = calculateScore(dealerHand);
    if (dealerScore === 21 && dealerHand.length === 2) {
        completePlayerTurn();
        return;
    }
}

// split function
function split() {
    if (numHands > 1 || playerHands[0].length !== 2 || getCardValue(playerHands[0][0]) !== getCardValue(playerHands[0][1]) || playerWallet < handBets[0]) {
        return;
    }
    const secondCard = playerHands[0].pop();
    playerHands.push([secondCard]);
    handBets.push(handBets[0]);
    playerWallet -= handBets[0];
    numHands = 2;
    splitActive = true;
    currentHandIndex = 0;
    splitBtn.disabled = true;
    doubleBtn.disabled = !(playerHands[0].length === 1 && playerWallet >= handBets[0]);
    messageEl.textContent = 'Split! Hit or Stand for Hand 1?';
    displayChips(handBets.reduce((a, b) => a + b, 0));
    updateWallets();
    updateDisplay();
}

// hit function
function hit() {
    if (!gameActive) return;
    const currentHand = playerHands[currentHandIndex];
    currentHand.push(deck.pop());
    updateDisplay();
    const handLength = currentHand.length;
    doubleBtn.disabled = !((handLength === 1 || handLength === 2) && playerWallet >= handBets[currentHandIndex]);
    splitBtn.disabled = true;
    const playerScore = calculateScore(currentHand);
    if (playerScore > 21) {
        finishCurrentHand(true);
    }
}

// double down
function doubleDown() {
    const handLength = playerHands[currentHandIndex].length;
    if (!gameActive || (handLength !== 1 && handLength !== 2) || playerWallet < handBets[currentHandIndex]) return;
    const handIndex = currentHandIndex;
    const betForHand = handBets[handIndex];
    playerWallet -= betForHand;
    handBets[handIndex] *= 2;
    displayChips(handBets.reduce((a, b) => a + b, 0));
    updateWallets();
    playerHands[handIndex].push(deck.pop());
    updateDisplay();
    const scoreAfter = calculateScore(playerHands[handIndex]);
    if (scoreAfter > 21) {
        messageEl.textContent = `Double down bust on Hand ${currentHandIndex + 1}!`;
        finishCurrentHand(true);
    } else {
        messageEl.textContent = `Doubled down on Hand ${currentHandIndex + 1}. Stand.`;
        finishCurrentHand(false);
    }
}

// stand function
function stand() {
    if (!gameActive) return;
    finishCurrentHand(false);
}

// show rules modal
function showRules() {
    rulesModal.style.display = 'block';
}

// close rules modal
function closeRules() {
    rulesModal.style.display = 'none';
}

// button events
newGameBtn.addEventListener('click', startGame);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
doubleBtn.addEventListener('click', doubleDown);
splitBtn.addEventListener('click', split);
rulesBtn.addEventListener('click', showRules);
closeModal.addEventListener('click', closeRules);

// Initialize wallets
updateWallets();