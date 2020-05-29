import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { SOME_MUTATION } from './mutation-types'

const store = new Vuex.Store({
	state:{
		nodelist: []
	},
	mutations:{
		setnodelist:(state, localVal) => {
			console.log(`被执行了`, localVal)
		}
	},
	actions:{}
})