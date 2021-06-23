import NodeConfig from "../types/NodeConfig";
import NetworkManager from "../classes/NetworkManager";
import Call from "../classes/Call";
import { v4 as uuidv4 } from "uuid";

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

		this.networkManager.init(callback);

	}

	// get a item from the network
	public getItem(key: string) {

	}

	// set a item in the network
	public setItem(key: string, value: string) {

		const call: Call = new Call({
			name: "set",
			caller: `${this.config.host}:${this.config.port}`,
			extra: {
				key,
				value
			}
		});

		this.networkManager.broadcastCall(call);
	}

	// callback to when the server receives a connection
	public onConnection(callback: Function) {
		this.networkManager.onConnection(callback);
	}

	// callback to when the server loses a connection
	public onConnectionClose(callback: Function) {
		this.networkManager.onConnectionClose(callback);
	}

}