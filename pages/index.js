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
      normal: [{ x: 0, y: 1 }], // Unpromoted Pawn (moves forward one square)
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Promoted Pawn (Gold General moves)
    },
    P: { 
      normal: [{ x: 0, y: -1 }], // Unpromoted White Pawn (moves forward one square for white side)
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] // Promoted White Pawn (Gold General moves)
    },
    l: { 
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), // Unpromoted Lance (moves any number of squares forward)
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Promoted Lance (Gold General moves)
    },
    L: { 
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), // Unpromoted White Lance
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] // Promoted White Lance (Gold General moves)
    },
    n: { 
      normal: [{ x: 1, y: -2 }, { x: -1, y: -2 }], // Unpromoted Knight (jumps forward)
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Promoted Knight (Gold General moves)
    },
    N: { 
      normal: [{ x: 1, y: 2 }, { x: -1, y: 2 }], // Unpromoted White Knight
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] // Promoted White Knight (Gold General moves)
    },
    s: { 
      normal: [
        { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }
      ], // Unpromoted Silver General
      promoted: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Promoted Silver General (Gold General moves)
    },
    S: { 
      normal: [
        { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
      ], // Unpromoted White Silver General
      promoted: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] // Promoted White Silver General (Gold General moves)
    },
    g: { 
      normal: [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, 
        { x: 1, y: -1 }, { x: -1, y: -1 }
      ] // Gold General
    },
    G: { 
      normal: [
        { x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, 
        { x: 1, y: 1 }, { x: -1, y: 1 }
      ] // White Gold General
    },
    k: { 
      normal: [
        { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }
      ] // King moves one square in any direction
    },
    K: { 
      normal: [
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
        { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }
      ] // White King
    },
    b: { 
      normal: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })), // Diagonal moves in 4 directions
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) }))
      ],
      promoted: [
        { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 },
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) }))
      ] // Promoted Bishop gains King's orthogonal moves
    },
    r: { 
      normal: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })), // Rook moves in 4 straight directions
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) }))
      ],
      promoted: [
        { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) }))
      ] // Promoted Rook gains King's diagonal moves
    }
};


  // Helper function to get valid moves for a piece
  const getValidMoves = (piece, position) => {
    const movements = pieceMovements[piece.toLowerCase()];
    const isPromoted = piece.includes('+');
    
    // Get the valid moves depending on whether the piece is promoted
    const validMoves = isPromoted ? movements.promoted : movements.normal;
    
    // Calculate potential moves based on the piece's movement pattern
    const possibleMoves = validMoves.map(move => {
      return {
        x: position.x + move.x,
        y: position.y + move.y,
      };
    });
    
    // Filter out moves that go outside the board
    return possibleMoves.filter(move => {
      return move.x >= 0 && move.x < BOARD_SIZE && move.y >= 0 && move.y < BOARD_SIZE;
    });
  };

  // Handle piece selection and calculating possible moves
  const handlePieceSelection = (x, y) => {
    const selected = board[x][y];
    
    if (selected !== " " && (currentPlayer === "white" && selected === selected.toUpperCase()) || (currentPlayer === "black" && selected === selected.toLowerCase())) {
      setSelectedPiece({ x, y });
      const moves = getValidMoves(selected, { x, y });
      setPossibleMoves(moves);
    }
  };

  // Handle moving a piece
  const handleMovePiece = (x, y) => {
    if (!selectedPiece) return;

    const { x: selectedX, y: selectedY } = selectedPiece;
    const selected = board[selectedX][selectedY];
    const validMoves = getValidMoves(selected, selectedPiece);
    
    if (validMoves.some(move => move.x === x && move.y === y)) {
      // If move is valid, update the board state
      const newBoard = [...board];
      newBoard[x][y] = selected;
      newBoard[selectedX][selectedY] = " ";

      // Update captured pieces if applicable
      if (currentPlayer === "white" && x >= 6 && newBoard[x][y].toLowerCase() !== newBoard[x][y]) {
        setCapturedWhite(prev => [...prev, newBoard[x][y]]);
      } else if (currentPlayer === "black" && x <= 2 && newBoard[x][y].toLowerCase() !== newBoard[x][y]) {
        setCapturedBlack(prev => [...prev, newBoard[x][y]]);
      }

      // Update board and change turn
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
      setSelectedPiece(null);
      setPossibleMoves([]);
      
      // Handle piece promotion after move
      handlePromotion(x, y);
    }
  };

