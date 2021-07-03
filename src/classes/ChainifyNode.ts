import NodeConfig from "../types/NodeConfig";
import NetworkManager from "./NetworkManager";
import StorageManager from "./StorageManager";
import WaitingCallback from "../types/WaitingCallback";
import Call from "../classes/Call";
import { v4 as uuidv4 } from "uuid";

// this is the main class the developer interacts with

export default class ChainifyNode {

	config: NodeConfig; // node configuration
	networkManager: NetworkManager;
	storageManager: StorageManager;
	waitingCallbacks: WaitingCallback[];

	constructor(config: NodeConfig) {

		this.config = config;
		this.config.id = uuidv4();
		this.config.networkAuthentication.node_id = this.config.id;
		// this.config.networkAuthentication.publicKey = null; // set public key for authentication here
		this.networkManager = new NetworkManager(config);
		this.storageManager = new StorageManager();

		// add the call handle function to message callbacks
		this.networkManager.messageCallbacks.push(this.handleCall.bind(this));

		this.waitingCallbacks = [];

	}

	public init(callback: Function) {

		// initialize all network related operations
		this.networkManager.init(callback);

	}

	// get a item from the network
	public getItem(key: string, callback: Function) {

		// search on local storage values
		const localValue = this.storageManager.get(key);
		if(localValue)
			return callback(localValue);

		// create the call
		const call: Call = new Call({
			name: "get",
			caller: {
				id: this.config.id,
				address: this.config.host,
				port: this.config.port
			},
			extra: {
				key
			}
		});

		// broadcast the call
		this.networkManager.broadcastCall(call);

		// add this call to the waiting calls
		this.waitingCallbacks.push({
			callId: call.id,
			callback
		});
		
	}

	// set a item in the network
	public setItem(key: string, value: string) {

		// create the call
		const call: Call = new Call({
			name: "set",
			caller: {
				id: this.config.id,
				address: this.config.host,
				port: this.config.port
			},
			extra: {
				key,
				value
			}
		});

		// set the value on this node
		// this.storageManager.set(key, value);

		// broadcast the call
		this.networkManager.broadcastCall(call);
	}

	public handleCall(call: Call) {

		switch(call.name) {

			case "get":

				const data: any = this.storageManager.get(call.extra.key);

				// if the data was found, reply with it
				if(data) {

					const newCall: Call = new Call({
						name: "set",
						parent: call,
						caller: {
							id: this.config.id,
							address: this.config.host,
							port: this.config.port
						},
						extra: {
							key: call.extra.key,
							value: data
						}
					});

					// broadcast the call to all known nodes, to optimize the network data retrieval chance and speed
					this.networkManager.broadcastCall(newCall);

					// iterate call generations and reply to the oldest (the one that started the call chain)
					let currGen: any = call;
					while(currGen.parent)
						currGen = currGen.parent;

					this.networkManager.sendCall(newCall, currGen.caller);

				} else {

					// if it wasn't, try to get it

					const newCall: Call = new Call({
						name: "get",
						parent: call,
						caller: {
							id: this.config.id,
							address: this.config.host,
							port: this.config.port
						},
						extra: {
							key: call.extra.key
						}
					});

					this.networkManager.broadcastCall(newCall);
				}
				break;
			
			case "set":

				this.storageManager.set(call.extra.key, call.extra.value);

				// find if a call was waiting for this response
				// for exemple, a get call expects a set call back
				this.waitingCallbacks.map((waitingCall, index) => {

					this.waitingCallbacks.splice(index, 1);

					if(waitingCall.callId == call.parent?.id)
						waitingCall.callback(call.extra.value);
				});
				break;
		}
	}

	// event called when the socket starts listening
	public onListening(callback: Function) {
		this.networkManager.listeningCallback = callback;
	}

	// event called when a message is received 
	// (this is only for developer usage, all the management is underlying)
	public onCall(callback: Function) {
		this.networkManager.messageCallbacks.push(callback);
	}

}