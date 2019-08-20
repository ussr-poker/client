<template>
    <div class="main">
        <h1>Покер расписной</h1>

        <p v-if="$store.state.socket.isConnected">Подключен к серверу</p>
        <p v-else>Не подключен к серверу</p>

        <p v-if="$store.state.user.isLoggedIn">
            Выполнен вход под: {{ $store.state.user.data.name }}
        </p>
        <p v-else>Не залогинен</p>

        <div v-if="$store.state.socket.isConnected && $store.state.user.isLoggedIn">
            <b-button v-b-modal.modal-create-room>Создать комнату</b-button>

            <b-modal id="modal-create-room" title="Создание комнаты" hide-footer>
                <b-form @submit.prevent="onCreateRoomSubmit">
                    <b-form-group id="input-group-2" label="Кол-во игроков:" label-for="players">
                        <b-form-input type="number" id="players" v-model="createRoomForm.players" required></b-form-input>
                    </b-form-group>

                    <b-form-group id="input-group-3" label="Размер колоды:" label-for="cards">
                        <b-form-input type="number" id="cards" v-model="createRoomForm.cards" required></b-form-input>
                    </b-form-group>

                    <b-button type="submit" variant="primary">Создать</b-button>
                </b-form>
            </b-modal>

            <hr>

            <b-button v-b-modal.modal-join-room>Зайти в комнату</b-button>

            <b-modal id="modal-join-room" title="Вход в комнату" hide-footer>
                <b-form @submit.prevent="onJoinRoomSubmit">
                    <b-form-group id="input-group-3" label="ID комнаты:" label-for="roomId">
                        <b-form-input type="number" id="roomId" v-model="joinRoomForm.roomId" required></b-form-input>
                    </b-form-group>

                    <b-button type="submit" variant="primary">Вход</b-button>
                </b-form>
            </b-modal>
        </div>
    </div>
</template>

<script>
    import {COMMAND_CREATE_ROOM, COMMAND_JOIN_ROOM} from "../client";

    export default {
        name: 'home',
        data() {
            return {
                createRoomForm: {
                    players: 2,
                    cards: 36
                },
                joinRoomForm: {
                    roomId: 0
                }
            }
        },
        methods: {
            async onCreateRoomSubmit() {
                let data = null;
                try {
                    data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_CREATE_ROOM,
                        commandPayload: {
                            players: this.createRoomForm.players,
                            deckSize: this.createRoomForm.cards,
                        }
                    });
                } catch (e) {
                    this.$toasted.show(`Ошибка создания комнаты: ${e.commandRes}`, {
                        duration: 3000,
                        type: "error"
                    });
                    return;
                }

                this.$toasted.show('Комната создана', {
                    duration: 3000,
                    type: "success"
                });

                this.$router.push({name: 'room', params: {id: data.commandRes.id}});
            },
            async onJoinRoomSubmit() {
                let data = null;
                try {
                    data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_JOIN_ROOM,
                        commandPayload: {
                            roomId: this.joinRoomForm.roomId
                        }
                    });
                } catch (e) {
                    this.$toasted.show(`Не получилось войти в комнату: ${e.commandRes}`, {
                        duration: 3000,
                        type: "error"
                    });
                    return;
                }

                this.$toasted.show('Успешный вход', {
                    duration: 3000,
                    type: "success"
                });

                this.$router.push({name: 'room', params: {id: this.joinRoomForm.roomId}});
            },
        }
    }
</script>
