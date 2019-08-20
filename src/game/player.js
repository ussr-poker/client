export default class Player {
    id = 0;
    name = '';
    cardsCount = 0;
    cards = [];

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    setCards(cards) {
        this.cards = cards;
    }

    setCardsCount(cardsCount) {
        this.cardsCount = cardsCount;
    }
};