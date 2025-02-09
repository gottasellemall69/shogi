// game.js

// Define initial board setup for Shogi
const initialBoard = [
    ["l", "n", "s", "g", "k", "g", "s", "n", "l"],
    [" ", "r", " ", " ", " ", " ", " ", "b", " "],
    ["p", "p", "p", "p", "p", "p", "p", "p", "p"],
    [" ", " ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " ", " "],
    ["P", "P", "P", "P", "P", "P", "P", "P", "P"],
    [" ", "B", " ", " ", " ", " ", " ", "R", " "],
    ["L", "N", "S", "G", "K", "G", "S", "N", "L"],
  ];

  

let board = JSON.parse(JSON.stringify(initialBoard));
let currentPlayer = 'player';

// Set up HTML elements for the board
const boardElement = document.getElementById('board');

// Render the board
function renderBoard() {
    boardElement.innerHTML = '';
    board.forEach((row, y) => {
        row.forEach((piece, x) => {
            const square = document.createElement('div');
            square.classList.add('square');
            square.dataset.x = x;
            square.dataset.y = y;
            square.textContent = piece;
            square.addEventListener('click', () => selectPiece(x, y));
            boardElement.appendChild(square);
        });
    });
}

// Select piece logic
let selectedPiece = null;
function selectPiece(x, y) {
    if (selectedPiece) {
        movePiece(selectedPiece.x, selectedPiece.y, x, y);
        selectedPiece = null;
    } else if (board[y][x] !== ' ') {
        selectedPiece = { x, y };
    }
}

// Check for promotion and apply if necessary
function checkPromotion(piece, x, y) {
    const inOpponentZone = (currentPlayer === 'player' && y < 3) || (currentPlayer === 'opponent' && y > 5);
    if (pieceMovements[piece].promotable && inOpponentZone) {
        return confirm("Promote this piece?") ? promote(piece) : piece;
    }
    return piece;
}

// Promote a piece by returning its promoted form
function promote(piece) {
    const promotionMap = { 'P': 'P+', 'L': 'L+', 'N': 'N+', 'S': 'S+' }; // Define promotions
    return promotionMap[piece] || piece;
}


function selectSquare(x, y) {
    const selectedPiece = board[y][x];
    if ((currentPlayer === 'player' && selectedPiece === selectedPiece.toUpperCase()) ||
        (currentPlayer === 'opponent' && selectedPiece === selectedPiece.toLowerCase())) {
        document.addEventListener('click', event => handleMove(x, y), { once: true });
    }
}

function handleMove(fromX, fromY) {
    document.addEventListener('click', event => {
        const [toX, toY] = getBoardCoordinates(event);
        movePiece(fromX, fromY, toX, toY);
    }, { once: true });
}

// Update movePiece to handle promotion
function movePiece(fromX, fromY, toX, toY) {
    let piece = board[fromY][fromX];

    if (isValidMove(piece, fromX, fromY, toX, toY)) {
        const originalDestination = board[toY][toX];

        // Simulate move
        board[toY][toX] = piece;
        board[fromY][fromX] = ' ';

        // Check if the move leaves the King in check
        if (!isKingInCheck(currentPlayer)) {
            piece = checkPromotion(piece, toX, toY);  // Handle promotion
            if (originalDestination !== ' ') capturePiece(originalDestination);  // Capture if necessary

            switchTurn();
            renderBoard();
        } else {
            // Revert the move if it puts the King in check
            board[toY][toX] = originalDestination;
            board[fromY][fromX] = piece;
            alert("Invalid move: Your King would be in check!");
        }
    }
}


// Check if the current player's king is in check
function isKingInCheck(player) {
    const king = player === 'player' ? 'K' : 'k';
    let kingPos = null;

    // Locate the King on the board
    board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell === king) kingPos = { x, y };
    }));

    if (!kingPos) return true; // King is missing, treated as in check

    return isSquareUnderAttack(kingPos.x, kingPos.y, player);
}


function isSquareUnderAttack(x, y, player) {
    const opponent = player === 'player' ? 'opponent' : 'player';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = board[row][col];
            if (isOpponentPiece(piece, opponent) && isValidMove(piece, col, row, x, y)) {
                return true;  // Square is under attack
            }
        }
    }
    return false;  // Safe square
}


function isOpponentPiece(piece, opponent) {
    return opponent === 'player' ? piece.toLowerCase() === piece : piece.toUpperCase() === piece;
}

// Select a captured piece for drop
function selectDropPiece(piece) {
    if (currentPlayer === 'player' && capturedPieces.player.includes(piece)) {
        document.addEventListener('click', (event) => {
            const [x, y] = getBoardCoordinates(event); // Assume getBoardCoordinates fetches board x, y
            if (board[y][x] === ' ' && isValidDrop(piece, x, y)) {
                dropPiece(piece, x, y);
            }
        }, { once: true });
    }
}

