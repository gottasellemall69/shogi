import Image from 'next/image';
import React, { useState, useEffect, useCallback, startTransition } from 'react';

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
      { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" }
    ]
  },
  {
    name: "Double Wing Attack",
    sequence: [
      { from: [ 6, 1 ], to: [ 5, 1 ], piece: "p" },
      { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" },
      { from: [ 6, 7 ], to: [ 5, 7 ], piece: "p" },
      { from: [ 2, 1 ], to: [ 3, 1 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 5, 7 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 3, 1 ], piece: "R" }
    ]
  },
  {
    name: "Static Rook",
    sequence: [
      { from: [ 6, 6 ], to: [ 5, 6 ], piece: "p" },
      { from: [ 2, 2 ], to: [ 3, 2 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 6, 7 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 2, 1 ], piece: "R" },
      { from: [ 8, 6 ], to: [ 7, 6 ], piece: "g" },
      { from: [ 0, 2 ], to: [ 1, 2 ], piece: "G" }
    ]
  },
  {
    name: "Fourth File Rook",
    sequence: [
      { from: [ 6, 3 ], to: [ 5, 3 ], piece: "p" },
      { from: [ 2, 5 ], to: [ 3, 5 ], piece: "P" },
      { from: [ 7, 7 ], to: [ 7, 3 ], piece: "r" },
      { from: [ 1, 1 ], to: [ 1, 5 ], piece: "R" },
      { from: [ 8, 3 ], to: [ 7, 3 ], piece: "s" },
      { from: [ 0, 5 ], to: [ 1, 5 ], piece: "S" }
    ]
  }
];


function hashMove( { from, to, piece } ) {
  if ( !from || !to || !piece ) return '';
  return `${ from[ 0 ] }${ from[ 1 ] }${ to[ 0 ] }${ to[ 1 ] }${ piece }`;
}

// Piece images mapped to their symbols
const pieceImages = {
  p: '/images/pieces/Pawn.svg', P: '/images/pieces/Pawn.svg',
  'p+': '/images/pieces/Pawn+.svg', 'P+': '/images/pieces/Pawn+.svg',
  l: '/images/pieces/Lance.svg', L: '/images/pieces/Lance.svg',
  'l+': '/images/pieces/Lance+.svg', 'L+': '/images/pieces/Lance+.svg',
  n: '/images/pieces/Knight.svg', N: '/images/pieces/Knight.svg',
  'n+': '/images/pieces/Knight+.svg', 'N+': '/images/pieces/Knight+.svg',
  s: '/images/pieces/SilverGeneral.svg', S: '/images/pieces/SilverGeneral.svg',
  's+': '/images/pieces/SilverGeneral+.svg', 'S+': '/images/pieces/SilverGeneral+.svg',
  g: '/images/pieces/GoldGeneral.svg', G: '/images/pieces/GoldGeneral.svg',
  b: '/images/pieces/Bishop.svg', B: '/images/pieces/Bishop.svg',
  'b+': '/images/pieces/Bishop+.svg', 'B+': '/images/pieces/Bishop+.svg',
  r: '/images/pieces/Rook.svg', R: '/images/pieces/Rook.svg',
  'r+': '/images/pieces/Rook+.svg', 'R+': '/images/pieces/Rook+.svg',
  k: '/images/pieces/_king.svg', K: '/images/pieces/King.svg'
};

const pieceNames = {
  p: 'Pawn', 'p+': 'Tokin',
  l: 'Lance', 'l+': 'Promoted Lance',
  n: 'Knight', 'n+': 'Promoted Knight',
  s: 'Silver General', 's+': 'Promoted Silver',
  g: 'Gold General',
  b: 'Bishop', 'b+': 'Horse',
  r: 'Rook', 'r+': 'Dragon',
  k: 'King',
  P: 'Pawn', 'P+': 'Tokin',
  L: 'Lance', 'L+': 'Promoted Lance',
  N: 'Knight', 'N+': 'Promoted Knight',
  S: 'Silver General', 'S+': 'Promoted Silver',
  G: 'Gold General',
  B: 'Bishop', 'B+': 'Horse',
  R: 'Rook', 'R+': 'Dragon',
  K: 'King'
};

