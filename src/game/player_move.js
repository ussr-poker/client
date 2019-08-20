export default class PlayerMove {
    playerId = 0;
    card = null;
    jokerMove = null;

    constructor(playerId, card, jokerMove) {
        this.playerId = playerId;
        this.card = card;
        this.jokerMove = jokerMove;
    }
}