import Image from "next/image";
import { useState, useEffect, useCallback, useMemo } from "react";

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
    p: "/images/pieces/Pawn.svg",
    P: "/images/pieces/Pawn.svg",
    "p+": "/images/pieces/Pawn+.svg",
    "P+": "/images/pieces/Pawn+.svg",
    l: "/images/pieces/Lance.svg",
    L: "/images/pieces/Lance.svg",
    "l+": "/images/pieces/Lance+.svg",
    "L+": "/images/pieces/Lance+.svg",
    n: "/images/pieces/Knight.svg",
    N: "/images/pieces/Knight.svg",
    "n+": "/images/pieces/Knight+.svg",
    "N+": "/images/pieces/Knight+.svg",
    s: "/images/pieces/SilverGeneral.svg",
    S: "/images/pieces/SilverGeneral.svg",
    "s+": "/images/pieces/SilverGeneral+.svg",
    "S+": "/images/pieces/SilverGeneral+.svg",
    g: "/images/pieces/GoldGeneral.svg",
    G: "/images/pieces/GoldGeneral.svg",
    b: "/images/pieces/Bishop.svg",
    B: "/images/pieces/Bishop.svg",
    "b+": "/images/pieces/Bishop+.svg",
    "B+": "/images/pieces/Bishop+.svg",
    r: "/images/pieces/Rook.svg",
    R: "/images/pieces/Rook.svg",
    "r+": "/images/pieces/Rook+.svg",
    "R+": "/images/pieces/Rook+.svg",
    k: "/images/pieces/_king.svg",
    K: "/images/pieces/King.svg",
  };

  

  const pieceMovements = useMemo(() => ({
    p: {
      normal: [{ x: 0, y: 1 }], // Unpromoted Pawn (moves forward one square)
      promoted: [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted Pawn (can move forward, backward, left, and right)
    },
    P: {
      normal: [{ x: 0, y: -1 }], // Unpromoted White Pawn (moves forward one square for white side)
      promoted: [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted White Pawn (can move forward, backward, left, and right)
    },
    l: {
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })), // Unpromoted Lance (moves any number of squares forward)
      promoted: [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted Lance (can move forward, backward, left, and right)
    },
    L: {
      normal: Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })), // Unpromoted White Lance
      promoted: [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted White Lance (can move forward, backward, left, and right)
    },
    n: {
      normal: [
        { x: 1, y: -2 },
        { x: -1, y: -2 },
      ], // Unpromoted Knight (jumps forward)
      promoted: [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted Knight (can move forward, backward, left, and right)
    },
    N: {
      normal: [
        { x: 1, y: 2 },
        { x: -1, y: 2 },
      ], // Unpromoted White Knight
      promoted: [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted White Knight (can move forward, backward, left, and right)
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
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted Silver General (can move forward, backward, left, and right)
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
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ], // Promoted White Silver General (can move forward, backward, left, and right)
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
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ], // White Gold General
    },
    b: {
      normal: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: i + 1 })), // Diagonal moves in 4 directions
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
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        ...Array.from({ length: 8 }, (_, i) => ({ x: i + 1, y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: -(i + 1), y: 0 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: i + 1 })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 0, y: -(i + 1) })),
      ], // Promoted Rook gains King's diagonal moves
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
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
      ], // White King
    },
  }), []);

  const getPossibleMoves = useCallback((piece, x, y, board) => {
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
  }, [pieceMovements]);
  
  // State management
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState("white");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [undoIndex, setUndoIndex] = useState(0);

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

  const selectPiece = (x, y) => {
    const piece = board[x][y];
    if (piece && (currentPlayer === "white" ? piece === piece.toUpperCase() : piece === piece.toLowerCase())) {
      setSelectedPiece({ x, y, piece });
      const moves = getPossibleMoves(piece, x, y, board);
      setPossibleMoves(moves);
    } else {
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const movePiece = (targetX, targetY) => {
    if (!selectedPiece || !possibleMoves.some(([px, py]) => px === targetX && py === targetY)) return;
  
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
      updatedBoard[targetX][targetY] = " "; // Clear the captured piece's position
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
  
    // Add the move to the history
    setMoveHistory([...moveHistory.slice(0, undoIndex), { board: updatedBoard, player: currentPlayer }]);
    setUndoIndex(moveHistory.length + 1);
  
    // Check for victory condition
    if (isVictory()) {
      // Game is over, determine the winner and display the result
      if (findKingPosition("K")) {
        alert("White wins!");
      } else {
        alert("Black wins!");
      }
      // Reset the game or do any other desired actions
    }
  };

  const isVictory = () => {
    const whiteKingPosition = findKingPosition("K");
    const blackKingPosition = findKingPosition("k");
  
    if (!whiteKingPosition || !blackKingPosition) {
      return true; // If either king is missing, the game is over
    }
  
    return false; // No victory condition met yet
  };
  
  const handleCapturedPieceSelect = (piece, player, targetX, targetY) => {
    if (currentPlayer !== player) return;
    setSelectedPiece({ piece, isCaptured: true, x: targetX, y: targetY });
    setPossibleMoves(getDropLocations(piece, board));
  };

  const dropCapturedPiece = (targetX, targetY) => {
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

    // Add the move to the history
    setMoveHistory([...moveHistory.slice(0, undoIndex), { board: updatedBoard, player: currentPlayer }]);
    setUndoIndex(moveHistory.length + 1);
  };

  const handleSquareClick = (x, y) => {
    const piece = board[x][y];
    const isWhitePiece = piece === piece.toUpperCase();
    const isBlackPiece = piece !== " " && piece === piece.toLowerCase();
  
    if (!selectedPiece && piece !== " " && ((currentPlayer === "white" && isWhitePiece) || (currentPlayer === "black" && isBlackPiece))) {
      if (isInCheck(currentPlayer)) {
        // Player's king is in check, only allow them to move the king
        if (piece.toLowerCase() === 'k') {
          selectPiece(x, y);
        } else {
          return;
        }
      } else {
        selectPiece(x, y);
      }
    } else if (selectedPiece) {
      if (selectedPiece.x === x && selectedPiece.y === y) {
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else if (piece !== " " && ((currentPlayer === "white" && isWhitePiece) || (currentPlayer === "black" && isBlackPiece))) {
        selectPiece(x, y);
      } else if (possibleMoves.some(([px, py]) => px === x && py === y)) {
        const capturedPiece = board[x][y];
        movePiece(x, y);
        if (capturedPiece === (currentPlayer === "white" ? "k" : "K")) {
          // King has been captured, end the game
          alert(`${currentPlayer === "black" ? "White" : "Black"} wins!`);
          // Reset the game or do any other desired actions
        }
      } else if (selectedPiece.isCaptured) {
        handleDrop(x, y);
      } else {
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    }
  };
  
  const handleDrop = (targetX, targetY) => {
    if (!selectedPiece || !selectedPiece.isCaptured || !possibleMoves.some(([px, py]) => px === targetX && py === targetY)) return;
  
    const { piece, isCaptured } = selectedPiece;
    const updatedBoard = [...board];
    updatedBoard[targetX][targetY] = currentPlayer === "white" ? piece.toUpperCase() : piece.toLowerCase();
  
    // Update the captured pieces arrays
    if (isCaptured) {
      if (currentPlayer === "white") {
        setCapturedWhite(capturedWhite.filter((p) => p !== piece.toLowerCase()));
      } else {
        setCapturedBlack(capturedBlack.filter((p) => p !== piece.toUpperCase()));
      }
    }
  
    setBoard(updatedBoard);
    setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
    setSelectedPiece(null);
    setPossibleMoves([]);
  
    // Add the move to the history
    setMoveHistory([...moveHistory.slice(0, undoIndex), { board: updatedBoard, player: currentPlayer }]);
    setUndoIndex(moveHistory.length + 1);
  };

const findKingPosition = useCallback((kingPiece) => {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        if (board[x][y] === kingPiece) {
          return [x, y];
        }
      }
    }
    return null;
  },[board]);

  const isInCheck = useCallback((player) => {
    const kingPosition = player === "white" ? findKingPosition("K") : findKingPosition("k");
    if (!kingPosition) return false;

    const [kingX, kingY] = kingPosition;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] !== " " && (player === "white" ? board[i][j] === board[i][j].toLowerCase() : board[i][j] === board[i][j].toUpperCase())) {
          const moves = getPossibleMoves(board[i][j], i, j, board);
          if (moves.some(([px, py]) => px === kingX && py === kingY)) {
            return true;
          }
        }
      }
    }
    return false;
  },[board, findKingPosition, getPossibleMoves]);

  const isCheckmate = useCallback((player) => {
    if (!isInCheck(player)) return false;

    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        if (board[x][y] !== " " && (player === "white" ? board[x][y] === board[x][y].toUpperCase() : board[x][y] === board[x][y].toLowerCase())) {
          const moves = getPossibleMoves(board[x][y], x, y, board);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }

    return true;
  },[board, getPossibleMoves, isInCheck]);

  const isStaleMate =useCallback( (player) => {
    if (isInCheck(player)) return false;

    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 9; y++) {
        if (board[x][y] !== " " && (player === "white" ? board[x][y] === board[x][y].toUpperCase() : board[x][y] === board[x][y].toLowerCase())) {
          const moves = getPossibleMoves(board[x][y], x, y, board);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }

    return true;
  },[board, getPossibleMoves, isInCheck]);

  const handleUndo = () => {
    if (undoIndex > 0) {
      setUndoIndex(undoIndex - 1);
      const { board, player } = moveHistory[undoIndex - 1];
      setBoard(board);
      setCurrentPlayer(player);
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  const handleRedo = () => {
    if (undoIndex < moveHistory.length) {
      setUndoIndex(undoIndex + 1);
      const { board, player } = moveHistory[undoIndex];
      setBoard(board);
      setCurrentPlayer(player);
      setSelectedPiece(null);
      setPossibleMoves([]);
    }
  };

  useEffect(() => {
    if (isCheckmate(currentPlayer)) {
      alert(`Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins.`);
      // Reset the game or do any other desired actions
      
    } else if (isStaleMate(currentPlayer)) {
      alert("Stalemate! The game is a draw.");
      // Reset the game or do any other desired actions
    }
  }, [currentPlayer, isCheckmate, isStaleMate]);

  return (
<div className="container flex flex-col items-center">
  <h1 className="mb-24 text-4xl font-black text-black">
    Current Player: {currentPlayer}
    {isInCheck(currentPlayer) && ` (in check)`}
  </h1>
  <div
    className={`board shogi-board ${
      currentPlayer === "black" ? "rotate-0" : ""
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
                piece === piece.toLowerCase() ? "rotate-0" : ""
              }`}
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


      <div className="controls m-5 w-full mt-24 max-w-72 mx-auto space-x-0 sm:space-x-10 sm:space-y-0">
        <button className="float-start bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleUndo}>Undo</button>
        <button className="float-end bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleRedo}>Redo</button>
      </div>
      <div className="captured m-5 w-full">
  <div className="float-start inline-flex flex-row flex-wrap w-1/2">
    <h3>Captured by White</h3>
    {capturedWhite.map((piece, index) => (
      <Image
        className="object-center object-scale-down  w-auto h-auto"
        key={index}
        src={pieceImages[piece.toLowerCase()]}
        alt={piece}
        width={30}
        height={30}
        onClick={(e) =>
          handleCapturedPieceSelect(
            piece,
            "black",
            parseInt(e.currentTarget.dataset.x),
            parseInt(e.currentTarget.dataset.y)
          )
        }
        data-x={Math.floor(Math.random() * 9)}
        data-y={Math.floor(Math.random() * 9)}
      />
    ))}
  </div>
  <div className="float-end inline-flex flex-row-reverse flex-wrap w-1/2">
    <h3>Captured by Black</h3>
    {capturedBlack.map((piece, index) => (
      <Image
        className="object-center object-scale-down  w-auto h-auto"
        key={index}
        src={pieceImages[piece.toUpperCase()]}
        alt={piece}
        width={30}
        height={30}
        onClick={(e) =>
          handleCapturedPieceSelect(
            piece,
            "white",
            parseInt(e.currentTarget.dataset.x),
            parseInt(e.currentTarget.dataset.y)
          )
        }
        data-x={Math.floor(Math.random() * 9)}
        data-y={Math.floor(Math.random() * 9)}
      />
    ))}
  </div>
</div>
</div>
  );
};

export default ShogiBoard;