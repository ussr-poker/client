import Vue from 'vue'
import Vuex from 'vuex'
import {
    COMMAND_CREATE_ROOM, COMMAND_GET_ROOM, COMMAND_JOIN_ROOM,
    COMMAND_LOGIN, COMMAND_MAKE_MOVE, COMMAND_MAKE_STAKE, COMMAND_REGISTER
} from './client'

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        socket: {
            isConnected: false,
            message: '',
            reconnectError: false,
            reconnectTries: 0
        },
        user: {
            isLoggedIn: false,
            data: null
        },
        room: null,
        roomEvent: null,
        messages: []
    },
    mutations: {
        SOCKET_ONOPEN(state, event) {
            Vue.prototype.$socket = event.currentTarget;
            state.socket.isConnected = true;
            state.socket.reconnectTries = 0;
        },
        SOCKET_ONCLOSE(state, event) {
            state.socket.isConnected = false;
            state.user.isLoggedIn = false;

            setTimeout(function () {
                console.log('Reconnecting to server...');

                Vue.prototype.$connect();

                state.socket.reconnectTries++;
            }.bind(this), 500 * (state.socket.reconnectTries + 1));
        },
        SOCKET_ONERROR(state, event) {
            console.error(state, event);

            Vue.toasted.show(`Connection error ${event.reason}`, {
                duration: 1500,
                type: "error"
            });
        },
        // default handler called for all methods
        SOCKET_ONMESSAGE(state, message) {
            state.socket.message = message;

            if (message.commandId === undefined || message.commandRes === undefined || message.ok === undefined) {
                console.error('Malformed message', message);
                return;
            }

            const stateMessage = state.messages[message.commandId];
            state.messages[message.commandId] = null;

            switch (message.commandId) {
                // client -> server events
                case COMMAND_LOGIN:
                case COMMAND_REGISTER:
                case COMMAND_CREATE_ROOM:
                case COMMAND_JOIN_ROOM:
                case COMMAND_MAKE_STAKE:
                case COMMAND_MAKE_MOVE:
                case COMMAND_GET_ROOM:
                    console.log('Received message', message);

                    if (message.ok) {
                        stateMessage.resolve(message);
                    } else {
                        stateMessage.reject(message);
                    }
                    break;
                // server -> client events
                case 1000:
                case 1001:
                case 1002:
                case 1003:
                case 1004:
                case 1005:
                case 1006:
                case 1007:
                case 1008:
                    console.log('Received message', message);

                    state.roomEvent = message;
                    break;
                default:
                    console.error('Unknown message commandId', message);
            }
        },
        // mutations for reconnect methods
        SOCKET_RECONNECT(state, count) {
            console.info(state, count)
        },
        SOCKET_RECONNECT_ERROR(state) {
            state.socket.reconnectError = true
        },
        addMessage(state, message) {
            if (null !== state.messages[message.commandId] && undefined !== state.messages[message.commandId]) {
                throw new Error('Command already sent ' + message.commandId);
            }

            state.messages[message.commandId] = message;
        },
        setRoom(state, room) {
            state.room = room;
        },
        addPlayerToRoom(state, player) {
            for (let i = 0; i < state.room.players.length; i++) {
                if (state.room.players[i].id === player.id) {
                    return;
                }
            }

            state.room.players.push(player);
        }
    },
    actions: {
        sendMessage: function (context, data) {
            if (data.commandId === undefined || data.commandId === null) {
                throw new Error("Missing commandId")
            }

            const payload = JSON.stringify({commandId: data.commandId, commandPayload: data.commandPayload});

            if (Vue.prototype.$socket === undefined) {
                throw new Error('$socket created is not created');
            }

            if (!context.state.socket.isConnected) {
                throw new Error('$socket created is not connected');
            }

            return new Promise((resolve, reject) => {
                context.commit('addMessage', {commandId: data.commandId, resolve, reject});

                console.log('sending message', payload);
                Vue.prototype.$socket.send(payload);
            });
        }
    }
})
