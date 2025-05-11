// utils.js

export const generateBoardHash = ( board ) => {
    // Flatten the board and join the pieces into a string
    return board.flat().join( '' );
};
