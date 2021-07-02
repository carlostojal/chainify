import NodeConfig from "../types/NodeConfig";
import NetworkManager from "./NetworkManager";
import StorageManager from "./StorageManager";
import Call from "../classes/Call";
import { v4 as uuidv4 } from "uuid";

// this is the main class the developer interacts with

export default class ChainifyNode {

	config: NodeConfig; // node configuration
	networkManager: NetworkManager;
	storageManager: StorageManager;

	constructor(config: NodeConfig) {

		this.config = config;
		this.config.id = uuidv4();
		this.config.networkAuthentication.node_id = this.config.id;
		// this.config.networkAuthentication.publicKey = null; // set public key for authentication here
		this.networkManager = new NetworkManager(config);
		this.storageManager = new StorageManager();

		// add the call handle function to message callbacks
		this.networkManager.messageCallbacks.push(this.handleCall.bind(this));

	}

	public init(callback: Function) {

		// initialize all network related operations
		this.networkManager.init(callback);

	}

	// get a item from the network
	public getItem(key: string, callback: Function) {

		// create the call
		const call: Call = new Call({
			name: "get",
			extra: {
				key
			}
		});

		// broadcast the call
		this.networkManager.broadcastCall(call);
	}

	// set a item in the network
	public setItem(key: string, value: string, callback: Function) {

		// create the call
		const call: Call = new Call({
			name: "set",
			extra: {
				key,
				value
			}
		});

		// set the value on this node
		this.storageManager.set(key, value);

		// broadcast the call
		this.networkManager.broadcastCall(call);
	}

	public handleCall(call: Call) {

		switch(call.name) {
			
			case "set":
				this.storageManager.set(call.extra.key, call.extra.value);
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