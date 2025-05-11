// utils/openingBook.js

// Each opening has a name and a precise sequence of Sente (lowercase) and Gote (uppercase) moves.
// Coordinates are [row, col], 0-indexed with row 0 = Gote’s back rank, row 8 = Sente’s back rank.
export const openingBook = [
    {
        name: "Yagura (矢倉)",
        sequence: [
            // Sente P-7f
            { from: [ 6, 6 ], to: [ 5, 6 ], piece: "p" },
            // Gote P-3d
            { from: [ 2, 2 ], to: [ 3, 2 ], piece: "P" },
            // Sente G-7h
            { from: [ 8, 5 ], to: [ 7, 5 ], piece: "g" },
            // Gote G-3b
            { from: [ 0, 3 ], to: [ 1, 3 ], piece: "G" },
            // Sente S-8h
            { from: [ 8, 2 ], to: [ 7, 3 ], piece: "s" },
            // Gote S-2b
            { from: [ 0, 6 ], to: [ 1, 5 ], piece: "S" },
            // Sente P-2f
            { from: [ 6, 1 ], to: [ 5, 1 ], piece: "p" },
            // Gote P-8d
            { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" }
        ]
    },
    {
        name: "Double Wing Attack (相掛かり)",
        sequence: [
            // Sente P-2f
            { from: [ 6, 1 ], to: [ 5, 1 ], piece: "p" },
            // Gote P-8d
            { from: [ 2, 7 ], to: [ 3, 7 ], piece: "P" },
            // Sente P-8f
            { from: [ 6, 7 ], to: [ 5, 7 ], piece: "p" },
            // Gote P-2d
            { from: [ 2, 1 ], to: [ 3, 1 ], piece: "P" },
            // Sente R-2h
            { from: [ 7, 7 ], to: [ 5, 7 ], piece: "r" },  // Rook swing
            // Gote R-8b
            { from: [ 1, 1 ], to: [ 3, 1 ], piece: "R" }
        ]
    }
];

// Board move hasher for history-checking
export function hashMove( { from, to, piece } ) {
    return `${ from[ 0 ] }${ from[ 1 ] }${ to[ 0 ] }${ to[ 1 ] }${ piece }`;
}
