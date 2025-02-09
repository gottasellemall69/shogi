import Image from "next/image";
import React, { useState, useEffect, useCallback, useRef } from "react";

// Initial Shogi board setup
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

// Piece images mapped to their symbols
const pieceImages = {
  p: "/images/pieces/Pawn.svg", P: "/images/pieces/Pawn.svg",
  "p+": "/images/pieces/Pawn+.svg", "P+": "/images/pieces/Pawn+.svg",
  l: "/images/pieces/Lance.svg", L: "/images/pieces/Lance.svg",
  "l+": "/images/pieces/Lance+.svg", "L+": "/images/pieces/Lance+.svg",
  n: "/images/pieces/Knight.svg", N: "/images/pieces/Knight.svg",
  "n+": "/images/pieces/Knight+.svg", "N+": "/images/pieces/Knight+.svg",
  s: "/images/pieces/SilverGeneral.svg", S: "/images/pieces/SilverGeneral.svg",
  "s+": "/images/pieces/SilverGeneral+.svg", "S+": "/images/pieces/SilverGeneral+.svg",
  g: "/images/pieces/GoldGeneral.svg", G: "/images/pieces/GoldGeneral.svg",
  b: "/images/pieces/Bishop.svg", B: "/images/pieces/Bishop.svg",
  "b+": "/images/pieces/Bishop+.svg", "B+": "/images/pieces/Bishop+.svg",
  r: "/images/pieces/Rook.svg", R: "/images/pieces/Rook.svg",
  "r+": "/images/pieces/Rook+.svg", "R+": "/images/pieces/Rook+.svg",
  k: "/images/pieces/_king.svg", K: "/images/pieces/King.svg",
};

