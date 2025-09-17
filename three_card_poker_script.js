const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let playerHand = [];
let dealerHand = [];
let gameActive = false;
let playerWallet = 1000;
let houseWallet = 10000;
let anteBet = 0;
let pairPlusBet = 0;
let playBet = 0;

const messageEl = document.getElementById('message');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const playerWalletEl = document.getElementById('player-wallet');
const houseWalletEl = document.getElementById('house-wallet');
const anteInputEl = document.getElementById('ante-input');
const pairplusInputEl = document.getElementById('pairplus-input');
const chipsEl = document.getElementById('chips-container');
const newGameBtn = document.getElementById('new-game');
const foldBtn = document.getElementById('fold');
const playBtn = document.getElementById('play');
const rulesBtn = document.getElementById('rules');
const rulesModal = document.getElementById('rules-modal');
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
    if (['J', 'Q', 'K'].includes(card.value)) return 10 + (['J', 'Q', 'K'].indexOf(card.value) + 1);
    if (card.value === 'A') return 14;
    return parseInt(card.value);
}

// get hand rank
function getHandRank(hand) {
    let vals = hand.map(c => getCardValue(c)).sort((a, b) => a - b);
    let suits = hand.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = (vals[2] - vals[0] === 2 && new Set(vals).size === 3) || (vals[0] === 2 && vals[1] === 3 && vals[2] === 14);
    let sortedVals = vals.sort((a, b) => b - a);
    if (isStraight && vals[0] === 2 && vals[1] === 3 && vals[2] === 14) sortedVals = [3, 2, 1];
    const isThreeKind = vals[0] === vals[2];
    const isPair = (vals[0] === vals[1] || vals[1] === vals[2]) && !isThreeKind;
    let type = 'High Card';
    if (isThreeKind) type = 'Three of a Kind';
    else if (isStraight && isFlush) type = 'Straight Flush';
    else if (isStraight) type = 'Straight';
    else if (isFlush) type = 'Flush';
    else if (isPair) type = 'Pair';
    return { type, values: sortedVals };
}

// compare hands
function compareHands(p, d) {
    const rankOrder = { 'Straight Flush': 6, 'Three of a Kind': 5, 'Straight': 4, 'Flush': 3, 'Pair': 2, 'High Card': 1 };
    const pOrder = rankOrder[p.type];
    const dOrder = rankOrder[d.type];
    if (pOrder > dOrder) return 1;
    if (pOrder < dOrder) return -1;
    for (let i = 0; i < 3; i++) {
        if (p.values[i] > d.values[i]) return 1;
        if (p.values[i] < d.values[i]) return -1;
    }
    return 0;
}

// is dealer qualified
function isQualified(hand) {
    const rank = getHandRank(hand);
    if (rank.type !== 'High Card') return true;
    return rank.values[0] >= 12; // Q or higher
}

// ante bonus
function getAnteBonus(rank) {
    const bonuses = {
        'Straight': 1,
        'Three of a Kind': 4,
        'Straight Flush': 5
    };
    return bonuses[rank.type] || 0;
}

// pair plus payout
function getPairPlusPayout(rank) {
    const payouts = {
        'Pair': 1,
        'Flush': 4,
        'Straight': 6,
        'Three of a Kind': 30,
        'Straight Flush': 40
    };
    return payouts[rank.type] || 0;
}

// display function
function displayCard(card, container, hidden = false) {
    const cardEl = document.createElement('div');
    cardEl.classList.add('card');
    cardEl.textContent = hidden ? '🂠' : `${card.value}${card.suit}`;
    container.appendChild(cardEl);
}

