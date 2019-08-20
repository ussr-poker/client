export default class Room {
    id = 0;
    playersNeeded = 0;
    players = [];
    game;

    constructor(id, playersNeeded, players) {
        this.id = id;
        this.playersNeeded = playersNeeded;
        this.players = players;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getPlayerById(id) {
        return this.players.find(player => player.id === Number(id));
    }
}