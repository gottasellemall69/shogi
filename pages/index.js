import Image from "next/image";
import { useState, useEffect } from "react";

const ShogiBoard = () => {
  // Initial board setup for Shogi
  const initialBoard = [
    ["l", "n", "s", "g", "k", "g", "s", "n", "l"], // Row 0: Black back row
    [" ", "r", " ", " ", " ", " ", " ", "b", " "], // Row 1: Black Rook and Bishop
    ["p", "p", "p", "p", "p", "p", "p", "p", "p"], // Row 2: Black pawns
    [" ", " ", " ", " ", " ", " ", " ", " ", " "], // Row 3: Empty
    [" ", " ", " ", " ", " ", " ", " ", " ", " "], // Row 4: Empty
    [" ", " ", " ", " ", " ", " ", " ", " ", " "], // Row 5: Empty
    ["P", "P", "P", "P", "P", "P", "P", "P", "P"], // Row 6: White pawns
    [" ", "B", " ", " ", " ", " ", " ", "R", " "], // Row 7: White Bishop and Rook
    ["L", "N", "S", "G", "K", "G", "S", "N", "L"], // Row 8: White back row
  ];

  // Mapping of piece types to image paths
  const pieceImages = {
    p: "/images/pieces/black/pawn.svg",
    P: "/images/pieces/white/pawn.svg",
    "p+": "/images/pieces/black/pawn_promoted.svg",
    "P+": "/images/pieces/white/pawn_promoted.svg",
    l: "/images/pieces/black/lance.svg",
    L: "/images/pieces/white/lance.svg",
    "l+": "/images/pieces/black/lance_promoted.svg",
    "L+": "/images/pieces/white/lance_promoted.svg",
    n: "/images/pieces/black/knight.svg",
    N: "/images/pieces/white/knight.svg",
    "n+": "/images/pieces/black/knight_promoted.svg",
    "N+": "/images/pieces/white/knight_promoted.svg",
    s: "/images/pieces/black/silverGeneral.svg",
    S: "/images/pieces/white/silverGeneral.svg",
    "s+": "/images/pieces/black/silverGeneral_promoted.svg",
    "S+": "/images/pieces/white/silverGeneral_promoted.svg",
    g: "/images/pieces/black/goldGeneral.svg",
    G: "/images/pieces/white/goldGeneral.svg",
    b: "/images/pieces/black/bishop.svg",
    B: "/images/pieces/white/bishop.svg",
    "b+": "/images/pieces/black/bishop_promoted.svg",
    "B+": "/images/pieces/white/bishop_promoted.svg",
    r: "/images/pieces/black/rook.svg",
    R: "/images/pieces/white/rook.svg",
    "r+": "/images/pieces/black/rook_promoted.svg",
    "R+": "/images/pieces/white/rook_promoted.svg",
    k: "/images/pieces/black/blackKing.svg",
    K: "/images/pieces/white/whiteKing.svg",
  };

  // State management
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const BOARD_SIZE = 9; // Shogi is played on a 9x9 board

  const pieceMovements = {
    p: { 
      normal: [{ x: 0, y: 1 }], // Unpromoted Pawn
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Gold General moves
    },
    P: { 
      normal: [{ x: 0, y: -1 }], // Unpromoted White Pawn
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ]
    },
    l: { 
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), // Unpromoted Lance
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ]
    },
    L: { 
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), // Unpromoted White Lance
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ]
    },
    n: { 
      normal: [{ x: 1, y: -2 }, { x: -1, y: -2 }], // Unpromoted Knight
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ]
    },
    N: { 
      normal: [{ x: 1, y: 2 }, { x: -1, y: 2 }], // Unpromoted White Knight
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ]
    },
    s: { 
      normal: [
        { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }
      ], // Unpromoted Silver General
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ]
    },
    S: { 
      normal: [
        { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
      ],
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ]
    },
    g: { 
      normal: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] 
    },
    G: { 
      normal: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] 
    },
  };
 // Helper function to capture a piece and add it to the opponent's captured list
const capturePiece = (piece, currentPlayer, capturedWhite, capturedBlack) => {
  // Convert the captured piece to the opponent's unpromoted form
  const unpromotedPiece = piece.replace("+", "").toUpperCase();

  if (currentPlayer === "white") {
    // Black captured the piece
    return {
      capturedWhite: [...capturedWhite, unpromotedPiece],
      capturedBlack,
    };
  } else {
    // White captured the piece
    return {
      capturedWhite,
      capturedBlack: [...capturedBlack, unpromotedPiece],
    };
  }
};

// Check if a piece is eligible for promotion based on its type and position
const promoteIfEligible = (piece, targetY, currentPlayer) => {
  // Define promotion zone for each player
  const promotionZone = currentPlayer === "white" ? [0, 1, 2] : [6, 7, 8];
  const promotablePieces = ["p", "l", "n", "s", "b", "r", "P", "L", "N", "S", "B", "R"];

  // Check if the piece is promotable and in the promotion zone
  if (promotablePieces.includes(piece) && promotionZone.includes(targetY)) {
    return `${piece}+`; // Return promoted piece notation
  }

  return piece; // No promotion, return original piece
};

// Handle the selection of a piece
const selectPiece = (x, y) => {
  const piece = board[y][x];

  // Check if the selected piece belongs to the current player
  if (
    (currentPlayer === "white" && piece === piece?.toUpperCase()) ||
    (currentPlayer === "black" && piece === piece?.toLowerCase())
  ) {
    setSelectedPiece({ x, y });
    setPossibleMoves(calculatePossibleMoves(x, y, piece, currentPlayer));
  }
};


