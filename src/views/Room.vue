<template>
    <div>
        <div v-if="room === null" class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        <div v-else>
            <h1>Комната {{ $route.params.id }}</h1>
            <template v-if="showDebugInfo">
                <p>Информация: {{ JSON.stringify(room)}}</p>
                <p>Последнее событие: {{ JSON.stringify(roomEvent)}}</p>
            </template>
            <p v-if="!room.game.currentRound">Нужно игроков для старта игры: <strong>{{ room.playersNeeded - roomPlayers.length }}</strong></p>

            <div class="room-wrapper">
                <div id="card-table">
                    <!-- another room players and theirs info -->
                    <div
                            v-for="player in room.players"
                            v-if="player.id !== user.data.id"
                            class="player"
                            v-bind:class="{awaitedPlayer: room.game.currentRound && player.id === room.game.currentRound.awaitedPlayerId}"
                    >
                        <div class="playerInfo">{{ player.name }} <span v-if="!player.isOnline">(disconnect)</span></div>
                        <div class="cards">
                            <template v-for="n in player.cardsCount">
                                <transition-group name="unknownCard" appear="">
                                    <div
                                            v-if="n > 1"
                                            v-bind:key="n"
                                            class="unknownCard"
                                            :style="`margin-left: -20px;`"
                                    ></div>
                                    <div v-else class="unknownCard" v-bind:key="n"></div>
                                </transition-group>
                            </template>
                        </div>
                    </div>

                    <!-- stakes -->
                    <div
                            v-if="room.game.currentRound && room.game.currentRound.state === ROUND_STATE_STAKES && room.game.currentRound.awaitedPlayerId === localPlayer.id"
                            class="makeStake"
                    >
                        <div>Ваша ставка:</div>
                        <template v-for="stake in availableStakes">
                            <div v-on:click="stakeClicked(stake)" class="stake">{{ stake }}</div>
                        </template>
                    </div>

                    <!-- subround && round winners block -->
                    <transition name="bounce" v-on:after-enter="subRoundWinnerId = null">
                        <p v-if="subRoundWinnerId">Взятку берет: <strong>{{ room.getPlayerById(subRoundWinnerId).name }}</strong></p>
                    </transition>
                    <transition name="bounce" v-on:after-enter="roundWinnerId = null">
                        <p v-if="roundWinnerId">Победил в раунде: <strong>{{ room.getPlayerById(roundWinnerId).name }}</strong></p>
                    </transition>

                    <!-- card deck -->
                    <div v-if="room.game.currentRound && room.game.currentRound.state !== ROUND_STATE_NEW"
                         class="cardDeck">
                        <div v-for="n in 15" class="unknownCard" :style="`margin-top: -130%;`"></div>
                        <div
                                class="knownCard"
                                :class="`c${room.game.currentRound.trump.shortSuit}${room.game.currentRound.trump.value}`"
                        ></div>
                    </div>

                    <!-- player moves  -->
                    <div v-if="room.game.currentRound && room.game.currentRound.state === ROUND_STATE_IN_PROGRESS">
                        <div class="moves">
                            <template v-for="move in room.game.currentRound.moves">
                                <div v-if="!move.card.isJoker" class="knownCard" :class="`c${move.card.shortSuit}${move.card.value}`"></div>
                                <template v-else>
                                    <div class="knownCard" :class="`c${move.card.shortSuit}${move.card.value}`">
                                        <span style="background-color: #cccccc">
                                            {{ move.jokerMove.mode ? '⬆' : '⬇' }} {{ getUnicodeSuit(move.jokerMove.suit) }}
                                        </span>
                                    </div>
                                </template>
                            </template>
                        </div>
                    </div>

                    <!-- local player info && cards -->
                    <div
                            class="localPlayer"
                            v-bind:class="{awaitedPlayer: room.game.currentRound && localPlayer.id === room.game.currentRound.awaitedPlayerId}"
                    >
                        <div class="playerInfo">{{ localPlayer.name }}</div>
                        <div class="cards">
                            <transition-group name="knownCard" appear="">
                                <div
                                        v-for="card in localPlayer.cards"
                                        v-on:click="cardClicked(card)"
                                        class="knownCard"
                                        :class="[`c${card.shortSuit}${card.value}`, isCardAvailable(card) ? '' : 'cardNotAvailable']"
                                        :key="card.id"
                                ></div>
                            </transition-group>
                        </div>
                    </div>

                    <!-- total scores -->
                    <div class="totalScores">
                        <span>Очки</span>
                        <table class="totalScores-table">
                            <tr>
                                <td v-for="player in room.players">{{ player.name }}</td>
                            </tr>
                            <tr>
                                <template v-for="player in room.players">
                                    <td>{{ totalScores[player.id] }}</td>
                                </template>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- ScoreBoard -->
                <score-board-component></score-board-component>
            </div>

            <b-modal id="modal-joker-move" title="Джокер" @hide="onJokerMoveCancel" hide-footer>
                <b-form @submit.prevent="onJokerMoveSubmit">
                    <b-form-group id="input-group-3" label="Режим:" label-for="mode">
                        <b-form-radio v-model="jokerMove.mode" name="mode" value="1" id="mode">Старшая</b-form-radio>
                        <b-form-radio v-model="jokerMove.mode" name="mode" value="0">Младшая</b-form-radio>
                    </b-form-group>
                    <b-form-group id="input-group-3" label="Масть:" label-for="suit">
                        <b-form-select v-model="jokerMove.suit" :options="jokerMoveSuits" size="sm"
                                       class="mt-3"></b-form-select>
                    </b-form-group>
                    <b-button type="submit" variant="primary">Ход</b-button>
                </b-form>
            </b-modal>
        </div>
        <b-button @click="showDebugInfo = !showDebugInfo" size="sm" style="margin-top: 10px;">Show Debug Info</b-button>
    </div>