// Main ShogiBoard component
const ShogiBoard = () => {
  // State management
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("gote"); // Gote starts
  const [selectedPiece, setSelectedPiece] = useState(null); // Currently selected piece
  const [possibleMoves, setPossibleMoves] = useState([]); // Legal moves for selected piece
  const [capturedGote, setCapturedGote] = useState([]); // Pieces captured by Gote
  const [capturedSente, setCapturedSente] = useState([]); // Pieces captured by Sente
  const [moveHistory, setMoveHistory] = useState([]); // Move history for undo/redo
  const [undoIndex, setUndoIndex] = useState(0); // Current position in move history

  const BOARD_SIZE = 9;

    // Populate pieces with initial metadata
  useRef(() => {
    const initializePieces = () => {
      const initialPieces = {};
      initialBoard.forEach((row, x) => {
        row.forEach((piece, y) => {
          if (piece !== " ") {
            initialPieces[`${x}-${y}`] = {
              type: piece,
              state: "active", // Tracks if piece is "active" or "captured"
              position: { x, y },
            };
          }
        });
      });
      setPieces(initialPieces);
    };
    initializePieces();
  }, [initialBoard]);

  // Select a piece on the board
  const selectPiece = (x, y) => {
    const piece = board[x][y];
    const isCurrentPlayerPiece = currentPlayer === "gote" ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
    
    if (piece && isCurrentPlayerPiece) {
      setSelectedPiece({ x, y, piece });
      setPossibleMoves(getPossibleMoves(piece, x, y, board));
    } else {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  // Get all possible moves for the selected piece
  const getPossibleMoves = useCallback((piece, x, y, board) => {
    const isPromoted = piece.includes("+");
    const basePiece = piece.replace("+", "").toLowerCase();
    const isGote = piece === piece.toUpperCase();

    const pieceMovements = {
      p: {
        normal: [{ x: 0, y: 1 }], // Sente Pawn moves forward
        promoted: [
          { x: 0, y: 1 },  // Forward
          { x: 0, y: -1 }, // Backward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
          { x: 1, y: 1 },  // Diagonal forward-right
          { x: -1, y: 1 }, // Diagonal forward-left
        ],
      },
      P: {
        normal: [{ x: 0, y: -1 }], // Gote Pawn moves forward
        promoted: [
          { x: 0, y: -1 }, // Forward
          { x: 0, y: 1 },  // Backward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
          { x: 1, y: -1 }, // Diagonal forward-right
          { x: -1, y: -1 }, // Diagonal forward-left
        ],
      },
      l: {
        normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), // Sente Lance moves any number of squares forward
        promoted: [
          { x: 0, y: -1 }, // Backward
          { x: 0, y: 1 },  // Forward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
        ],
      },
      L: {
        normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), // Gote Lance moves any number of squares forward
        promoted: [
          { x: 0, y: -1 }, // Backward
          { x: 0, y: 1 },  // Forward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
        ],
      },
      n: {
        normal: [
          { x: 1, y: -2 }, // Sente Knight jumps forward
          { x: -1, y: -2 },
        ],
        promoted: [
          { x: 0, y: -1 }, // Backward
          { x: 0, y: 1 },  // Forward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
          { x: 1, y: -1 }, // Diagonal backward-right
          { x: -1, y: -1 }, // Diagonal backward-left
        ],
      },
      N: {
        normal: [
          { x: 1, y: 2 },  // Gote Knight jumps forward
          { x: -1, y: 2 },
        ],
        promoted: [
          { x: 0, y: 1 },  // Forward
          { x: 0, y: -1 }, // Backward
          { x: 1, y: 0 },  // Right
          { x: -1, y: 0 }, // Left
          { x: 1, y: 1 },  // Forward-right diagonal
          { x: -1, y: 1 }, // Forward-left diagonal
          { x: 1, y: -1 }, // Backward-right diagonal
          { x: -1, y: -1 }, // Backward-left diagonal
        ],
      },
      s: {
        normal: [
          { x: 0, y: 1 },  // Forward
          { x: 1, y: 1 },  // Forward-right
          { x: -1, y: 1 }, // Forward-left
          { x: 1, y: -1 }, // Backward-right
          { x: -1, y: -1 } // Backward-left
        ],
        promoted: [
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
        ],
      },
      S: {
        normal: [
          { x: 0, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
        promoted: [
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
        ],
      },
      g: {
        normal: [
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
      },
      G: {
        normal: [
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
      },
      b: {
        normal: [
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
        ],
        promoted: [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
        ],
      },
      B: {
        normal: [
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
        ],
        promoted: [
          { x: -1, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
        ],
      },
      r: {
        normal: [
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ],
        promoted: [
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ],
      },
      R: {
        normal: [
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -i + 1, y: 0 })),
        ],
        promoted: [
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: 1, y: 1 },
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
          ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
        ],
      },
      k: {
        normal: [
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
        ],
      },
      K: {
        normal: [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: 1, y: 1 },
        ],
      },
    };

    const isInBounds = (x, y) => x >= 0 && x < 9 && y >= 0 && y < 9;
    const canCapture = (newX, newY) => {
      const target = board[newX][newY];
      return target === " " || (isGote ? target === target.toLowerCase() : target === target.toUpperCase());
    };

    // Initialize moveSet before using
  const moveSet = isPromoted 
  ? pieceMovements[basePiece]?.promoted || pieceMovements[basePiece]?.normal 
  : pieceMovements[basePiece]?.normal;

const possibleMoves = [];

   // Handle sliding pieces (rook, bishop, lance)
    const handleSlidingMove = (startX, startY, dx, dy) => {
      let newX = startX + dx;
      let newY = startY + dy;

      while (isInBounds(newX, newY)) {
        const targetPiece = board[newX][newY];
        if (targetPiece === " ") {
          possibleMoves.push([newX, newY]);
        } else {
          if (canCapture(newX, newY)) {
            possibleMoves.push([newX, newY]);
          }
          break;
        }
        newX += dx;
        newY += dy;
      }
    };
  

    // Check each possible move based on piece type
    switch (basePiece) {
      case 'r': // Rook
        const rookDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        rookDirs.forEach(([dx, dy]) => handleSlidingMove(x, y, dx, dy));

        // Add king-like moves for promoted rook
        if (isPromoted) {
          [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (isInBounds(newX, newY) && canCapture(newX, newY)) {
              possibleMoves.push([newX, newY]);
            }
          });
        }
        break;

      case 'b': // Bishop
        const bishopDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        bishopDirs.forEach(([dx, dy]) => handleSlidingMove(x, y, dx, dy));

        // Add king-like moves for promoted bishop
        if (isPromoted) {
          [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (isInBounds(newX, newY) && canCapture(newX, newY)) {
              possibleMoves.push([newX, newY]);
            }
          });
        }
        break;

      case 'l': // Lance
        const direction = isGote ? -1 : 1;
        handleSlidingMove(x, y, direction, 0);
        break;

      case 'n': // Knight
        const knightMoves = isGote ?
          [[-2, -1], [-2, 1]] : // Gote knight
          [[2, -1], [2, 1]];    // Sente knight

        knightMoves.forEach(([dx, dy]) => {
          const newX = x + dx;
          const newY = y + dy;
          if (isInBounds(newX, newY) && canCapture(newX, newY)) {
            possibleMoves.push([newX, newY]);
          }
        });
        break;

      case 'p': // Pawn
        const pawnDir = isGote ? -1 : 1;
        const newX = x + pawnDir;
        if (isInBounds(newX, y) && canCapture(newX, y)) {
          possibleMoves.push([newX, y]);
        }
        if (isPromoted) {
          [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
            const newX = x + dx;
            const newY = y + dy;
            if (isInBounds(newX, newY) && canCapture(newX, newY)) {
              possibleMoves.push([newX, newY]);
            }
          });
        }
        break;

        default: // For non-sliding pieces like King, Gold, Silver, etc.
        if (moveSet && Array.isArray(moveSet)) {
          moveSet.forEach(({ x: dx, y: dy }) => {
            const newX = x + (isGote ? -dy : dy);  // Adjust for player perspective
            const newY = y + dx;
            if (isInBounds(newX, newY) && canCapture(newX, newY)) {
              possibleMoves.push([newX, newY]);
            }
          });
        } 
        break;
    }
  
    return possibleMoves;
  }, [board]);


  const movePiece = (targetX, targetY) => {
    if (!selectedPiece || !possibleMoves.some(([px, py]) => px === targetX && py === targetY)) return;
  
    const { x, y, piece } = selectedPiece;
    const updatedBoard = JSON.parse(JSON.stringify(board)); // Deep copy
  
    // Capture handling
    const capturedPiece = updatedBoard[targetX][targetY];
    if (capturedPiece !== " ") {
      const normalizedPiece = capturedPiece.replace("+", "");
      if (currentPlayer === "gote") {
        setCapturedGote([...capturedGote, normalizedPiece.toLowerCase()]);
      } else {
        setCapturedSente([...capturedSente, normalizedPiece.toUpperCase()]);
      }
    }
  
    // Clear original position
    updatedBoard[x][y] = " ";
  
    // Handle promotion logic
    if (shouldPromote(piece, targetX)) {
      const promotionChoice = window.confirm("Do you want to promote this piece?");
      updatedBoard[targetX][targetY] = promotionChoice && !piece.includes("+") ? piece + "+" : piece;
    } else {
      updatedBoard[targetX][targetY] = piece;
    }

    // Update the board and switch turns
    setBoard(updatedBoard);
    setCurrentPlayer(currentPlayer === "gote" ? "sente" : "gote");
    setSelectedPiece(null);
    setPossibleMoves([]);

    // Add move to history for undo/redo functionality
    setMoveHistory([...moveHistory.slice(0, undoIndex), { board: updatedBoard, player: currentPlayer }]);
    setUndoIndex(moveHistory.length + 1);

    // Check for victory condition after the move
    if (isVictory()) {
      alert(`${currentPlayer === "gote" ? "Sente" : "Gote"} wins!`);
      resetGame();
    }
  };

