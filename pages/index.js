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
 
   const isWithinBounds = (row, col) => row >= 0 && row < 9 && col >= 0 && col < 9;
 
   const pieceMovements = {
     p: { normal: [{ x: 0, y: 1 }], promoted: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: -1 }] },
     P: { normal: [{ x: 0, y: -1 }], promoted: [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }] },
     l: { normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), promoted: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }] },
     L: { normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), promoted: [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }] },
     n: { normal: [{ x: 1, y: -2 }, { x: -1, y: -2 }], promoted: [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }] },
     N: { normal: [{ x: 1, y: 2 }, { x: -1, y: 2 }], promoted: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }] },
     s: { normal: [{ x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }], promoted: [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }] },
     S: { normal: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }], promoted: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }] },
     g: { normal: [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }] },
     G: { normal: [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }] },
     b: { normal: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }], promoted: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 0, y: 1 }] },
     B: { normal: [{ x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }], promoted: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }] },
     r: { normal: Array.from({ length: 8 }, (_, i) => [{ x: 0, y: i + 1 }, { x: i + 1, y: 0 }, { x: 0, y: -(i + 1) }]), promoted: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }] },
     k: { normal: [{ x: 0, y: 1 }, { x: 1, y: 0 }] },
   };
 
   const getPossibleMoves = (piece, row, col) => {
    const isPromoted = piece.includes("+");
    const isWhitePiece = piece === piece.toUpperCase();
    const moveType = isPromoted ? "promoted" : "normal";
    const movements = pieceMovements[piece.toLowerCase()]?.[moveType] || [];

    const validMoves = [];

    movements.forEach(({ x, y }) => {
      let newRow = row + (isWhitePiece ? -y : y); // White moves up, Black moves down
      let newCol = col + x;

      // Handle unrestricted movement for Rook and Bishop
      if ((piece.toLowerCase() === "r" || piece.toLowerCase() === "b") && !isPromoted) {
        let i = 1;
        while (isWithinBounds(newRow, newCol) && board[newRow][newCol] === " ") {
          validMoves.push({ row: newRow, col: newCol });
          newRow += (isWhitePiece ? -y : y) * i;
          newCol += x * i;
          i++;
        }
        if (isWithinBounds(newRow, newCol) && isEnemyPiece(board[newRow][newCol])) {
          validMoves.push({ row: newRow, col: newCol });
        }
      } else if (isWithinBounds(newRow, newCol)) {
        const targetPiece = board[newRow][newCol];
        if (targetPiece === " " || isEnemyPiece(targetPiece)) {
          validMoves.push({ row: newRow, col: newCol });
        }
      }
    });

    return validMoves;
  };

  const isEnemyPiece = (piece) => {
    if (!piece || piece === " ") return false;
    return currentPlayer === "white" ? piece === piece.toLowerCase() : piece === piece.toUpperCase();
  };

  const handleSelectPiece = (row, col) => {
    const piece = board[row][col];
    if (piece && ((currentPlayer === "white" && piece === piece.toUpperCase()) || (currentPlayer === "black" && piece === piece.toLowerCase()))) {
      setSelectedPiece({ piece, row, col });
      setPossibleMoves(getPossibleMoves(piece, row, col));
    } else {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const handleMovePiece = (toRow, toCol) => {
    if (!selectedPiece) return;

    const { row, col, piece } = selectedPiece;
    const validMove = possibleMoves?.some((move) => move.row === toRow && move.col === toCol);

    if (validMove) {
      const newBoard = board?.map((r) => r.slice());
      if (newBoard[toRow][toCol] !== " ") capturePiece(newBoard[toRow][toCol]);
      newBoard[toRow][toCol] = promoteIfEligible(piece, toRow);
      newBoard[row][col] = " ";
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
      setSelectedPiece(null);
      setPossibleMoves([]);
    } else {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const capturePiece = (piece) => {
    if (piece === piece.toUpperCase()) setCapturedBlack((prev) => [...prev, piece]);
    else setCapturedWhite((prev) => [...prev, piece]);
  };

  // Promote piece if it enters the promotion zone
  const promoteIfEligible = (piece, row) => {
    if (piece === "p" && row === 0 || piece === "P" && row === 7) {
      return piece + "+";  // Promote pawn
    }
    return piece;
  };
  
 
   const handleSquareClick = (row, col) => {
     if (selectedPiece) {
       handleMovePiece(row, col);
     } else {
       handleSelectPiece(row, col);
     }
   };

  return (
    <div className="container board-grid mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2>Shogi - Turn: {currentPlayer === "white" ? "White" : "Black"}</h2>
      <div className="board mx-auto max-w-3xl">
        {board?.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row?.map((cell, colIndex) => {
              const isHighlighted = possibleMoves?.some((move) => move.row === rowIndex && move.col === colIndex);
              return (
                <div
                  key={colIndex}
                  className={`cell ${isHighlighted ? "highlight" : ""}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {cell !== " " && (
                    <Image className="object-center object-scale-down aspect-auto w-auto h-auto" src={pieceImages[cell]} alt={cell} width={50} height={50} priority={true} unoptimized={true} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="captured">
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
                height={30}
              />
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
                height={30}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShogiBoard;