// Handle piece drop
function dropPiece(piece, x, y) {
    board[y][x] = currentPlayer === 'player' ? piece.toUpperCase() : piece.toLowerCase();  // Place piece on board

    // Remove from captured pieces
    capturedPieces[currentPlayer] = capturedPieces[currentPlayer].filter(p => p !== piece);

    switchTurn();  // Change turn
    renderBoard();  // Update board visually
    renderCapturedPieces();  // Update captured pieces display
}


function isValidDrop(piece, x, y) {
    // Ensure the target square is empty
    if (board[y][x] !== ' ') return false;

    const normalizedPiece = piece.toLowerCase();

    // Pawn drop restrictions
    if (normalizedPiece === 'p') {
        // 1. No two pawns in the same column
        for (let row = 0; row < 9; row++) {
            if (board[row][x].toLowerCase() === 'p' && !board[row][x].includes('+')) {
                return false;  // Found another unpromoted pawn in the same column
            }
        }

        // 2. Can't drop pawn to checkmate (Uchi-fu)
        board[y][x] = currentPlayer === 'player' ? 'P' : 'p';  // Temporarily place pawn
        if (isKingInCheck(currentPlayer === 'player' ? 'opponent' : 'player') && isCheckmate()) {
            board[y][x] = ' ';  // Revert pawn
            return false;  // Illegal pawn drop that causes immediate checkmate
        }
        board[y][x] = ' ';  // Revert pawn
    }

    // Knights can't be dropped on last two rows (no legal moves)
    if (normalizedPiece === 'n' && ((currentPlayer === 'player' && y <= 1) || (currentPlayer === 'opponent' && y >= 7))) {
        return false;
    }

    // Lances and Pawns can't be dropped on last row
    if (['l', 'p'].includes(normalizedPiece) && ((currentPlayer === 'player' && y === 0) || (currentPlayer === 'opponent' && y === 8))) {
        return false;
    }

    return true;  // Valid drop
}


function checkForCheckmate() {
    if (isKingInCheck(currentPlayer) && !hasLegalMoves(currentPlayer)) {
        alert(`${currentPlayer === 'player' ? 'Opponent' : 'Player'} wins by checkmate!`);
        resetGame();
    }
}