// Helper function to validate if a target move is within calculated possible moves
const isMoveAllowed = (targetX, targetY) => {
  return possibleMoves.some((move) => move.x === targetX && move.y === targetY);
};


// Function to check if a king is missing, indicating a win condition
const checkWinCondition = (board) => {
  let whiteKingExists = false;
  let blackKingExists = false;

  // Scan the board to see if both kings are present
  board.forEach(row => {
    row.forEach(cell => {
      if (cell === "K") whiteKingExists = true; // White king found
      if (cell === "k") blackKingExists = true; // Black king found
    });
  });

  // If either king is missing, return the winning player
  if (!whiteKingExists) return "black"; // Black wins if white king is missing
  if (!blackKingExists) return "white"; // White wins if black king is missing

  return null; // No win condition met
};


// Move a piece to a new position
const movePiece = (targetX, targetY) => {
  if (!selectedPiece) return;

  const { x, y } = selectedPiece;
  let piece = board[y][x];
  let updatedCapturedWhite = capturedWhite;
  let updatedCapturedBlack = capturedBlack;

  // Capture opponent's piece if present
  const targetPiece = board[targetY][targetX];
  if (targetPiece !== " ") {
    const captureResult = capturePiece(targetPiece, currentPlayer, capturedWhite, capturedBlack);
    updatedCapturedWhite = captureResult.capturedWhite;
    updatedCapturedBlack = captureResult.capturedBlack;
  }

  // Check for promotion eligibility
  piece = promoteIfEligible(piece, targetY, currentPlayer);

  // Update board and state
  const newBoard = board?.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowIndex === y && colIndex === x) return " "; // Clear old position
      if (rowIndex === targetY && colIndex === targetX) return piece; // Place piece in new position
      return cell; // Keep other cells unchanged
    })
  );

   // Check for win condition after the move
   const winner = checkWinCondition(newBoard);
   if (winner) {
     alert(`${winner} wins!`); // Display win message
     setBoard(initialBoard); // Reset the board or implement any other end-game logic
     return; // Stop further execution
   }

  // Update states
  setBoard(newBoard);
  setCapturedWhite(updatedCapturedWhite);
  setCapturedBlack(updatedCapturedBlack);
  setSelectedPiece(null);
  setPossibleMoves([]);
  setCurrentPlayer(currentPlayer === "white" ? "black" : "white"); // Switch player turn
};

// Calculate possible moves for a selected piece
const calculatePossibleMoves = (x, y, piece, currentPlayer) => {
  const moves = [];

  // Check if the piece is defined and a valid piece (not empty or invalid)
  if (!piece || piece === " ") {
    return moves; // If no valid piece is selected, return empty possible moves
  }

  const isPromoted = piece.includes("+");
  const movementPattern = pieceMovements[piece.toLowerCase()]?.[isPromoted ? "promoted" : "normal"];

  if (!movementPattern) {
    return moves; // If no movement pattern found for the piece, return empty moves
  }

  movementPattern.forEach((move) => {
    const targetX = x + move.x;
    const targetY = y + (currentPlayer === "white" ? -move.y : move.y);

    if (
      targetX >= 0 &&
      targetX < BOARD_SIZE &&
      targetY >= 0 &&
      targetY < BOARD_SIZE &&
      (board[targetY][targetX] === " " || board[targetY][targetX].toUpperCase() !== piece?.toUpperCase())
    ) {
      moves.push({ x: targetX, y: targetY });
    }
  });

  return moves;
};


return (
  <>
  <div className="container flex flex-col items-center">
    <h1 className=" mb-24 text-4xl font-black text-black drop-shadow-sm text-center sm:text-left max-w-prose">Current Player:{` ${currentPlayer} `}</h1>

    <div className="shogi-board board board-grid grid-cols-9 grid-rows-9 gap-1 border border-gray-500 p-1 bg-yellow-200">
      {board.map((row, y) => row.map((cell, x) => (
        <div
          key={`${x}-${y}`}
          className={`grid-cell w-full h-full flex items-center justify-center border border-gray-400
              ${selectedPiece && selectedPiece.x === x && selectedPiece.y === y ? "bg-blue-300" : ""}
              ${possibleMoves.some(move => move.x === x && move.y === y) ? "bg-green-200" : ""}
              ${currentPlayer === "white" ? "rotate-0"  : "rotate-180" ? "rotate-180" : ""}
              ${currentPlayer === "black" ? "rotate-180" : "rotate-180" ? "rotate-0" : ""}
            `}
          onClick={() => (selectedPiece ? movePiece(x, y) : selectPiece(x, y))}
        >
          {cell !== " " && (
            <Image className="object-center object-scale-down aspect-auto w-full h-full" src={pieceImages[cell]} alt={cell} width={50} height={50} priority={true} unoptimized={true} />
          )}
        </div>
      )))};

    </div>

  </div><div className="captured">
      <div>
        <h3>Captured by White</h3>
        <div className={"capturedPieces inline-flex flex-row flex-wrap"}>
          {capturedWhite?.map((cp, index) => (
            <Image
              className="object-center object-scale-down aspect-auto w-auto h-auto"
              key={index}
              src={pieceImages[cp.toLowerCase()]}
              alt={cp}
              width={30}
              height={30} />
          ))}
        </div>
      </div>
      <div>
        <h3>Captured by Black</h3>
        <div className="capturedPieces inline-flex flex-row flex-wrap">
          {capturedBlack?.map((cp, index) => (
            <Image
              className="object-center object-scale-down aspect-auto w-auto h-auto"
              key={index}
              src={pieceImages[cp.toUpperCase()]}
              alt={cp}
              width={30}
              height={30} />
          ))}
        </div>
      </div>
    </div></>
  );
};

export default ShogiBoard;
