<template>
    <div id="scoreboard">
        <table class="scoreboard-table">
            <tr>
                <td></td>
                <td colspan="2" v-for="player in room.players">{{ player.name }}</td>
            </tr>
            <tr>
                <td></td>
                <template v-for="player in room.players">
                    <td>Взятки</td>
                    <td>Очки</td>
                </template>
            </tr>
            <tr v-for="entry in room.game.scoreBoard.entries">
                <td>{{ getRoundName(entry) }}</td>
                <template v-for="player in room.players">
                    <td>{{ scoreBoard[entry.round.number][player.id].stake }} / {{ scoreBoard[entry.round.number][player.id].wins }}
                    </td>
                    <td>{{ scoreBoard[entry.round.number][player.id].score }}</td>
                </template>
            </tr>
        </table>
    </div>
</template>

<script>
    export default {
        computed: {
            room() {
                return this.$store.state.room;
            },
            scoreBoard() {
                const scoreBoardEntries = this.room.game.scoreBoard.entries;

                let result = [];

                scoreBoardEntries.forEach(function (entry) {
                    result[entry.round.number] = [];

                    entry.players.forEach(function (player) {
                        result[entry.round.number][player.id] = player;
                    });
                });

                return result;
            },
        },
        methods: {
            getRoundName(entry) {
                switch (entry.round.type) {
                    case 0:
                        return String(entry.round.cardsCount);
                    case 1:
                        return 'Т';
                    case 2:
                        return 'Б';
                    case 3:
                        return 'З';
                    case 4:
                        return 'М';
                    default:
                        return '?';
                }
            },
        }
    };
</script>

<style>
    #scoreboard {
        display: flex;
        align-self: flex-end;
        flex-direction: row;
        margin-bottom: auto;
        margin-left: 5px;
        margin-top: 5px;
        max-height: 500px;
    }

    .scoreboard-table {
        border-spacing: 5px;
        border: 1px solid black;
    }

    .scoreboard-table td {
        border: 1px solid black;
        padding: 4px;
    }
</style>