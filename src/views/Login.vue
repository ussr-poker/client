<template>
    <div class="login">
        <div class="wrapper fadeInDown">
            <div id="formContent">
                <div v-if="isLoggingIn" class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>

                <form autocomplete="off" @submit.prevent="loginSubmit">
                    <input v-model="login" type="text" id="login" class="fadeIn second" name="login" placeholder="Логин">
                    <input v-model="password" type="text" id="password" class="fadeIn third" name="login" placeholder="Пароль">
                    <input type="submit" class="fadeIn fourth" value="Войти">
                </form>
            </div>
        </div>
    </div>
</template>

<script>
    import {COMMAND_LOGIN} from "../client";

    export default {
        name: 'login',
        data() {
            return {
                login: '',
                password: '',
                isLoggingIn: false
            }
        },
        methods: {
            async loginSubmit() {
                this.isLoggingIn = true;

                try {
                    const data = await this.$store.dispatch('sendMessage', {
                        commandId: COMMAND_LOGIN,
                        commandPayload: {
                            username: this.login,
                            password: this.password
                        }
                    });

                    this.$store.state.user.isLoggedIn = true;
                    this.$store.state.user.data = data.commandRes;

                    localStorage.setItem('credentials', JSON.stringify({login: this.login, password: this.password}));

                    this.$toasted.show(`Привет ${this.$store.state.user.data.name}!`, {
                        duration: 3000,
                        type: "success"
                    });

                    this.$router.push({name: 'home'});
                } catch (e) {
                    this.$toasted.show(`Ошибка входа: ${e.commandRes}!`, {
                        duration: 3000,
                        type: "error"
                    });
                } finally {
                    this.isLoggingIn = false;
                }
            }
        }
    }
</script>

<style scoped>
    .login {
        /*margin-top: 20px;*/
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

    #formContent {
        -webkit-border-radius: 10px 10px 10px 10px;
        border-radius: 10px 10px 10px 10px;
        background: #fff;
        padding: 30px;
        width: 90%;
        max-width: 450px;
        position: relative;
        -webkit-box-shadow: 0 30px 60px 0 rgba(0, 0, 0, 0.3);
        box-shadow: 0 30px 60px 0 rgba(0, 0, 0, 0.3);
        text-align: center;
    }

    /* FORM TYPOGRAPHY*/
    input[type=button], input[type=submit], input[type=reset] {
        background-color: #56baed;
        border: none;
        color: white;
        padding: 15px 80px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        text-transform: uppercase;
        font-size: 13px;
        -webkit-box-shadow: 0 10px 30px 0 rgba(95, 186, 233, 0.4);
        box-shadow: 0 10px 30px 0 rgba(95, 186, 233, 0.4);
        -webkit-border-radius: 5px 5px 5px 5px;
        border-radius: 5px 5px 5px 5px;
        margin: 5px 20px 5px 20px;
        -webkit-transition: all 0.3s ease-in-out;
        -moz-transition: all 0.3s ease-in-out;
        -ms-transition: all 0.3s ease-in-out;
        -o-transition: all 0.3s ease-in-out;
        transition: all 0.3s ease-in-out;
    }

    input[type=button]:hover, input[type=submit]:hover, input[type=reset]:hover {
        background-color: #39ace7;
    }

    input[type=button]:active, input[type=submit]:active, input[type=reset]:active {
        -moz-transform: scale(0.95);
        -webkit-transform: scale(0.95);
        -o-transform: scale(0.95);
        -ms-transform: scale(0.95);
        transform: scale(0.95);
    }

    input[type=text] {
        background-color: #f6f6f6;
        border: none;
        color: #0d0d0d;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 5px;
        width: 85%;
        border: 2px solid #f6f6f6;
        -webkit-transition: all 0.5s ease-in-out;
        -moz-transition: all 0.5s ease-in-out;
        -ms-transition: all 0.5s ease-in-out;
        -o-transition: all 0.5s ease-in-out;
        transition: all 0.5s ease-in-out;
        -webkit-border-radius: 5px 5px 5px 5px;
        border-radius: 5px 5px 5px 5px;
    }

    input[type=text]:focus {
        background-color: #fff;
        border-bottom: 2px solid #5fbae9;
    }

    input[type=text]:placeholder {
        color: #cccccc;
    }

    /* ANIMATIONS */

    /* Simple CSS3 Fade-in-down Animation */
    .fadeInDown {
        -webkit-animation-name: fadeInDown;
        animation-name: fadeInDown;
        -webkit-animation-duration: 300ms;
        animation-duration: 300ms;
        -webkit-animation-fill-mode: both;
        animation-fill-mode: both;
    }

    @-webkit-keyframes fadeInDown {
        0% {
            opacity: 0;
            -webkit-transform: translate3d(0, -100%, 0);
            transform: translate3d(0, -100%, 0);
        }
        100% {
            opacity: 1;
            -webkit-transform: none;
            transform: none;
        }
    }

    @keyframes fadeInDown {
        0% {
            opacity: 0;
            -webkit-transform: translate3d(0, -100%, 0);
            transform: translate3d(0, -100%, 0);
        }
        100% {
            opacity: 1;
            -webkit-transform: none;
            transform: none;
        }
    }

    /* Simple CSS3 Fade-in Animation */
    @-webkit-keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @-moz-keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .fadeIn {
        opacity: 0;
        -webkit-animation: fadeIn ease-in 1;
        -moz-animation: fadeIn ease-in 1;
        animation: fadeIn ease-in 1;

        -webkit-animation-fill-mode: forwards;
        -moz-animation-fill-mode: forwards;
        animation-fill-mode: forwards;

        -webkit-animation-duration: 300ms;
        -moz-animation-duration: 300ms;
        animation-duration: 300ms;
    }

    .fadeIn.second {
        -webkit-animation-delay: 100ms;
        -moz-animation-delay: 100ms;
        animation-delay: 100ms;
    }

    .fadeIn.third {
        -webkit-animation-delay: 100ms;
        -moz-animation-delay: 100ms;
        animation-delay: 100ms;
    }

    .fadeIn.fourth {
        -webkit-animation-delay: 100ms;
        -moz-animation-delay: 100ms;
        animation-delay: 100ms;
    }

    /* OTHERS */
    *:focus {
        outline: none;
    }
</style>