// Determine if a piece should promote based on its type and position
const shouldPromote = (piece, x) => {
  if (!piece || piece.includes("+")) return false; // Already promoted
  if (piece.toLowerCase() === 'k' || piece.toLowerCase() === 'g') return false; // Kings and Gold Generals don't promote

  const isGote = piece === piece.toUpperCase();

  // Mandatory promotion for Pawns, Lances, and Knights when reaching last ranks
  if (['p', 'l', 'n'].includes(piece.toLowerCase())) {
    if ((isGote && x === 0) || (!isGote && x === 8)) return true;
  }

  // Optional promotion when entering the promotion zone (3 farthest ranks)
  return isGote ? x <= 2 : x >= 6;
};

// Function to check if the current player is in check
const isInCheck = (player, tempBoard = board) => {
  const kingPiece = player === "gote" ? "K" : "k";
  const kingPosition = findKingPosition(kingPiece, tempBoard);

  if (!kingPosition) {
    // King is missing from the board, which means the game is technically over
    return true;
  }

  const [kingX, kingY] = kingPosition;

  // Loop through opponent's pieces to see if any threaten the king
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const piece = tempBoard[i][j];
      if (piece && (player === "gote" ? piece === piece.toLowerCase() : piece === piece.toUpperCase())) {
        const moves = getPossibleMoves(piece, i, j, tempBoard);
        if (moves.some(([px, py]) => px === kingX && py === kingY)) {
          return true;  // King is in check
        }
      }
    }
  }
  return false;  // King is safe
};


