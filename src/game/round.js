export default class Round {
    number = 1;
    type = 0;
    cardsCount = 0;
    state = 0;
    trump = null;
    awaitedPlayerId = null;
    stakes = [];
    moves = [];

    constructor(number, type, cardsCount, state, awaitedPlayerId, stakes, moves) {
        this.number = number;
        this.type = type;
        this.cardsCount = cardsCount;
        this.state = state;
        this.awaitedPlayerId = awaitedPlayerId;
        this.stakes = stakes;
        this.moves = moves;
    }
};

export const ROUND_STATE_NEW = 0;
export const ROUND_STATE_STAKES = 1;
export const ROUND_STATE_IN_PROGRESS = 2;
export const ROUND_STATE_FINISHED = 3;