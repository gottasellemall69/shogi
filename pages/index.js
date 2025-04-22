import Image from 'next/image';
import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [ pieces, setPieces ] = useState( {} );
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

  const movePiece = ( targetX, targetY, fromX = null, fromY = null ) => {
    const pieceData = fromX !== null ? { x: fromX, y: fromY, piece: board[ fromX ][ fromY ] } : selectedPiece;
    if ( !pieceData ) return;

    const { x, y, piece } = pieceData;

    const legalMoves = getPossibleMoves( piece, x, y, board );
    const isLegal = legalMoves.some( ( [ px, py ] ) => px === targetX && py === targetY );
    if ( !isLegal ) return;

    const updatedBoard = board.map( row => [ ...row ] );

    // Save state
    setMoveHistory( [
      ...moveHistory.slice( 0, undoIndex ),
      {
        type: 'move',
        board: board.map( row => [ ...row ] ),
        player: currentPlayer,
        capturedGote: [ ...capturedGote ],
        capturedSente: [ ...capturedSente ]
      }
    ] );
    setUndoIndex( undoIndex + 1 );

    // Capture
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
    if ( shouldPromote( piece, targetX ) && !piece.includes( '+' ) ) {
      updatedBoard[ targetX ][ targetY ] = piece + '+';
    } else {
      updatedBoard[ targetX ][ targetY ] = piece;
    }

    if ( isInCheck( currentPlayer, updatedBoard ) ) return;

    setBoard( updatedBoard );
    setCurrentPlayer( currentPlayer === 'gote' ? 'sente' : 'gote' );
    setSelectedPiece( null );
    setPossibleMoves( [] );
    setLastMove( { from: [ x, y ], to: [ targetX, targetY ] } );


    if ( isVictory() ) {
      alert( `${ currentPlayer === 'gote' ? 'Sente' : 'Gote' } wins!` );
      resetGame();
    }
  };

  // Determine if a piece should promote based on its type and position
  const shouldPromote = ( piece, x ) => {
    if ( !piece || piece.includes( '+' ) ) return false; // Already promoted
    if ( piece.toLowerCase() === 'k' || piece.toLowerCase() === 'g' ) return false; // Kings and Gold Generals don't promote

    const isGote = piece === piece.toUpperCase();

    // Mandatory promotion for Pawns, Lances, and Knights when reaching last ranks
    if ( [ 'p', 'l', 'n' ].includes( piece.toLowerCase() ) ) {
      if ( ( isGote && x === 0 ) || ( !isGote && x === 8 ) ) return true;
    }

    // Optional promotion when entering the promotion zone (3 farthest ranks)
    return isGote ? x <= 2 : x >= 6;
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
  const isCheckmate = player => {
    if ( !isInCheck( player ) ) return false; // Not in check, so can't be checkmate

    // Check if any of the player's pieces can make a valid move
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
            return false; // Player can escape check, so not checkmate
          }
        }
      }
    }

    alert( `Checkmate! ${ player === 'gote' ? 'Sente' : 'Gote' } wins!` );
    setGameOver( true );
    return true;
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
    updatedBoard[ targetX ][ targetY ] = currentPlayer === 'gote'
      ? piece.toUpperCase()
      : piece.toLowerCase();

    // 🔥 Save game state BEFORE the drop
    setMoveHistory( [
      ...moveHistory.slice( 0, undoIndex ),
      {
        type: 'drop',
        board: board.map( r => [ ...r ] ),
        player: currentPlayer,
        capturedGote: [ ...capturedGote ],
        capturedSente: [ ...capturedSente ]
      }
    ] );
    setUndoIndex( undoIndex + 1 );

    // Remove piece from captured array
    const newCaps = playerCaps.slice();
    newCaps.splice( newCaps.indexOf( piece ), 1 );
    currentPlayer === 'gote'
      ? setCapturedGote( newCaps )
      : setCapturedSente( newCaps );

    if ( isInCheck( currentPlayer, updatedBoard ) ) {
      alert( "Invalid drop: you cannot leave your king in check." );
      return;
    }

    setBoard( updatedBoard );
    setCurrentPlayer( currentPlayer === 'gote' ? 'sente' : 'gote' );
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

  const pieceValue = {
    p: 1, l: 3, n: 3, s: 4, g: 5, b: 7, r: 7, k: 999,
    'p+': 5, 'l+': 5, 'n+': 5, 's+': 5, 'b+': 9, 'r+': 9
  };

  const evaluateBoard = ( board ) => {
    let score = 0;
    for ( let i = 0; i < 9; i++ ) {
      for ( let j = 0; j < 9; j++ ) {
        const piece = board[ i ][ j ];
        if ( piece && piece !== ' ' ) {
          const value = pieceValue[ piece.replace( '+', '' ).toLowerCase() ] || 0;
          score += piece === piece.toLowerCase() ? value : -value;
        }
      }
    }
    return score;
  };

  const scoreMove = ( { piece, captured, promotes, putsOpponentInCheck } ) => {
    const val = pieceValue[ piece.replace( '+', '' ).toLowerCase() ] || 0;
    const capturedVal = captured ? ( pieceValue[ captured.replace( '+', '' ).toLowerCase() ] || 0 ) : 0;

    let score = 0;
    score += capturedVal;
    score += promotes ? 1.5 : 0;
    score += putsOpponentInCheck ? 2 : 0;
    score -= val * 0.2; // discourage trading down

    return score;
  };

  const performAIMove = useCallback( () => {
    if ( currentPlayer !== 'sente' || gameOver ) return;

    const generateBoardClone = () => board.map( row => [ ...row ] );

    const allMoves = [];

    for ( let x = 0; x < 9; x++ ) {
      for ( let y = 0; y < 9; y++ ) {
        const piece = board[ x ][ y ];
        if ( !piece || piece !== piece.toLowerCase() ) continue;

        const legalMoves = getPossibleMoves( piece, x, y, board );

        for ( const [ targetX, targetY ] of legalMoves ) {
          const tempBoard = generateBoardClone();
          const captured = tempBoard[ targetX ][ targetY ];
          const willPromote = shouldPromote( piece, targetX ) && !piece.includes( '+' );
          const promotedPiece = willPromote ? piece + '+' : piece;

          tempBoard[ x ][ y ] = ' ';
          tempBoard[ targetX ][ targetY ] = promotedPiece;

          // ✅ Filter out self-checking moves
          if ( isInCheck( 'sente', tempBoard ) ) continue;

          const putsOpponentInCheck = isInCheck( 'gote', tempBoard );

          const score = scoreMove( {
            piece,
            captured,
            promotes: willPromote,
            putsOpponentInCheck
          } );

          allMoves.push( {
            type: 'move',
            from: [ x, y ],
            to: [ targetX, targetY ],
            piece,
            score
          } );
        }
      }
    }

    // Drop moves
    for ( const captured of capturedSente ) {
      const dropLocations = getDropLocations( captured, board );
      for ( const [ dx, dy ] of dropLocations ) {
        const tempBoard = generateBoardClone();
        tempBoard[ dx ][ dy ] = captured.toLowerCase();

        // ✅ Avoid drops that result in check
        if ( isInCheck( 'sente', tempBoard ) ) continue;

        const putsOpponentInCheck = isInCheck( 'gote', tempBoard );

        const score = scoreMove( {
          piece: captured,
          captured: null,
          promotes: false,
          putsOpponentInCheck
        } );

        allMoves.push( {
          type: 'drop',
          to: [ dx, dy ],
          piece: captured,
          score
        } );
      }
    }

    if ( !allMoves.length ) {
      console.warn( "AI has no legal moves." );
      return;
    }

    allMoves.sort( ( a, b ) => b.score - a.score );
    const bestMoves = allMoves.filter( m => m.score === allMoves[ 0 ].score );
    const chosen = bestMoves[ Math.floor( Math.random() * bestMoves.length ) ];

    setTimeout( () => {
      if ( chosen.type === 'drop' ) {
        handleDropCapturedPiece( chosen.piece, chosen.to[ 0 ], chosen.to[ 1 ] );
        setLastMove( { from: null, to: [ chosen.to[ 0 ], chosen.to[ 1 ] ] } );
      } else {
        movePiece( chosen.to[ 0 ], chosen.to[ 1 ], chosen.from[ 0 ], chosen.from[ 1 ] );
        setLastMove( { from: [ chosen.from[ 0 ], chosen.from[ 1 ] ], to: [ chosen.to[ 0 ], chosen.to[ 1 ] ] } );
      }
    }, 300 );
  }, [
    board,
    currentPlayer,
    gameOver,
    getPossibleMoves,
    capturedSente,
    shouldPromote,
    isInCheck,
    isVictory,
    movePiece,
    handleDropCapturedPiece,
    scoreMove
  ] );

  useEffect( () => {
    if ( vsAI && currentPlayer === 'sente' ) {
      performAIMove();
    }
  }, [ currentPlayer, vsAI, performAIMove, setLastMove ] );


  // Undo the last move
  const handleUndo = () => {
    if ( undoIndex <= 0 || !moveHistory[ undoIndex - 1 ] ) {
      alert( 'No more moves to undo.' );
      return;
    }

    const {
      board: previousBoard,
      player,
      capturedGote = [],
      capturedSente = []
    } = moveHistory[ undoIndex - 1 ];

    setUndoIndex( undoIndex - 1 );
    setBoard( previousBoard.map( row => [ ...row ] ) );
    setCurrentPlayer( player );
    setCapturedGote( [ ...capturedGote ] );
    setCapturedSente( [ ...capturedSente ] );
    setSelectedPiece( null );
    setPossibleMoves( [] );

    refreshGameState( player );
  };


  // Redo a move that was undone
  const handleRedo = () => {
    if ( undoIndex >= moveHistory.length || !moveHistory[ undoIndex ] ) {
      alert( 'No more moves to redo.' );
      return;
    }

    const {
      board: nextBoard,
      player,
      capturedGote = [],
      capturedSente = []
    } = moveHistory[ undoIndex ];

    setUndoIndex( undoIndex + 1 );
    setBoard( nextBoard.map( row => [ ...row ] ) );
    setCurrentPlayer( player );
    setCapturedGote( [ ...capturedGote ] );
    setCapturedSente( [ ...capturedSente ] );
    setSelectedPiece( null );
    setPossibleMoves( [] );
    refreshGameState( player );
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
  };

  const [ promotedPieces, setPromotedPieces ] = useState( new Set() );

  const handlePromotion = () => ( piece, x, y, updatedBoard ) => {
    const promotedPiece = piece + '+';
    updatedBoard[ x ][ y ] = promotedPiece;
    setBoard( updatedBoard );
  };

  const handleSquareClick = ( x, y ) => {
    const piece = board[ x ][ y ];
    const isGotePiece = piece === piece.toUpperCase();
    const isSentePiece = piece !== ' ' && piece === piece.toLowerCase();

    if ( selectedPiece?.isCaptured ) {
      if ( possibleMoves.some( ( [ px, py ] ) => px === x && py === y ) ) {
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
      } else if ( possibleMoves.some( ( [ px, py ] ) => px === x && py === y ) ) {
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

  return (
    <div className="flex flex-row w-full min-h-screen h-fit overflow-hidden">
      {/* Left: Captured by Gote */ }
      <div className="max-w-prose bg-gray-100 p-2 flex items-center overflow-y-auto max-h-fit">

        <div className="flex float-start flex-wrap flex-col mx-auto w-fit">
          <h3 className="text-lg font-bold mb-2">Captured by Gote</h3>
          { capturedGote.map( ( piece, index ) => (
            <Image
              key={ index }
              src={ pieceImages[ piece.toLowerCase() ] }
              alt={ piece }
              width={ 48 }
              height={ 48 }
              className="cursor-pointer mb-1 object-scale-down object-center "
              onClick={ () => {
                setSelectedPiece( { piece, isCaptured: true } );
                setPossibleMoves( getDropLocations( piece, board ) );
              } }
            />
          ) ) }
        </div>
      </div>

      {/* Middle: Shogi Board */ }
      <div className="flex flex-col items-center justify-start p-4">
        { lastMove && (
          <div className="mt-2 text-sm text-gray-700 font-mono">
            Last move: { lastMove.from
              ? `(${ lastMove.from[ 0 ] },${ lastMove.from[ 1 ] }) → (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })`
              : `Drop at (${ lastMove.to[ 0 ] },${ lastMove.to[ 1 ] })` }
          </div>
        ) }

        <h1 className="text-2xl mb-4 font-bold">
          Current Player: { currentPlayer }
          { isInCheck( currentPlayer ) && ` (in check)` }
        </h1>

        <div className={ `board w-100vw` }>
          { board.map( ( row, x ) =>
            row.map( ( piece, y ) => (
              <div
                key={ `${ x }-${ y }` }
                className={ `cell w-full aspect-square border border-gray-300 flex items-center justify-center relative 
                  ${ possibleMoves.some( ( [ px, py ] ) => px === x && py === y ) ? 'highlight' : '' }
                  ${ lastMove?.to?.[ 0 ] === x && lastMove?.to?.[ 1 ] === y ? 'bg-yellow-200' : '' }
                  ${ lastMove?.from?.[ 0 ] === x && lastMove?.from?.[ 1 ] === y ? 'bg-yellow-100' : '' }` }
                onClick={ () => handleSquareClick( x, y ) }
              >

                { piece !== ' ' && (
                  <div className='relative group'>
                    <Image
                      className={ `object-contain ${ piece === piece.toLowerCase() ? 'rotate-180' : '' }` }
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
        <div className=" mx-auto mb-4">
          <button
            onClick={ () => setVsAI( prev => !prev ) }
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            { vsAI ? 'Switch to Player vs Player' : 'Switch to Play vs AI' }
          </button>
        </div>

        <div className="mt-4 flex justify-between space-x-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={ handleUndo }
          >
            Undo
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={ handleRedo }
          >
            Redo
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={ resetGame }
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right: Captured by Sente */ }
      <div className="max-w-prose bg-gray-100 p-2 flex items-center overflow-y-auto max-h-fit">

        <div className="flex flex-wrap float-end flex-col mx-auto w-full">
          <h3 className="text-lg font-bold mb-2">Captured by Sente</h3>
          { capturedSente.map( ( piece, index ) => (
            <Image
              key={ index }
              src={ pieceImages[ piece.toUpperCase() ] }
              alt={ piece }
              width={ 48 }
              height={ 48 }
              className="cursor-pointer mb-1 object-scale-down object-center"
              onClick={ () => {
                setSelectedPiece( { piece, isCaptured: true } );
                setPossibleMoves( getDropLocations( piece, board ) );
              } }
            />
          ) ) }
        </div>
      </div>
    </div>
  );

};

export default ShogiBoard;