</template>

<script>
    import {COMMAND_GET_ROOM, COMMAND_MAKE_MOVE, COMMAND_MAKE_STAKE} from "../client";
    import Room from "../game/room";
    import Game from "../game/game";
    import ScoreBoard from "../game/scoreboard";
    import Player from "../game/player";
    import Card from "../game/card";
    import ScoreBoardComponent from "./ScoreBoard";
    import Round, {
        ROUND_STATE_NEW,
        ROUND_STATE_STAKES,
        ROUND_STATE_IN_PROGRESS,
        ROUND_STATE_FINISHED
    } from "../game/round";
    import PlayerStake from "../game/player_stake";
    import PlayerMove from "../game/player_move";

    export default {
        name: 'room',
        components: {ScoreBoardComponent},
        data() {
            return {
                jokerMove: {
                    mode: 0,
                    suit: 0
                },
                jokerMoveSuits: [
                    {value: 0, text: "Черва"},
                    {value: 1, text: "Бубна"},
                    {value: 2, text: "Пика"},
                    {value: 3, text: "Крестья"},
                ],
                jokerMoveResolve: null,
                jokerMoveReject: null,
                ROUND_STATE_NEW: ROUND_STATE_NEW,
                ROUND_STATE_STAKES: ROUND_STATE_STAKES,
                ROUND_STATE_IN_PROGRESS: ROUND_STATE_IN_PROGRESS,
                ROUND_STATE_FINISHED: ROUND_STATE_FINISHED,
                subRoundWinnerId: null,
                roundWinnerId: null,
                showDebugInfo: false
            }
        },
        computed: {
            user() {
                return this.$store.state.user;
            },
            room() {
                return this.$store.state.room;
            },
            roomPlayers() {
                return this.room.players;
            },
            localPlayer() {
                return this.room.getPlayerById(this.user.data.id);
            },
            availableStakes() {
                if (!this.room.game.currentRound) {
                    return [];
                }

                if (this.room.game.currentRound.state !== 1) {
                    return [];
                }

                let sumOfStakes = 0;
                this.room.game.currentRound.stakes.forEach(playerStake => sumOfStakes += playerStake.stake);

                const cardsCount = this.room.game.currentRound.cardsCount;

                let result = [];

                for (let i = 0; i <= cardsCount; i++) {
                    if (i + sumOfStakes === cardsCount && this.room.game.currentRound.stakes.length > 0) {
                        continue;
                    }

                    result.push(i);
                }

                return result;
            },
            availableCards() {
                if (!this.room.game.currentRound) {
                    return [];
                }

                if (this.room.game.currentRound.state !== ROUND_STATE_IN_PROGRESS) {
                    return [];
                }

                if (this.room.game.currentRound.moves.length === 0) {
                    return this.localPlayer.cards;
                }

                const firstMove = this.room.game.currentRound.moves[0];
                if (firstMove.playerId === this.localPlayer.id) {
                    return [];
                }

                let cards = [];
                if (firstMove.card.isJoker) {
                     cards = this.localPlayer.cards.filter(card => card.suit === firstMove.jokerMove.suit);
                } else {
                    cards = this.localPlayer.cards.filter(card => card.isJoker || card.suit === firstMove.card.suit)
                }

                if (cards.length === 1 && cards[0].isJoker) {
                    return this.localPlayer.cards;
                }

                if (cards.length) {
                    return cards;
                }

                return this.localPlayer.cards;
            },
            totalScores() {
                let result = [];

                this.room.game.scoreBoard.entries.forEach(entry => {
                    entry.players.forEach(player => {
                        if (undefined === result[player.id]) {
                            result[player.id] = 0;
                        }

                        if (null !== player.score) {
                            result[player.id] += player.score;
                        }
                    });
                });

                return result;
            },
            isSocketConnected: function () {
                return this.$store.state.socket.isConnected;
            },
            isLoggedIn: function () {
                return this.$store.state.user.isLoggedIn;
            },
            roomEvent() {
                return this.$store.state.roomEvent;
            }
        },
        watch: {
            isSocketConnected: async function (newValue, oldValue) {
                console.log('socket connected');

                if (newValue) {
                    await this.fetchRoom();
                }
            },
            roomEvent: function (roomEvent) {
                const commandRes = roomEvent.commandRes;

                switch (roomEvent.commandId) {
                    // player join
                    case 1000:
                        this.room.addPlayer(new Player(commandRes.id, commandRes.name));
                        break;
                    // round started
                    case 1001:
                        this.subRoundWinnerId = null;
                        this.roundWinnerId = null;

                        // set new round
                        let round = new Round(
                            commandRes.number,
                            commandRes.type,
                            commandRes.cardsCount,
                            commandRes.state,
                            commandRes.awaitedPlayerId,
                            [],
                            []
                        );
                        round.trump = new Card(0, commandRes.trump.suit, commandRes.trump.value);
                        this.room.game.currentRound = round;

                        // set local player cards
                        this.localPlayer.cards = commandRes.cards.map(rawCard => new Card(rawCard.id, rawCard.suit, rawCard.value));
                        // set other players cards count
                        this.room.players.forEach(player => {
                            if (player.id !== this.localPlayer.id) {
                                player.cardsCount = round.cardsCount;
                            }
                        });

                        // add new scoreboard entry
                        this.room.game.scoreBoard.entries.push({
                            round: {
                                number: round.number,
                                type: round.type,
                                cardsCount: round.cardsCount
                            },
                            players: this.room.players.map(player => {
                                return {id: player.id, stake: null, wins: null, score: null}
                            })
                        });

                        (new Audio(require('../assets/sound/card_shuffling.mp3'))).play();
                        break;
                    // round finished
                    case 1002:
                        this.room.game.currentRound.state = ROUND_STATE_FINISHED;
                        this.roundWinnerId = commandRes.winnerId;

                        const entry = this.room.game.scoreBoard.entries.find(entry => entry.round.number === commandRes.number);

                        // update scoreboard
                        commandRes.results.forEach(result => {
                            const player = entry.players.find(player => player.id === result.playerId);

                            player.stake = result.stake;
                            player.wins = result.wins;
                            player.score = result.score;
                        });
                        break;
                    // player stake
                    case 1003:
                        this.fetchRoom();
                        break;
                    // player move
                    case 1004:
                        const card = new Card(commandRes.card.id, commandRes.card.suit, commandRes.card.value);
                        const playerMove = new PlayerMove(commandRes.playerId, card, commandRes.jokerMove);

                        // drop card from player
                        const player = this.room.getPlayerById(commandRes.playerId);
                        if (player.id === this.localPlayer.id) {
                            player.cards = player.cards.filter(playerCard => {
                                return playerCard.id !== card.id
                            });
                        } else {
                            player.cardsCount--;
                        }

                        // save player move
                        this.room.game.currentRound.moves.push(playerMove);
                        // set next awaited player
                        this.room.game.currentRound.awaitedPlayerId = commandRes.awaitedPlayerId;

                        (new Audio(require('../assets/sound/card_flip.mp3'))).play();
                        break;
                    // subround started
                    case 1005:
                        this.subRoundWinnerId = null;
                        this.room.game.currentRound.awaitedPlayerId = commandRes.awaitedPlayerId;
                        break;
                    // subround finished
                    case 1006:
                        this.room.game.currentRound.moves = [];
                        this.subRoundWinnerId = commandRes.winnerId;

                        // update scoreboard player wins
                        const sbEntry = this.room.game.scoreBoard.entries.find(entry => entry.round.number === this.room.game.currentRound.number);
                        const sbPlayer = sbEntry.players.find(player => player.id === commandRes.winnerId);
                        if (null === sbPlayer.wins) {
                            sbPlayer.wins = 0;
                        }
                        sbPlayer.wins++;

                        break;
                    // player disconnected
                    case 1010:
                        const roomPlayerA = this.room.getPlayerById(commandRes.playerId);
                        if (roomPlayerA) {
                            roomPlayerA.isOnline = false;
                        }
                        break;
                    // player connected
                    case 1011:
                        const roomPlayerB = this.room.getPlayerById(commandRes.playerId);
                        if (roomPlayerB) {
                            roomPlayerB.isOnline = true;
                        }
                        break;
                }
            }
        },
        async mounted() {
            try {
                await this.fetchRoom();
            } catch (e) {
            }
        },
        methods: {
            isCardAvailable(card) {
                if (this.room.game.currentRound.state === ROUND_STATE_STAKES) {
                    return true;
                }

                if (this.room.game.currentRound.moves.find(move => move.playerId === this.localPlayer.id)) {
                    return true;
                }

                return Boolean(this.availableCards.find(availableCard => availableCard.id === card.id));
            },
            onJokerMoveSubmit() {
                this.jokerMove.suit = Number(this.jokerMove.suit);
                this.jokerMove.mode = Number(this.jokerMove.mode);

                this.jokerMoveResolve();
            },
            onJokerMoveCancel() {
                this.jokerMoveReject();
            },
            getUnicodeSuit(suit) {
                return Card.getUnicodeSuit(suit);
            },
            async cardClicked(card) {
                if (this.room.game.currentRound.state !== ROUND_STATE_IN_PROGRESS) {
                    return;
                }

                let jokerMove = null;

                if (card.isJoker) {
                    try {
                        await new Promise((resolve, reject) => {
                            this.jokerMoveResolve = resolve;
                            this.jokerMoveReject = reject;

                            this.$bvModal.show('modal-joker-move');
                        });

                        this.jokerMoveResolve = null;
                        this.jokerMoveReject = null;

                        this.$bvModal.hide('modal-joker-move');

                        jokerMove = this.jokerMove;
                    } catch (e) {
                        this.jokerMoveResolve = null;
                        this.jokerMoveReject = null;

                        console.log('promise rejected');
                        return;
                    }
                }

                try {
                    const data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_MAKE_MOVE,
                        commandPayload: {
                            roomId: this.$route.params.id,
                            cardId: card.id,
                            jokerMove: jokerMove
                        }
                    });
                } catch (e) {
                    console.error(e);

                    this.$toasted.show(`Ошибка: ${e.commandRes}!`, {
                        duration: 3000,
                        type: "error"
                    });
                }
            },
            async stakeClicked(value) {
                try {
                    const data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_MAKE_STAKE,
                        commandPayload: {
                            roomId: this.$route.params.id,
                            stake: Number(value)
                        }
                    });
                } catch (e) {
                    console.error(e);

                    this.$toasted.show(`Ошибка: ${e.commandRes}!`, {
                        duration: 3000,
                        type: "error"
                    });
                }
            },
            async fetchRoom() {
                console.log(`fetching room ${this.$route.params.id}`);

                try {
                    const data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_GET_ROOM,
                        commandPayload: {
                            roomId: this.$route.params.id
                        }
                    });

                    const commandRes = data.commandRes;

                    this.saveRoomToState(commandRes);
                } catch (e) {
                    console.error(e);
                    this.$store.state.room = null;

                    this.$toasted.show(`Ошибка: ${e.commandRes}!`, {
                        duration: 3000,
                        type: "error"
                    });
                }
            },
            saveRoomToState(commandRes) {
                let room = new Room(commandRes.id, commandRes.playersNeeded, []);

                commandRes.players.forEach(function (rawPlayer) {
                    const player = new Player(rawPlayer.id, rawPlayer.name);

                    if (rawPlayer.cards) {
                        const cards = [];

                        rawPlayer.cards.forEach(function (rawCard) {
                            const card = new Card(rawCard.id, rawCard.suit, rawCard.value);

                            cards.push(card);
                        });

                        player.setCards(cards);
                    }

                    player.cardsCount = Number(rawPlayer.cardsCount || 0);

                    room.addPlayer(player);
                });

                let game = new Game();
                game.deckSize = commandRes.game.deckSize;
                game.mode = commandRes.game.mode;
                game.state = commandRes.game.state;
                game.scoreBoard = new ScoreBoard(commandRes.game.scoreBoard);

                const rawCurrentRound = commandRes.game.currentRound;
                if (rawCurrentRound) {
                    game.currentRound = new Round(
                        rawCurrentRound.number,
                        rawCurrentRound.type,
                        rawCurrentRound.cardsCount,
                        rawCurrentRound.state,
                        rawCurrentRound.awaitedPlayerId,
                        rawCurrentRound.stakes.map(rawPlayerStake => new PlayerStake(rawPlayerStake.playerId, rawPlayerStake.stake)),
                        rawCurrentRound.playerMoves ? rawCurrentRound.playerMoves.map(rawPlayerMove => {
                            const card = new Card(0, rawPlayerMove.suit, rawPlayerMove.value);

                            return new PlayerMove(rawPlayerMove.playerId, card, rawPlayerMove.jokerMove);
                        }) : []
                    );
                    if (rawCurrentRound.trump) {
                        game.currentRound.trump = new Card(0, rawCurrentRound.trump.suit, rawCurrentRound.trump.value);
                    }
                }

                room.game = game;

                this.$store.state.room = room;
            }
        }
    }
