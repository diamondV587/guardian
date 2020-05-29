<template>
	<view class="container">
		<view class="handle-wrapper">
			<view class="left-wrapper">
				<button class="mini-btn" type="primary" size="mini" @tap="startBluetoothDeviceDiscovery">搜索附近设备</button>
			</view>
			<view class="right-wrapper">
				<button class="mini-btn" type="warn" size="mini" @tap="stopBluetoothDeviceDiscovery">停止搜索</button>
			</view>
		</view>
		
		<scroll-view class="result-wrapper">
			<view class="result-item">
				<view class="device_item" v-for="(item, index) in scrollList" :key="item.deviceId">
					<view class="item-left-wrapper">
						<view class="item-cell">
							<label class="title">信号强度:</label>{{item.RSSI}}dbm ({{Math.max(100+item.RSSI,0)}})
						</view>
						<view class="item-cell">
							<label class="title">deviceId:</label> {{item.deviceId}}
						</view>
						<view class="item-cell">
							<label class="title">localName:</label> {{item.localName}}
						</view>
						<view class="item-cell">
							<label class="title">Service数量:</label>{{item.advertisServiceUUIDs ? (item.advertisServiceUUIDs.length || 0) : 0}}
						</view>
					</view>
					<view class="item-right-wrapper">
						<button class="mini-btn" type="primary" size="mini" :data-deviceid="item.deviceId" v-if="deviceId != item.deviceId" @tap="toServicesList">连接蓝牙</button>
						<button class="mini-btn" type="warn" size="mini" v-else @tap="closeServices">断开蓝牙</button>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import Bluetooth from '@/common/bluetooth/bluetooth.js'
	
	let bluetooth = new Bluetooth();
	
	export default {
		data() {
			return {
				isOpenBle: false, //是否已经打开蓝牙，默认为false
				devicesList: [], //设备列表
				deviceId: ''
			}
		},
		//页面卸载是关闭蓝牙链接
		onUnload() {
			bluetooth.closeBLEConnection();
			bluetooth.closeBluetoothAdapter();
		},
		onLoad() {
			console.log('初始化蓝牙模块')
			
			uni.getLocation({
				type: 'wgs84',
				success: function(res) {
					console.log('当前位置的经度：' + res.longitude);
					console.log('当前位置的纬度：' + res.latitude);
				}
			});
			
			bluetooth.openBluetoothAdapter();
		},
		computed: {
			scrollList() {
				return this.devicesList.filter(item => item.name.length > 0)
			}
		},
		methods: {
			showToast(msg) {
				uni.showToast({
					title: msg,
					icon: 'none',
					duration: 1000
				})
			},
			closeServices() {
				let self = this
				bluetooth.closeBLEConnection().then(res=>{
					console.log('close')
					bluetooth.deviceId = "";
					self.deviceId = "";
				})
			},
			startBluetoothDeviceDiscovery() {
				uni.showLoading({
					title:'设备搜索中...'
				})
				
				let self = this;
				self.devicesList = [];
				
				setTimeout(() => {
					uni.startBluetoothDevicesDiscovery({
						success: res => {
							uni.onBluetoothDeviceFound(devices => {
								console.log('发现设备：'+ JSON.stringify(devices))
								// 过滤重复的数据
								if(!self.devicesList.some(item => {
									return item.deviceId === devices.devices[0].deviceId
								})) {
									self.devicesList.push(devices.devices[0])
								}
							})
						},
						fail: res => {
							uni.hideLoading();
							self.showToast('搜索失败')
						}
					})
				}, 500)
			},
			stopBluetoothDeviceDiscovery() {
				uni.hideLoading();
				console.log('停止搜索设备')
				bluetooth.stopBluetoothDevicesDiscovery();
			},
			async toServicesList(e) {
				let self = this
				self.stopBluetoothDeviceDiscovery()
				console.log(e.currentTarget.dataset.deviceid)
				
				uni.showLoading({
					mask: true,
					title: '设别连接中,请稍候...'
				})
				
				if(e.currentTarget.dataset.deviceid) {
					try{
						//1.链接设备
						self.deviceId = e.currentTarget.dataset.deviceid;
						bluetooth.deviceId = e.currentTarget.dataset.deviceid;
						
						let result = await bluetooth.createBLEConnection();
						uni.onBLEConnectionStateChange(function (res) {
						  // 该方法回调中可以用于处理连接意外断开等异常情况
						  console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
						  //self.showToast(res.connected?'连接成功':'连接断开')
						  
						  if(!res.connected) { bluetooth.createBLEConnection(); }
						})
						
						setTimeout(() => {
							uni.hideLoading();
							uni.navigateTo({
								url: '../services/services?deviceId=' + e.currentTarget.dataset.deviceid
							})
						},1500)
						
					} catch(err) {
						console.log(`error: ${JSON.stringify(err)}`)
					}
				}
			}
		}
	}
</script>

<style>
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}
	.handle-wrapper {
		display: flex;
		width: 100%;
		line-height: 40rpx;
	}
	.left-wrapper,.right-wrapper {
		flex: 1;
		text-align: center;
		margin: 0 auto;
	}
	.result-wrapper {
		position: absolute;
		top: 150rpx;
		left: 2%;
		width: 95%;
		margin: auto;
		bottom: 5rpx;
		border: 1px solid #C0C0C0;
		border-radius: 5rpx;
	}
	.device_item {
		display: flex;
		width: 90%;
		margin: 20rpx auto;
		padding: 10rpx;
		border: 1px solid #007AFF;
	}
	.item-left-wrapper {
		flex: 1;
	}
	.item-right-wrapper {
		width: 200rpx;
		line-height: 120rpx;
	}
	.item-cell {
		display: block;
		line-height: 30rpx;
		font-size: 20rpx;
		margin-bottom: 5rpx;
	}
	.item-cell .title {
		color: #DD524D;
	}
</style>
