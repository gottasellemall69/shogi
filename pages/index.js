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
    p: "/images/pieces/_pawn.svg",
    P: "/images/pieces/Pawn.svg",
    "p+": "/images/pieces/_pawn+.svg",
    "P+": "/images/pieces/Pawn+.svg",
    l: "/images/pieces/_lance.svg",
    L: "/images/pieces/Lance.svg",
    "l+": "/images/pieces/_lance+.svg",
    "L+": "/images/pieces/Lance+.svg",
    n: "/images/pieces/_knight.svg",
    N: "/images/pieces/Knight.svg",
    "n+": "/images/pieces/_knight+.svg",
    "N+": "/images/pieces/Knight+.svg",
    s: "/images/pieces/_silvergeneral.svg",
    S: "/images/pieces/SilverGeneral.svg",
    "s+": "/images/pieces/_silvergeneral+.svg",
    "S+": "/images/pieces/SilverGeneral+.svg",
    g: "/images/pieces/_goldgeneral.svg",
    G: "/images/pieces/GoldGeneral.svg",
    b: "/images/pieces/_bishop.svg",
    B: "/images/pieces/Bishop.svg",
    "b+": "/images/pieces/_bishop+.svg",
    "B+": "/images/pieces/Bishop+.svg",
    r: "/images/pieces/_rook.svg",
    R: "/images/pieces/Rook.svg",
    "r+": "/images/pieces/_rook+.svg",
    "R+": "/images/pieces/Rook+.svg",
    k: "/images/pieces/_king.svg",
    K: "/images/pieces/King.svg",
  };

  

  const pieceMovements = {
    p: {
      normal: [{ x: 0, y: 1 }], // Unpromoted Pawn (moves forward one square)
      promoted: [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Promoted Pawn (Gold General moves)
    },
    P: {
      normal: [{ x: 0, y: -1 }], // Unpromoted White Pawn (moves forward one square for white side)
      promoted: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // Promoted White Pawn (Gold General moves)
    },
    l: {
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), // Unpromoted Lance (moves any number of squares forward)
      promoted: [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Promoted Lance (Gold General moves)
    },
    L: {
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), // Unpromoted White Lance
      promoted: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // Promoted White Lance (Gold General moves)
    },
    n: {
      normal: [
        { x: 1, y: -2 },
        { x: -1, y: -2 },
      ], // Unpromoted Knight (jumps forward)
      promoted: [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Promoted Knight (Gold General moves)
    },
    N: {
      normal: [
        { x: 1, y: 2 },
        { x: -1, y: 2 },
      ], // Unpromoted White Knight
      promoted: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // Promoted White Knight (Gold General moves)
    },
    s: {
      normal: [
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // Unpromoted Silver General
      promoted: [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Promoted Silver General (Gold General moves)
    },
    S: {
      normal: [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Unpromoted White Silver General
      promoted: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // Promoted White Silver General (Gold General moves)
    },
    g: {
      normal: [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // Gold General
    },
    G: {
      normal: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // White Gold General
    },
    k: {
      normal: [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
      ], // King moves one square in any direction
    },
    K: {
      normal: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
      ], // White King
    },
    b: {
      normal: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })), // Diagonal moves in 4 directions
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
      ],
      promoted: [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: -(i + 1) })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: -(i + 1) })),
      ], // Promoted Bishop gains King's orthogonal moves
    },
    r: {
      normal: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })), // Rook moves in 4 straight directions
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
      ],
      promoted: [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
      ], // Promoted Rook gains King's diagonal moves
    },
  };


  const getPossibleMoves = (piece, x, y, board) => {
    const isPromoted = piece.includes("+");
    const basePiece = piece.replace("+", "").toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    
    if (!pieceMovements[basePiece]) return [];
  
    const moveSet = isPromoted ? 
      pieceMovements[basePiece].promoted || pieceMovements[basePiece].normal :
      pieceMovements[basePiece].normal;
  
    let possibleMoves = [];
    
    // Helper function to check if a position is within board bounds
    const isInBounds = (x, y) => x >= 0 && x < 9 && y >= 0 && y < 9;
    
    // Helper function to check if a piece can capture at position
    const canCapture = (x, y) => {
      const targetPiece = board[x][y];
      return targetPiece === " " || 
             (isWhite ? targetPiece === targetPiece.toLowerCase() : 
                        targetPiece === targetPiece.toUpperCase());
    };
  
    // Handle sliding pieces (rook, bishop, lance)
    const handleSlidingMove = (startX, startY, dx, dy) => {
      let newX = startX + dx;
      let newY = startY + dy;
      
      while (isInBounds(newX, newY)) {
        if (board[newX][newY] === " ") {
          possibleMoves.push([newX, newY]);
        } else {
          if (canCapture(newX, newY)) {
            possibleMoves.push([newX, newY]);
          }
          break; // Stop checking this direction if we hit any piece
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
        const direction = isWhite ? -1 : 1;
        handleSlidingMove(x, y, direction, 0);
        break;
  
      case 'n': // Knight
        const knightMoves = isWhite ? 
          [[-2, -1], [-2, 1]] : // White knight
          [[2, -1], [2, 1]];    // Black knight
        
        knightMoves.forEach(([dx, dy]) => {
          const newX = x + dx;
          const newY = y + dy;
          if (isInBounds(newX, newY) && canCapture(newX, newY)) {
            possibleMoves.push([newX, newY]);
          }
        });
        break;
  
      case 'p': // Pawn
        const pawnDir = isWhite ? -1 : 1;
        const newX = x + pawnDir;
        if (isInBounds(newX, y) && canCapture(newX, y)) {
          possibleMoves.push([newX, y]);
        }
        break;
  
      default: // King, Gold General, Silver General, and promoted pieces
        moveSet.forEach(move => {
          const newX = x + (isWhite ? -move.y : move.y);
          const newY = y + move.x;
          if (isInBounds(newX, newY) && canCapture(newX, newY)) {
            possibleMoves.push([newX, newY]);
          }
        });
        break;
    }
  
    return possibleMoves;
  };
  // State management
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);

  const BOARD_SIZE = 9;

  const shouldPromote = (piece, x) => {
    if (!piece || piece.includes("+")) return false;
    if (piece.toLowerCase() === 'k' || piece.toLowerCase() === 'g') return false;
    
    const isWhite = piece === piece.toUpperCase();
    
    // Mandatory promotion for pawns, lances, and knights in last ranks
    if (piece.toLowerCase() === 'p' || piece.toLowerCase() === 'l' || piece.toLowerCase() === 'n') {
      if (isWhite && x === 0) return true;
      if (!isWhite && x === 8) return true;
    }
    
    // Optional promotion in promotion zone
    return isWhite ? x <= 2 : x >= 6;
  };
  const [promotedPieces, setPromotedPieces] = useState(new Set());
  const handlePromotion = (piece, x, y, updatedBoard) => {
    const promotedPiece = piece + "+";
    updatedBoard[x][y] = promotedPiece;
    setBoard(updatedBoard);
  };

  const isValidPawnDrop = (x, y, board) => {
    for (let row = 0; row < 9; row++) {
      const cell = board[row][y];
      if (cell.toLowerCase() === 'p' && (currentPlayer === "white" ? cell === cell.toUpperCase() : cell === cell.toLowerCase())) {
        return false;
      }
    }
    return !(currentPlayer === "white" && x === 0) && !(currentPlayer === "black" && x === 8);
  };

  const getDropLocations = (piece, board) => {
    let moves = [];
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        if (board[x][y] === " " && (piece.toLowerCase() !== 'p' || isValidPawnDrop(x, y, board))) {
          moves.push([x, y]);
        }
      }
    }
    return moves;
  };

  const handlePieceSelect = (x, y) => {
    const piece = board[x][y];
    if (piece && (currentPlayer === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
      setSelectedPiece({ x, y, piece });
      const moves = getPossibleMoves(piece, x, y, board);
      setPossibleMoves(moves);
    } else {
      setSelectedPiece(null);
      setPossibleMoves(pieceMovements);
    }
  };

  const handleMove = (targetX, targetY) => {
    if (!selectedPiece || !possibleMoves.some(([px, py]) => px === targetX && py === targetY))
      return;
  
    const { x, y, piece } = selectedPiece;
    const updatedBoard = JSON.parse(JSON.stringify(board)); // Deep copy
    const capturedPiece = updatedBoard[targetX][targetY];
  
    // Handle capture
    if (capturedPiece !== " ") {
      const normalizedPiece = capturedPiece.replace("+", ""); // Remove promotion status
      if (currentPlayer === "white") {
        setCapturedWhite([...capturedWhite, normalizedPiece.toLowerCase()]);
      } else {
        setCapturedBlack([...capturedBlack, normalizedPiece.toUpperCase()]);
      }
    }
  
    // Clear original position
    updatedBoard[x][y] = " ";
  
    // Check for promotion
    if (shouldPromote(piece, targetX)) {
      const promotionChoice = window.confirm("Do you want to promote this piece?");
      if (promotionChoice && !piece.includes("+")) {
        updatedBoard[targetX][targetY] = piece + "+";
      } else {
        updatedBoard[targetX][targetY] = piece;
      }
    } else {
      updatedBoard[targetX][targetY] = piece;
    }
  
    setBoard(updatedBoard);
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
    setSelectedPiece(null);
    setPossibleMoves([]);
  };

  const handleCapturedPieceSelect = (piece, player) => {
    if (currentPlayer !== player) return;
    setSelectedPiece({ piece, isCaptured: true });
    setPossibleMoves(getDropLocations(piece, board));
  };

  const handleDrop = (targetX, targetY) => {
    if (!selectedPiece || !selectedPiece.isCaptured || !possibleMoves.some(([px, py]) => px === targetX && py === targetY)) return;

    const piece = selectedPiece.piece;
    const updatedBoard = [...board];
    updatedBoard[targetX][targetY] = currentPlayer === "white" ? piece.toUpperCase() : piece.toLowerCase();

    if (currentPlayer === "white") {
      setCapturedWhite(capturedWhite.filter((p) => p !== piece));
    } else {
      setCapturedBlack(capturedBlack.filter((p) => p !== piece));
    }

    setBoard(updatedBoard);
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
    setSelectedPiece(null);
    setPossibleMoves(pieceMovements);
  };

  const handleSquareClick = (x, y) => {
  const piece = board[x][y];
  const isWhitePiece = piece === piece.toUpperCase();
  const isBlackPiece = piece !== " " && piece === piece.toLowerCase();

  // If no piece is selected and clicked square has a piece of current player's color
  if (!selectedPiece && piece !== " " && 
      ((currentPlayer === "white" && isWhitePiece) || 
       (currentPlayer === "black" && isBlackPiece))) {
    
    const moves = getPossibleMoves(piece, x, y, board);
    
    // Even if there are no valid moves, we should still set the selected piece
    setSelectedPiece({ x, y, piece });
    setPossibleMoves(moves);
    return;
  }

  // If a piece is already selected
  if (selectedPiece) {
    // If clicking on the same piece, deselect it
    if (selectedPiece.x === x && selectedPiece.y === y) {
      setSelectedPiece(null);
      setPossibleMoves([]);
      return;
    }

    // If clicking on another piece of the same color, select the new piece
    if (piece !== " " && 
        ((currentPlayer === "white" && isWhitePiece) || 
         (currentPlayer === "black" && isBlackPiece))) {
      const moves = getPossibleMoves(piece, x, y, board);
      setSelectedPiece({ x, y, piece });
      setPossibleMoves(moves);
      return;
    }

    // Try to move the selected piece
    if (possibleMoves.some(([px, py]) => px === x && py === y)) {
      handleMove(x, y);
    } else {
      // If clicking on an invalid square, deselect the piece
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  }
};


  return (
    <div className="container flex flex-col items-center">
    <h1 className="mb-24 text-4xl font-black text-black">
      Current Player: {currentPlayer}
    </h1>
    <div className="shogi-board">
      {board.map((row, x) =>
        row.map((piece, y) => (
          <div
            key={`${y}-${x}`}
            className={`cell ${Array.isArray(possibleMoves) && possibleMoves.some(([px, py]) => px === x && py === y) ? "highlight" : ""}`}
            onClick={() =>  selectedPiece ? handleSquareClick(x, y) : handlePieceSelect(x, y)}
          >
            {piece !== " " && (
              <Image
                className="object-center object-scale-down"
                src={pieceImages[piece]}
                alt={piece}
                width={45}
                height={45}
              />
            )}
          </div>
        ))
      )}
    </div>
    <div className="captured m-5">
      <h3>Captured by White</h3>
      
      <div className="">
        {capturedWhite.map((piece, index) => (
          <Image
            className="object-center object-scale-down inline-flex flex-col w-auto h-auto"
            key={index}
            src={pieceImages[piece.toLowerCase()]}
            alt={piece}
            width={30}
            height={30}
          />
        ))}
      </div>
      <h3>Captured by Black</h3>
      
      <div className="">
        {capturedBlack.map((piece, index) => (
          <Image
            className="object-center object-scale-down inline-flex flex-col w-auto h-auto"
            key={index}
            src={pieceImages[piece.toUpperCase()]}
            alt={piece}
            width={30}
            height={30}
          />
        ))}
      </div>
    </div>
  </div>
  );

};

export default ShogiBoard;
