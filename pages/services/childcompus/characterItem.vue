<template>
	<view class="character-item" v-if="Object.keys(character).length !== 0">
		<view class="title">
			{{character.uuid}}
		</view>
		<view v-if="character.properties.notify">
			<button class="mini-btn" type="default" size="mini" v-if="!character.isOpenNotify" @tap="openNotify">开启notify</button>
			<button class="mini-btn" type="primary" size="mini" v-if="character.isOpenNotify" @tap="closeNotify">关闭notify</button>
		</view>
	</view>
</template>

<script>
	
	import Bluetooth from '@/common/bluetooth/bluetooth.js'
	import Equipment from '@/common/bluetooth/equipment.js'
	let bluetooth = new Bluetooth();
	
	export default {
		name: 'CharacterItem',
		props: {
			character: {
				type: Object,
				default() {
					return {}
				}
			},
			deviceId: String,
			serviceId: String
		},
		data() {
			return {
				characteritem: {},
				responseText: '',
				responseInfoArray: [],
				showEquipmentBox: false,
				resArray: [],
				equipmentInfo: new Equipment()
			}
		},
		mounted() {
			this.characteritem = this.character;
			bluetooth.deviceId = this.deviceId;
			bluetooth.serviceId = this.serviceId;
		},
		methods: {
			async openNotify(e) {
				let self = this;
				//console.log("开启服务:" + this.characteritem.uuid)
				bluetooth.notifyId = this.characteritem.uuid;
				
				let info = await bluetooth.notifyBLECharacteristicValue();
				uni.showToast({
					title: info,
					icon: 'success',
					duration: 1000
				})
				self.onBLECharacteristicValueChange();
				self.characteritem['isOpenNotify'] = true;
				self.showEquipmentBox = true;
			
				//this.$emit("openNotify", this.characteritem.uuid)
			},
			onBLECharacteristicValueChange() {
				let self = this
				console.log(`${bluetooth.notifyId} 开启监听...`)
				uni.onBLECharacteristicValueChange(function(e) {
					console.log('onBLECharacteristicValueChange: '+JSON.stringify(e));
					
					if (e.characteristicId.indexOf('D3D9') > -1) { //数据消息推送
						let response = bluetooth.ab2hex(e.value)
						let resCode = response.toUpperCase()
						let bcode = resCode.substring(0,4);
						if(bcode == "0200") {
							//获取到的事包数据
							let protocl = resCode.substring(4,8);
							let originalStr = bluetooth.unit8Array2str(new Uint8Array(e.value).slice(4))
							if(protocl.toLowerCase() == 'ffff') {
								let dr = bluetooth.pakeagesData.join('') + originalStr
								let result = JSON.parse(dr);
								bluetooth.pakeagesData = [];
								self.$emit('showNodeList', result)
							} else {
								bluetooth.pakeagesData.push(originalStr)
							}
						} else if(bcode == "0100") {
							let protocl = resCode.substring(4,8);
							let originalStr = bluetooth.unit8Array2str(new Uint8Array(e.value).slice(4))
							if(protocl.toLowerCase() == 'ffff') {
								let dr = originalStr
								let result = JSON.parse(dr);
								console.log(JSON.stringify(result))
								self.$emit('findnodelist', result)
							}
						}
					} else if (e.characteristicId.indexOf('6950') > -1) { // 命令端回复
						
					}
				});
			},
			
			closeNotify() {
				let self = this;
				bluetooth.notifyBLECharacteristicValue(false).then(res => {
					uni.showToast({
						title: '关闭成功',
						icon: 'success',
						duration: 1000
					})
					
					self.characteritem['isOpenNotify'] = false;
				})
			},
			addnode() {
				let str = {"cmd": 2,"address": "68:0a:e2:ef:41:03", "action": 65}
				let buffer = bluetooth.str2ab(JSON.stringify(str));
				bluetooth.writeBLECharacteristicValue(buffer);
			},
		}
	}
</script>

<style scoped>
	.show-text {
		width: 100%;
		text-overflow: ellipsis;
		white-space: normal;
		overflow: hidden;
	}
	.uni-common-mt {
		margin: 10rpx 0;
	}
	.uni-form-item {
		margin-bottom: 10rpx;
	}
	.uni-input {
		border: 1px solid #222;
		line-height: 48rpx;
		background-color: #FFFFFF;
	}
</style>