</script>

<style>
    .bounce-enter-active {
        animation: bounce-in 1s;
    }

    .bounce-leave-active {
        animation: bounce-in 1s reverse;
    }

    @keyframes bounce-in {
        0% {
            transform: scale(0);
        }
        50% {
            transform: scale(1.5);
        }
        100% {
            transform: scale(1);
        }
    }

    .room-wrapper {
        display: flex;
        justify-content: center;
    }

    #card-table {
        position: relative;
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: green;
        height: 600px;
        width: 60%;
        border: solid 6px brown;
        border-radius: 8px;
        box-shadow: #111 1px 1px 2px;
    }

    .totalScores {
        display: block;
        position: absolute;
        width: 10%;
        bottom: 5px;
        right: 5px;
        z-index: 1;
        background-color: darkorange;
    }

    .totalScores-table {
        border-spacing: 5px;
        border: 1px solid black;
        table-layout: fixed;
        width: 100%;
    }

    .totalScores-table td {
        border: 1px solid black;
        padding: 4px;
    }

    .player {
        min-width: 100px;
        margin-right: 2%;
        display: inline-block;
        background-color: greenyellow;
    }

    .awaitedPlayer {
        background-color: yellow !important;
    }

    .playerInfo {
    }

    .localPlayer {
        min-width: 100px;
        display: block;
        position: absolute;
        bottom: 10%;
        left: 50%;
        transform: translateX(-50%);
        background-color: greenyellow;
    }

    .makeStake {
        display: block;
        position: absolute;
        bottom: 40%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
        background-color: darkorange;
    }

    .makeStake .stake {
        display: inline-block;
        border-radius: 5px;
        background-color: #cccccc;
        min-width: 20px;
        cursor: pointer;
        margin-bottom: 5px;
        margin-left: 3px;
        margin-right: 3px;
    }

    .makeStake .stake:hover {
        box-shadow: 0 0 11px rgba(33, 33, 33, .2);
    }

    .moves {
        display: block;
        position: absolute;
        bottom: 40%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1;
        background-color: darkorange;
    }

    .cards {
        display: flex;
        flex-direction: row;
        justify-content: center;
    }

    .cardDeck {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 40px;
        height: 54px;
    }

    .unknownCard {
        background-image: url("~@/assets/svg/cardback_red.svg");
        background-size: cover;
        min-width: 40px;
        min-height: 54px;
        display: inline-block;
        transition: all 1s;
    }

    .unknownCard-enter, .unknownCard-leave-to {
        opacity: 0;
        transform: translateY(30px);
    }

    .unknownCard-leave-active {
        position: absolute;
    }

    .knownCard {
        display: inline-block;
        background-size: cover;
        min-width: 60px;
        min-height: 80px;
        transition: all 1s;
    }

    .knownCard.cardNotAvailable {
        box-shadow: inset 0 0 0 100vw rgba(0,0,0,0.35);
    }

    .knownCard:hover {
        box-shadow: inset 0 0 0 100vw rgba(0,0,0,0.22);
        transition-duration: 0.5s;
    }

    .knownCard-enter, .knownCard-leave-to {
        opacity: 0;
        transform: translateY(30px);
    }

    .knownCard-leave-active {
        position: absolute;
    }

    /* STRUCTURE */
    .wrapper {
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        min-height: 100%;
        padding: 20px;
    }

    .knownCard.ch2 {
        background-image: url("~@/assets/svg/h2.svg");
    }

    .knownCard.ch3 {
        background-image: url("~@/assets/svg/h3.svg");
    }

    .knownCard.ch4 {
        background-image: url("~@/assets/svg/h4.svg");
    }

    .knownCard.ch5 {
        background-image: url("~@/assets/svg/h5.svg");
    }

    .knownCard.ch6 {
        background-image: url("~@/assets/svg/h6.svg");
    }

    .knownCard.ch7 {
        background-image: url("~@/assets/svg/h7.svg");
    }

    .knownCard.ch8 {
        background-image: url("~@/assets/svg/h8.svg");
    }

    .knownCard.ch9 {
        background-image: url("~@/assets/svg/h9.svg");
    }

    .knownCard.ch10 {
        background-image: url("~@/assets/svg/h10.svg");
    }

    .knownCard.ch11 {
        background-image: url("~@/assets/svg/h11.svg");
    }

    .knownCard.ch12 {
        background-image: url("~@/assets/svg/h12.svg");
    }

    .knownCard.ch13 {
        background-image: url("~@/assets/svg/h13.svg");
    }

    .knownCard.ch14 {
        background-image: url("~@/assets/svg/h14.svg");
    }

    .knownCard.cd2 {
        background-image: url("~@/assets/svg/d2.svg");
    }

    .knownCard.cd3 {
        background-image: url("~@/assets/svg/d3.svg");
    }

    .knownCard.cd4 {
        background-image: url("~@/assets/svg/d4.svg");
    }

    .knownCard.cd5 {
        background-image: url("~@/assets/svg/d5.svg");
    }

    .knownCard.cd6 {
        background-image: url("~@/assets/svg/d6.svg");
    }

    .knownCard.cd7 {
        background-image: url("~@/assets/svg/d7.svg");
    }

    .knownCard.cd8 {
        background-image: url("~@/assets/svg/d8.svg");
    }

    .knownCard.cd9 {
        background-image: url("~@/assets/svg/d9.svg");
    }

    .knownCard.cd10 {
        background-image: url("~@/assets/svg/d10.svg");
    }

    .knownCard.cd11 {
        background-image: url("~@/assets/svg/d11.svg");
    }

    .knownCard.cd12 {
        background-image: url("~@/assets/svg/d12.svg");
    }

    .knownCard.cd13 {
        background-image: url("~@/assets/svg/d13.svg");
    }

    .knownCard.cd14 {
        background-image: url("~@/assets/svg/d14.svg");
    }

    .knownCard.cs2 {
        background-image: url("~@/assets/svg/s2.svg");
    }

    .knownCard.cs3 {
        background-image: url("~@/assets/svg/s3.svg");
    }

    .knownCard.cs4 {
        background-image: url("~@/assets/svg/s4.svg");
    }

    .knownCard.cs5 {
        background-image: url("~@/assets/svg/s5.svg");
    }

    .knownCard.cs6 {
        background-image: url("~@/assets/svg/s6.svg");
    }

    .knownCard.cs7 {
        background-image: url("~@/assets/svg/s7.svg");
    }

    .knownCard.cs8 {
        background-image: url("~@/assets/svg/s8.svg");
    }

    .knownCard.cs9 {
        background-image: url("~@/assets/svg/s9.svg");
    }

    .knownCard.cs10 {
        background-image: url("~@/assets/svg/s10.svg");
    }

    .knownCard.cs11 {
        background-image: url("~@/assets/svg/s11.svg");
    }

    .knownCard.cs12 {
        background-image: url("~@/assets/svg/s12.svg");
    }

    .knownCard.cs13 {
        background-image: url("~@/assets/svg/s13.svg");
    }

    .knownCard.cs14 {
        background-image: url("~@/assets/svg/s14.svg");
    }

    .knownCard.cc2 {
        background-image: url("~@/assets/svg/c2.svg");
    }

    .knownCard.cc3 {
        background-image: url("~@/assets/svg/c3.svg");
    }

    .knownCard.cc4 {
        background-image: url("~@/assets/svg/c4.svg");
    }

    .knownCard.cc5 {
        background-image: url("~@/assets/svg/c5.svg");
    }

    .knownCard.cc6 {
        background-image: url("~@/assets/svg/c6.svg");
    }

    .knownCard.cc7 {
        background-image: url("~@/assets/svg/c7.svg");
    }

    .knownCard.cc8 {
        background-image: url("~@/assets/svg/c8.svg");
    }

    .knownCard.cc9 {
        background-image: url("~@/assets/svg/c9.svg");
    }

    .knownCard.cc10 {
        background-image: url("~@/assets/svg/c10.svg");
    }

    .knownCard.cc11 {
        background-image: url("~@/assets/svg/c11.svg");
    }

    .knownCard.cc12 {
        background-image: url("~@/assets/svg/c12.svg");
    }

    .knownCard.cc13 {
        background-image: url("~@/assets/svg/c13.svg");
    }

    .knownCard.cc14 {
        background-image: url("~@/assets/svg/c14.svg");
    }
</style>