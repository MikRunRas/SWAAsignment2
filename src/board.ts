export type Generator<T> = { next: () => T }

export type Position = {
    row: number,
    col: number
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

    // Constructor here
    constructor(width: number = 3, height: number = 3) {
        this.width = width
        this.height = height
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
        return undefined
    }

    canMove(first: Position, second: Position): boolean {
        return false
    }

    move(first: Position, second: Position) {
        //DoNothing
    }
}
