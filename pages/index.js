import Image from "next/image";
import React, {
  useState,
  useEffect,
  useCallback,
  startTransition,
} from "react";

const openingBook = [
  {
    name: "Yagura",
    sequence: [
      { from: [ 6, 6 ], to: [ 5, 6 ], piece: "p" },
      { from: [ 2, 2 ], to: [ 3, 2 ], piece: "P" },
      { from: [ 8, 5 ], to: [ 7, 5 ], piece: "g" },
      { from: [ 0, 3 ], to: [ 1, 3 ], piece: "G" },
      { from: [ 8, 2 ], to: [ 7, 3 ], piece: "s" },
      { from: [ 0, 6 ], to: [ 1, 5 ], piece: "S" },
      { from: [ 6, 1 ], to: [ 5, 1 ], piece: "p" },
      { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" },
    ],
  },
  {
    name: "Double Wing Attack",
    sequence: [
      { from: [ 6, 1 ], to: [ 5, 1 ], piece: "p" },
      { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" },
      { from: [ 6, 7 ], to: [ 5, 7 ], piece: "p" },
      { from: [ 2, 1 ], to: [ 3, 1 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 5, 7 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 3, 1 ], piece: "R" },
    ],
  },
  {
    name: "Static Rook",
    sequence: [
      { from: [ 6, 6 ], to: [ 5, 6 ], piece: "p" },
      { from: [ 2, 2 ], to: [ 3, 2 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 6, 7 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 2, 1 ], piece: "R" },
      { from: [ 8, 6 ], to: [ 7, 6 ], piece: "g" },
      { from: [ 0, 2 ], to: [ 1, 2 ], piece: "G" },
    ],
  },
  {
    name: "Fourth File Rook",
    sequence: [
      { from: [ 6, 3 ], to: [ 5, 3 ], piece: "p" },
      { from: [ 2, 5 ], to: [ 3, 5 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 7, 3 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 1, 5 ], piece: "R" },
      { from: [ 8, 3 ], to: [ 7, 3 ], piece: "s" },
      { from: [ 0, 5 ], to: [ 1, 5 ], piece: "S" },
    ],
  },
];

function hashMove( { from, to, piece } ) {
  if ( !from || !to || !piece ) return "";
  return `${ from[ 0 ] }${ from[ 1 ] }${ to[ 0 ] }${ to[ 1 ] }${ piece }`;
}

// Piece images mapped to their symbols
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

const pieceNames = {
  p: "Pawn",
  "p+": "Tokin",
  l: "Lance",
  "l+": "Promoted Lance",
  n: "Knight",
  "n+": "Promoted Knight",
  s: "Silver General",
  "s+": "Promoted Silver",
  g: "Gold General",
  b: "Bishop",
  "b+": "Horse",
  r: "Rook",
  "r+": "Dragon",
  k: "King",
  P: "Pawn",
  "P+": "Tokin",
  L: "Lance",
  "L+": "Promoted Lance",
  N: "Knight",
  "N+": "Promoted Knight",
  S: "Silver General",
  "S+": "Promoted Silver",
  G: "Gold General",
  B: "Bishop",
  "B+": "Horse",
  R: "Rook",
  "R+": "Dragon",
  K: "King",
};

// Initial Shogi board setup
const initialBoard = [
  [ "l", "n", "s", "g", "k", "g", "s", "n", "l" ],
  [ " ", "r", " ", " ", " ", " ", " ", "b", " " ],
  [ "p", "p", "p", "p", "p", "p", "p", "p", "p" ],
  [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
  [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
  [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
  [ "P", "P", "P", "P", "P", "P", "P", "P", "P" ],
  [ " ", "B", " ", " ", " ", " ", " ", "R", " " ],
  [ "L", "N", "S", "G", "K", "G", "S", "N", "L" ],
];

const pieceValue = {
  p: 500,
  l: 1000,
  n: 1000,
  s: 3000,
  g: 5000,
  b: 3000,
  r: 5000,
  k: 100000,
  P: 500,
  L: 1000,
  N: 1000,
  S: 3000,
  G: 5000,
  B: 3000,
  R: 5000,
  K: 100000,
  "p+": 1000,
  "l+": 3000,
  "n+": 3000,
  "s+": 5000,
  "b+": 9000,
  "r+": 9000,
  "+P": 4500,
  "+L": 5500,
  "+N": 5500,
  "+S": 6500,
  "+B": 7500,
  "+R": 9000,
};

const goldMovement = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

const scoreMove = ( { piece, captured, promotes, putsOpponentInCheck, to } ) => {
  const val = pieceValue[ piece.replace( "+", "" ).toLowerCase() ] || 0;
  const capturedVal = captured
    ? pieceValue[ captured.replace( "+", "" ).toLowerCase() ] || 0
    : 0;

  const [ x, y ] = to || [ 0, 0 ];
  const centerBonus = 4 - Math.abs( 4 - x ) + ( 4 - Math.abs( 4 - y ) ); // closer to center = better

  let score = 0;
  score += capturedVal * 1.2;
  score += promotes ? 2.5 : 0;
  score += putsOpponentInCheck ? 2 : 0;
  score += centerBonus * 0.2;
  score -= val * 0.4;

  return score;
};

// Main ShogiBoard component
const ShogiBoard = () => {
  // State management
  const [ board, setBoard ] = useState( initialBoard );
  const [ piece, setPieces ] = useState( {} );
  const [ currentPlayer, setCurrentPlayer ] = useState( "gote" ); // Gote starts
  const [ selectedPiece, setSelectedPiece ] = useState( null ); // Currently selected piece
  const [ possibleMoves, setPossibleMoves ] = useState( [] ); // Legal moves for selected piece
  const [ capturedGote, setCapturedGote ] = useState( [] ); // Pieces captured by Gote
  const [ capturedSente, setCapturedSente ] = useState( [] ); // Pieces captured by Sente
  const [ moveHistory, setMoveHistory ] = useState( [] ); // Move history for undo/redo
  const [ undoIndex, setUndoIndex ] = useState( 0 ); // Current position in move history
  const [ vsAI, setVsAI ] = useState( true );
  const [ gameOver, setGameOver ] = useState( false );
  const [ lastMove, setLastMove ] = useState( null ); // { from: [x, y], to: [x, y] }
  const [ openingStep, setOpeningStep ] = useState( 0 );
  const [ matchedOpening, setMatchedOpening ] = useState( null );
  const [ drawerOpen, setDrawerOpen ] = useState( false );
  const [ checkmateInfo, setCheckmateInfo ] = useState( null ); // null | { player, kingPos, lastMove }
  const [ replayMode, setReplayMode ] = useState( false );
  const [ replayIndex, setReplayIndex ] = useState( 0 );
  const [ replayPlaying, setReplayPlaying ] = useState( false );
  const [ replaySpeed, setReplaySpeed ] = useState( 1000 ); // 1 second per move
  const [ showModal, setShowModal ] = useState( true );
  const [ aiThinking, setAiThinking ] = useState( false );

  const BOARD_SIZE = 9;

  // Populate pieces with initial metadata
  useEffect( () => {
    const initializePieces = () => {
      const initialPieces = {};
      initialBoard.forEach( ( row, x ) => {
        row.forEach( ( piece, y ) => {
          if ( piece !== " " ) {
            initialPieces[ `${ x }-${ y }` ] = {
              type: piece,
              state: "active",
              position: { x, y },
            };
          }
        } );
      } );
      setPieces( initialPieces );
    };
    initializePieces();
  }, [] );

  const getPieceValue = ( piece ) => {
    const normalized = piece.replace( "+", "" ).toLowerCase();
    return pieceValue[ normalized ] || 0;
  };

  const groupAndSortCaptured = ( capturedArray ) => {
    const grouped = {};

    for ( const piece of capturedArray ) {
      const normalized = piece.replace( "+", "" );
      grouped[ normalized ] = ( grouped[ normalized ] || 0 ) + 1;
    }

    return Object.entries( grouped )
      .sort( ( a, b ) => getPieceValue( b[ 0 ] ) - getPieceValue( a[ 0 ] ) )
      .map( ( [ piece, count ] ) => ( { piece, count } ) );
  };

  // Select a piece on the board
  const selectPiece = ( x, y ) => {
    const piece = board[ x ][ y ];
    const isCurrentPlayerPiece =
      currentPlayer === "gote"
        ? piece === piece.toUpperCase()
        : piece === piece.toLowerCase();

    if ( piece && isCurrentPlayerPiece ) {
      setSelectedPiece( { x, y, piece } );
      setPossibleMoves( getPossibleMoves( piece, x, y, board ) );
    } else {
      setSelectedPiece( null );
      setPossibleMoves( [] );
    }
  };

  // Get all possible moves for the selected piece
  const getPossibleMoves = useCallback( ( piece, x, y, board ) => {
    const isPromoted = piece.includes( "+" );
    const basePiece = piece.replace( "+", "" ).toLowerCase();
    const isGote = piece === piece.toUpperCase();

    const pieceMovements = {
      p: {
        normal: [ { x: 0, y: -1 } ], // Sente Pawn moves forward
        promoted: goldMovement,
      },
      P: {
        normal: [ { x: 0, y: 1 } ], // Gote Pawn moves forward
        promoted: goldMovement,
      },
      l: {
        normal: Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ), // Sente Lance moves any number of squares forward
        promoted: goldMovement,
      },
      L: {
        normal: Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ), // Gote Lance moves any number of squares forward
        promoted: goldMovement,
      },
      n: {
        normal: [
          { x: -1, y: 2 },
          { x: 1, y: 2 },
        ], // Sente knight
        promoted: goldMovement,
      },
      N: {
        normal: [
          { x: -1, y: -2 },
          { x: 1, y: -2 },
        ], // Gote knight
        promoted: goldMovement,
      },
      s: {
        normal: [
          { x: 0, y: 1 }, // Forward
          { x: 1, y: 1 }, // Forward-right
          { x: -1, y: 1 }, // Forward-left
          { x: 1, y: -1 }, // Backward-right
          { x: -1, y: -1 }, // Backward-left
        ],
        promoted: goldMovement,
      },
      S: {
        normal: [
          { x: 0, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
        ],
        promoted: goldMovement,
      },
      g: {
        normal: goldMovement,
      },
      G: {
        normal: goldMovement,
      },
      b: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( {
            x: -( i + 1 ),
            y: -( i + 1 ),
          } ) ),
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( {
            x: -( i + 1 ),
            y: -( i + 1 ),
          } ) ),
          ...goldMovement,
        ],
      },
      B: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( {
            x: -( i + 1 ),
            y: -( i + 1 ),
          } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( {
            x: -( i + 1 ),
            y: -( i + 1 ),
          } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...goldMovement,
        ],
      },
      r: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
        ],
      },
      R: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -i + 1, y: 0 } ) ),
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: 1, y: 1 },
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

    const isInBounds = ( x, y ) => x >= 0 && x < 9 && y >= 0 && y < 9;
    const canCapture = ( newX, newY ) => {
      const target = board[ newX ][ newY ];
      return (
        target === " " ||
        ( isGote
          ? target === target.toLowerCase()
          : target === target.toUpperCase() )
      );
    };

    // Initialize moveSet before using
    const moveSet = isPromoted
      ? pieceMovements[ basePiece ]?.promoted || pieceMovements[ basePiece ]?.normal
      : pieceMovements[ basePiece ]?.normal;

    const possibleMoves = [];

    // Handle sliding pieces (rook, bishop, lance)
    const handleSlidingMove = ( startX, startY, dx, dy ) => {
      let newX = startX + dx;
      let newY = startY + dy;

      while ( isInBounds( newX, newY ) ) {
        const targetPiece = board[ newX ][ newY ];
        if ( targetPiece === " " ) {
          possibleMoves.push( [ newX, newY ] );
        } else {
          if ( canCapture( newX, newY ) ) {
            possibleMoves.push( [ newX, newY ] );
          }
          break;
        }
        newX += dx;
        newY += dy;
      }
    };

    // Check each possible move based on piece type
    switch ( basePiece ) {
      case "r": // Rook
        // Four orthogonal directions: down, up, right, left
        const rookDirs = [
          [ 1, 0 ], // down
          [ -1, 0 ], // up
          [ 0, 1 ], // right
          [ 0, -1 ], // left
        ];
        rookDirs.forEach( ( [ dx, dy ] ) => handleSlidingMove( x, y, dx, dy ) );

        // If promoted, also add single‑step diagonal moves
        if ( isPromoted ) {
          [
            [ 1, 1 ],
            [ 1, -1 ],
            [ -1, 1 ],
            [ -1, -1 ],
          ].forEach( ( [ dx, dy ] ) => {
            const nx = x + dx,
              ny = y + dy;
            if ( isInBounds( nx, ny ) && canCapture( nx, ny ) ) {
              possibleMoves.push( [ nx, ny ] );
            }
          } );
        }
        break;

      case "b": // Bishop
        const bishopDirs = [
          [ 1, 1 ],
          [ 1, -1 ],
          [ -1, 1 ],
          [ -1, -1 ],
        ];
        bishopDirs.forEach( ( [ dx, dy ] ) => handleSlidingMove( x, y, dx, dy ) );

        // Add king-like moves for promoted bishop
        if ( isPromoted ) {
          [
            [ 0, 1 ],
            [ 0, -1 ],
            [ 1, 0 ],
            [ -1, 0 ],
          ].forEach( ( [ dx, dy ] ) => {
            const newX = x + dx;
            const newY = y + dy;
            if ( isInBounds( newX, newY ) && canCapture( newX, newY ) ) {
              possibleMoves.push( [ newX, newY ] );
            }
          } );
        }
        break;

      case "l": // Lance
        if ( !isPromoted ) {
          const direction = isGote ? -1 : 1;
          handleSlidingMove( x, y, direction, 0 );
          break; // only break for unpromoted
        }
      // Let promoted lance fall through to default for goldMovement

      case "n": // Knight
        if ( !isPromoted ) {
          const knightMoves = isGote
            ? [
              [ -2, -1 ],
              [ -2, 1 ],
            ] // Gote knight
            : [
              [ 2, -1 ],
              [ 2, 1 ],
            ]; // Sente knight

          knightMoves.forEach( ( [ dx, dy ] ) => {
            const newX = x + dx;
            const newY = y + dy;
            if ( isInBounds( newX, newY ) && canCapture( newX, newY ) ) {
              possibleMoves.push( [ newX, newY ] );
            }
          } );
          break; // prevent falling through if unpromoted
        }

      case "p": // Pawn
        if ( !isPromoted ) {
          const pawnDir = isGote ? -1 : 1;
          const newX = x + pawnDir;
          if ( isInBounds( newX, y ) && canCapture( newX, y ) ) {
            possibleMoves.push( [ newX, y ] );
          }
          break;
        }

      default:
        if ( moveSet && Array.isArray( moveSet ) ) {
          moveSet.forEach( ( { x: dx, y: dy } ) => {
            const newX = x + ( isGote ? -dy : dy );
            const newY = y + dx;
            if ( isInBounds( newX, newY ) && canCapture( newX, newY ) ) {
              possibleMoves.push( [ newX, newY ] );
            }
          } );
        }
        break;
    }

    return possibleMoves;
  }, [] );

  const movePiece = (
    targetX,
    targetY,
    fromX = null,
    fromY = null,
    forcePiece = null
  ) => {
    const pieceData =
      fromX !== null
        ? { x: fromX, y: fromY, piece: board[ fromX ][ fromY ] }
        : selectedPiece;
    if ( !pieceData ) return;

    const { x, y, piece } = pieceData;
    const legalMoves = getPossibleMoves( piece, x, y, board );
    const isLegal = legalMoves.some(
      ( [ px, py ] ) => px === targetX && py === targetY
    );
    if ( !isLegal ) return;

    const updatedBoard = board.map( ( row ) => [ ...row ] );

    // ⏪ Record state before move
    const historyEntry = {
      type: "move",
      boardBefore: board.map( ( r ) => [ ...r ] ),
      capturedGoteBefore: [ ...capturedGote ],
      capturedSenteBefore: [ ...capturedSente ],
      playerBefore: currentPlayer,
      lastMoveBefore: lastMove,
      openingStepBefore: openingStep,
    };

    // Capture logic
    const target = updatedBoard[ targetX ][ targetY ];
    if ( target !== " " ) {
      const normalized = target.replace( "+", "" );
      if ( currentPlayer === "gote" ) {
        setCapturedGote( [ ...capturedGote, normalized.toLowerCase() ] );
      } else {
        setCapturedSente( [ ...capturedSente, normalized.toUpperCase() ] );
      }
    }

    updatedBoard[ x ][ y ] = " ";

    // Promotion logic
    let finalPiece = piece;
    if ( forcePiece ) {
      finalPiece = forcePiece;
    } else if ( shouldPromote( piece, x, targetX ) && !piece.includes( "+" ) ) {
      const isMandatory = ( ( piece ) => {
        const isGote = piece === piece.toUpperCase();
        const base = piece.toLowerCase();
        return (
          [ "p", "l", "n" ].includes( base ) &&
          ( ( isGote && targetX === 0 ) || ( !isGote && targetX === 8 ) )
        );
      } )( piece, targetX );

      if ( isMandatory ) {
        finalPiece = piece + "+";
      } else if ( ( vsAI && currentPlayer === "gote" ) || !vsAI ) {
        const confirmPromotion = window.confirm(
          `Promote ${ pieceNames[ piece.toLowerCase() ] || piece }?`
        );
        finalPiece = confirmPromotion ? piece + "+" : piece;
      }
    }

    updatedBoard[ targetX ][ targetY ] = finalPiece;

    if ( isInCheck( currentPlayer, updatedBoard ) ) return;

    const nextPlayer = currentPlayer === "gote" ? "sente" : "gote";

    // ✅ Save after-move state
    historyEntry.boardAfter = updatedBoard.map( ( r ) => [ ...r ] );
    historyEntry.capturedGoteAfter = [
      ...( currentPlayer === "gote"
        ? [ ...capturedGote, target.toLowerCase() ]
        : capturedGote ),
    ];
    historyEntry.capturedSenteAfter = [
      ...( currentPlayer === "sente"
        ? [ ...capturedSente, target.toUpperCase() ]
        : capturedSente ),
    ];
    historyEntry.playerAfter = nextPlayer;
    historyEntry.lastMoveAfter = { from: [ x, y ], to: [ targetX, targetY ] };
    historyEntry.openingStepAfter = openingStep;

    setMoveHistory( [ ...moveHistory.slice( 0, undoIndex ), historyEntry ] );
    setUndoIndex( undoIndex + 1 );

    setBoard( updatedBoard );
    setCurrentPlayer( nextPlayer );
    setSelectedPiece( null );
    setPossibleMoves( [] );
    setLastMove( { from: [ x, y ], to: [ targetX, targetY ] } );

    if ( isVictory() ) {
      alert( `${ currentPlayer === "gote" ? "Sente" : "Gote" } wins!` );
    }
  };

  const shouldPromote = ( piece, fromX, toX ) => {
    if ( !piece || piece.includes( "+" ) ) return false;

    const base = piece.replace( "+", "" );
    const isGote = base === base.toUpperCase();

    if ( [ "K", "G", "k", "g" ].includes( base ) ) return false;

    if ( [ "P", "L", "N" ].includes( base ) && isGote && toX === 0 ) return true;
    if ( [ "p", "l", "n" ].includes( base ) && !isGote && toX === 8 ) return true;

    const fromInZone = isGote ? fromX <= 2 : fromX >= 6;
    const toInZone = isGote ? toX <= 2 : toX >= 6;

    return fromInZone || toInZone;
  };

  // Function to check if the current player is in check
  const isInCheck = ( player, tempBoard = board ) => {
    const kingPiece = player === "gote" ? "K" : "k";
    const kingPosition = findKingPosition( kingPiece, tempBoard );

    if ( !kingPosition ) {
      // King is missing from the board, which means the game is technically over
      return true;
    }

    const [ kingX, kingY ] = kingPosition;

    // Loop through opponent's pieces to see if any threaten the king
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = tempBoard[ i ][ j ];
        if (
          piece &&
          ( player === "gote"
            ? piece === piece.toLowerCase()
            : piece === piece.toUpperCase() )
        ) {
          const moves = getPossibleMoves( piece, i, j, tempBoard );
          if ( moves.some( ( [ px, py ] ) => px === kingX && py === kingY ) ) {
            return true; // King is in check
          }
        }
      }
    }
    return false; // King is safe
  };

  // Find the king's position on the board
  const findKingPosition = ( kingPiece, tempBoard = board ) => {
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        if ( tempBoard[ i ][ j ] === kingPiece ) {
          return [ i, j ]; // Return the position as an array when found
        }
      }
    }
    return null; // Explicitly return null if the king isn't found
  };

  // Check if the current player has achieved victory (opponent's king captured)
  const isVictory = () => {
    const goteKingPosition = findKingPosition( "K" );
    const senteKingPosition = findKingPosition( "k" );

    // Check if either king is missing
    if ( !goteKingPosition ) {
      alert( "Sente wins! Gote's king is missing." );
      setGameOver( true );
      return true; // Game over, Gote's king is missing
    }
    if ( !senteKingPosition ) {
      alert( "Gote wins! Sente's king is missing." );
      setGameOver( true );
      return true; // Game over, Sente's king is missing
    }

    return false; // Both kings are present, game continues
  };

  // Check for checkmate by seeing if the player has any legal moves left
  const isCheckmate = ( player ) => {
    if ( !isInCheck( player ) ) return false;

    const kingPiece = player === "gote" ? "K" : "k";
    const kingPos = findKingPosition( kingPiece );
    let legalExists = false;

    // Can any piece move legally?
    outerLoop: for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = board[ i ][ j ];
        if ( !piece ) continue;
        const isPlayersPiece =
          ( player === "gote" && piece === piece.toUpperCase() ) ||
          ( player === "sente" && piece === piece.toLowerCase() );
        if ( !isPlayersPiece ) continue;

        const moves = getPossibleMoves( piece, i, j, board );
        for ( const [ nx, ny ] of moves ) {
          const simulated = board.map( ( r ) => [ ...r ] );
          simulated[ i ][ j ] = " ";
          simulated[ nx ][ ny ] = piece;
          if ( !isInCheck( player, simulated ) ) {
            legalExists = true;
            break outerLoop;
          }
        }
      }
    }

    if ( !legalExists ) {
      setGameOver( true );
      setCheckmateInfo( {
        player,
        kingPos,
        lastMove,
      } );
      return true;
    }

    return false;
  };

  // Check for stalemate (no legal moves, but not in check)
  const isStalemate = ( player ) => {
    if ( isInCheck( player ) ) return false; // Can't be stalemate if in check

    // Check if any legal moves are available
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = board[ i ][ j ];
        if (
          piece &&
          ( player === "gote"
            ? piece === piece.toUpperCase()
            : piece === piece.toLowerCase() )
        ) {
          const moves = getPossibleMoves( piece, i, j, board );
          if ( moves.length > 0 ) {
            return false; // Player can make a move, so not stalemate
          }
        }
      }
    }

    alert( "Stalemate! The game is a draw." );
    resetGame();
    return true;
  };

  // Check for checkmate or stalemate after every turn
  useEffect( () => {
    if ( isCheckmate( currentPlayer ) || isStalemate( currentPlayer ) ) {
      // Game is over
    }
  }, [ currentPlayer, isCheckmate, isStalemate ] );

  // Function to handle dropping a captured piece onto the board
  const handleDropCapturedPiece = ( piece, targetX, targetY ) => {
    if ( board[ targetX ][ targetY ] !== " " ) return;

    const playerCaps = currentPlayer === "gote" ? capturedGote : capturedSente;
    if ( !playerCaps.includes( piece ) ) {
      alert( "Invalid drop: You can only drop pieces you've captured." );
      return;
    }

    const updatedBoard = board.map( ( r ) => [ ...r ] );

    // ⏪ Save previous state
    const historyEntry = {
      type: "drop",
      boardBefore: board.map( ( r ) => [ ...r ] ),
      capturedGoteBefore: [ ...capturedGote ],
      capturedSenteBefore: [ ...capturedSente ],
      playerBefore: currentPlayer,
      lastMoveBefore: lastMove,
      openingStepBefore: openingStep,
    };

    updatedBoard[ targetX ][ targetY ] =
      currentPlayer === "gote" ? piece.toUpperCase() : piece.toLowerCase();

    const newCaps = [ ...playerCaps ];
    newCaps.splice( newCaps.indexOf( piece ), 1 );
    currentPlayer === "gote"
      ? setCapturedGote( newCaps )
      : setCapturedSente( newCaps );

    if ( isInCheck( currentPlayer, updatedBoard ) ) {
      alert( "Invalid drop: you cannot leave your king in check." );
      return;
    }

    const nextPlayer = currentPlayer === "gote" ? "sente" : "gote";

    // ✅ Save after-drop state
    historyEntry.boardAfter = updatedBoard.map( ( r ) => [ ...r ] );
    historyEntry.capturedGoteAfter = [
      ...( currentPlayer === "gote" ? newCaps : capturedGote ),
    ];
    historyEntry.capturedSenteAfter = [
      ...( currentPlayer === "sente" ? newCaps : capturedSente ),
    ];
    historyEntry.playerAfter = nextPlayer;
    historyEntry.lastMoveAfter = { from: null, to: [ targetX, targetY ] };
    historyEntry.openingStepAfter = openingStep;

    setMoveHistory( [ ...moveHistory.slice( 0, undoIndex ), historyEntry ] );
    setUndoIndex( undoIndex + 1 );

    setBoard( updatedBoard );
    setCurrentPlayer( nextPlayer );
    setSelectedPiece( null );
    setPossibleMoves( [] );

    if ( isVictory() ) {
      alert( `${ currentPlayer === "gote" ? "Sente" : "Gote" } wins!` );
      resetGame();
    }
  };

  // Validate pawn-specific drop rules (Nifu and last-rank restriction)
  const isValidPawnDrop = ( x, y, board ) => {
    // Nifu: Ensure no other pawn exists in the same file
    for ( let row = 0; row < 9; row++ ) {
      const cell = board[ row ][ y ];
      if (
        cell.toLowerCase() === "p" &&
        ( currentPlayer === "gote"
          ? cell === cell.toUpperCase()
          : cell === cell.toLowerCase() )
      ) {
        return false; // Nifu violation (double pawn in the same file)
      }
    }

    // Cannot drop a pawn on the last rank where it can't move
    if (
      ( currentPlayer === "gote" && x === 0 ) ||
      ( currentPlayer === "sente" && x === 8 )
    ) {
      return false;
    }

    return true;
  };

  // Check if dropping a piece is legal
  const isValidDrop = ( piece, x, y, board ) => {
    if ( piece.toLowerCase() === "p" && !isValidPawnDrop( x, y, board ) )
      return false;

    // Simulate drop
    const temp = board.map( ( r ) => [ ...r ] );
    temp[ x ][ y ] =
      currentPlayer === "gote" ? piece.toUpperCase() : piece.toLowerCase();

    // Cannot deliver immediate checkmate by pawn
    if (
      piece.toLowerCase() === "p" &&
      isCheckmate( currentPlayer === "gote" ? "sente" : "gote", temp )
    )
      return false;

    // And cannot leave yourself in check
    return !isInCheck( currentPlayer, temp );
  };
  // Get legal drop locations for a captured piece
  const getDropLocations = ( piece, board ) => {
    const moves = [];
    for ( let x = 0; x < 9; x++ ) {
      for ( let y = 0; y < 9; y++ ) {
        if ( board[ x ][ y ] === " " && isValidDrop( piece, x, y, board ) ) {
          moves.push( [ x, y ] );
        }
      }
    }
    return moves;
  };

  const refreshGameState = ( player ) => {
    if ( isVictory() ) return;
    if ( isCheckmate( player ) || isStalemate( player ) ) return;
  };

  const matchOpeningBook = () => {
    for ( const book of openingBook ) {
      const step = openingStep;
      const entry = book.sequence[ step ];
      if ( !entry ) continue;

      const { from, to, piece } = entry;

      // Confirm piece is still at `from` and `to` is empty
      if ( board[ from[ 0 ] ][ from[ 1 ] ] === piece && board[ to[ 0 ] ][ to[ 1 ] ] === " " ) {
        // Ensure this move hasn't already been played
        const h = hashMove( entry );

        const hasAlreadyPlayed = moveHistory.some(
          ( mh ) => mh.from && mh.to && mh.piece && hashMove( mh ) === h
        );

        if ( !hasAlreadyPlayed ) {
          return { book, entry };
        }
      }
    }
    return null;
  };

  const performAIMove = useCallback( async () => {
    if ( currentPlayer !== "sente" || gameOver ) return;
    setAiThinking( true );
    try {
      const pieceValues = {
        'p': 500,
        'l': 1000,
        'n': 1000,
        's': 3000,
        'g': 5000,
        'b': 3000,
        'r': 5000,
        'k': 100000,
        'P': 500,
        'L': 1000,
        'N': 1000,
        'S': 3000,
        'G': 5000,
        'B': 3000,
        'R': 5000,
        'K': 100000,
        "p+": 4500,
        "l+": 5500,
        "n+": 5500,
        "s+": 6500,
        "b+": 7500,
        "r+": 9000,
        "P+": 4500,
        "L+": 5500,
        "N+": 5500,
        "S+": 6500,
        "B+": 7500,
        "R+": 9000,
      };

      // ——— “Thinking” time cutoff (~300 ms) ———
      let nodesEvaluated = 0;
      const startTime = Date.now();
      const MAX_TIME = 3000; // 300 ms total budget
      let timeUp = false;

      // 1) Opening‐book check (unchanged)
      const bookMatch = matchedOpening
        ? { book: matchedOpening, entry: matchedOpening.sequence[ openingStep ] }
        : matchOpeningBook();
      if ( bookMatch ) {
        const { book, entry } = bookMatch;
        const { from, to, piece } = entry;
        movePiece( to[ 0 ], to[ 1 ], from[ 0 ], from[ 1 ], piece );
        setLastMove( { from, to } );
        setMatchedOpening( book );
        setOpeningStep( openingStep + 1 );

        setAiThinking( true );

        return;
      }

      // 2) Advanced AI: move generation + minimax + fallback

      const cloneBoard = ( b ) => {
        const nb = Array( 9 );
        for ( let i = 0; i < 9; i++ ) nb[ i ] = b[ i ].slice();
        return nb;
      };

      // Leaf evaluation (compute full positional score, then check time)
      const evaluatePosition = ( board, forPlayer ) => {
        nodesEvaluated++;

        let score = 0;
        const centerSquares = [
          [ 3, 3 ], [ 3, 4 ], [ 3, 5 ],
          [ 4, 3 ], [ 4, 4 ], [ 4, 5 ],
          [ 5, 3 ], [ 5, 4 ], [ 5, 5 ],
        ];

        try {
          for ( let x = 0; x < 9; x++ ) {
            for ( let y = 0; y < 9; y++ ) {
              const piece = board[ x ]?.[ y ];
              if ( !piece || piece === " " ) continue;

              const isUpperCase = piece === piece.toUpperCase();
              const piecePlayer = isUpperCase ? "gote" : "sente";
              const base = piece.replace( "+", "" ).toLowerCase();
              const baseValue = pieceValues[ piece ] ?? pieceValues[ base ] ?? 0;

              if ( typeof baseValue !== "number" ) {
                console.warn( "Non-numeric baseValue for piece:", piece, baseValue );
              }

              let pieceScore = baseValue;

              if ( centerSquares.some( ( [ cx, cy ] ) => cx === x && cy === y ) ) {
                pieceScore += 50;
              }

              if ( piece.toLowerCase() === "k" ) {
                let defenders = 0;
                for ( let dx = -1; dx <= 1; dx++ ) {
                  for ( let dy = -1; dy <= 1; dy++ ) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if ( nx < 0 || nx >= 9 || ny < 0 || ny >= 9 ) continue;
                    const neighbor = board[ nx ]?.[ ny ];
                    if ( neighbor && neighbor !== " " ) {
                      const neighborPlayer = neighbor === neighbor.toUpperCase() ? "gote" : "sente";
                      if ( neighborPlayer === piecePlayer ) defenders++;
                    }
                  }
                }
                pieceScore += defenders * 100;
              }

              if ( piecePlayer === "sente" && x <= 2 && !piece.includes( "+" ) ) {
                pieceScore += 100;
              } else if ( piecePlayer === "gote" && x >= 6 && !piece.includes( "+" ) ) {
                pieceScore += 100;
              }

              score += piecePlayer === forPlayer ? pieceScore : -pieceScore;
            }
          }

          if ( typeof isInCheck === "function" ) {
            if ( isInCheck( forPlayer, board ) ) score -= 500;
            if ( isInCheck( forPlayer === "sente" ? "gote" : "sente", board ) ) score += 300;
          }

          if ( Date.now() - startTime > MAX_TIME ) {
            timeUp = true;
          }

          if ( typeof score !== "number" || isNaN( score ) || !isFinite( score ) ) {
            console.warn( "Invalid score detected:", score );
            return 0;
          }

          return score;

        } catch ( e ) {
          console.warn( "evaluatePosition error:", e );
          return 0;
        }
      };


      // Generate all legal moves, attach a small “frontBonus” for capturing directly forward
      const generateAllMoves = ( boardState, player ) => {
        const moves = [];

        for ( let x = 0; x < 9; x++ ) {
          for ( let y = 0; y < 9; y++ ) {
            const piece = boardState[ x ][ y ];
            if ( !piece || piece === " " ) continue;
            const isUpperCase = piece === piece.toUpperCase();
            const piecePlayer = isUpperCase ? "gote" : "sente";
            if ( piecePlayer !== player ) continue;

            try {
              const legal = getPossibleMoves( piece, x, y, boardState );
              for ( const [ tx, ty ] of legal ) {
                // “Front‐capture” bonus if Sente can eat a Gote piece immediately ahead
                let frontBonus = 0;
                if (
                  player === "sente" &&
                  tx === x - 1 &&
                  ty === y &&
                  boardState[ tx ][ ty ] &&
                  boardState[ tx ][ ty ] !== " " &&
                  boardState[ tx ][ ty ] === boardState[ tx ][ ty ].toUpperCase()
                ) {
                  frontBonus = 200;
                }

                const cap = boardState[ tx ][ ty ];
                const canProm =
                  typeof shouldPromote === "function" &&
                  shouldPromote( piece, x, tx ) &&
                  !piece.includes( "+" );

                // (1) normal move
                const b1 = cloneBoard( boardState );
                if ( !b1[ x ] || !b1[ tx ] ) continue;
                b1[ x ][ y ] = " ";
                b1[ tx ][ ty ] = piece;
                try {
                  if ( !isInCheck( player, b1 ) ) {
                    moves.push( {
                      type: "move",
                      from: [ x, y ],
                      to: [ tx, ty ],
                      piece,
                      board: b1,
                      capturedPiece: cap && cap !== " " ? cap : null,
                      frontBonus,
                    } );
                  }
                } catch ( _ ) {
                  moves.push( {
                    type: "move",
                    from: [ x, y ],
                    to: [ tx, ty ],
                    piece,
                    board: b1,
                    capturedPiece: cap && cap !== " " ? cap : null,
                    frontBonus,
                  } );
                }

                // (2) promotion move
                if ( canProm ) {
                  const promPiece = piece + "+";
                  const b2 = cloneBoard( boardState );
                  b2[ x ][ y ] = " ";
                  b2[ tx ][ ty ] = promPiece;
                  try {
                    if ( !isInCheck( player, b2 ) ) {
                      moves.push( {
                        type: "move",
                        from: [ x, y ],
                        to: [ tx, ty ],
                        piece: promPiece,
                        board: b2,
                        capturedPiece: cap && cap !== " " ? cap : null,
                        frontBonus,
                      } );
                    }
                  } catch ( _ ) {
                    moves.push( {
                      type: "move",
                      from: [ x, y ],
                      to: [ tx, ty ],
                      piece: promPiece,
                      board: b2,
                      capturedPiece: cap && cap !== " " ? cap : null,
                      frontBonus,
                    } );
                  }
                }
              }
            } catch ( e ) {
              console.warn( "Error generating moves for piece:", piece, e );
            }
            if ( timeUp ) return moves;
          }
        }

        // (3) drop moves for Sente
        if ( player === "sente" && capturedSente && capturedSente.length > 0 ) {
          for ( const cap of capturedSente ) {
            try {
              const drops = getDropLocations( cap, boardState );
              for ( const [ dx, dy ] of drops ) {
                const b3 = cloneBoard( boardState );
                b3[ dx ][ dy ] = cap.toLowerCase();

                const centerBonus = ( 4 - Math.abs( 4 - dx ) + 4 - Math.abs( 4 - dy ) ) * 10;

                try {
                  if ( !isInCheck( "sente", b3 ) ) {
                    moves.push( {
                      type: "drop",
                      to: [ dx, dy ],
                      piece: cap,
                      board: b3,
                      capturedPiece: null,
                      frontBonus: 0,
                      dropBonus: 300 + centerBonus,
                    } );
                  }
                } catch ( _ ) {
                  moves.push( {
                    type: "drop",
                    to: [ dx, dy ],
                    piece: cap,
                    board: b3,
                    capturedPiece: null,
                    frontBonus: 0,
                    dropBonus: 300 + centerBonus,
                  } );
                }
              }
            } catch ( e ) {
              console.warn( "Error generating drop moves for:", cap, e );
            }
            if ( timeUp ) return moves;
          }
        }

        // Sort by frontBonus first, then by capture value
        moves.sort( ( a, b ) => {
          const frontDiff = ( b.frontBonus || 0 ) - ( a.frontBonus || 0 );
          if ( frontDiff !== 0 ) return frontDiff;

          const aCap = a.capturedPiece
            ? pieceValues[ a.capturedPiece.replace( "+", "" ).toLowerCase() ] || 0
            : 0;
          const bCap = b.capturedPiece
            ? pieceValues[ b.capturedPiece.replace( "+", "" ).toLowerCase() ] || 0
            : 0;

          const capDiff = bCap - aCap;
          if ( capDiff !== 0 ) return capDiff;

          return ( b.dropBonus || 0 ) - ( a.dropBonus || 0 ); // <-- prioritize drops last
        } );

        return moves;
      };

      // Minimax with alpha–beta (depth 2), adding frontBonus only at the root
      const minimax = ( boardState, depth, alpha, beta, maximizingPlayer ) => {
        const player = maximizingPlayer ? "sente" : "gote";
        const allMoves = generateAllMoves( boardState, player );
        console.log(
          `[MINIMAX] Depth ${ depth } | Player: ${ player } | Generated Moves: ${ allMoves.length }`
        );

        if ( allMoves.length === 0 ) {
          // No legal moves → evaluate statically
          const fallbackScore = evaluatePosition(
            boardState,
            maximizingPlayer ? "sente" : "gote"
          );
          return depth === 2
            ? { move: null, score: fallbackScore }
            : fallbackScore;
        }

        let bestMove = null;

        if ( maximizingPlayer ) {
          let maxEval = -Infinity;
          for ( const move of allMoves ) {
            if ( timeUp ) break;
            if ( !move.board ) continue;

            let evaluation;

            if ( depth > 1 ) {
              evaluation = minimax(
                move.board,
                depth - 1,
                alpha,
                beta,
                false
              ).score;
            } else {
              evaluation = evaluatePosition( move.board, "sente" );
            }

            if ( depth === 2 ) {
              if ( move.frontBonus ) evaluation += move.frontBonus * 0.5;
              if ( move.dropBonus ) evaluation += move.dropBonus * 0.5;
            }

            if ( depth === 2 ) {
              console.log(
                `[MINIMAX] depth=2 | move=`,
                move,
                `| score=`,
                evaluation,
                `maxEval=${ maxEval }`
              );
            }

            if ( bestMove === null || evaluation > maxEval ) {
              if ( depth === 2 ) {
                console.log( `[MINIMAX] New best (max) move @ depth ${ depth }:`, {
                  move,
                  score: evaluation,
                } );
              }
              maxEval = evaluation;
              bestMove = move;
            }

            alpha = Math.max( alpha, evaluation );
            if ( beta <= alpha ) break;
          }

          if ( depth === 2 ) {
            if ( !bestMove ) {
              // If somehow no bestMove, pick the first legal move as fallback
              const fallback = allMoves[ 0 ];
              const fallbackScore = fallback.board
                ? evaluatePosition( fallback.board, "sente" )
                : -Infinity;
              return { move: fallback, score: fallbackScore };
            }
            return { move: bestMove, score: maxEval };
          }

          return maxEval;
        } else {
          let minEval = Infinity;
          for ( const move of allMoves ) {
            if ( timeUp ) break;
            if ( !move.board ) continue;

            let evaluation;
            if ( depth > 1 ) {
              evaluation = minimax(
                move.board,
                depth - 1,
                alpha,
                beta,
                true
              ).score;
            } else {
              evaluation = evaluatePosition( move.board, "gote" );
            }

            if ( depth === 2 ) {
              console.log(
                `[MINIMAX] depth=2 (min) | move=`,
                move,
                `| score=`,
                evaluation,
                `minEval=${ minEval }`
              );
            }

            if ( bestMove === null || evaluation < minEval ) {
              if ( depth === 2 ) {
                console.log( `[MINIMAX] New best (min) move @ depth ${ depth }:`, {
                  move,
                  score: evaluation,
                } );
              }
              minEval = evaluation;
              bestMove = move;
            }

            beta = Math.min( beta, evaluation );
            if ( beta <= alpha ) break;
          }

          if ( depth === 2 ) {
            if ( !bestMove ) {
              const fallback = allMoves[ 0 ];
              const fallbackScore = fallback.board
                ? evaluatePosition( fallback.board, "gote" )
                : Infinity;
              return { move: fallback, score: fallbackScore };
            }
            return { move: bestMove, score: minEval };
          }

          return minEval;
        }
      };

      // ─── Run minimax(depth=2) ───
      let result;
      try {
        result = minimax( board, 2, -Infinity, Infinity, true );
      } catch ( e ) {
        console.warn( "Minimax error, falling back to all moves:", e );
        result = null;
      }

      // ─── If minimax failed or no move found, fallback to a simpler heuristic ───
      if ( !result || !result.move ) {
        console.warn(
          "[AI] Fallback triggered — minimax returned invalid:",
          result
        );
        const allMoves = generateAllMoves( board, "sente" );
        if ( allMoves.length === 0 ) {
          alert( "AI has no legal moves (checkmate)." );
          return;
        }
        for ( const move of allMoves ) {
          let score = 0;
          const [ tx, ty ] = move.to || [ 4, 4 ];
          if ( move.capturedPiece ) {
            const base = move.capturedPiece.replace( "+", "" ).toLowerCase();
            const value = pieceValues[ base ] || 0;
            score += value * 3.0;
            score += 2000;
          }
          try {
            if ( isInCheck( "gote", move.board ) ) {
              score += 2500;
            }
          } catch ( _ ) { }
          if ( move.piece && move.piece.includes( "+" ) ) {
            score += 1200;
          }
          score += ( 8 - tx ) * 200;
          const centerBonus = 4 - Math.abs( 4 - tx ) + ( 4 - Math.abs( 4 - ty ) );
          score += centerBonus * 150;
          for ( let i = 0; i < 9; i++ ) {
            for ( let j = 0; j < 9; j++ ) {
              const p = move.board[ i ][ j ];
              if ( !p || p === " " ) continue;
              const isEnemy = p === p.toUpperCase();
              const base = p.replace( "+", "" ).toLowerCase();
              const value = pieceValues[ base ] || 0;
              if ( isEnemy && value > 1000 ) {
                score -= value * 3.0;
              }
            }
          }
          try {
            const attacked = getPossibleMoves( move.piece, tx, ty, move.board );
            for ( const [ ex, ey ] of attacked ) {
              const target = move.board?.[ ex ]?.[ ey ];
              if ( target && target !== " " ) {
                const base = target.replace( "+", "" ).toLowerCase();
                const val = pieceValues[ base ] || 0;
                if ( target === target.toUpperCase() && val > 3000 ) {
                  score += val * 1.2;
                }
              }
            }
          } catch ( _ ) { }
          move.score = score;
        }
        allMoves.sort( ( a, b ) => b.score - a.score );
        result = { move: allMoves[ 0 ], score: allMoves[ 0 ].score };
      }

      console.log(
        `[AI] Evaluated ${ nodesEvaluated } nodes in ${ Date.now() - startTime }ms`
      );

      // ─── Finally, apply the chosen move after a short “thinking” pause (~200 ms) ───
      setTimeout( () => {
        const choice = result.move;
        if ( !choice ) {
          // If somehow still no move, do nothing
        } else if ( choice.type === "drop" ) {
          handleDropCapturedPiece( choice.piece, choice.to[ 0 ], choice.to[ 1 ] );
          setLastMove( { from: null, to: choice.to } );
        } else {
          movePiece(
            choice.to[ 0 ],
            choice.to[ 1 ],
            choice.from[ 0 ],
            choice.from[ 1 ],
            choice.piece
          );
          setLastMove( { from: choice.from, to: choice.to } );
        }
      }, 1500 );
    } finally {
      // ─── ALWAYS hide the overlay once search (or fallback) is done ───
      setAiThinking( false );
    }
  }, [
    board,
    currentPlayer,
    gameOver,
    matchedOpening,
    openingStep,
    capturedSente,
    getPossibleMoves,
    shouldPromote,
    isInCheck,
    movePiece,
    handleDropCapturedPiece,
    setLastMove,
    scoreMove,
  ] );

  // ─── Fire AI when it’s Sente’s turn ───
  useEffect( () => {
    if ( vsAI && currentPlayer === "sente" ) {
      if ( "requestIdleCallback" in window ) {
        requestIdleCallback( () => performAIMove() );
      } else {
        setTimeout( () => performAIMove(), 1500 );
      }
    }
  }, [ currentPlayer, vsAI, performAIMove ] );

  // Undo the last move
  const handleUndo = () => {
    if ( undoIndex <= 0 || !moveHistory[ undoIndex - 3 ] ) {
      alert( "No more moves to undo." );
      return;
    }

    const entry = moveHistory[ undoIndex - 3 ];

    setBoard( entry.boardBefore.map( ( row ) => [ ...row ] ) );
    setCapturedGote( [ ...entry.capturedGoteBefore ] );
    setCapturedSente( [ ...entry.capturedSenteBefore ] );
    setCurrentPlayer( entry.playerBefore );
    setLastMove( entry.lastMoveBefore );
    setOpeningStep( entry.openingStepBefore || 0 );
    setMatchedOpening( null );
    setUndoIndex( undoIndex - 3 );
    setSelectedPiece( null );
    setPossibleMoves( [] );
  };

  // Redo a move that was undone
  const handleRedo = () => {
    if ( undoIndex >= moveHistory.length || !moveHistory[ undoIndex ] ) {
      alert( "No more moves to redo." );
      return;
    }

    const entry = moveHistory[ undoIndex ] + 1;

    setBoard( entry.boardAfter.map( ( row ) => [ ...row ] ) );
    setCapturedGote( [ ...entry.capturedGoteAfter ] );
    setCapturedSente( [ ...entry.capturedSenteBefore ] );
    setCurrentPlayer( entry.playerAfter );
    setLastMove( entry.lastMoveAfter );
    setOpeningStep( entry.openingStepAfter || 0 );
    setMatchedOpening( null );
    setUndoIndex( undoIndex + 1 );
    setSelectedPiece( null );
    setPossibleMoves( [] );
  };

  // Reset the entire game (already included but reiterated here)
  const resetGame = () => {
    setGameOver( false );
    setBoard( initialBoard );
    setCurrentPlayer( "gote" );
    setSelectedPiece( null );
    setPossibleMoves( [] );
    setCapturedGote( [] );
    setCapturedSente( [] );
    setMoveHistory( [] );
    setUndoIndex( 0 );
    setLastMove( null );
    setMatchedOpening( null );
    setOpeningStep( 0 );
    setCheckmateInfo( null );

    setReplayMode( false );
    setReplayPlaying( false );
    setReplayIndex( 0 );
  };

  const handleSquareClick = async ( x, y ) => {
    const piece = board[ x ][ y ];
    const isGotePiece = piece === piece.toUpperCase();
    const isSentePiece = piece !== " " && piece === piece.toLowerCase();

    if ( selectedPiece?.isCaptured ) {
      if ( possibleMoves?.some( ( [ px, py ] ) => px === x && py === y ) ) {
        handleDropCapturedPiece( selectedPiece.piece, x, y );
      } else {
        alert( "Invalid drop location!" );
      }
      setSelectedPiece( null );
      setPossibleMoves( [] );
      return;
    }

    if ( selectedPiece ) {
      if ( selectedPiece.x === x && selectedPiece.y === y ) {
        setSelectedPiece( null );
        setPossibleMoves( [] );
      } else if ( possibleMoves?.some( ( [ px, py ] ) => px === x && py === y ) ) {
        movePiece( x, y );
      } else if (
        piece !== " " &&
        ( ( currentPlayer === "gote" && isGotePiece ) ||
          ( currentPlayer === "sente" && isSentePiece ) )
      ) {
        selectPiece( x, y );
      } else {
        setSelectedPiece( null );
        setPossibleMoves( [] );
      }
      return;
    }

    // New Logic: Allow any piece to move if it resolves the check
    if (
      piece !== " " &&
      ( ( currentPlayer === "gote" && isGotePiece ) ||
        ( currentPlayer === "sente" && isSentePiece ) )
    ) {
      if ( isInCheck( currentPlayer ) ) {
        const possibleDefensiveMoves = getPossibleMoves(
          piece,
          x,
          y,
          board
        ).filter( ( [ newX, newY ] ) => {
          const tempBoard = board.map( ( row ) => [ ...row ] );
          tempBoard[ x ][ y ] = " ";
          tempBoard[ newX ][ newY ] = piece;
          return !isInCheck( currentPlayer, tempBoard );
        } );

        if ( possibleDefensiveMoves.length > 0 ) {
          setSelectedPiece( { x, y, piece } );
          setPossibleMoves( possibleDefensiveMoves );
        } else {
          alert( "This move doesn't resolve the check. Choose another move." );
        }
      } else {
        selectPiece( x, y );
      }
    }
  };

  useEffect( () => {
    if ( !replayPlaying ) return;
    if ( !replayMode || replayIndex >= moveHistory.length ) {
      setReplayPlaying( false );
      return;
    }

    const interval = setInterval( () => {
      const move = moveHistory[ replayIndex ];
      if ( !move ) return;

      setBoard( move.boardAfter.map( ( row ) => [ ...row ] ) );
      setCapturedGote( [ ...move.capturedGoteAfter ] );
      setCapturedSente( [ ...move.capturedSenteAfter ] );
      setCurrentPlayer( move.playerAfter );
      setLastMove( move.lastMoveAfter );
      setReplayIndex( ( prev ) => prev + 1 );
    }, replaySpeed );

    return () => clearInterval( interval );
  }, [ replayPlaying, replayIndex, replayMode, moveHistory ] );

  const downloadReplayAsJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent( JSON.stringify( moveHistory, null, 2 ) );
    const dlAnchorElem = document.createElement( "a" );
    dlAnchorElem.setAttribute( "href", dataStr );
    dlAnchorElem.setAttribute( "download", "shogi_replay.json" );
    dlAnchorElem.click();
  };

  const downloadReplayAsCSV = () => {
    const headers = [ "Move#", "Player", "From", "To", "Piece" ];
    const rows = moveHistory.map( ( entry, idx ) => {
      const move = entry.lastMoveAfter || {};
      const piece = entry.boardAfter?.[ move?.to?.[ 0 ] ]?.[ move?.to?.[ 1 ] ] || "";
      return [
        idx + 1,
        entry.playerBefore,
        move.from ? `(${ move.from[ 0 ] },${ move.from[ 1 ] })` : "Drop",
        move.to ? `(${ move.to[ 0 ] },${ move.to[ 1 ] })` : "-",
        piece,
      ];
    } );

    const csvContent = [ headers, ...rows ].map( ( e ) => e.join( "|" ) ).join( "\n" );

    const blob = new Blob( [ csvContent ], { type: "text/csv;charset=utf-8;" } );
    const url = URL.createObjectURL( blob );
    const link = document.createElement( "a" );
    link.setAttribute( "href", url );
    link.setAttribute( "download", "shogi_replay.csv" );
    document.body.appendChild( link );
    link.click();
    document.body.removeChild( link );
  };

  return (
    <>

      <div className="flex flex-wrap flex-col mx-auto hidden md:block">
        <header className="bg-red-50 p-2 h-[20vh] flex flex-wrap md:h-auto mx-auto w-full">
          <span className="text-2xl font-bold w-full mx-auto my-2 text-center">
            Current Player: { currentPlayer }
            { isInCheck( currentPlayer ) && ` (in check)` }
          </span>
          <br />
          { lastMove && (
            <span className="my-2  text-sm text-gray-700 font-mono w-full text-center">
              Last move:{ " " }
              { lastMove.from
                ? `(${ lastMove.from[ 0 ] },${ lastMove.from[ 1 ] }) → (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })`
                : `Drop at (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` }
            </span>
          ) }
        </header>
        <div className="flex-1 flex flex-col md:flex-row">
          <main className="flex-1 bg-indigo-100 p-2 mx-auto w-full relative">
            { aiThinking && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                  <span className="text-lg font-semibold">AI is thinking…</span>
                </div>
              </div>
            ) }
            <div className="board mx-auto w-fit max-w-full relative">

              { board.map( ( row, x ) =>
                row.map( ( piece, y ) => (
                  <div
                    key={ `${ x }-${ y }` }
                    className={ `cell aspect-square border border-gray-300
                  ${ possibleMoves.some( ( [ px, py ] ) => px === x && py === y )
                        ? "highlight"
                        : ""
                      } 
                  ${ lastMove?.to?.[ 0 ] === x &&
                        lastMove?.to?.[ 1 ] === y &&
                        currentPlayer === "gote"
                        ? "pulse-red"
                        : ""
                      }
                  ${ lastMove?.from?.[ 0 ] === x &&
                        lastMove?.from?.[ 1 ] === y &&
                        currentPlayer === "gote"
                        ? "pulse-red"
                        : ""
                      }
                `}
                    onClick={ () => handleSquareClick( x, y ) }
                  >
                    { piece !== " " && pieceImages[ piece ] && (
                      <div className="row relative group">
                        <Image
                          className={ `object-scale-down ${ piece === piece.toLowerCase() ? "rotate-180" : ""
                            }` }
                          src={ pieceImages[ piece ] }
                          alt={ piece }
                          width={ 48 }
                          height={ 48 }
                        />
                        <div className="absolute z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 -top-8 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
                          { pieceNames[ piece.replace( "+", "" ).toLowerCase() ] ||
                            piece }
                        </div>
                      </div>
                    ) }
                  </div>
                ) )
              ) }
            </div>
          </main>
          <nav className="hidden md:block order-first md:w-[20vw] bg-purple-200 p-2 mx-auto">
            <h3 className="text-lg font-bold mb-2">Captured by Sente</h3>
            { groupAndSortCaptured( capturedSente ).map( ( { piece, count } ) => (
              <div
                key={ piece }
                className="mb-1 max-w-full w-fit text-center group"
              >
                { pieceImages[ piece.toUpperCase() ] ? (
                  <Image
                    src={ pieceImages[ piece.toUpperCase() ] }
                    alt={ piece }
                    width={ 48 }
                    height={ 48 }
                    className="cursor-pointer object-scale-down object-center"
                    onClick={ () => {
                      setSelectedPiece( { piece, isCaptured: true } );
                      setPossibleMoves( getDropLocations( piece, board ) );
                    } }
                  />
                ) : null }
                <span className="text-xs text-center block font-semibold">
                  ×{ count }
                </span>
                <div className="absolute mr-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                  { pieceNames[ piece.toLowerCase() ] || piece }
                </div>
              </div>
            ) ) }
          </nav>
          <aside className="hidden md:block md:w-[20vw] bg-yellow-100 p-2 mx-auto">
            <h3 className="text-lg font-bold mb-2">Captured by Gote</h3>
            { groupAndSortCaptured( capturedGote ).map( ( { piece, count } ) => (
              <div key={ piece } className="mb-1 max-w-full w-fit text-center group">
                { pieceImages[ piece.toUpperCase() ] ? (
                  <Image
                    src={ pieceImages[ piece.toLowerCase() ] }
                    alt={ piece }
                    width={ 48 }
                    height={ 48 }
                    className="cursor-pointer object-scale-down object-center"
                    onClick={ () => {
                      setSelectedPiece( { piece, isCaptured: true } );
                      setPossibleMoves( getDropLocations( piece, board ) );
                    } }
                  />
                ) : null }
                <span className="text-xs text-left ml-4 block font-semibold">
                  ×{ count }
                </span>
                <div className="absolute ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                  { pieceNames[ piece.toLowerCase() ] || piece }
                </div>
              </div>
            ) ) }
          </aside>
          { gameOver && checkmateInfo && showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-3">
                  Checkmate!
                </h2>
                <p className="mb-2">
                  <strong>{ checkmateInfo.player }</strong> has been checkmated.
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>King Position:</strong> (
                  { checkmateInfo.kingPos?.[ 0 ] }, { checkmateInfo.kingPos?.[ 1 ] })
                </p>
                { checkmateInfo.lastMove && (
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Last Move:</strong>{ " " }
                    { checkmateInfo.lastMove.from
                      ? `(${ checkmateInfo.lastMove.from[ 0 ] },${ checkmateInfo.lastMove.from[ 1 ] }) → (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })`
                      : `Drop at (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })` }
                  </p>
                ) }
                <p className="text-xs text-gray-600 mt-3">
                  No legal moves remain to escape check.
                </p>
                <button
                  onClick={ resetGame }
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold mr-2"
                >
                  Reset Game
                </button>

                { !replayMode && moveHistory.length > 0 && (
                  <button
                    onClick={ () => {
                      setShowModal( false );
                      setReplayMode( true );
                      setReplayIndex( 0 );
                      const first = moveHistory[ 0 ];
                      setBoard( first.boardBefore.map( ( r ) => [ ...r ] ) );
                      setCapturedGote( [ ...first.capturedGoteBefore ] );
                      setCapturedSente( [ ...first.capturedSenteBefore ] );
                      setCurrentPlayer( first.playerBefore );
                      setLastMove( first.lastMoveBefore );
                    } }
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
                  >
                    Review Game
                  </button>
                ) }
                <button
                  onClick={ () => setShowModal( false ) }
                  className="mt-4 bg-red-400 hover:bg-gray-500 text-white ml-2 px-4 py-2 rounded text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          ) }
        </div>
        <footer className="bg-gray-100 p-2 h-[20vh] md:h-auto mx-auto">
          { replayMode && (
            <div className="mt-4 space-y-4 mx-auto">
              <div className="gap-5 mx-auto">
                <button
                  onClick={ downloadReplayAsJSON }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Export JSON
                </button>
                <button
                  onClick={ downloadReplayAsCSV }
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Export CSV
                </button>
              </div>
              <div className="gap-5 mx-auto">
                <button
                  onClick={ () => setReplayPlaying( true ) }
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
                >
                  ▶ Play
                </button>
                <button
                  onClick={ () => setReplayPlaying( false ) }
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={ () => {
                    if ( replayIndex > 0 ) {
                      const move = moveHistory[ replayIndex - 1 ];
                      setReplayIndex( replayIndex - 1 );
                      setBoard( move.boardAfter.map( ( row ) => [ ...row ] ) );
                      setCapturedGote( [ ...move.capturedGoteAfter ] );
                      setCapturedSente( [ ...move.capturedSenteAfter ] );
                      setCurrentPlayer( move.playerAfter );
                      setLastMove( move.lastMoveAfter );
                    }
                  } }
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded"
                >
                  ⏪ Back
                </button>
                <button
                  onClick={ () => {
                    if ( replayIndex < moveHistory.length ) {
                      const move = moveHistory[ replayIndex ];
                      setReplayIndex( replayIndex + 1 );
                      setBoard( move.boardAfter.map( ( row ) => [ ...row ] ) );
                      setCapturedGote( [ ...move.capturedGoteAfter ] );
                      setCapturedSente( [ ...move.capturedSenteAfter ] );
                      setCurrentPlayer( move.playerAfter );
                      setLastMove( move.lastMoveAfter );
                    }
                  } }
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded"
                >
                  ⏩ Next
                </button>
                <button
                  onClick={ () => {
                    setReplayMode( false );
                    setReplayIndex( 0 );
                    setReplayPlaying( false );
                    resetGame();
                  } }
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded"
                >
                  ⏹ Stop
                </button>
              </div>

              <div className="w-full mt-4">
                <input
                  type="range"
                  min="0"
                  max={ moveHistory.length }
                  value={ replayIndex }
                  onChange={ ( e ) => {
                    const idx = parseInt( e.target.value );
                    setReplayIndex( idx );
                    const move =
                      idx === 0 ? moveHistory[ 0 ] : moveHistory[ idx - 1 ];
                    setBoard( move.boardAfter.map( ( r ) => [ ...r ] ) );
                    setCapturedGote( [ ...move.capturedGoteAfter ] );
                    setCapturedSente( [ ...move.capturedSenteAfter ] );
                    setCurrentPlayer( move.playerAfter );
                    setLastMove( move.lastMoveAfter );
                  } }
                  className="w-full max-w-7xl"
                />
                <div className="text-sm text-center mt-1">
                  Move { replayIndex } / { moveHistory.length }
                </div>
              </div>
            </div>
          ) }
          <div className="mt-5 mx-auto mb-4 text-center block space-x-4">
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={ handleUndo }
            >
              Undo
            </button>
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={ handleRedo }
            >
              Redo
            </button>
            <button
              type="reset"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={ resetGame }
            >
              Reset
            </button>

            <button
              type="button"
              onClick={ () => setVsAI( ( prev ) => !prev ) }
              className="bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              { vsAI ? "Switch to Player vs Player" : "Switch to Play vs AI" }
            </button>
          </div>
        </footer>
      </div>



      {/* Mobile Layout */ }
      <div className="md:hidden w-full h-fit relative">
        {/* Mobile Header */ }
        <div className="text-center font-bold text-lg py-2 border-b">
          {/* Game Info */ }
          <div className="text-xl text-center">
            Current Player: <strong>{ currentPlayer }</strong>
            { isInCheck( currentPlayer ) && (
              <span className="text-red-600"> (in check)</span>
            ) }
            { lastMove && (
              <div className="text-base mt-1">
                Last move:{ " " }
                { lastMove.from
                  ? `(${ lastMove.from[ 0 ] },${ lastMove.from[ 1 ] }) → (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })`
                  : `Drop at (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` }
              </div>
            ) }
          </div>
        </div>

        {/* Mobile Board */ }
        <div className="shogi-board w-full h-full my-4 relative">
          { board.map( ( row, x ) =>
            row.map( ( piece, y ) => {
              const isHighlighted = possibleMoves.some(
                ( [ px, py ] ) => px === x && py === y
              );
              const isLastMoveTo =
                lastMove?.to?.[ 0 ] === x && lastMove?.to?.[ 1 ] === y;
              const isLastMoveFrom =
                lastMove?.from?.[ 0 ] === x && lastMove?.from?.[ 1 ] === y;

              const name =
                pieceNames[ piece.replace( "+", "" ).toLowerCase() ] || "";
              const nameWords = name.split( " " );
              const topLabel = nameWords.length > 1 ? nameWords[ 0 ] : "";
              const bottomLabel =
                nameWords.length > 1 ? nameWords.slice( 1 ).join( " " ) : name;

              return (
                <div
                  key={ `${ x }-${ y }` }
                  onClick={ () => handleSquareClick( x, y ) }
                  className={ `
                      relative aspect-square h-full w-full text-white border border-black flex items-center justify-center
                      ${ isHighlighted ? "bg-yellow-300/90" : "" }
                      ${ isHighlighted ? "bg-yellow-300/90" : "" || isLastMoveTo ? "bg-red-400/80 border-2 border-red-400/80 animate-pulse" : "" || isLastMoveFrom ? "animate-pulse border-2 border-red-400/80" : "" }
                    `}
                >
                  {/* Piece image */ }
                  { piece !== " " && pieceImages[ piece ] && (
                    <>
                      <Image
                        src={ pieceImages[ piece ] }
                        alt={ piece }
                        width={ 32 }
                        height={ 32 }
                        className={ `object-scale-down ${ piece === piece.toLowerCase() ? "rotate-180" : ""
                          }` }
                      />

                      {/* Top label (for long names only) */ }
                      { topLabel &&
                        pieceNames[
                          piece.replace( "+", "" ).toLowerCase()
                        ]?.includes( " " ) && (
                          <div className="overflow-hidden text-pretty absolute z-50 -bottom-[2.5px] font-semibold max-w-fit text-[16px] bg-white bg-blur-2xl bg-opacity-40 backdrop-shadow-lg text-center text-neutral-800 pointer-events-none px-0.5 leading-none">
                            {
                              pieceNames[
                                piece.replace( "+", "" ).toLowerCase()
                              ].split( " " )[ 0 ]
                            }
                          </div>
                        ) }

                      {/* Bottom label (always shown) */ }
                      <div className="overflow-hidden text-pretty absolute z-50 -top-[3px] font-semibold max-w-fit text-[16px] bg-white bg-blur-2xl bg-opacity-80 backdrop-shadow-lg text-center text-neutral-800 pointer-events-none px-0.5 leading-none">
                        { bottomLabel &&
                          pieceNames[ piece.replace( "+", "" ).toLowerCase() ]
                            .split( " " )
                            .slice( -1 )
                            .join( " " ) }
                      </div>
                    </>
                  ) }
                </div>
              );
            } )
          ) }
          { aiThinking && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                <span className="text-lg font-semibold">AI is thinking…</span>
              </div>
            </div>
          ) }
        </div>

        { gameOver && checkmateInfo && showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                Checkmate!
              </h2>
              <p className="mb-2">
                <strong>{ checkmateInfo.player }</strong> has been checkmated.
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>King Position:</strong> (
                { checkmateInfo.kingPos?.[ 0 ] }, { checkmateInfo.kingPos?.[ 1 ] })
              </p>
              { checkmateInfo.lastMove && (
                <p className="text-sm text-gray-700 mb-1">
                  <strong>Last Move:</strong>{ " " }
                  { checkmateInfo.lastMove.from
                    ? `(${ checkmateInfo.lastMove.from[ 0 ] },${ checkmateInfo.lastMove.from[ 1 ] }) → (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })`
                    : `Drop at (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })` }
                </p>
              ) }
              <p className="text-xs text-gray-600 mt-3">
                No legal moves remain to escape check.
              </p>
              <button
                onClick={ resetGame }
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Reset Game
              </button>
              { !replayMode && moveHistory.length > 0 && (
                <button
                  onClick={ () => {
                    setShowModal( false );
                    setReplayMode( true );
                    setReplayIndex( 0 );
                    const first = moveHistory[ 0 ];
                    setBoard( first.boardBefore.map( ( r ) => [ ...r ] ) );
                    setCapturedGote( [ ...first.capturedGoteBefore ] );
                    setCapturedSente( [ ...first.capturedSenteBefore ] );
                    setCurrentPlayer( first.playerBefore );
                    setLastMove( first.lastMoveBefore );
                  } }
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold ml-2"
                >
                  Review Game
                </button>
              ) }
              <button
                onClick={ () => setShowModal( false ) }
                className="mt-4 bg-red-400 hover:bg-red-700 text-white px-4 py-2 rounded ml-2 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) }


        { replayMode && (
          <div className="mt-4 mx-auto w-full justify-around">
            <div className="space-x-2 mx-auto">
              <button
                onClick={ downloadReplayAsJSON }
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Export JSON
              </button>
              <button
                onClick={ downloadReplayAsCSV }
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="space-x-3 ">
              <button
                onClick={ () => setReplayPlaying( true ) }
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded"
              >
                ▶ Play
              </button>
              <button
                onClick={ () => setReplayPlaying( false ) }
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded"
              >
                ⏸ Pause
              </button>

              <button
                onClick={ () => {
                  setReplayMode( false );
                  setReplayIndex( 0 );
                  setReplayPlaying( false );
                  resetGame();
                } }
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded mt-5 mx-auto"
              >
                ⏹ Stop
              </button>
            </div>

            <div className="w-full mt-4 mx-auto">
              <input
                type="range"
                min="0"
                max={ moveHistory.length }
                value={ replayIndex }
                onChange={ ( e ) => {
                  const idx = parseInt( e.target.value );
                  setReplayIndex( idx );
                  const move =
                    idx === 0 ? moveHistory[ 0 ] : moveHistory[ idx - 1 ];
                  setBoard( move.boardAfter.map( ( r ) => [ ...r ] ) );
                  setCapturedGote( [ ...move.capturedGoteAfter ] );
                  setCapturedSente( [ ...move.capturedSenteAfter ] );
                  setCurrentPlayer( move.playerAfter );
                  setLastMove( move.lastMoveAfter );
                } }
                className="w-full mx-auto"
              />
              <div className="text-sm text-center mt-1">
                Move { replayIndex } / { moveHistory.length }
              </div>
            </div>
            <button
              onClick={ () => {
                if ( replayIndex > 0 ) {
                  const move = moveHistory[ replayIndex - 1 ];
                  setReplayIndex( replayIndex - 1 );
                  setBoard( move.boardAfter.map( ( row ) => [ ...row ] ) );
                  setCapturedGote( [ ...move.capturedGoteAfter ] );
                  setCapturedSente( [ ...move.capturedSenteAfter ] );
                  setCurrentPlayer( move.playerAfter );
                  setLastMove( move.lastMoveAfter );
                }
              } }
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded mt-5"
            >
              ⏪ Back
            </button>
            <button
              onClick={ () => {
                if ( replayIndex < moveHistory.length ) {
                  const move = moveHistory[ replayIndex ];
                  setReplayIndex( replayIndex + 1 );
                  setBoard( move.boardAfter.map( ( row ) => [ ...row ] ) );
                  setCapturedGote( [ ...move.capturedGoteAfter ] );
                  setCapturedSente( [ ...move.capturedSenteAfter ] );
                  setCurrentPlayer( move.playerAfter );
                  setLastMove( move.lastMoveAfter );
                }
              } }
              className="float-right bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded mt-5"
            >
              ⏩ Next
            </button>
          </div>
        ) }


        {/* Sticky Control Buttons */ }
        <div className="relative mt-5 mx-auto mb-4 text-center">
          <button
            type="button"
            onClick={ () => setVsAI( ( prev ) => !prev ) }
            className="bg-gray-700 hover:bg-neutral-500 text-white hover:text-black font-bold py-2 px-4 rounded-md"
          >
            { vsAI ? "Switch to Player vs Player" : "Switch to Play vs AI" }
          </button>
        </div>
        <div className="bottom-16 left-0 right-0 bg-gray-100 flex justify-evenly py-2 w-full">
          <button
            onClick={ handleUndo }
            className="border border-black text-blue-600 font-bold"
          >
            Undo
          </button>
          <button
            onClick={ handleRedo }
            className="border border-black text-blue-600 font-bold"
          >
            Redo
          </button>
          <button
            onClick={ resetGame }
            className="border border-black text-red-600 font-bold"
          >
            Reset
          </button>
        </div>

        {/* Bottom Drawer Toggle Button */ }
        <button
          className="bottom-0 left-0 right-0 bg-blue-600 text-white py-2 text-lg w-full"
          onClick={ () => setDrawerOpen( !drawerOpen ) }
        >
          { drawerOpen ? "Hide Captured Pieces" : "Show Captured Pieces" }
        </button>

        {/* Bottom Drawer */ }
        <div
          className={ `fixed bottom-0 left-0 right-0 bg-white border-t border-gray-400 transition-transform duration-300 z-50 ${ drawerOpen ? "translate-y-0" : "translate-y-full"
            }` }
        >
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-center text-sm w-full">
                Captured Pieces
              </h2>
              <button
                onClick={ () => setDrawerOpen( false ) }
                className="absolute right-4 top-2 text-xs bg-red-500 text-white px-3 py-2.5 rounded"
              >
                Close
              </button>
            </div>

            {/* 🔵 Captured by Gote */ }
            <div>
              <h3 className="text-xs font-semibold text-left text-gray-700 pl-2 mb-1">
                🔵 Captured by Gote
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                { groupAndSortCaptured( capturedGote ).map(
                  ( { piece, count } ) => {
                    const disabled = currentPlayer !== "gote";
                    return (
                      <div
                        key={ piece + "-g" }
                        className={ `text-center ${ disabled ? "opacity-40" : "cursor-pointer"
                          }` }
                        onClick={ () => {
                          if ( !disabled ) {
                            setSelectedPiece( { piece, isCaptured: true } );
                            setPossibleMoves(
                              getDropLocations( piece, board )
                            );
                          }
                        } }
                      >
                        { pieceImages[ piece.toLowerCase() ] ? (
                          <Image
                            src={ pieceImages[ piece.toLowerCase() ] }
                            alt={ piece }
                            width={ 48 }
                            height={ 48 }
                          />
                        ) : null }
                        <span className="text-xs text-center block font-semibold">
                          ×{ count }
                        </span>
                        <div className="absolute ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                          { pieceNames[ piece.toLowerCase() ] || piece }
                        </div>
                      </div>
                    );
                  }
                ) }
              </div>
            </div>

            {/* 🔴 Captured by Sente */ }
            <div>
              <h3 className="text-xs font-semibold text-left text-gray-700 pl-2 mb-1">
                🔴 Captured by Sente
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                { groupAndSortCaptured( capturedSente ).map(
                  ( { piece, count } ) => {
                    const disabled = currentPlayer !== "sente";
                    return (
                      <div
                        key={ piece + "-s" }
                        className={ `text-center ${ disabled ? "opacity-40" : "cursor-pointer"
                          }` }
                        onClick={ () => {
                          if ( !disabled ) {
                            setSelectedPiece( { piece, isCaptured: true } );
                            setPossibleMoves(
                              getDropLocations( piece, board )
                            );
                          }
                        } }
                      >
                        { pieceImages[ piece.toUpperCase() ] ? (
                          <Image
                            src={ pieceImages[ piece.toUpperCase() ] }
                            alt={ piece }
                            width={ 48 }
                            height={ 48 }
                          />
                        ) : null }
                        <span className="text-xs text-center block font-semibold">
                          ×{ count }
                        </span>
                        <div className="absolute ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                          { pieceNames[ piece.toLowerCase() ] || piece }
                        </div>
                      </div>
                    );
                  }
                ) }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ShogiBoard;