// Shogi piece movement definitions
const pieceMovements = {
    p: {
      moves: [[0, 1]], // Black pawn can only move down one square
      promotions: "g",
    }, // Black pawn
    P: {
      moves: [[0, -1]], // Pawn can only move forward one square
      promotions: "G",
    }, // White pawn
    l: {
      moves: "forward", // Lance can move any number of squares forward
      promotions: "g",
    },
    L: {
      moves: "forward",
      promotions: "G",
    },
    n: {
      moves: [
        [1, 2], // Knight's "L" shaped movement, only forward
        [-1, 2],
      ],
      promotions: "g",
    },
    N: {
      moves: [
        [1, 2],
        [-1, 2],
      ],
      promotions: "G",
    },
    s: {
      moves: [
        [1], // Silver General's movement
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1],
      ],
      promotions: "g",
    },
    S: {
      moves: [
        [0, -1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ],
      promotions: "G",
    },
    g: {
      moves: [
        [1], // Gold General's movement
        [1, 1],
        [1],
        [1, -1],
        [0, -1],
        [-1, 0],
      ],
    }, // Gold general
    G: {
      moves: [
        [0, -1],
        [1, -1],
        [1],
        [1, 1],
        [1],
        [-1, 0],
      ],
    },
    b: { moves: "diagonal", promotions: "h" }, // Bishop moves diagonally
    B: { moves: "diagonal", promotions: "H" },
    r: { moves: "orthogonal", promotions: "d" }, // Rook moves orthogonally
    R: { moves: "orthogonal", promotions: "D" },
    k: {
      moves: [
        [1], // King can move one square in any direction
        [1, 1],
        [1],
        [1, -1],
        [0, -1],
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [-1]
      ],
    },
    K: {
      moves: [
        [0, -1],
        [1, -1],
        [1],
        [1, 1],
        [1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [-1]
      ],
    },
    h: { moves: "diagonalKing" }, // Promoted Bishop (Horse)
    H: { moves: "diagonalKing" },
    d: { moves: "orthogonalKing" }, // Promoted Rook (Dragon)
    D: { moves: "orthogonalKing" },
  };

// Check if move is valid based on piece type
function isValidMove(piece, fromX, fromY, toX, toY) {
    if (!pieceMovements[piece]) return false; // If the piece has no defined movement, reject the move

    const movement = pieceMovements[piece].moves;
    const isPromoted = piece.includes("+");
    const basePiece = piece.replace("+", "").toLowerCase();

    const dx = toX - fromX;
    const dy = toY - fromY;

    // Handle special sliding pieces
    if (["r", "b", "l"].includes(basePiece)) {
        return isValidLineMove(piece, fromX, fromY, toX, toY);
    }

    // Handle regular movement
    const possibleMoves = isPromoted
        ? pieceMovements[basePiece].promoted || pieceMovements[basePiece].normal
        : pieceMovements[basePiece].normal;

    return possibleMoves.some(([mx, my]) => dx === mx && dy === my);
}


// Validate line moves (e.g., for Rook and Bishop)
function isValidLineMove(piece, fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const isRook = piece.toLowerCase() === "r";
    const isBishop = piece.toLowerCase() === "b";
    const isLance = piece.toLowerCase() === "l";

    if (isRook && (dx !== 0 && dy !== 0)) return false;
    if (isBishop && Math.abs(dx) !== Math.abs(dy)) return false;
    if (isLance && dx !== 0) return false;

    // Step size for movement
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    let x = fromX + stepX;
    let y = fromY + stepY;
    while (x !== toX || y !== toY) {
        if (board[y][x] !== " ") return false; // Blocked path
        x += stepX;
        y += stepY;
    }
    return true;
}

function isValidKnightMove(piece, fromX, fromY, toX, toY) {
    const moves = piece === "n"
        ? [[-1, -2], [1, -2]] // Sente Knight moves forward two, then left/right
        : [[-1, 2], [1, 2]];  // Gote Knight moves downward two, then left/right

    return moves.some(([dx, dy]) => fromX + dx === toX && fromY + dy === toY);
}



let capturedPieces = { player: [], opponent: [] };

// Capture a piece and store it
function capturePiece(piece) {
    const owner = currentPlayer === 'player' ? 'opponent' : 'player';
    const demotedPiece = piece.replace('+', '').toLowerCase();  // Demote and normalize the captured piece
    capturedPieces[owner].push(demotedPiece);  // Add to captured list
    renderCapturedPieces();  // Update UI
}


// Render captured pieces in the captured pieces area
function renderCapturedPieces() {
    const playerDiv = document.getElementById('player-captured');
    const opponentDiv = document.getElementById('opponent-captured');

    playerDiv.innerHTML = 'Player\'s Captured Pieces: ';
    opponentDiv.innerHTML = 'Opponent\'s Captured Pieces: ';

    // Render player-captured pieces
    capturedPieces.player.forEach(piece => {
        const pieceEl = document.createElement('span');
        pieceEl.textContent = piece.toUpperCase();  // Display in uppercase for clarity
        pieceEl.onclick = () => selectDropPiece(piece);
        playerDiv.appendChild(pieceEl);
    });

    // Render opponent-captured pieces
    capturedPieces.opponent.forEach(piece => {
        const pieceEl = document.createElement('span');
        pieceEl.textContent = piece.toLowerCase();  // Display in lowercase for clarity
        opponentDiv.appendChild(pieceEl);
    });
}




// Check if player has any legal moves
function hasLegalMoves(player) {
    const pieces = findPlayerPieces(player);

    for (const { piece, x, y } of pieces) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const toX = x + dx;
                const toY = y + dy;

                if (isValidMove(piece, x, y, toX, toY) && !isKingInCheckAfterMove(player, x, y, toX, toY)) {
                    return true;  // Found a legal move
                }
            }
        }
    }
    return false;  // No legal moves available
}


// Simulate if the king would be in check after moving
function isKingInCheckAfterMove(player, fromX, fromY, toX, toY) {
    const tempPiece = board[toY][toX];
    board[toY][toX] = board[fromY][fromX];
    board[fromY][fromX] = ' ';
    const inCheck = isKingInCheck(player);
    board[fromY][fromX] = board[toY][toX];
    board[toY][toX] = tempPiece;
    return inCheck;
}

// Find all pieces belonging to the current player
function findPlayerPieces(player) {
    const pieces = [];
    board.forEach((row, y) => row.forEach((cell, x) => {
        if ((player === 'player' && cell === cell.toUpperCase()) || (player === 'opponent' && cell === cell.toLowerCase())) {
            pieces.push({ piece: cell, x, y });
        }
    }));
    return pieces;
}



// Switch turns
function switchTurn() {
    currentPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
}

// Reset game
document.getElementById('reset-game').addEventListener('click', () => {
    board = JSON.parse(JSON.stringify(initialBoard));
    currentPlayer = 'player';
    renderBoard();
});

// Initial render
renderBoard();









  









  