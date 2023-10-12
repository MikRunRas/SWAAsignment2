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

  boardState: T[][] = []; // Board[Row][Col]
  listeners: BoardListener<T>[] = [];
  movedPieces: Position[] = [];

  // Constructor here
  constructor(
    sequenceGenerator: Generator<T>,
    width: number = 3,
    height: number = 3
  ) {
    this.width = width;
    this.height = height;

    // Save Sequence Generator
    this.seqGen = sequenceGenerator;

    // Populate Board
    this.populateBoard();
  }

  private populateBoard() {
    for (let c = 0; c < this.height; c++) {
      let temp_col: T[] = [];
      // Runs through x-axis
      for (let r = 0; r < this.width; r++) {
        // Adding Piece to Row
        temp_col.push(this.seqGen.next());
      }

      // Add Row to State
      this.boardState.push(temp_col);
    }
  }

  addListener(listener: BoardListener<T>) {
    this.listeners.push(listener);
  }

  // Creates a List of all Positions possible
  positions(): Position[] {
    //Create empty array
    let positions: Position[] = [];

    //Runs through y-axis
    for (let r = 0; r < this.height; r++) {
      //Runs through x-axis
      for (let c = 0; c < this.width; c++) {
        //Adding each position
        positions.push({ row: r, col: c });
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
  anyIllegalMoves(
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
  anyMatching(b: T[][], p: Position): boolean {
    // Reference Vectors
    const [n, e, s, w] = [
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
    matchH = this.checkNext(b, p, e, ref) + this.checkNext(b, p, w, ref) >= 2;

    // Check for Matches on the Vertical axis
    matchV = this.checkNext(b, p, n, ref) + this.checkNext(b, p, s, ref) >= 2;

    return matchH || matchV;
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
    return OOB ? undefined : board[pos.row][pos.col];
  }

  private fireMatchEvent(positions: Position[]) {
    // Sort the positions by Col and Row values
    positions.sort((a, b) => {
      if (a.col === b.col) {
        return a.row - b.row;
      }
      return a.col - b.col;
    });

    const firstInMatch = positions[0];
    const reference = this.boardState[firstInMatch.row][firstInMatch.col];

    // Create Event
    const event: BoardEvent<T> = {
      kind: "Match",
      match: { matched: reference, positions: positions },
    };

    // Fire Event
    this.listeners.forEach((listener) => {
      listener(event);
    });

    // Remove / Repopulate positions
    // this.positionsOfMatch.forEach((p) => {
    //   this.boardState[p.row][p.col] = this.seqGen.next();
    // });
  }

  private checkNext(
    board: T[][],
    currentPosition: Position,
    direction: Position,
    reference: T
  ): number {
    // Calculate the next position
    const newPos: Position = {
      row: currentPosition.row + direction.row,
      col: currentPosition.col + direction.col,
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
      row: currentPosition.row + direction.row,
      col: currentPosition.col + direction.col,
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
    copy[first.row][first.col] = new_first;
    copy[second.row][second.col] = new_second;

    // Return Copy
    return copy;
  }

  private findMatches(p: Position): Position[] {
    // Reference Vectors
    const [n, e, s, w] = [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ];

    const b = this.boardState;

    // Get the Reference Piece
    const ref = this.getFromBoard(p, b);

    var trackH: Set<Position> = new Set();
    var trackV: Set<Position> = new Set();
    // Check for Matches on the Horizontal axis
    this.getNext(b, p, e, ref, trackH);
    this.getNext(b, p, w, ref, trackH);

    // Check for Matches on the Vertical axis
    this.getNext(b, p, n, ref, trackV);
    this.getNext(b, p, s, ref, trackV);

    // Return longest array | CHANGE THIS LATER
    return trackH.size > trackV.size ? [...trackH] : [...trackV];
  }

  // 
  move(first: Position, second: Position) {
    // Return if not allowed
    if (!this.canMove(first, second)) return;

    // Get temporary piece for Swap
    let temp = this.piece(first);
    this.boardState[first.row][first.col] = this.piece(second);
    this.boardState[second.row][second.col] = temp;

    const matchesForFirst = this.findMatches(first);
    const matchesForSecond = this.findMatches(second);

    // Fire Match Event
    if (matchesForFirst.length > 2) {
      this.fireMatchEvent(matchesForFirst);
    }

    if (matchesForSecond.length > 2) {
      this.fireMatchEvent(matchesForSecond);
    }

    // Send Refill
    this.listeners.forEach((l) => l({ kind: "Refill" }));
  }
}
