export type Generator<T> = { next: () => T }

export type Position = {
    row: number,
    col: number,
    piece: any
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = ?;

export type BoardListener<T> = ?;

export class Board<T> {
    readonly width: number
    readonly height: number
    readonly seqGen: any

    // Constructor here
    constructor(seqGen: any, width: number = 3, height: number = 3) {
        this.width = width
        this.height = height
        this.seqGen = seqGen

        //Generate pieces on board?
        //Fillup x-->y

         //foreach(position in positions)
         //      position.piece = seqGen.next();
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
                positions.push({ row: r, col: c, piece: undefined })
            }
        }

        return positions
    }

    piece(p: Position): T | undefined {
        if (0 > p.col || p.col > this.width ||
            0 > p.row || p.row > this.height)
            return undefined
        return undefined
        //Somehow return the piece on the position
        //return position.piece
    }

    canMove(first: Position, second: Position): boolean {
        return false
    }

    move(first: Position, second: Position) {
        //DoNothing
    }
}