// update display
function updateDisplay(reveal = false) {
    playerCardsEl.innerHTML = '';
    playerHand.forEach(card => displayCard(card, playerCardsEl));
    dealerCardsEl.innerHTML = '';
    if (!reveal) {
        for (let i = 0; i < 3; i++) {
            displayCard(null, dealerCardsEl, true);
        }
    } else {
        dealerHand.forEach(card => displayCard(card, dealerCardsEl));
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

// end game
function endGame() {
    foldBtn.disabled = true;
    playBtn.disabled = true;
    newGameBtn.disabled = false;
    if (playerWallet <= 0) {
        messageEl.textContent += ' You are bankrupt! Game Over.';
        newGameBtn.disabled = true;
    } else if (houseWallet <= 0) {
        messageEl.textContent += ' You bankrupted the house! Congratulations!';
        newGameBtn.disabled = true;
    }
}

// startfunction
function startGame() {
    anteBet = parseInt(anteInputEl.value);
    pairPlusBet = parseInt(pairplusInputEl.value);
    if (isNaN(anteBet) || anteBet < 5 || anteBet > playerWallet || isNaN(pairPlusBet) || pairPlusBet < 0) {
        alert('Invalid bets! Ante must be at least $5 and not exceed your wallet. Pair Plus optional >=0.');
        return;
    }
    const totalBet = anteBet + pairPlusBet;
    if (totalBet > playerWallet) {
        alert('Bets exceed wallet!');
        return;
    }
    playerWallet -= totalBet;
    createDeck();
    playerHand = [deck.pop(), deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop(), deck.pop()];
    gameActive = true;
    foldBtn.disabled = false;
    playBtn.disabled = false;
    newGameBtn.disabled = true;
    messageEl.textContent = 'Fold or Play?';
    displayChips(totalBet);
    updateWallets();
    updateDisplay(false);
}

// fold
function fold() {
    gameActive = false;
    const rank = getHandRank(playerHand);
    const pairPlusPayout = getPairPlusPayout(rank);
    playerWallet += pairPlusPayout * pairPlusBet;
    houseWallet += anteBet;
    messageEl.textContent = 'You folded. ';
    if (pairPlusPayout > 0) messageEl.textContent += `Pair Plus wins $${pairPlusPayout * pairPlusBet}.`;
    updateWallets();
    updateDisplay(true);
    endGame();
}

// play
function play() {
    if (playerWallet < anteBet) {
        alert('Not enough for Play bet!');
        return;
    }
    playBet = anteBet;
    playerWallet -= playBet;
    displayChips(anteBet + pairPlusBet + playBet);
    updateWallets();
    gameActive = false;
    updateDisplay(true);
    const playerRank = getHandRank(playerHand);
    const dealerRank = getHandRank(dealerHand);
    let msg = '';
    const anteBonus = getAnteBonus(playerRank);
    playerWallet += anteBonus * anteBet;
    houseWallet -= anteBonus * anteBet;
    if (anteBonus > 0) msg += `Ante Bonus: $${anteBonus * anteBet}. `;
    const pairPlusPayout = getPairPlusPayout(playerRank);
    playerWallet += pairPlusPayout * pairPlusBet;
    houseWallet -= pairPlusPayout * pairPlusBet;
    if (pairPlusPayout > 0) msg += `Pair Plus: $${pairPlusPayout * pairPlusBet}. `;
    const qualifies = isQualified(dealerHand);
    if (!qualifies) {
        msg += 'Dealer does not qualify. Ante wins, Play pushes.';
        playerWallet += anteBet; // win 1:1
        houseWallet -= anteBet;
        playerWallet += playBet; // push
    } else {
        const compare = compareHands(playerRank, dealerRank);
        if (compare > 0) {
            msg += 'You win! Ante and Play pay 1:1.';
            playerWallet += anteBet + playBet;
            houseWallet -= anteBet + playBet;
        } else if (compare === 0) {
            msg += 'Tie. Push.';
            playerWallet += anteBet + playBet; // push
        } else {
            msg += 'Dealer wins.';
            houseWallet += anteBet + playBet;
        }
    }
    messageEl.textContent = msg;
    updateWallets();
    endGame();
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
foldBtn.addEventListener('click', fold);
playBtn.addEventListener('click', play);
rulesBtn.addEventListener('click', showRules);
closeModal.addEventListener('click', closeRules);

// Initialize wallets
updateWallets();