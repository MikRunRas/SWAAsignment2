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
  | { kind: T }
  | { kind: T; match: { matched: string; positions: [] } };

export type BoardListener<T> = Function;

export class Board<T> {
  readonly width: number;
  readonly height: number;
  readonly seqGen: Generator<T>;
  boardState: T[][];
  listeners: BoardListener<T>[];

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

    // Create empty Board
    this.boardState = [];
    this.listeners = [];

    // Populate Board
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

  piece(p: Position): T | undefined {
    // Somehow return the piece on the position
    return this.getPieceFromBoard(this.boardState, p);
  }

  // HELPER METHOD
  getPieceFromBoard(board: T[][], p: Position): T | undefined {
    // Check if Out Of Bounds
    if (0 > p.col || p.col >= this.width || 0 > p.row || p.row >= this.height)
      return undefined;

    return board[p.row][p.col];
  }

  canMove(first: Position, second: Position): boolean {
    // Check for Illegal Moves
    if (this.anyIllegalMoves(first, second)) return false;

    // Check if anything matches
    const simulatedBoard = this.simulateSwap(first, second);
    const matchOnFirst = this.anyMatching(
      simulatedBoard,
      first,
      this.piece(second)
    );
    const matchOnSecond = this.anyMatching(
      simulatedBoard,
      second,
      this.piece(first)
    );

    // Return True if any matches are found, False otherwise
    return matchOnFirst || matchOnSecond;
  }

  // Helper Methods
  anyIllegalMoves(first: Position, second: Position): boolean {
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
    const diff_sum = c_diff + r_diff;

    // If diff_sum != -1 OR 1 -> False
    // if (diff_sum != -1 && diff_sum != 1) return true;

    // if(c_diff > 1 || -1 > c_diff) return true
    // if(r_diff > 1 || -1 > r_diff) return true

    if (c_diff == 0 && r_diff == 0) return true;

    // Default Case
    return false;
  }

  // Recursion using a Vector to add more general checks
  anyMatching(board: T[][], p: Position, reference: T): boolean {
    // Reference Vectors
    const north = { row: -1, col: 0 };
    const east = { row: 0, col: 1 };
    const south = { row: 1, col: 0 };
    const west = { row: 0, col: -1 };

    if (
      this.checkNext(board, p, north, reference) +
        this.checkNext(board, p, south, reference) >=
      2
    ) {
      return true;
    }

    if (
      this.checkNext(board, p, east, reference) +
        this.checkNext(board, p, west, reference) >=
      2
    ) {
      return true;
    }

    // Default Case / No Match Found
    return false;
  }

  checkNext(
    board: T[][],
    currentPosition: Position,
    direction: Position,
    reference: T
  ): number {
    const newPos: Position = {
      row: currentPosition.row + direction.row,
      col: currentPosition.col + direction.col,
    };
    const piece = this.getPieceFromBoard(board, newPos);

    if (piece == reference) {
      return 1 + this.checkNext(board, newPos, direction, reference);
    } else {
      return 0;
    }
  }

  simulateSwap(first: Position, second: Position): T[][] {
    // Copy Board
    let copy = this.boardState.map((arr) => arr.slice());
    let new_first = this.piece(second);
    let new_second = this.piece(first);

    // Swap
    copy[first.row][first.col] = new_first;
    copy[second.row][second.col] = new_second;

    // Return Copy
    return copy;
  }

  // From OLE
  move(first: Position, second: Position) {
    // Return if not allowed
    if (!this.canMove(first, second)) return;

    // Get temporary piece for Swap
    let temp = this.piece(first);
    this.boardState[first.row][first.col] = this.piece(second);
    this.boardState[second.row][second.col] = temp;
  }
}
