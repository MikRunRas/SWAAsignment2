import { parseSync } from "@babel/core";

export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export type Match<T> = {
  matched: T;
  positions: Position[];
};

export type BoardEvent<T> =
  | { kind: "Refill" }
  | { kind: "Match"; match: Match<T> };

export type BoardListener<T> = Function;

export class Board<T> {
  readonly width: number;
  readonly height: number;
  readonly seqGen: Generator<T>;
  readonly matchLimit = 3;

  boardState: T[][] = []; // Board[Row][Col]
  listeners: BoardListener<T>[] = [];
  movedPieces: Position[] = [];

  // Constructor here
  constructor(
    sequenceGenerator: Generator<T>,
    width: number = 3,
    height: number = 3
  ) {
    // Size of the Board
    this.width = width;
    this.height = height;

    // Save Sequence Generator
    this.seqGen = sequenceGenerator;

    // Populate Board
    this.createEmptyBoard();
    this.populateBoard();
  }
  private createEmptyBoard() {
    // Create an Empty Board
    this.boardState = [];

    // Add the Columns to the board
    for (let c = 0; c < this.width; c++) {
      this.boardState.push([]);
    }

    // Fill each row, 1 column at a time
    for (let r = 0; r < this.height; r++) {
      this.boardState.forEach((c) => {
        // Adding undefined to Row
        c.push(undefined);
      });
    }
  }
  private populateBoard() {
    // Loop through Board State, row -> col, col, [...]
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        // Return if Piece already exists
        if (this.boardState[col][row] != undefined) return;

        // Set the Piece
        let nextPiece = this.seqGen.next();
        this.boardState[col][row] = nextPiece;
      }
    }
  }

  addListener(listener: BoardListener<T>) {
    this.listeners.push(listener);
  }

  // Creates a List of all Positions possible
  positions(): Position[] {
    //Create empty array
    let positions: Position[] = [];

    //Runs through x-axis
    for (let x = 0; x < this.width; x++) {
      //Runs through y-axis
      for (let y = 0; y < this.height; y++) {
        //Adding each position
        positions.push({ row: y, col: x });
      }
    }

    // Return
    return positions;
  }

  // Gets the piece at the given Position
  piece(p: Position): T | undefined {
    return this.getFromBoard(p, this.boardState);
  }

  /**
   * Checks if the First and Second Position can be swapped around
   *
   * @param first First Position
   * @param second Second Position
   * @returns True if a Move is allowed
   */
  canMove(first: Position, second: Position): boolean {
    // Cache Moved Pieces
    this.movedPieces = [first, second];

    // False if any Illegal moves are attempted
    if (this.anyIllegalMoves()) return false;

    const simulatedBoard = this.simulateSwap(first, second);
    const matchOnFirst = this.anyMatching(simulatedBoard, first);
    const matchOnSecond = this.anyMatching(simulatedBoard, second);

    // Return True if any matches are found, False otherwise
    return matchOnFirst || matchOnSecond;
  }

  // Helper Methods
  private anyIllegalMoves(
    first: Position = this.movedPieces[0],
    second: Position = this.movedPieces[1]
  ): boolean {
    // use Piece to check OOB
    if (this.piece(first) == undefined || this.piece(second) == undefined)
      return true;

    // Extract Columns and Rows
    const c1 = first.col,
      c2 = second.col,
      r1 = first.row,
      r2 = second.row;

    // Return true if not in a Cardinal Direction
    if (c1 != c2 && r1 != r2) return true;

    // Calculate Difference between Columns && Rows && Magic (Maths)
    const c_diff = c1 - c2,
      r_diff = r1 - r2;
    // const diff_sum = c_diff + r_diff;

    // If diff_sum != -1 OR 1 -> False
    // if (diff_sum != -1 && diff_sum != 1) return true;

    // if(c_diff > 1 || -1 > c_diff) return true
    // if(r_diff > 1 || -1 > r_diff) return true

    // True if First and Second is the same
    return c_diff == 0 && r_diff == 0;
  }

  /**
   * Recursion using a Vector to add more general checks
   *
   * @param b Board to check through
   * @param p Position to check from
   * @returns `true` if a Match is found, `false` otherwise
   */
  private anyMatching(b: T[][], p: Position): boolean {
    // Reference Vectors
    const [n, e, s, w]: Position[] = [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ];

    // Get the Reference Piece
    const ref = this.getFromBoard(p, b);

    // Create Booleans for Vertical and Horizontal Matches
    let matchV = false,
      matchH = false;

    // Check for Matches on the Horizontal axis
    matchH =
      1 + this.checkNext(b, p, e, ref) + this.checkNext(b, p, w, ref) >=
      this.matchLimit;

    // Check for Matches on the Vertical axis
    matchV =
      1 + this.checkNext(b, p, n, ref) + this.checkNext(b, p, s, ref) >=
      this.matchLimit;

    return matchH || matchV;
  }

  private checkEntireBoard() {
    // To Be Implemented
  }

  /**
   * Retrieve a Piece from the Board
   *
   * @param pos Position to retrieve a Piece from
   * @param board Board to retrieve a Piece from
   * @returns `undefined` if Piece is Out Of Bounds, or doesn't exist. Piece of type `<T>` otherwise
   */
  private getFromBoard(pos: Position, board: T[][] = this.boardState) {
    // Check if Out Of Bounds
    const OOB =
      0 > pos.col ||
      pos.col >= this.width ||
      0 > pos.row ||
      pos.row >= this.height;

    // Return Undefined if OOB, otherwise the Piece at position
    return OOB ? undefined : board[pos.col][pos.row];
  }

  private fireMatchEvent(positions: Position[]) {
    // Sort the positions by Col and Row values
    positions.sort((a, b) => {
      if (a.col === b.col) {
        return a.row - b.row;
      }
      return a.col - b.col;
    });

    // Get Reference Piece from first position
    const pos_0 = positions[0];
    const ref = this.boardState[pos_0.col][pos_0.row];

    // Create Event
    const event: BoardEvent<T> = {
      kind: "Match",
      match: { matched: ref, positions: positions },
    };

    // Fire Event
    this.listeners.forEach((l) => l(event));
  }

  private checkNext(
    board: T[][],
    currentPosition: Position,
    direction: Position,
    reference: T
  ): number {
    // Calculate the next position
    const newPos: Position = {
      col: currentPosition.col + direction.col,
      row: currentPosition.row + direction.row,
    };

    // Get the Piece
    const piece = this.getFromBoard(newPos, board);

    // Check if Piece is the correct Piece
    if (piece == reference) {
      // Return 1 + current amount
      return 1 + this.checkNext(board, newPos, direction, reference);
    } else {
      return 0;
    }
  }

  private getNext(
    board: T[][],
    currentPosition: Position,
    direction: Position,
    reference: T,
    trackArray: Set<Position>
  ) {
    // Calculate the next position
    const newPos: Position = {
      col: currentPosition.col + direction.col,
      row: currentPosition.row + direction.row,
    };

    // Get the Piece
    const piece = this.getFromBoard(newPos, board);

    // Check if Piece is the correct Piece
    if (piece == reference) {
      // Recursion
      this.getNext(board, newPos, direction, reference, trackArray);
    }

    // Add current position to the Tracking Array
    trackArray.add(currentPosition);
  }

  private simulateSwap(
    first: Position,
    second: Position,
    board: T[][] = this.boardState
  ): T[][] {
    // Copy Board
    let copy = board.map((arr) => arr.slice());
    let new_first = this.piece(second);
    let new_second = this.piece(first);

    // Swap
    copy[first.col][first.row] = new_first;
    copy[second.col][second.row] = new_second;

    // Return Copy
    return copy;
  }

  private findMatches(
    p: Position,
    direction: "Horiztonal" | "Vertical" // | "Both"
  ): Position[] {
    // Reference Vectors
    const [n, e, s, w]: Position[] = [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ];

    const b = this.boardState;

    // Get the Reference Piece
    const ref = this.getFromBoard(p, b);

    // Tracking Arrays
    var trackH: Set<Position> = new Set();
    var trackV: Set<Position> = new Set();

    // Check for Matches on the Horizontal axis
    this.getNext(b, p, e, ref, trackH);
    this.getNext(b, p, w, ref, trackH);

    // Check for Matches on the Vertical axis
    this.getNext(b, p, n, ref, trackV);
    this.getNext(b, p, s, ref, trackV);

    // Return requested Array
    switch (direction) {
      case "Horiztonal":
        return [...trackH];
      case "Vertical":
        return [...trackV];
      // case "Both":
      default:
      // return {V: [...trackV], H: [...trackH] };
    }
  }

  /**
   * Filters the Lists of Matches to and then fires events for those of length high enough for the Match Limit
   *
   * @param matches Lists of Matches
   */
  private fireMatchEvents(matches: Position[][]) {
    matches
      .filter((m) => m.length >= this.matchLimit)
      .forEach((m) => this.fireMatchEvent(m));
  }

  //
  move(first: Position, second: Position) {
    // Return if not allowed
    if (!this.canMove(first, second)) return;

    // Get temporary piece for Swap
    let temp = this.piece(first);
    this.boardState[first.col][first.row] = this.piece(second);
    this.boardState[second.col][second.row] = temp;

    // Get the Horizontal & Vertical Matches
    const matches = [
      this.findMatches(first, "Horiztonal"),
      this.findMatches(first, "Vertical"),
      this.findMatches(second, "Horiztonal"),
      this.findMatches(second, "Vertical"),
    ];

    // Fire the Matches events
    this.fireMatchEvents(matches);
    this.removeMatches(matches);

    // Refill Event
    this.listeners.forEach((l) => l({ kind: "Refill" }));
    this.refillBoard();
  }

  private refillBoard() {
    // Loop through columns by removing the first column, and adding it back on the end
    for (let i = 0; i < this.boardState.length; i++) {
      // Get cleaned column
      let column = this.boardState.shift();
      column = column.filter(Boolean);

      // Fill column
      const missing = this.height - column.length;
      for (let i = missing; i > 0; i--) {
        column.unshift(undefined);
      }

      // Add back column
      this.boardState.push(column);
    }

    // Add Pieces back
    this.populateBoard();
    console.log("DEBUG");
  }

  private removeMatches(matches: Position[][]) {
    matches
      .filter((m) => m.length >= this.matchLimit)
      .forEach((m) =>
        m.forEach((m) => (this.boardState[m.col][m.row] = undefined))
      );
  }
}