// Find the king's position on the board
const findKingPosition = (kingPiece, tempBoard = board) => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (tempBoard[i][j] === kingPiece) {
        return [i, j];  // Return the position as an array when found
      }
    }
  }
  return null;  // Explicitly return null if the king isn't found
};



// Check if the current player has achieved victory (opponent's king captured)
const isVictory = () => {
  const goteKingPosition = findKingPosition("K");
  const senteKingPosition = findKingPosition("k");

  // Check if either king is missing
  if (!goteKingPosition) {
    alert("Sente wins! Gote's king is missing.");
    return true; // Game over, Gote's king is missing
  }
  if (!senteKingPosition) {
    alert("Gote wins! Sente's king is missing.");
    return true; // Game over, Sente's king is missing
  }

  return false; // Both kings are present, game continues
};


  // Check for checkmate by seeing if the player has any legal moves left
  const isCheckmate = (player) => {
    if (!isInCheck(player)) return false; // Not in check, so can't be checkmate

    // Check if any of the player's pieces can make a valid move
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const piece = board[i][j];
        if (piece && (player === "gote" ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
          const moves = getPossibleMoves(piece, i, j, board);
          if (moves.length > 0) {
            return false; // Player can escape check, so not checkmate
          }
        }
      }
    }

    alert(`Checkmate! ${player === "gote" ? "Sente" : "Gote"} wins!`);
    resetGame();
    return true;
  };

   // Check for stalemate (no legal moves, but not in check)
   const isStalemate = (player) => {
    if (isInCheck(player)) return false; // Can't be stalemate if in check

    // Check if any legal moves are available
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const piece = board[i][j];
        if (piece && (player === "gote" ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
          const moves = getPossibleMoves(piece, i, j, board);
          if (moves.length > 0) {
            return false; // Player can make a move, so not stalemate
          }
        }
      }
    }

    alert("Stalemate! The game is a draw.");
    resetGame();
    return true;
  };

    // Check for checkmate or stalemate after every turn
    useEffect(() => {
      if (isCheckmate(currentPlayer) || isStalemate(currentPlayer)) {
        // Game is over
      }
    }, [currentPlayer, isCheckmate, isStalemate]);

    // Function to handle dropping a captured piece onto the board
    const handleDropCapturedPiece = (piece, targetX, targetY) => {
      if (board[targetX][targetY] !== " ") return; // Ensure target square is empty
    
      // Ensure only captured pieces can be dropped by the correct player
      const playerCapturedPieces = currentPlayer === "gote" ? capturedGote : capturedSente;
      if (!playerCapturedPieces.includes(piece)) {
        alert("Invalid drop: You can only drop pieces you've captured.");
        return;
      }
    
      // Drop the piece on the board
      const updatedBoard = board.map(row => [...row]);
      updatedBoard[targetX][targetY] = currentPlayer === "gote" ? piece.toUpperCase() : piece.toLowerCase();
      setBoard(updatedBoard);
    
      // Remove only the selected dropped piece from captured list
      const updatedCapturedPieces = playerCapturedPieces.slice();
      const pieceIndex = updatedCapturedPieces.indexOf(piece);
      if (pieceIndex > -1) {
        updatedCapturedPieces.splice(pieceIndex, 1); // Remove the specific captured piece
      }
      currentPlayer === "gote" ? setCapturedGote(updatedCapturedPieces) : setCapturedSente(updatedCapturedPieces);
    
      // Switch turns
      setCurrentPlayer(currentPlayer === "gote" ? "sente" : "gote");
      setSelectedPiece(null);
      setPossibleMoves([]);

    // Update move history for undo/redo functionality
    setMoveHistory([...moveHistory.slice(0, undoIndex), { board: updatedBoard, player: currentPlayer }]);
    setUndoIndex(moveHistory.length + 1);

    if (isVictory()) {
      alert(`${currentPlayer === "gote" ? "Sente" : "Gote"} wins!`);
      resetGame();
    }
  };

  // Check if dropping a piece is legal
  const isValidDrop = (piece, x, y, board) => {
    const isPawn = piece.toLowerCase() === 'p';

    if (isPawn && !isValidPawnDrop(x, y, board)) {
      return false; // Invalid pawn drop (Nifu or Uchifuzume)
    }

    // Ensure the drop doesn't result in an immediate checkmate
    const tempBoard = board.map(row => [...row]);
    tempBoard[x][y] = currentPlayer === "gote" ? piece.toUpperCase() : piece.toLowerCase();
    return !isCheckmate(currentPlayer === "gote" ? "sente" : "gote", tempBoard);
  };

  // Validate pawn-specific drop rules (Nifu and last-rank restriction)
  const isValidPawnDrop = (x, y, board) => {
    // Nifu: Ensure no other pawn exists in the same file
    for (let row = 0; row < 9; row++) {
      const cell = board[row][y];
      if (cell.toLowerCase() === 'p' && (currentPlayer === "gote" ? cell === cell.toUpperCase() : cell === cell.toLowerCase())) {
        return false; // Nifu violation (double pawn in the same file)
      }
    }

    // Cannot drop a pawn on the last rank where it can't move
    if ((currentPlayer === "gote" && x === 0) || (currentPlayer === "sente" && x === 8)) {
      return false;
    }

    return true;
  };

  // Get legal drop locations for a captured piece
  const getDropLocations = (piece, board) => {
    const moves = [];
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        if (board[x][y] === " " && isValidDrop(piece, x, y, board)) {
          moves.push([x, y]);
        }
      }
    }
    return moves;
  };

   // Undo the last move
   const handleUndo = () => {
    if (undoIndex > 0) {
      setUndoIndex(undoIndex - 1);
      const { board: previousBoard, player } = moveHistory[undoIndex - 1];
      setBoard(previousBoard);
      setCurrentPlayer(player);
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      alert("No more moves to undo.");
    }
  };

  // Redo a move that was undone
  const handleRedo = () => {
    if (undoIndex < moveHistory.length) {
      setUndoIndex(undoIndex + 1);
      const { board: nextBoard, player } = moveHistory[undoIndex];
      setBoard(nextBoard);
      setCurrentPlayer(player);
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      alert("No more moves to redo.");
    }
  };

  // Reset the entire game (already included but reiterated here)
  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer("gote");
    setSelectedPiece(null);
    setPossibleMoves([]);
    setCapturedGote([]);
    setCapturedSente([]);
    setMoveHistory([]);
    setUndoIndex(0);
  };








  const [promotedPieces, setPromotedPieces] = useState(new Set());

  const handlePromotion = () => (piece, x, y, updatedBoard) => {
    const promotedPiece = piece + "+";
    updatedBoard[x][y] = promotedPiece;
    setBoard(updatedBoard);
  };

  




  const handleSquareClick = (x, y) => {
    const piece = board[x][y];
    const isGotePiece = piece === piece.toUpperCase();
    const isSentePiece = piece !== " " && piece === piece.toLowerCase();
  
    if (selectedPiece?.isCaptured) {
      if (possibleMoves.some(([px, py]) => px === x && py === y)) {
        handleDropCapturedPiece(selectedPiece.piece, x, y);
      } else {
        alert("Invalid drop location!");
      }
      setSelectedPiece(null);
      setPossibleMoves([]);
      return;
    }
  
    if (selectedPiece) {
      if (selectedPiece.x === x && selectedPiece.y === y) {
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else if (possibleMoves.some(([px, py]) => px === x && py === y)) {
        movePiece(x, y);
      } else if (piece !== " " && ((currentPlayer === "gote" && isGotePiece) || (currentPlayer === "sente" && isSentePiece))) {
        selectPiece(x, y);
      } else {
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
      return;
    }
  
    // New Logic: Allow any piece to move if it resolves the check
    if (piece !== " " && ((currentPlayer === "gote" && isGotePiece) || (currentPlayer === "sente" && isSentePiece))) {
      if (isInCheck(currentPlayer)) {
        const possibleDefensiveMoves = getPossibleMoves(piece, x, y, board).filter(([newX, newY]) => {
          const tempBoard = board.map(row => [...row]);
          tempBoard[x][y] = " ";
          tempBoard[newX][newY] = piece;
          return !isInCheck(currentPlayer, tempBoard);
        });
  
        if (possibleDefensiveMoves.length > 0) {
          setSelectedPiece({ x, y, piece });
          setPossibleMoves(possibleDefensiveMoves);
        } else {
          alert("This move doesn't resolve the check. Choose another move.");
        }
      } else {
        selectPiece(x, y);
      }
    }
  };
  
  
  


  
  




  
  
  return (
    <div className="container flex flex-col items-center">
      <h1 className="mb-24 text-2xl font-sente text-sente">
        Current Player: {currentPlayer}
        {isInCheck(currentPlayer) && ` (in check)`}
      </h1>
      <button
        className="mb-5 mx-auto bg-blue-500 hover:bg-blue-700 text-gote font-bold py-2 px-4 rounded"
        onClick={resetGame}
      >
        Reset
      </button>
  
      <div
        className={`board shogi-board ${
          currentPlayer === "sente" ? "rotate-0" : ""
        }`}
      >
        {board.map((row, x) =>
          row.map((piece, y) => (
            <div
              key={`${x}-${y}`}
              className={`cell ${
                Array.isArray(possibleMoves) &&
                possibleMoves.some(([px, py]) => px === x && py === y)
                  ? "highlight"
                  : ""
              }`}
              onClick={() => handleSquareClick(x, y)}
            >
              {piece !== " " && (
                <Image
                  className={`object-center object-scale-down ${
                    piece === piece.toLowerCase() ? "rotate-180" : ""
                  }`}
                  src={pieceImages[piece]}
                  alt={piece}
                  width={1600}
                  height={1600}
                />
              )}
            </div>
          ))
        )}
      </div>
  
      <div className="controls m-5 w-full mt-24 max-w-72 mx-auto space-x-0 sm:space-x-10 sm:space-y-0">
        <button
          className="float-start bg-blue-500 hover:bg-blue-700 text-gote font-bold py-2 px-4 rounded"
          onClick={handleUndo}
        >
          Undo
        </button>
        <button
          className="float-end bg-blue-500 hover:bg-blue-700 text-gote font-bold py-2 px-4 rounded"
          onClick={handleRedo}
        >
          Redo
        </button>
      </div>
  
      <div className="captured m-5 w-full">
  <div className="float-start inline-flex flex-row flex-wrap w-1/2">
    <h3>Captured by Gote</h3>
    {capturedGote.map((piece, index) => (
      <Image
        key={index}
        src={pieceImages[piece.toLowerCase()]}
        alt={piece}
        width={1600}
        height={1600}
        className="cursor-pointer text-xs"
        onClick={() => {
          setSelectedPiece({ piece, isCaptured: true });
          setPossibleMoves(getDropLocations(piece, board));
        }}
      />
    ))}
  </div>
  <div className="float-end inline-flex flex-row-reverse flex-wrap w-1/2">
    <h3>Captured by Sente</h3>
    <div className="flex flex-wrap justify-center">
    {capturedSente.map((piece, index) => (
      <Image
        key={index}
        src={pieceImages[piece.toUpperCase()]}
        alt={piece}
        width={1600}
        height={1600}
        className="cursor-pointer text-xs"
        onClick={() => {
          setSelectedPiece({ piece, isCaptured: true });
          setPossibleMoves(getDropLocations(piece, board));
        }}
      />
    ))}
  </div>
</div>
</div>
</div>
  );
  
};

export default ShogiBoard;
