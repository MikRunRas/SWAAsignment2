export type Generator<T> = { next: () => T };

export type Position = {
  row: number;
  col: number;
};

export type Match<T> = {
  matched: T;
  positions: Position[];
};

export type BoardEvent<T> = undefined;

export type BoardListener<T> = undefined;

export class Board<T> {
  readonly width: number;
  readonly height: number;
  readonly seqGen: Generator<T>;
  boardState: T[][];

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

  addListener(listener: BoardListener<T>) {}

  positions(): Position[] {
    //Create empty array
    let positions: Position[] = [];

    //Runs through y-axis
    for (let r = 0; r < this.height; r++) {
      //Runs through x-axis
      for (let c = 0; c < this.width; c++) {
        //Adding each position
        positions.push({ row: r, col: c});
      }
    }

    // Return
    return positions;
  }

  piece(p: Position): T | undefined {
    // Check if Out Of Bounds
    if (0 > p.col || p.col >= this.width || 0 > p.row || p.row >= this.height)
      return undefined;

    // Somehow return the piece on the position
    return this.boardState[p.row][p.col];
  }

  canMove(first: Position, second: Position): boolean {
    // Check for Illegal Moves
    if (this.anyIllegalMoves(first, second)) return false

    // Check if anything matches
    const matchOnFirst = this.anyMatching(first)
    const matchOnSecond = this.anyMatching(second)

    // Return True if any matches are found, False otherwise
    return matchOnFirst || matchOnSecond;
  }

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
    if (diff_sum != -1 && diff_sum != 1) return true;
    /*
          if(c_diff > 1 || -1 > c_diff) return false
          if(r_diff > 1 || -1 > r_diff) return false
          if(c_diff == 0 && r_diff == 0) return false
        */

    // Default Case
    return false;
  }

  anyMatching(p: Position): boolean {
    // Get Reference Character
    const reference_char = this.piece(p);
    let in_a_row = 0;

    // Check for a match in the Row
    for (let col = p.col - 2; col <= p.col + 2; col++) {
      if (this.piece({ row: p.row, col: col }) == reference_char) {
        in_a_row++;

        // Return if a Match is found
        if(in_a_row === 3) return true
      } else {
        in_a_row = 0;
      }
    }

    // Reset counter
    in_a_row = 0

    // Check for a match in the Column
    for (let row = p.col - 2; row <= p.col + 2; row++) {
      if (this.piece({ row: row, col: p.col }) == reference_char) {
        in_a_row++;

        // Return if a Match is found
        if(in_a_row === 3) return true
      } else {
        in_a_row = 0;
      }
    }

    // Default Case / No Match Found
    return false;
  }

  move(first: Position, second: Position) {
    // Return if not allowed
    if (!this.canMove(first, second)) return;

    // Get temporary piece for Swap
    let temp = this.piece(first);
    this.boardState[first.row][first.col] = this.piece(second);
    this.boardState[second.row][second.col] = temp;
  }
}
