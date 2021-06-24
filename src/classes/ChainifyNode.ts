import NodeConfig from "../types/NodeConfig";
import NetworkManager from "../classes/NetworkManager";
import Call from "../classes/Call";
import { v4 as uuidv4 } from "uuid";

// this is the main class the developer interacts with

export default class ChainifyNode {

	id: string;
	config: NodeConfig; // node configuration
	networkManager: NetworkManager;

	constructor(config: NodeConfig) {

		this.id = uuidv4();
		this.config = config;
		this.networkManager = new NetworkManager(config);

	}

	public init(callback: Function) {

		// initialize all network related operations
		this.networkManager.init(callback);

	}

	// get a item from the network
	public getItem(key: string) {

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
	public setItem(key: string, value: string) {

		// create the call
		const call: Call = new Call({
			name: "set",
			extra: {
				key,
				value
			}
		});

		// broadcast the call
		this.networkManager.broadcastCall(call);
	}

	// event called when the socket starts listening
	public onListening(callback: Function) {
		this.networkManager.listeningCallback = callback;
	}

	// event called when a message is received 
	// (this is only for developer usage, all the management is underlying)
	public onMessage(callback: Function) {
		this.networkManager.messageCallback = callback;
	}

}