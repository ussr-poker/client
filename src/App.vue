<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Главная</router-link>
            <router-link v-if="!$store.state.user.isLoggedIn" to="/login">Вход</router-link>
            <router-link v-if="!$store.state.user.isLoggedIn" to="/registration">Регистрация</router-link>
            <router-link to="/about">Об игре</router-link>
        </div>
        <div v-if="waitForSocketNeeded">
            <router-view v-if="isSocketConnected"></router-view>
            <div v-else>
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                Connecting to server... Try: {{ $store.state.socket.reconnectTries + 1 }}
            </div>
        </div>
        <div v-else>
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
    import {COMMAND_LOGIN} from "./client";

    export default {
        computed: {
            isSocketConnected: function () {
                return this.$store.state.socket.isConnected;
            },
            waitForSocketNeeded: function () {
                return Boolean(this.$route.meta.waitForSocket);
            },
        },
        watch: {
            isSocketConnected: async function (newValue, oldValue) {
                if (newValue && !this.$store.state.user.isLoggedIn) {
                    async function autoLogin() {
                        let credentials = null;
                        try {
                            credentials = JSON.parse(localStorage.getItem('credentials'));
                        } catch (e) {
                            return;
                        }

                        if (!credentials.login || !credentials.password) {
                            return;
                        }

                        console.log('Trying to auto login');

                        try {
                            const data = await this.$store.dispatch('sendMessage', {
                                commandId: COMMAND_LOGIN,
                                commandPayload: {
                                    username: credentials.login,
                                    password: credentials.password
                                }
                            });

                            this.$store.state.user.isLoggedIn = true;
                            this.$store.state.user.data = data.commandRes;
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    await autoLogin.bind(this)();
                }
            }
        }
    };
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 20px;
    }

    #nav a {
        margin-right: 20px;
    }
</style>
