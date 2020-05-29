class Bluetooth {

	constructor() {
		this.isOpenBle = false;
		this.deviceId = "";
		this.serviceId = "";
		this.writeId = "";
		this.notifyId = "";
		this.pakeagesData = [];
		this.openBluetoothAdapter();
	}

	showToast(title, time = 2000) {
		uni.showToast({
			title: title,
			icon: 'none',
			'duration': time
		});
	}

	openBluetoothAdapter() {
		return new Promise((resolve, reject) => {
			uni.openBluetoothAdapter({
				success: res => {
					this.isOpenBle = true;
					this.showToast("初始化蓝牙模块成功");
					resolve(res);
				},
				fail: err => {
					this.showToast(`初始化蓝牙模块失败` + JSON.stringify(err));
					reject(err);
				},
			});
		});

	}

	startBluetoothDevicesDiscovery() {
		if (!this.isOpenBle) {
			this.showToast(`初始化蓝牙模块失败`)
			return;
		}

		let self = this;
		uni.showLoading({
			title: '蓝牙搜索中'
		})
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				uni.startBluetoothDevicesDiscovery({
					success: res => {
						resolve(res)
					},
					fail: res => {
						self.showToast(`搜索设备失败` + JSON.stringify(err));
						reject(err);
					}
				})
			}, 300);
		});
	}

	stopBluetoothDevicesDiscovery() {
		let self = this;
		return new Promise((resolve, reject) => {
			uni.stopBluetoothDevicesDiscovery({
				success: e => {
					uni.hideLoading();
				},
				fail: e => {
					uni.hideLoading();
					self.showToast(`停止搜索蓝牙设备失败` + JSON.stringify(err));
				}
			})
		});
	}

	createBLEConnection() {
		//设备deviceId
		let deviceId = this.deviceId;
		let self = this;
		return new Promise((resolve, reject) => {
			uni.createBLEConnection({
				deviceId,
				success: (res) => {
					console.log("连接成功" + JSON.stringify(res));
					console.log(JSON.stringify(res))
					resolve(res)
				},
				fail: err => {
					console.log(`连接失败${JSON.stringify(err)}`)
					self.showToast(`连接蓝牙设备失败` + JSON.stringify(err));
					reject(err);
				}
			})
		});
	}

	//获取蓝牙设备所有服务(service)
	getBLEDeviceServices() {
		let _serviceList = [];
		let deviceId = this.deviceId;
		let self = this;
		console.log(`deviceId=${this.deviceId} 查找所有服务...`)
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				uni.getBLEDeviceServices({
					deviceId,
					success: res => {
						console.log(`设备信息 ${JSON.stringify(res)}`)
						for (let service of res.services) {
							if (service.isPrimary) {
								_serviceList.push(service);
							}
						}
						uni.hideLoading();
						console.log("_serviceList: " + JSON.stringify(_serviceList));
						resolve(_serviceList)
					},
					fail: err => {
						uni.hideLoading();
						self.showToast(`获取设备Services` + JSON.stringify(err));
						reject(err);
					},
				})
			}, 500);
		});
	}

	//获取蓝牙设备某个服务中所有特征值(characteristic)
	getBLEDeviceCharacteristics() {
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;

		let self = this;
		return new Promise((resolve, reject) => {
			uni.getBLEDeviceCharacteristics({
				deviceId,
				serviceId,
				success: res => {
					console.log(`getBLEDeviceCharacteristics: ${JSON.stringify(res)}`)
					let characteristics = res.characteristics
					self.showToast(`获取服务中所有特征值OK`);
					resolve(characteristics)
				},
				fail: err => {
					console.log(`getBLEDeviceCharacteristics: ${JSON.stringify(err)}`)
					self.showToast(`getBLEDeviceCharacteristics` + JSON.stringify(err));
					reject(err);
				}
			})
		});
	}

	//断开联链接
	closeBLEConnection() {
		let deviceId = this.deviceId;
		return new Promise((resolve,reject) => {
			uni.closeBLEConnection({
				deviceId,
				success(res) {
					console.log('close success :'+JSON.stringify(res))
					resolve(res)
				},
				fail(err) {
					reject(err)
				}
			})
		})
	}

	notifyBLECharacteristicValue(state = true) {
		let self = this
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.notifyId;
		console.log('当前信息'+JSON.stringify(this))
		console.log(`${state?'开启':'关闭'}:${this.notifyId}`)
		return new Promise((resolve, reject) => {
			uni.notifyBLECharacteristicValueChange({
				state: state, // 启用 notify 功能
				deviceId,
				serviceId,
				characteristicId,
				success(res) {
					console.log(`${self.notifyId}启用notify成功`)
					resolve("success")
				},
				fail(res) {
					console.log('notifyBLECharacteristicValueChange failed:' + res.errMsg);
					reject("error")
				}
			});
		})
	}
	
	getUint8Value(e) {
		let n = '';
		for (let a = e, i = new DataView(a), s = 0; s < i.byteLength; s++) n += String.fromCharCode(i.getUint8(s));
		return n;
	}
	
	ab2hex(buffer) {
		const hexArr = Array.prototype.map.call(
		    new Uint8Array(buffer),
		    function (bit) {
		      return ('00' + bit.toString(16)).slice(-2)
		    }
		  )
		  
		  return hexArr.join('')
	}
	
	ab2str(buf) {
		return String.fromCharCode.apply(null, new Uint8Array(buf))
	}
	
	unit8Array2str(unit8Array) {
		return String.fromCharCode.apply(null, unit8Array)
	}
	
	str2ab(str) {
		let buf = new ArrayBuffer(str.length * 2);
		const dataView = new DataView(buf)
		for(let i = 0, strLen = str.length; i < strLen; i++) {
			dataView.setUint8(i, str.charCodeAt(i))
		}
		return buf;
	}

	writeBLECharacteristicValue(buffer) {
		let self = this
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.notifyId;

		console.log(`【write】this=${JSON.stringify(this)} #### length=${buffer.byteLength} #### value=${self.ab2str(buffer)}`)
		
		return new Promise((resolve, reject) => {
			uni.writeBLECharacteristicValue({
				deviceId,
				serviceId,
				characteristicId,
				value: buffer,
				success(res) {
					console.log('writeBLECharacteristicValue success', JSON.stringify(res))
					resolve(res)
				},
				fail(err) {
					console.log(`write error:${JSON.stringify(err)}`)
					reject(err)
				}
			});			
		})
	}

	readBLECharacteristicValue() {
		let self = this
		let deviceId = this.deviceId;
		let serviceId = this.serviceId;
		let characteristicId = this.notifyId;
		console.log(`【read】this=${JSON.stringify(this)}`)
		
		return new Promise((resolve, reject) => {
			uni.readBLECharacteristicValue({
			  deviceId,
			  serviceId,
			  characteristicId,
			  success(res) {
				console.log('readBLECharacteristicValue:', JSON.stringify(res))
				resolve(res)
			  }
			})
		})
	}
	
	closeBluetoothAdapter() {
		uni.closeBluetoothAdapter({
			success: res => {
				console.log(res)
			}
		});
	}

	//若APP在之前已有搜索过某个蓝牙设备，并成功建立连接，可直接传入之前搜索获取的 deviceId 直接尝试连接该设备，无需进行搜索操作。
	reconnect() {
		(async () => {
			try {
				this.deviceId = this.deviceId || uni.getStorageSync("deviceId");
				this.serviceId = this.serviceId || uni.getStorageSync("serviceId");

				let result1 = await this.createBLEConnection();
				console.log("createBLEConnection: " + JSON.stringify(result1));

				let result2 = await this.getBLEDeviceServices();
				console.log("getBLEDeviceServices: " + JSON.stringify(result2));

				let result3 = await this.getBLEDeviceCharacteristics();
				console.log("getBLEDeviceCharacteristics: " + JSON.stringify(result3));

				// this.writeId = uni.getStorageSync("writeId");
				// this.notifyId = uni.getStorageSync("notifyId");
			} catch (err) {
				console.log("err: " + JSON.stringify(err));
			}

		})();
	}
}

export default Bluetooth;
