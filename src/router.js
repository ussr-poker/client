import Vue from 'vue'
import Router from 'vue-router'

import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Registration from './views/Registration'
import Room from "./views/Room";

import store from './store'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        waitForSocket: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        waitForSocket: true
      },
      beforeEnter: function (to, from, next) {
        if (store.state.user.isLoggedIn) {
          next('/');
        } else {
          next();
        }
      }
    },
    {
      path: '/registration',
      name: 'registration',
      component: Registration,
      meta: {
        waitForSocket: true
      },
    },
    {
      path: '/room/:id',
      name: 'room',
      component: Room,
      meta: {
        waitForSocket: true
      },
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    }
  ]
})
