export default class ScoreBoard {
    entries = [];

    constructor(scoreBoard) {
        scoreBoard.forEach(entry => this.entries.push(entry));
    }
}