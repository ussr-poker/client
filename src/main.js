import Vue from 'vue'
import App from './App.vue'
import router from './router'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import ToastedPlugin from 'vue-toasted'

import store from './store'

import VueNativeSock from 'vue-native-websocket'
import {COMMAND_LOGIN} from "./client";

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app');

Vue.use(BootstrapVue);
Vue.use(ToastedPlugin);

Vue.use(VueNativeSock, 'ws://127.0.0.1:9501', {
    store: store,
    format: 'json',
    connectManually: true
});
Vue.prototype.$connect();