// Check if a move is within the board bounds
const isWithinBounds = (move) => {
  return move.x >= 0 && move.x < BOARD_SIZE && move.y >= 0 && move.y < BOARD_SIZE;
};


// Function to handle the click event on a square
const handleSquareClick = (x, y) => {
  if (selectedPiece) {
    const piece = board[selectedPiece.y][selectedPiece.x];
    const validMoves = getValidMoves(piece, selectedPiece);

    // Check if the clicked square is a valid move for the selected piece
    if (validMoves.some(move => move.x === x && move.y === y)) {
      // Make the move
      const newBoard = [...board];
      newBoard[y][x] = piece;  // Move piece to the target position
      newBoard[selectedPiece.y][selectedPiece.x] = " ";  // Empty the original square
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white");  // Switch turn
    }
  } else {
    // If no piece is selected, highlight possible moves for the clicked square
    if (board[y][x] !== " " && ((currentPlayer === "white" && board[y][x].toUpperCase() === board[y][x]) || 
      (currentPlayer === "black" && board[y][x].toLowerCase() === board[y][x]))) {
      setSelectedPiece({ x, y });
      const piece = board[y][x];
      const validMoves = getValidMoves(piece, { x, y });
      setPossibleMoves(validMoves);  // Store the possible moves for the piece
    }
  }
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
  const moves = [pieceMovements];

  // Check if the piece is defined and valid (not empty or invalid)
  if (!piece || piece === " ") {
    return moves; // If no valid piece is selected, return empty possible moves
  }

  const isPromoted = piece.includes("+");
  const movementPattern = pieceMovements[piece.toLowerCase()]?.[isPromoted ? "promoted" : "normal"];

  // Validate movementPattern to ensure it's an array and contains objects with x and y properties
  if (!Array.isArray(movementPattern)) {
    console.warn(`No valid movement pattern found for piece: ${piece}`);
    return moves;
  }

  movementPattern.forEach((move) => {
    // Check that move is an object with x and y properties
    if (typeof move.x !== 'number' || typeof move.y !== 'number') {
      console.warn(`Invalid move data in movement pattern for piece: ${piece}`);
      return;
    }

    const targetX = x + move.x;
    const targetY = y + (currentPlayer === "white" ? -move.y : move.y);

    // Ensure the target is within board bounds
    if (
      targetX >= 0 &&
      targetX < BOARD_SIZE &&
      targetY >= 0 &&
      targetY < BOARD_SIZE
    ) {
      const targetPiece = board[targetY][targetX];
      const isOpponentPiece = targetPiece && targetPiece.toUpperCase() !== piece.toUpperCase();

      // Check for empty square or an opponent's piece for a valid move
      if (targetPiece === " " || isOpponentPiece) {
        moves.push({ x: targetX, y: targetY });
      }
    }
  });

  return moves;
};


// Function to handle promotion
const handlePromotion = (x, y) => {
  const piece = board[x][y];
  if (piece === "p" && x === 0) {
    board[x][y] = "p+";
  } else if (piece === "P" && x === 8) {
    board[x][y] = "P+";
  } else if (piece === "r" && x === 0) {
    board[x][y] = "r+";
  } else if (piece === "R" && x === 8) {
    board[x][y] = "R+";
  } else if (piece === "n" && x === 0) {
    board[x][y] = "n+";
  } else if (piece === "N" && x === 8) {
    board[x][y] = "N+";
  } else if (piece === "l" && x === 0) {
    board[x][y] = "l+";
  } else if (piece === "L" && x === 8) {
    board[x][y] = "L+";
  } else if (piece === "b" && x === 0) {
    board[x][y] = "b+";
  } else if (piece === "B" && x === 8) {
    board[x][y] = "B+";
  }
  setBoard([...board]);
};



return (
  <>
  <div className="container flex flex-col items-center">
    <h1 className=" mb-24 text-4xl font-black text-black drop-shadow-sm text-center sm:text-left max-w-prose">Current Player:{` ${currentPlayer} `}</h1>

    <div className="shogi-board board board-grid grid-cols-9 grid-rows-9 gap-1 border border-gray-500 p-1 bg-yellow-200">
      {board.map((row, y) => row.map((cell, x) => (
        <div
          key={`${y}-${x}`}
          className={`grid-cell w-full h-full flex items-center justify-center border border-gray-400
              ${selectedPiece && selectedPiece.x === x && selectedPiece.y === y ? "bg-blue-300" : ""}
              ${possibleMoves.some(move => move.x === x && move.y === y) ? "bg-green-200" : ""}
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