// Initial Shogi board setup
const initialBoard = [
  [ 'l', 'n', 's', 'g', 'k', 'g', 's', 'n', 'l' ],
  [ ' ', 'r', ' ', ' ', ' ', ' ', ' ', 'b', ' ' ],
  [ 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p' ],
  [ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ' ],
  [ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ' ],
  [ ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ' ],
  [ 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P' ],
  [ ' ', 'B', ' ', ' ', ' ', ' ', ' ', 'R', ' ' ],
  [ 'L', 'N', 'S', 'G', 'K', 'G', 'S', 'N', 'L' ]
];

const pieceValue = {
  p: 5, l: 10, n: 10, s: 30, g: 50, b: 30, r: 50, k: 1000,
  'p+': 10, 'l+': 30, 'n+': 30, 's+': 50, 'b+': 90, 'r+': 90
};


const goldMovement = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 }
];



// Main ShogiBoard component
const ShogiBoard = () => {
  // State management
  const [ board, setBoard ] = useState( initialBoard );
  const [ piece, setPieces ] = useState( {} );
  const [ currentPlayer, setCurrentPlayer ] = useState( 'gote' ); // Gote starts
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






  const BOARD_SIZE = 9;

  // Populate pieces with initial metadata
  useEffect( () => {
    const initializePieces = () => {
      const initialPieces = {};
      initialBoard.forEach( ( row, x ) => {
        row.forEach( ( piece, y ) => {
          if ( piece !== ' ' ) {
            initialPieces[ `${ x }-${ y }` ] = {
              type: piece,
              state: 'active',
              position: { x, y }
            };
          }
        } );
      } );
      setPieces( initialPieces );
    };
    initializePieces();
  }, [] );

  const getPieceValue = ( piece ) => {
    const normalized = piece.replace( '+', '' ).toLowerCase();
    return pieceValue[ normalized ] || 0;
  };

  const groupAndSortCaptured = ( capturedArray ) => {
    const grouped = {};

    for ( const piece of capturedArray ) {
      const normalized = piece.replace( '+', '' );
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
      currentPlayer === 'gote'
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
    const isPromoted = piece.includes( '+' );
    const basePiece = piece.replace( '+', '' ).toLowerCase();
    const isGote = piece === piece.toUpperCase();

    const pieceMovements = {
      p: {
        normal: [ { x: 0, y: -1 } ], // Sente Pawn moves forward
        promoted: goldMovement
      },
      P: {
        normal: [ { x: 0, y: 1 } ], // Gote Pawn moves forward
        promoted: goldMovement
      },
      l: {
        normal: Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ), // Sente Lance moves any number of squares forward
        promoted: goldMovement
      },
      L: {
        normal: Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ), // Gote Lance moves any number of squares forward
        promoted: goldMovement
      },
      n: {
        normal: [ { x: -1, y: 2 }, { x: 1, y: 2 } ],       // Sente knight
        promoted: goldMovement
      },
      N: {
        normal: [ { x: -1, y: -2 }, { x: 1, y: -2 } ],     // Gote knight
        promoted: goldMovement
      },
      s: {
        normal: [
          { x: 0, y: 1 }, // Forward
          { x: 1, y: 1 }, // Forward-right
          { x: -1, y: 1 }, // Forward-left
          { x: 1, y: -1 }, // Backward-right
          { x: -1, y: -1 } // Backward-left
        ],
        promoted: goldMovement
      },
      S: {
        normal: [
          { x: 0, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 }
        ],
        promoted: goldMovement
      },
      g: {
        normal: goldMovement
      },
      G: {
        normal: goldMovement
      },
      b: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: -( i + 1 ) } ) )
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: -( i + 1 ) } ) ),
          ...goldMovement
        ]
      },
      B: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) )
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: i + 1 } ) ),
          ...goldMovement
        ]
      },
      r: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) )
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: -1 }
        ]
      },
      R: {
        normal: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -i + 1, y: 0 } ) )
        ],
        promoted: [
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: -( i + 1 ) } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: 0, y: i + 1 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: -( i + 1 ), y: 0 } ) ),
          ...Array.from( { length: 8 }, ( _, i ) => ( { x: i + 1, y: 0 } ) ),
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: 1, y: 1 }
        ]
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
          { x: -1, y: -1 }
        ]
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
          { x: 1, y: 1 }
        ]
      }
    };

    const isInBounds = ( x, y ) => x >= 0 && x < 9 && y >= 0 && y < 9;
    const canCapture = ( newX, newY ) => {
      const target = board[ newX ][ newY ];
      return (
        target === ' ' ||
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
        if ( targetPiece === ' ' ) {
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
      case 'r': // Rook
        // Four orthogonal directions: down, up, right, left
        const rookDirs = [
          [ 1, 0 ],  // down
          [ -1, 0 ],  // up
          [ 0, 1 ],  // right
          [ 0, -1 ]   // left
        ];
        rookDirs.forEach( ( [ dx, dy ] ) =>
          handleSlidingMove( x, y, dx, dy )
        );

        // If promoted, also add single‑step diagonal moves
        if ( isPromoted ) {
          [ [ 1, 1 ], [ 1, -1 ], [ -1, 1 ], [ -1, -1 ] ].forEach( ( [ dx, dy ] ) => {
            const nx = x + dx, ny = y + dy;
            if ( isInBounds( nx, ny ) && canCapture( nx, ny ) ) {
              possibleMoves.push( [ nx, ny ] );
            }
          } );
        }
        break;


      case 'b': // Bishop
        const bishopDirs = [
          [ 1, 1 ],
          [ 1, -1 ],
          [ -1, 1 ],
          [ -1, -1 ]
        ];
        bishopDirs.forEach( ( [ dx, dy ] ) => handleSlidingMove( x, y, dx, dy ) );

        // Add king-like moves for promoted bishop
        if ( isPromoted ) {
          ;[
            [ 0, 1 ],
            [ 0, -1 ],
            [ 1, 0 ],
            [ -1, 0 ]
          ].forEach( ( [ dx, dy ] ) => {
            const newX = x + dx;
            const newY = y + dy;
            if ( isInBounds( newX, newY ) && canCapture( newX, newY ) ) {
              possibleMoves.push( [ newX, newY ] );
            }
          } );
        }
        break;

      case 'l': // Lance
        if ( !isPromoted ) {
          const direction = isGote ? -1 : 1;
          handleSlidingMove( x, y, direction, 0 );
          break; // only break for unpromoted
        }
      // Let promoted lance fall through to default for goldMovement


      case 'n': // Knight
        if ( !isPromoted ) {
          const knightMoves = isGote
            ? [
              [ -2, -1 ],
              [ -2, 1 ]
            ] // Gote knight
            : [
              [ 2, -1 ],
              [ 2, 1 ]
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


      case 'p': // Pawn
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

  const movePiece = ( targetX, targetY, fromX = null, fromY = null, forcePiece = null ) => {
    const pieceData = fromX !== null ? { x: fromX, y: fromY, piece: board[ fromX ][ fromY ] } : selectedPiece;
    if ( !pieceData ) return;

    const { x, y, piece } = pieceData;
    const legalMoves = getPossibleMoves( piece, x, y, board );
    const isLegal = legalMoves.some( ( [ px, py ] ) => px === targetX && py === targetY );
    if ( !isLegal ) return;

    const updatedBoard = board.map( row => [ ...row ] );

    // ⏪ Record state before move
    const historyEntry = {
      type: "move",
      boardBefore: board.map( r => [ ...r ] ),
      capturedGoteBefore: [ ...capturedGote ],
      capturedSenteBefore: [ ...capturedSente ],
      playerBefore: currentPlayer,
      lastMoveBefore: lastMove,
      openingStepBefore: openingStep
    };

    // Capture logic
    const target = updatedBoard[ targetX ][ targetY ];
    if ( target !== ' ' ) {
      const normalized = target.replace( '+', '' );
      if ( currentPlayer === 'gote' ) {
        setCapturedGote( [ ...capturedGote, normalized.toLowerCase() ] );
      } else {
        setCapturedSente( [ ...capturedSente, normalized.toUpperCase() ] );
      }
    }

    updatedBoard[ x ][ y ] = ' ';

    // Promotion logic
    let finalPiece = piece;
    if ( forcePiece ) {
      finalPiece = forcePiece;
    } else if ( shouldPromote( piece, x, targetX ) && !piece.includes( '+' ) ) {
      const isMandatory = ( ( piece ) => {
        const isGote = piece === piece.toUpperCase();
        const base = piece.toLowerCase();
        return [ 'p', 'l', 'n' ].includes( base ) &&
          ( ( isGote && targetX === 0 ) || ( !isGote && targetX === 8 ) );
      } )( piece, targetX );

      if ( isMandatory ) {
        finalPiece = piece + '+';
      } else if ( ( vsAI && currentPlayer === 'gote' ) || !vsAI ) {
        const confirmPromotion = window.confirm( `Promote ${ pieceNames[ piece.toLowerCase() ] || piece }?` );
        finalPiece = confirmPromotion ? piece + '+' : piece;
      }
    }

    updatedBoard[ targetX ][ targetY ] = finalPiece;

    if ( isInCheck( currentPlayer, updatedBoard ) ) return;

    const nextPlayer = currentPlayer === 'gote' ? 'sente' : 'gote';

    // ✅ Save after-move state
    historyEntry.boardAfter = updatedBoard.map( r => [ ...r ] );
    historyEntry.capturedGoteAfter = [ ...( currentPlayer === 'gote' ? [ ...capturedGote, target.toLowerCase() ] : capturedGote ) ];
    historyEntry.capturedSenteAfter = [ ...( currentPlayer === 'sente' ? [ ...capturedSente, target.toUpperCase() ] : capturedSente ) ];
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
      alert( `${ currentPlayer === 'gote' ? 'Sente' : 'Gote' } wins!` );
    }
  };


  const shouldPromote = ( piece, fromX, toX ) => {
    if ( !piece || piece.includes( '+' ) ) return false;

    const base = piece.replace( '+', '' );
    const isGote = base === base.toUpperCase();

    if ( [ 'K', 'G', 'k', 'g' ].includes( base ) ) return false;

    if ( [ 'P', 'L', 'N' ].includes( base ) && isGote && toX === 0 ) return true;
    if ( [ 'p', 'l', 'n' ].includes( base ) && !isGote && toX === 8 ) return true;

    const fromInZone = isGote ? fromX <= 2 : fromX >= 6;
    const toInZone = isGote ? toX <= 2 : toX >= 6;

    return fromInZone || toInZone;
  };


  // Function to check if the current player is in check
  const isInCheck = ( player, tempBoard = board ) => {
    const kingPiece = player === 'gote' ? 'K' : 'k';
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
          ( player === 'gote'
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
    const goteKingPosition = findKingPosition( 'K' );
    const senteKingPosition = findKingPosition( 'k' );

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

    const kingPiece = player === 'gote' ? 'K' : 'k';
    const kingPos = findKingPosition( kingPiece );
    let legalExists = false;

    // Can any piece move legally?
    outerLoop:
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = board[ i ][ j ];
        if ( !piece ) continue;
        const isPlayersPiece =
          ( player === 'gote' && piece === piece.toUpperCase() ) ||
          ( player === 'sente' && piece === piece.toLowerCase() );
        if ( !isPlayersPiece ) continue;

        const moves = getPossibleMoves( piece, i, j, board );
        for ( const [ nx, ny ] of moves ) {
          const simulated = board.map( r => [ ...r ] );
          simulated[ i ][ j ] = ' ';
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
        lastMove
      } );
      return true;
    }

    return false;
  };

  // Check for stalemate (no legal moves, but not in check)
  const isStalemate = player => {
    if ( isInCheck( player ) ) return false; // Can't be stalemate if in check

    // Check if any legal moves are available
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = board[ i ][ j ];
        if (
          piece &&
          ( player === 'gote'
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

    alert( 'Stalemate! The game is a draw.' );
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
    if ( board[ targetX ][ targetY ] !== ' ' ) return;

    const playerCaps = currentPlayer === 'gote' ? capturedGote : capturedSente;
    if ( !playerCaps.includes( piece ) ) {
      alert( "Invalid drop: You can only drop pieces you've captured." );
      return;
    }

    const updatedBoard = board.map( r => [ ...r ] );

    // ⏪ Save previous state
    const historyEntry = {
      type: "drop",
      boardBefore: board.map( r => [ ...r ] ),
      capturedGoteBefore: [ ...capturedGote ],
      capturedSenteBefore: [ ...capturedSente ],
      playerBefore: currentPlayer,
      lastMoveBefore: lastMove,
      openingStepBefore: openingStep
    };

    updatedBoard[ targetX ][ targetY ] =
      currentPlayer === 'gote' ? piece.toUpperCase() : piece.toLowerCase();

    const newCaps = [ ...playerCaps ];
    newCaps.splice( newCaps.indexOf( piece ), 1 );
    currentPlayer === 'gote'
      ? setCapturedGote( newCaps )
      : setCapturedSente( newCaps );

    if ( isInCheck( currentPlayer, updatedBoard ) ) {
      alert( "Invalid drop: you cannot leave your king in check." );
      return;
    }

    const nextPlayer = currentPlayer === 'gote' ? 'sente' : 'gote';

    // ✅ Save after-drop state
    historyEntry.boardAfter = updatedBoard.map( r => [ ...r ] );
    historyEntry.capturedGoteAfter = [ ...( currentPlayer === 'gote' ? newCaps : capturedGote ) ];
    historyEntry.capturedSenteAfter = [ ...( currentPlayer === 'sente' ? newCaps : capturedSente ) ];
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
      alert( `${ currentPlayer === 'gote' ? 'Sente' : 'Gote' } wins!` );
      resetGame();
    }
  };



  // Validate pawn-specific drop rules (Nifu and last-rank restriction)
  const isValidPawnDrop = ( x, y, board ) => {
    // Nifu: Ensure no other pawn exists in the same file
    for ( let row = 0; row < 9; row++ ) {
      const cell = board[ row ][ y ];
      if (
        cell.toLowerCase() === 'p' &&
        ( currentPlayer === 'gote'
          ? cell === cell.toUpperCase()
          : cell === cell.toLowerCase() )
      ) {
        return false; // Nifu violation (double pawn in the same file)
      }
    }

    // Cannot drop a pawn on the last rank where it can't move
    if (
      ( currentPlayer === 'gote' && x === 0 ) ||
      ( currentPlayer === 'sente' && x === 8 )
    ) {
      return false;
    }

    return true;
  };

  // Check if dropping a piece is legal
  const isValidDrop = ( piece, x, y, board ) => {
    if ( piece.toLowerCase() === 'p' && !isValidPawnDrop( x, y, board ) ) return false;

    // Simulate drop
    const temp = board.map( r => [ ...r ] );
    temp[ x ][ y ] = currentPlayer === 'gote' ? piece.toUpperCase() : piece.toLowerCase();

    // Cannot deliver immediate checkmate by pawn
    if ( piece.toLowerCase() === 'p' && isCheckmate(
      currentPlayer === 'gote' ? 'sente' : 'gote',
      temp
    ) ) return false;

    // And cannot leave yourself in check
    return !isInCheck( currentPlayer, temp );
  };
  // Get legal drop locations for a captured piece
  const getDropLocations = ( piece, board ) => {
    const moves = [];
    for ( let x = 0; x < 9; x++ ) {
      for ( let y = 0; y < 9; y++ ) {
        if ( board[ x ][ y ] === ' ' && isValidDrop( piece, x, y, board ) ) {
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



  const scoreMove = ( { piece, captured, promotes, putsOpponentInCheck, to } ) => {
    const val = pieceValue[ piece.replace( '+', '' ).toLowerCase() ] || 0;
    const capturedVal = captured ? ( pieceValue[ captured.replace( '+', '' ).toLowerCase() ] || 0 ) : 0;

    const [ x, y ] = to || [ 0, 0 ];
    const centerBonus = ( 4 - Math.abs( 4 - x ) ) + ( 4 - Math.abs( 4 - y ) ); // closer to center = better

    let score = 0;
    score += capturedVal * 1.2;
    score += promotes ? 2.5 : 0;
    score += putsOpponentInCheck ? 2 : 0;
    score += centerBonus * 0.2;
    score -= val * 0.4;

    return score;
  };


  const matchOpeningBook = () => {
    for ( const book of openingBook ) {
      const step = openingStep;
      const entry = book.sequence[ step ];
      if ( !entry ) continue;

      const { from, to, piece } = entry;

      // Confirm piece is still at `from` and `to` is empty
      if (
        board[ from[ 0 ] ][ from[ 1 ] ] === piece &&
        board[ to[ 0 ] ][ to[ 1 ] ] === ' '
      ) {
        // Ensure this move hasn't already been played
        const h = hashMove( entry );

        const hasAlreadyPlayed = moveHistory.some( mh =>
          mh.from && mh.to && mh.piece &&
          hashMove( mh ) === h
        );

        if ( !hasAlreadyPlayed ) {
          return { book, entry };
        }
      }
    }
    return null;
  };



  const performAIMove = useCallback( async () => {
    if ( currentPlayer !== 'sente' || gameOver ) return;

    // 1) Opening-book check
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
      return;
    }

    // 2) Advanced AI with proper move generation
    const cloneBoard = b => {
      const nb = Array( 9 );
      for ( let i = 0; i < 9; i++ ) nb[ i ] = b[ i ].slice();
      return nb;
    };

    // Performance monitoring
    let nodesEvaluated = 0;
    const MAX_NODES = 100000;
    const startTime = Date.now();
    const MAX_TIME = 8000; // 8 second timeout

    const isTimeUp = () => {
      return Date.now() - startTime > MAX_TIME || nodesEvaluated > MAX_NODES;
    };

    // Enhanced position evaluation
    const evaluatePosition = ( board, forPlayer ) => {
      nodesEvaluated++;

      let score = 0;

      const pieceValues = {
        'p': 100, 'l': 300, 'n': 350, 's': 400, 'g': 500, 'b': 750, 'r': 900, 'k': 10000,
        'P': 100, 'L': 300, 'N': 350, 'S': 400, 'G': 500, 'B': 750, 'R': 900, 'K': 10000,
        '+p': 550, '+l': 550, '+n': 550, '+s': 550, '+b': 950, '+r': 1100,
        '+P': 550, '+L': 550, '+N': 550, '+S': 550, '+B': 950, '+R': 1100
      };

      const centerSquares = [ [ 3, 3 ], [ 3, 4 ], [ 3, 5 ], [ 4, 3 ], [ 4, 4 ], [ 4, 5 ], [ 5, 3 ], [ 5, 4 ], [ 5, 5 ] ];

      for ( let x = 0; x < 9; x++ ) {
        for ( let y = 0; y < 9; y++ ) {
          const piece = board[ x ][ y ];
          if ( !piece || piece === ' ' ) continue;

          const isUpperCase = piece === piece.toUpperCase();
          const piecePlayer = isUpperCase ? 'gote' : 'sente';
          const baseValue = pieceValues[ piece ] || 0;
          let pieceScore = baseValue;

          // Positional bonuses
          if ( centerSquares.some( ( [ cx, cy ] ) => cx === x && cy === y ) ) {
            pieceScore += 50;
          }

          // King safety
          if ( piece.toLowerCase() === 'k' ) {
            let defenders = 0;
            for ( let dx = -1; dx <= 1; dx++ ) {
              for ( let dy = -1; dy <= 1; dy++ ) {
                const nx = x + dx, ny = y + dy;
                if ( nx >= 0 && nx < 9 && ny >= 0 && ny < 9 ) {
                  const neighbor = board[ nx ][ ny ];
                  if ( neighbor && neighbor !== ' ' ) {
                    const neighborPlayer = neighbor === neighbor.toUpperCase() ? 'gote' : 'sente';
                    if ( neighborPlayer === piecePlayer ) defenders++;
                  }
                }
              }
            }
            pieceScore += defenders * 100;
          }

          // Promotion zone bonus
          if ( piecePlayer === 'sente' && x <= 2 && !piece.includes( '+' ) ) {
            pieceScore += 100;
          } else if ( piecePlayer === 'gote' && x >= 6 && !piece.includes( '+' ) ) {
            pieceScore += 100;
          }

          if ( piecePlayer === forPlayer ) {
            score += pieceScore;
          } else {
            score -= pieceScore;
          }
        }
      }

      // Check evaluation with error handling
      try {
        if ( isInCheck( forPlayer, board ) ) score -= 500;
        if ( isInCheck( forPlayer === 'sente' ? 'gote' : 'sente', board ) ) score += 300;
      } catch ( e ) {
        // Ignore check detection errors in evaluation
      }

      return score;
    };

    // Generate ALL legal moves without artificial limits
    const generateAllMoves = ( board, player ) => {
      const moves = [];

      // Generate piece moves - NO LIMITS
      for ( let x = 0; x < 9; x++ ) {
        for ( let y = 0; y < 9; y++ ) {
          const piece = board[ x ][ y ];
          if ( !piece || piece === ' ' ) continue;

          const isUpperCase = piece === piece.toUpperCase();
          const piecePlayer = isUpperCase ? 'gote' : 'sente';
          if ( piecePlayer !== player ) continue;

          try {
            const legal = getPossibleMoves( piece, x, y, board );
            for ( const [ tx, ty ] of legal ) {
              const cap = board[ tx ][ ty ];
              const canProm = shouldPromote && shouldPromote( piece, x, tx ) && !piece.includes( '+' );

              // Non-promotion move
              const b1 = cloneBoard( board );
              b1[ x ][ y ] = ' ';
              b1[ tx ][ ty ] = piece;

              try {
                if ( !isInCheck( player, b1 ) ) {
                  moves.push( {
                    type: 'move',
                    from: [ x, y ],
                    to: [ tx, ty ],
                    piece: piece,
                    board: b1,
                    capturedPiece: cap && cap !== ' ' ? cap : null
                  } );
                }
              } catch ( e ) {
                // If check detection fails, assume move is legal
                moves.push( {
                  type: 'move',
                  from: [ x, y ],
                  to: [ tx, ty ],
                  piece: piece,
                  board: b1,
                  capturedPiece: cap && cap !== ' ' ? cap : null
                } );
              }

              // Promotion move
              if ( canProm ) {
                const promPiece = piece + '+';
                const b2 = cloneBoard( board );
                b2[ x ][ y ] = ' ';
                b2[ tx ][ ty ] = promPiece;

                try {
                  if ( !isInCheck( player, b2 ) ) {
                    moves.push( {
                      type: 'move',
                      from: [ x, y ],
                      to: [ tx, ty ],
                      piece: promPiece,
                      board: b2,
                      capturedPiece: cap && cap !== ' ' ? cap : null
                    } );
                  }
                } catch ( e ) {
                  // If check detection fails, assume move is legal
                  moves.push( {
                    type: 'move',
                    from: [ x, y ],
                    to: [ tx, ty ],
                    piece: promPiece,
                    board: b2,
                    capturedPiece: cap && cap !== ' ' ? cap : null
                  } );
                }
              }
            }
          } catch ( e ) {
            console.warn( 'Error generating moves for piece:', piece, e );
          }
        }
      }

      // Generate ALL drop moves
      if ( player === 'sente' && capturedSente && capturedSente.length > 0 ) {
        for ( const cap of capturedSente ) {
          try {
            const drops = getDropLocations( cap, board );
            for ( const [ dx, dy ] of drops ) {
              const b3 = cloneBoard( board );
              b3[ dx ][ dy ] = cap.toLowerCase();

              try {
                if ( !isInCheck( 'sente', b3 ) ) {
                  moves.push( {
                    type: 'drop',
                    to: [ dx, dy ],
                    piece: cap,
                    board: b3,
                    capturedPiece: null
                  } );
                }
              } catch ( e ) {
                // If check detection fails, assume move is legal
                moves.push( {
                  type: 'drop',
                  to: [ dx, dy ],
                  piece: cap,
                  board: b3,
                  capturedPiece: null
                } );
              }
            }
          } catch ( e ) {
            console.warn( 'Error generating drop moves for:', cap, e );
          }
        }
      }

      return moves;
    };

    // Simple minimax with limited depth but unlimited move generation
    const minimax = ( board, depth, alpha, beta, maximizingPlayer ) => {
      if ( isTimeUp() ) return maximizingPlayer ? -9999 : 9999;
      if ( depth <= 0 ) return evaluatePosition( board, 'sente' );

      const currentPlayer = maximizingPlayer ? 'sente' : 'gote';
      const allMoves = generateAllMoves( board, currentPlayer );

      if ( allMoves.length === 0 ) {
        return maximizingPlayer ? -9999 : 9999;
      }

      // Limit moves only for deep searches to prevent slowdown
      const moves = depth >= 2 ? allMoves.slice( 0, Math.min( allMoves.length, 40 ) ) : allMoves;

      // Move ordering - prioritize captures and promotions
      moves.sort( ( a, b ) => {
        let scoreA = 0, scoreB = 0;
        if ( a.capturedPiece ) scoreA += 1000;
        if ( b.capturedPiece ) scoreB += 1000;
        if ( a.piece && a.piece.includes( '+' ) ) scoreA += 500;
        if ( b.piece && b.piece.includes( '+' ) ) scoreB += 500;
        return scoreB - scoreA;
      } );

      if ( maximizingPlayer ) {
        let maxEval = -Infinity;
        let bestMove = null;

        for ( const move of moves ) {
          if ( isTimeUp() ) break;

          const evaluation = minimax( move.board, depth - 1, alpha, beta, false );

          if ( evaluation > maxEval ) {
            maxEval = evaluation;
            bestMove = move;
          }

          alpha = Math.max( alpha, evaluation );
          if ( beta <= alpha ) break;
        }

        return depth === 2 ? { move: bestMove, score: maxEval } : maxEval;
      } else {
        let minEval = Infinity;

        for ( const move of moves ) {
          if ( isTimeUp() ) break;

          const evaluation = minimax( move.board, depth - 1, alpha, beta, true );
          minEval = Math.min( minEval, evaluation );
          beta = Math.min( beta, evaluation );
          if ( beta <= alpha ) break;
        }

        return minEval;
      }
    };

    // Execute search with proper fallback
    let result;
    try {
      result = minimax( board, 2, -Infinity, Infinity, true );
    } catch ( e ) {
      console.warn( 'Minimax error, falling back to all moves:', e );
      result = null;
    }

    // If minimax failed or no result, use all available moves
    if ( !result || !result.move ) {
      console.log( 'Using fallback move selection' );
      const allMoves = generateAllMoves( board, 'sente' );

      if ( allMoves.length === 0 ) {
        console.log( 'Truly no legal moves available' );
        alert( "AI has no legal moves (checkmate)." );
        return;
      }

      // Score moves simply and pick best
      for ( const move of allMoves ) {
        let score = 0;
        if ( move.capturedPiece ) score += 100;
        if ( move.piece && move.piece.includes( '+' ) ) score += 50;
        score += Math.random() * 10;
        move.score = score;
      }

      allMoves.sort( ( a, b ) => b.score - a.score );
      result = { move: allMoves[ 0 ], score: allMoves[ 0 ].score };
    }

    console.log( `AI evaluated ${ nodesEvaluated } nodes in ${ Date.now() - startTime }ms` );

    const choice = result.move;

    setTimeout( () => {
      if ( choice.type === 'drop' ) {
        handleDropCapturedPiece( choice.piece, choice.to[ 0 ], choice.to[ 1 ] );
        setLastMove( { from: null, to: choice.to } );
      } else {
        movePiece( choice.to[ 0 ], choice.to[ 1 ], choice.from[ 0 ], choice.from[ 1 ], choice.piece );
        setLastMove( { from: choice.from, to: choice.to } );
      }
    }, 300 );

  }, [
    board, currentPlayer, gameOver,
    getPossibleMoves, capturedSente,
    shouldPromote, isInCheck,
    movePiece, handleDropCapturedPiece,
    matchedOpening, openingStep, setLastMove
  ] );

  useEffect( () => {
    if ( vsAI && currentPlayer === 'sente' ) {
      performAIMove();
    }
  }, [ currentPlayer, vsAI, performAIMove ] );

  // Undo the last move
  const handleUndo = () => {
    if ( undoIndex <= 0 || !moveHistory[ undoIndex - 3 ] ) {
      alert( "No more moves to undo." );
      return;
    }

    const entry = moveHistory[ undoIndex - 3 ];

    setBoard( entry.boardBefore.map( row => [ ...row ] ) );
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

    setBoard( entry.boardAfter.map( row => [ ...row ] ) );
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
    setCurrentPlayer( 'gote' );
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
    const isSentePiece = piece !== ' ' && piece === piece.toLowerCase();

    if ( selectedPiece?.isCaptured ) {
      if ( possibleMoves?.some( ( [ px, py ] ) => px === x && py === y ) ) {
        handleDropCapturedPiece( selectedPiece.piece, x, y );
      } else {
        alert( 'Invalid drop location!' );
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
        piece !== ' ' &&
        ( ( currentPlayer === 'gote' && isGotePiece ) ||
          ( currentPlayer === 'sente' && isSentePiece ) )
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
      piece !== ' ' &&
      ( ( currentPlayer === 'gote' && isGotePiece ) ||
        ( currentPlayer === 'sente' && isSentePiece ) )
    ) {
      if ( isInCheck( currentPlayer ) ) {
        const possibleDefensiveMoves = getPossibleMoves(
          piece,
          x,
          y,
          board
        ).filter( ( [ newX, newY ] ) => {
          const tempBoard = board.map( row => [ ...row ] );
          tempBoard[ x ][ y ] = ' ';
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

      setBoard( move.boardAfter.map( row => [ ...row ] ) );
      setCapturedGote( [ ...move.capturedGoteAfter ] );
      setCapturedSente( [ ...move.capturedSenteAfter ] );
      setCurrentPlayer( move.playerAfter );
      setLastMove( move.lastMoveAfter );
      setReplayIndex( prev => prev + 1 );
    }, replaySpeed );

    return () => clearInterval( interval );
  }, [ replayPlaying, replayIndex, replayMode, moveHistory ] );

  const downloadReplayAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent( JSON.stringify( moveHistory, null, 2 ) );
    const dlAnchorElem = document.createElement( 'a' );
    dlAnchorElem.setAttribute( "href", dataStr );
    dlAnchorElem.setAttribute( "download", "shogi_replay.json" );
    dlAnchorElem.click();
  };

  const downloadReplayAsCSV = () => {
    const headers = [ "Move#", "Player", "From", "To", "Piece" ];
    const rows = moveHistory.map( ( entry, idx ) => {
      const move = entry.lastMoveAfter || {};
      const piece = entry.boardAfter?.[ move?.to?.[ 0 ] ]?.[ move?.to?.[ 1 ] ] || '';
      return [
        idx + 1,
        entry.playerBefore,
        move.from ? `(${ move.from[ 0 ] },${ move.from[ 1 ] })` : "Drop",
        move.to ? `(${ move.to[ 0 ] },${ move.to[ 1 ] })` : "-",
        piece
      ];
    } );

    const csvContent = [ headers, ...rows ]
      .map( ( e ) => e.join( "|" ) )
      .join( "\n" );

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
      <>
        <div className="min-h-screen flex flex-col mx-auto hidden sm:block">
          <header className="bg-red-50 p-2 h-[20vh] flex flex-wrap sm:h-auto mx-auto w-full">
            <span className="text-2xl font-bold w-full mx-auto my-2 text-center">
              Current Player: { currentPlayer }
              { isInCheck( currentPlayer ) && ` (in check)` }
            </span>
            <br />
            { lastMove && (
              <span className="my-2  text-sm text-gray-700 font-mono w-full text-center">
                Last move:{ " " }
                { lastMove.from ? `(${ lastMove.from[ 0 ] },${ lastMove.from[ 1 ] }) → (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` : `Drop at (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` }
              </span>
            ) }
          </header>
          <div className="flex-1 flex flex-col sm:flex-row">
            <main className="flex-1 bg-indigo-100 p-2 mx-auto w-full">
              <div className="board min-h-full mx-auto w-fit max-w-full">
                { board.map( ( row, x ) => row.map( ( piece, y ) => (
                  <div
                    key={ `${ x }-${ y }` }
                    className={ `cell aspect-square border border-gray-300
                  ${ possibleMoves.some( ( [ px, py ] ) => px === x && py === y ) ? 'highlight' : '' } 
                  ${ lastMove?.to?.[ 0 ] === x && lastMove?.to?.[ 1 ] === y && currentPlayer === 'gote' ? 'pulse-red' : '' }
                  ${ lastMove?.from?.[ 0 ] === x && lastMove?.from?.[ 1 ] === y && currentPlayer === 'gote' ? 'pulse-red' : '' }
                `}
                    onClick={ () => handleSquareClick( x, y ) }
                  >
                    { piece !== ' ' && pieceImages[ piece ] && (
                      <div className="row relative group">
                        <Image
                          className={ `object-scale-down ${ piece === piece.toLowerCase() ? 'rotate-180' : '' }` }
                          src={ pieceImages[ piece ] }
                          alt={ piece }
                          width={ 48 }
                          height={ 48 }
                        />
                        <div className="absolute z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 -top-8 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
                          { pieceNames[ piece.replace( '+', '' ).toLowerCase() ] || piece }
                        </div>
                      </div>
                    ) }
                  </div>
                ) )
                ) }
              </div>
            </main>
            <nav className="hidden sm:block order-first sm:w-[20vw] bg-purple-200 p-2 mx-auto">
              <h3 className="text-lg font-bold mb-2">Captured by Sente</h3>
              { groupAndSortCaptured( capturedSente ).map( ( { piece, count } ) => (
                <div key={ piece } className="mb-1 max-w-full w-fit text-center group">
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
                  ) : null
                  }
                  <span className="text-xs text-center block font-semibold">×{ count }</span>
                  <div className=" mr-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                    { pieceNames[ piece.toLowerCase() ] || piece }
                  </div>
                </div>
              ) ) }
            </nav>
            <aside className="hidden sm:block sm:w-[20vw] bg-yellow-100 p-2 mx-auto">
              <h3 className="text-lg font-bold mb-2">Captured by Gote</h3>
              { groupAndSortCaptured( capturedGote ).map( ( { piece, count } ) => (
                <div key={ piece } className=" mb-1 text-center group">
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
                      } } />
                  ) : null }
                  <span className="text-xs text-left ml-4 block font-semibold">×{ count }</span>
                  <div className="absolute  ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                    { pieceNames[ piece.toLowerCase() ] || piece }
                  </div>
                </div>
              ) ) }
            </aside>
            { gameOver && checkmateInfo && showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">


                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-3">Checkmate!</h2>
                  <p className="mb-2">
                    <strong>{ checkmateInfo.player }</strong> has been checkmated.
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>King Position:</strong> ({ checkmateInfo.kingPos?.[ 0 ] }, { checkmateInfo.kingPos?.[ 1 ] })
                  </p>
                  { checkmateInfo.lastMove && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Last Move:</strong>{ " " }
                      { checkmateInfo.lastMove.from
                        ? `(${ checkmateInfo.lastMove.from[ 0 ] },${ checkmateInfo.lastMove.from[ 1 ] }) → (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })`
                        : `Drop at (${ checkmateInfo.lastMove.to[ 0 ] },${ checkmateInfo.lastMove.to[ 1 ] })` }
                    </p>
                  ) }
                  <p className="text-xs text-gray-600 mt-3">No legal moves remain to escape check.</p>
                  <button onClick={ resetGame } className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold mr-2">
                    Reset Game
                  </button>

                  { !replayMode && moveHistory.length > 0 && (
                    <button
                      onClick={ () => {
                        setShowModal( false );
                        setReplayMode( true );
                        setReplayIndex( 0 );
                        const first = moveHistory[ 0 ];
                        setBoard( first.boardBefore.map( r => [ ...r ] ) );
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
          <footer className="bg-gray-100 p-2 h-[20vh] sm:h-auto">
            { replayMode && (
              <div className="mt-4 space-y-4">
                <div className="gap-5">
                  <button onClick={ downloadReplayAsJSON } className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Export JSON
                  </button>
                  <button onClick={ downloadReplayAsCSV } className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Export CSV
                  </button>
                </div>
                <div className="gap-5">
                  <button onClick={ () => setReplayPlaying( true ) } className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded">
                    ▶ Play
                  </button>
                  <button onClick={ () => setReplayPlaying( false ) } className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded">
                    ⏸ Pause
                  </button>
                  <button
                    onClick={ () => {
                      if ( replayIndex > 0 ) {
                        const move = moveHistory[ replayIndex - 1 ];
                        setReplayIndex( replayIndex - 1 );
                        setBoard( move.boardAfter.map( row => [ ...row ] ) );
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
                        setBoard( move.boardAfter.map( row => [ ...row ] ) );
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
                      const move = idx === 0 ? moveHistory[ 0 ] : moveHistory[ idx - 1 ];
                      setBoard( move.boardAfter.map( ( r ) => [ ...r ] ) );
                      setCapturedGote( [ ...move.capturedGoteAfter ] );
                      setCapturedSente( [ ...move.capturedSenteAfter ] );
                      setCurrentPlayer( move.playerAfter );
                      setLastMove( move.lastMoveAfter );
                    } }
                    className="w-full max-w-7xl" />
                  <div className="text-sm text-center mt-1">Move { replayIndex } / { moveHistory.length }</div>
                </div>
              </div>
            ) }
            <div className="mt-5 mx-auto mb-4 text-center block space-x-4">
              <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={ handleUndo }>
                Undo
              </button>
              <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={ handleRedo }>
                Redo
              </button>
              <button type="reset" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={ resetGame }>
                Reset
              </button>


              <button
                type="button"
                onClick={ () => setVsAI( prev => !prev ) }
                className="bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                { vsAI ? 'Switch to Player vs Player' : 'Switch to Play vs AI' }
              </button>
            </div>

          </footer>
        </div>
      </>

      <>
        {/* Mobile Layout */ }
        <div className="sm:hidden w-full h-full relative">
          {/* Mobile Header */ }
          <div className="text-center font-bold text-lg py-2 border-b">{/* Game Info */ }
            <div className="text-xl text-center py-2">
              Current Player: <strong>{ currentPlayer }</strong>
              { isInCheck( currentPlayer ) && <span className="text-red-600"> (in check)</span> }
              { lastMove && (
                <div className="text-base mt-1">
                  Last move:{ " " }
                  { lastMove.from ? `(${ lastMove.from[ 0 ] },${ lastMove.from[ 1 ] }) → (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` : `Drop at (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` }
                </div>
              ) }
            </div>
          </div>

          {/* Mobile Board */ }
          <div className="shogi-board w-full h-full">
            { board.map( ( row, x ) => row.map( ( piece, y ) => {
              const isHighlighted = possibleMoves.some( ( [ px, py ] ) => px === x && py === y );
              const isLastMoveTo = lastMove?.to?.[ 0 ] === x && lastMove?.to?.[ 1 ] === y;
              const isLastMoveFrom = lastMove?.from?.[ 0 ] === x && lastMove?.from?.[ 1 ] === y;

              const name = pieceNames[ piece.replace( '+', '' ).toLowerCase() ] || '';
              const nameWords = name.split( ' ' );
              const topLabel = nameWords.length > 1 ? nameWords[ 0 ] : '';
              const bottomLabel = nameWords.length > 1 ? nameWords.slice( 1 ).join( ' ' ) : name;

              return (
                <div
                  key={ `${ x }-${ y }` }
                  onClick={ () => handleSquareClick( x, y ) }
                  className={ `
    relative aspect-square h-full w-full text-white border border-black flex items-center justify-center
    ${ isHighlighted ? 'bg-yellow-300/90' : '' }
    ${ isHighlighted ? 'bg-yellow-300/90' : '' || isLastMoveTo ? 'bg-red-400/80 border-2 border-red-400/80 animate-pulse' : '' || isLastMoveFrom ? 'animate-pulse border-2 border-red-400/80' : '' }
  `}
                >
                  {/* Piece image */ }
                  { piece !== ' ' && pieceImages[ piece ] && (
                    <>
                      <Image
                        src={ pieceImages[ piece ] }
                        alt={ piece }
                        width={ 32 }
                        height={ 32 }
                        className={ `object-scale-down ${ piece === piece.toLowerCase() ? 'rotate-180' : '' }` } />

                      {/* Top label (for long names only) */ }
                      { topLabel && pieceNames[ piece.replace( '+', '' ).toLowerCase() ]?.includes( ' ' ) && (
                        <div className="overflow-hidden text-pretty absolute -bottom-[2.5px] font-black w-full text-[12px] text-center text-neutral-800 pointer-events-none px-0.5 leading-none">
                          { pieceNames[ piece.replace( '+', '' ).toLowerCase() ].split( ' ' )[ 0 ] }
                        </div>
                      ) }

                      {/* Bottom label (always shown) */ }
                      <div className="overflow-hidden text-pretty absolute -top-[25%] font-black w-full text-[12px] text-center text-neutral-800 pointer-events-none px-0.5 leading-none">
                        { bottomLabel && pieceNames[ piece.replace( '+', '' ).toLowerCase() ].split( ' ' ).slice( -1 ).join( ' ' ) }
                      </div>
                    </>
                  ) }
                </div>

              );
            } )
            ) }
          </div>
          <>
            { gameOver && checkmateInfo && showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-3">Checkmate!</h2>
                  <p className="mb-2">
                    <strong>{ checkmateInfo.player }</strong> has been checkmated.
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>King Position:</strong> ({ checkmateInfo.kingPos?.[ 0 ] }, { checkmateInfo.kingPos?.[ 1 ] })
                  </p>
                  { checkmateInfo.lastMove && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Last Move:</strong>{ ' ' }
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
                        setBoard( first.boardBefore.map( r => [ ...r ] ) );
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
          </>
          <>
            { replayMode && (
              <div className="mt-4 mx-auto w-full justify-around">
                <div className="space-x-2">
                  <button onClick={ downloadReplayAsJSON } className="float-left bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Export JSON
                  </button>
                  <button onClick={ downloadReplayAsCSV } className="float-left bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-3 rounded text-sm">
                    Export CSV
                  </button>
                </div>
                <div className="space-x-3 ">
                  <button onClick={ () => setReplayPlaying( true ) } className="float-right bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded">
                    ▶ Play
                  </button>
                  <button onClick={ () => setReplayPlaying( false ) } className="float-right bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded">
                    ⏸ Pause
                  </button>

                  <button
                    onClick={ () => {
                      setReplayMode( false );
                      setReplayIndex( 0 );
                      setReplayPlaying( false );
                      resetGame();
                    } }
                    className="float-right bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded mt-5"
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
                      const move = idx === 0 ? moveHistory[ 0 ] : moveHistory[ idx - 1 ];
                      setBoard( move.boardAfter.map( ( r ) => [ ...r ] ) );
                      setCapturedGote( [ ...move.capturedGoteAfter ] );
                      setCapturedSente( [ ...move.capturedSenteAfter ] );
                      setCurrentPlayer( move.playerAfter );
                      setLastMove( move.lastMoveAfter );
                    } }
                    className="w-full" />
                  <div className="text-sm text-center mt-1">Move { replayIndex } / { moveHistory.length }</div>
                </div>
                <button
                  onClick={ () => {
                    if ( replayIndex > 0 ) {
                      const move = moveHistory[ replayIndex - 1 ];
                      setReplayIndex( replayIndex - 1 );
                      setBoard( move.boardAfter.map( row => [ ...row ] ) );
                      setCapturedGote( [ ...move.capturedGoteAfter ] );
                      setCapturedSente( [ ...move.capturedSenteAfter ] );
                      setCurrentPlayer( move.playerAfter );
                      setLastMove( move.lastMoveAfter );
                    }
                  } }
                  className="float-left bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded mt-5"
                >
                  ⏪ Back
                </button>
                <button
                  onClick={ () => {
                    if ( replayIndex < moveHistory.length ) {
                      const move = moveHistory[ replayIndex ];
                      setReplayIndex( replayIndex + 1 );
                      setBoard( move.boardAfter.map( row => [ ...row ] ) );
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
          </>
          <>
            {/* Sticky Control Buttons */ }
            <div className="relative mt-5 mx-auto mb-4 text-center">
              <button
                type="button"
                onClick={ () => setVsAI( prev => !prev ) }
                className="bg-gray-700 hover:bg-neutral-500 text-white hover:text-black font-bold py-2 px-4 rounded-md"
              >
                { vsAI ? 'Switch to Player vs Player' : 'Switch to Play vs AI' }
              </button>
            </div>
            <div className="bottom-16 left-0 right-0 bg-gray-100 flex justify-evenly py-2 w-full">
              <button onClick={ handleUndo } className="border border-black text-blue-600 font-bold">Undo</button>
              <button onClick={ handleRedo } className="border border-black text-blue-600 font-bold">Redo</button>
              <button onClick={ resetGame } className="border border-black text-red-600 font-bold">Reset</button>
            </div>

            {/* Bottom Drawer Toggle Button */ }
            <button
              className="bottom-0 left-0 right-0 bg-blue-600 text-white py-2 text-lg w-full"
              onClick={ () => setDrawerOpen( !drawerOpen ) }
            >
              { drawerOpen ? 'Hide Captured Pieces' : 'Show Captured Pieces' }
            </button>

            {/* Bottom Drawer */ }
            <div className={ `fixed bottom-0 left-0 right-0 bg-white border-t border-gray-400 transition-transform duration-300 z-50 ${ drawerOpen ? 'translate-y-0' : 'translate-y-full' }` }>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-bold text-center text-sm w-full">Captured Pieces</h2>
                  <button
                    onClick={ () => setDrawerOpen( false ) }
                    className="absolute right-4 top-2 text-xs bg-red-500 text-white px-3 py-2.5 rounded"
                  >
                    Close
                  </button>
                </div>

                {/* 🔵 Captured by Gote */ }
                <div>
                  <h3 className="text-xs font-semibold text-left text-gray-700 pl-2 mb-1">🔵 Captured by Gote</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    { groupAndSortCaptured( capturedGote ).map( ( { piece, count } ) => {
                      const disabled = currentPlayer !== 'gote';
                      return (
                        <div
                          key={ piece + '-g' }
                          className={ `text-center ${ disabled ? 'opacity-40' : 'cursor-pointer' }` }
                          onClick={ () => {
                            if ( !disabled ) {
                              setSelectedPiece( { piece, isCaptured: true } );
                              setPossibleMoves( getDropLocations( piece, board ) );
                            }
                          } }
                        >
                          { pieceImages[ piece.toLowerCase() ] ? (
                            <Image
                              src={ pieceImages[ piece.toLowerCase() ] }
                              alt={ piece }
                              width={ 48 }
                              height={ 48 } />
                          ) : null }
                          <span className="text-xs text-center block font-semibold">×{ count }</span>
                          <div className="absolute ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                            { pieceNames[ piece.toLowerCase() ] || piece }
                          </div>
                        </div>
                      );
                    } ) }
                  </div>
                </div>

                {/* 🔴 Captured by Sente */ }
                <div>
                  <h3 className="text-xs font-semibold text-left text-gray-700 pl-2 mb-1">🔴 Captured by Sente</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    { groupAndSortCaptured( capturedSente ).map( ( { piece, count } ) => {
                      const disabled = currentPlayer !== 'sente';
                      return (
                        <div
                          key={ piece + '-s' }
                          className={ `text-center ${ disabled ? 'opacity-40' : 'cursor-pointer' }` }
                          onClick={ () => {
                            if ( !disabled ) {
                              setSelectedPiece( { piece, isCaptured: true } );
                              setPossibleMoves( getDropLocations( piece, board ) );
                            }
                          } }
                        >
                          { pieceImages[ piece.toUpperCase() ] ? (
                            <Image
                              src={ pieceImages[ piece.toUpperCase() ] }
                              alt={ piece }
                              width={ 48 }
                              height={ 48 } />
                          ) : null }
                          <span className="text-xs text-center block font-semibold">×{ count }</span>
                          <div className="absolute ml-2 z-50 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-90 transition-all duration-200 whitespace-nowrap">
                            { pieceNames[ piece.toLowerCase() ] || piece }
                          </div>
                        </div>
                      );
                    } ) }
                  </div>
                </div>
              </div>
            </div>
          </>
        </div>
      </>
    </>


  );
};
export default ShogiBoard;