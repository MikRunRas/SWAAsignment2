export type Generator<T> = { next: () => T }

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = undefined;

export type BoardListener<T> = undefined;

export class Board<T> {
    readonly width: number
    readonly height: number
    readonly seqGen: Generator<T>
    boardState: T[][]

    // Constructor here
    constructor(sequenceGenerator: Generator<T>, width: number = 3, height: number = 3) {
        this.width = width
        this.height = height

        // Save Sequence Generator
        this.seqGen = sequenceGenerator
        
        // Create empty Board
        this.boardState = []
        
        // Populate Board
        for (let r = 0; r < this.height; r++) {
            let row: T[] = []
            // Runs through x-axis
            for (let c = 0; c < this.width; c++) {
                // Adding Piece to Row
                row.push(this.seqGen.next())
            }

            // Add Row to State
            this.boardState.push(row)
        }
        

    }


    addListener(listener: BoardListener<T>) {

    }

    positions(): Position[] {
        //Create empty array
        let positions: Position[] = [];
        
        //Runs through y-axis
        for (let r = 0; r < this.height; r++) {

            //Runs through x-axis
            for (let c = 0; c < this.width; c++) {
                //Adding each position
                positions.push({ row: r, col: c })
            }
        }

        return positions
    }

    piece(p: Position): T | undefined {
        return this.boardState[p.col][p.row]
    }

    canMove(first: Position, second: Position): boolean {
        return false
    }

    move(first: Position, second: Position) {
        //DoNothing
    }
}
