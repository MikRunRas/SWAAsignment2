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

  boardState: T[][]; // Board[Row][Col]
  listeners: BoardListener<T>[];
  movedPieces: Position[];

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
    this.movedPieces = [first, second];
    // Check for Illegal Moves
    if (this.anyIllegalMoves()) return false;

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

  // Recursion using a Vector to add more general checks
  anyMatching(board: T[][], position: Position, referencePiece: T): boolean {
    // Reference Vectors
    const [north, east, south, west] = [
      { row: -1, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
    ];

    let foundMatch = false;

    if (
      this.checkNext(board, position, east, referencePiece) +
        this.checkNext(board, position, west, referencePiece) >=
      2
    ) {
      foundMatch = true;
    }

    if (
      this.checkNext(board, position, north, referencePiece) +
        this.checkNext(board, position, south, referencePiece) >=
      2
    ) {
      foundMatch = true;
    }

    // Default Case / No Match Found
    return foundMatch;
  }

  private fireMatchEvent() {
    // Sort the positions by Col and Row values
    // this.positionsOfMatch.sort((a, b) => {
    //   if (a.col === b.col) {
    //     return a.row - b.row;
    //   }
    //   return a.col - b.col;
    // });

    // const firstInMatch = this.positionsOfMatch[0];
    // const reference = this.boardState[firstInMatch.row][firstInMatch.col];

    // Create Event
    // const event: BoardEvent<T> = {
    //   kind: "Match",
    //   match: { matched: reference, positions: this.positionsOfMatch },
    // };

    // Fire Event
    this.listeners.forEach((listener) => {
      // listener(event);
      listener({ kind: "Refill" });
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
    const piece = this.getPieceFromBoard(board, newPos);

    // Check if Piece is the correct Piece
    if (piece == reference) {
      // Return 1 + current amount
      return 1 + this.checkNext(board, newPos, direction, reference);
    } else {
      return 0;
    }
  }

  private simulateSwap(first: Position, second: Position): T[][] {
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

    // var matches = getMatches(first)
    // var matches = getMatches(second)

    // Get temporary piece for Swap
    let temp = this.piece(first);
    this.boardState[first.row][first.col] = this.piece(second);
    this.boardState[second.row][second.col] = temp;

    // Fire Match Event
    // this.fireMatchEvent();
  }
}
