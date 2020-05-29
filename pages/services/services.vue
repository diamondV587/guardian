<template>
	<view class="container">
		<uni-collapse @change="change">
			<uni-collapse-item v-for="(item, index) in serviceList" :key="item.uuid" :title="'uuid:'+item.uuid" thumb="https://img-cdn-qiniu.dcloud.net.cn/new-page/uni.png">
				<view style="padding: 30rpx;">
					<template v-for="(character, character_index) in characteristics">
						<character-item
							:key="character.uuid"
							:character="character" 
							:device-id="deviceid" 
							:service-id="item.uuid" 
							@openNotify="openNotify"
							@showNodeList="showNodeList"
							@findnodelist="findnodelist">
						</character-item>
					</template>
				</view>
			</uni-collapse-item>
		</uni-collapse>
		<view class="tabs" v-if="showTabs">
			<navTab ref="navTab" :tabTitle="tabTitle" @changeTab='changeTab'></navTab>
			<template v-if="currentTab == 0">
				<view v-for="(finditem, findex) in findlist"> {{ finditem.node }} - {{finditem.rssi}}</view>
			</template>
			<template v-if="currentTab == 1">
				<scroll-view class="node-view" v-if="nodelist.length !== 0">
					<view class="node-item" v-for="(nodeitem, index) in nodelist" :key="index">
						<view class="node-left-item">
							<view class="name">
								<text>name:</text>{{nodeitem.name}}
							</view>
							<view class="address">
								<text>address:</text>{{nodeitem.address}}
							</view>
						</view>
						<view class="node-right-item">
							<button type="default" size="mini">添加节点</button>
						</view>
					</view>
				</scroll-view>
			</template>
		</view>
		<view class="button-sp-area">
			<button class="mini-btn" type="primary" size="mini" @click="hideTabMoal">显示服务</button>
			<button class="mini-btn" type="primary" size="mini" @click="getNodeInfo">获取设备列表</button>
		</view>
	</view>
</template>

<script>
	import Bluetooth from '@/common/bluetooth/bluetooth.js'
	let bluetooth = new Bluetooth();
	
	import uniCollapse from '@/components/uni-collapse/uni-collapse.vue'
	import uniCollapseItem from '@/components/uni-collapse-item/uni-collapse-item.vue';
	import characterItem from './childcompus/characterItem.vue'
	import navTab from '@/components/common/navTab.vue'
	
	export default {
		data() {
			return {
				deviceid: '',
				serviceList: [],
				characteristics:[],
				responseText:'',
				findlist: [],
				nodelist:[],
				listen: false,
				showTabs: false,
				currentTab: 0,
				tabTitle:['搜索信息','节点列表']
			}
		},
		components: {
			uniCollapse,
			uniCollapseItem,
			characterItem,
			navTab 
		},
		async onLoad(option) {
			this.deviceid = option.deviceId;
			bluetooth.deviceId = option.deviceId;
			
			uni.setStorageSync('deviceId', bluetooth.deviceId);
			this.serviceList = [];
			
			try {
				//2.寻找服务
				let result2 = await bluetooth.getBLEDeviceServices();
			
				console.log("获取服务: " + JSON.stringify(result2));
				this.serviceList = result2;
			} catch (e) {
				console.log("e: " + JSON.stringify(e));
			}
		},
		methods: {
			changeTab(index){
				this.currentTab = index;
			},
			swiperChange() {
				
			},
			async change(index) {
				bluetooth.serviceId = this.serviceList[index].uuid;
				uni.setStorageSync('serviceId', this.serviceList[index].uuid);
				try {
					let result = await bluetooth.getBLEDeviceCharacteristics();
					result.forEach(item => {
						console.log(`【${item.uuid}】propoties:${JSON.stringify(item.properties)}`)
						item['isOpenNotify'] = false
					})
					this.characteristics = result;
				} catch (e) {
					//TODO handle the exception
				}
			},
			openNotify(uuid) {
				let self = this;
				console.log("开启服务"+uuid)
				bluetooth.notifyId = uuid;
			},
			onBLECharacteristicValueChange() {
				let self = this
				uni.onBLECharacteristicValueChange(function(e) {
					console.log('msg3:'+ bluetooth.ab2str(e.value))
					self.responseText += bluetooth.ab2str(e.value);
					self.responseArray.push(bluetooth.ab2str(e.value))
				});
				
				self.listen = true;
			},
			closeNotify() {
				uni.showToast({
					title: '无法关闭',
					icon: 'none',
					duration: 1000
				})
			},
			writeBLECharacteristicValue() {
				//const buffer = new ArrayBuffer(1)
				//const dataView = new DataView(buffer)
				//dataView.setUint8(0, 0)

			},
			
			async printbuff(buffer) {
				let result = await bluetooth.writeBLECharacteristicValue(buffer);
				bluetooth.readBLECharacteristicValue()
			},
			
			addNode() {
				let str = {"cmd": 2,"address": "68:0a:e2:ef:41:03", "action": 65}
				bluetooth.notifyId = 'CA5FD304-960D-4634-ADF2-A81C45A7D3D9'
				let buffer = bluetooth.str2ab(JSON.stringify(str));
				this.printbuff(buffer)
			},
			
			showTabMoal() {
				this.showTabs = true;
			},
			
			hideTabMoal() {
				this.showTabs = false;
			},
			
			deleteNode() {
				let str = {"cmd": 2,"address": "68:0a:e2:ef:41:03", "action": 65}
				bluetooth.notifyId = '78725B2A-8A17-408F-B634-50F2BA726950'
				let buffer = bluetooth.str2ab(JSON.stringify(str));
			
				this.printbuff(buffer)
			},
			
			getNodeInfo() {
				const str = {"cmd": 8,"address": "dd:dd:dd:dd:dd:dd"};
				bluetooth.notifyId = '78725B2A-8A17-408F-B634-50F2BA726950';
				let buffer = bluetooth.str2ab(JSON.stringify(str));
				
				this.printbuff(buffer)
			},
			showNodeList (list) {
				this.nodelist = list;
				this.showTabMoal()
			},
			addEquipment(response) {
				let result = true;
				
			},
			findnodelist (result) {
				if(!this.nodelist.some(item => {
					return item.address == result.node
				})) {
					let index = this.findlist.findIndex(item => item.node == result.node);
					if(index == -1) {
						this.findlist.push(result)
					} else {
						this.findlist.splice(index,1,result);
					}
				} 
			}
		}
	}
</script>

<style>
	.character-item {
		display: block;
		font-size: 20rpx;
		line-height: 50rpx;
		width: 95%;
		background-color: #4CD964;
		border: 1px solid #000000;
		margin: 20rpx auto;
		padding: 20rpx;
	}
	
	.resule-box {
		width: 98%;
		margin: 20rpx auto;
		min-height: 200rpx;
		border: 1px solid #C0C0C0;
	}
	
	.button-sp-area {
		position: fixed;
		display: flex;
		bottom: 0;
		width: 100%;
		left: 0;
		right: 0;
		padding: 20rpx 0;
		z-index: 9;
	}
	
	.scroll-view_H {
		max-height: 400rpx;
	}
	.node-view {
		display: block;
		width: 100%;
		min-height: 400rpx;
	}
	.tabs {
		position: absolute;
		top: 0;
		width: 100%;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9;
		background-color: #F0F0F0;
	}
</style>
