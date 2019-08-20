export default class Card {
    id;
    suit;
    value;

    constructor(id, suit, value) {
        this.id = id;
        this.suit = suit;
        this.value = value;
    }

    get shortSuit() {
        switch (this.suit) {
            case 0:
                return 'h';
            case 1:
                return 'd';
            case 2:
                return 's';
            case 3:
                return 'c';
        }
    }

    static getUnicodeSuit(suit) {
        switch (suit) {
            case 0:
                return '♥';
            case 1:
                return '♦';
            case 2:
                return '♠';
            case 3:
                return '♣';
        }
    }

    get unicodeSuit() {
        return Card.getUnicodeSuit(this.suit);
    }

    get isJoker() {
        return this.suit === 2 && this.value === 6;
    }
}