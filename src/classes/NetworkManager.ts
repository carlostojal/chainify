import dgram from "dgram";
import Node from "../types/Node";
import NodeConfig from "../types/NodeConfig";
import Call from "../classes/Call";

// the network manager is responsible for all
// underlying network communication

export default class NetworkManager {

	socket: any;
	nodes: Node[];
	nodeConfig: NodeConfig;

	// callbacks
	listeningCallback: Function;
	messageCallback: Function;
	errorCallback: Function;

	constructor(config: NodeConfig) {

		this.nodeConfig = config;
		if(this.nodeConfig.alwaysActiveNodes)
			this.nodes = this.nodeConfig.alwaysActiveNodes;
		else
			this.nodes = [];

		this.listeningCallback = () => {};
		this.messageCallback = () => {};
		this.errorCallback = () => {};

	}

	public init(callback: Function) {

		// create the socket
		this.socket= dgram.createSocket("udp4");

		// socket error event
		this.socket.on("error", (err: any) => {
			this.onError(err);
		});

		// socket message event
		this.socket.on("message", (msg: any, rinfo: any) => {
			this.handleNode(rinfo.address, rinfo.port);
			this.onMessage(msg);
		});

		// socket listening event
		this.socket.on("listening", () => {
			this.onListening();
		});

		// bind socket to address and port
		this.socket.bind({
			address: this.nodeConfig.host,
			port: this.nodeConfig.port,
			exclusive: false
		});

		this.announceAlive();

		if(callback)
			callback(this.nodeConfig);
	}

	// broadcast the call to all known nodes
	public broadcastCall(call: Call) {

		this.nodes.map((node) => {

			// if(node.authenticated)
				this.socket.send(call.toString(), node.port, node.address);
			
		});
	}

	// announce that we are alive
	announceAlive() {

		const call: Call = new Call({
			name: "alive"
		});

		this.broadcastCall(call);
	}

	// call the listening callback
	onListening() {
		this.listeningCallback();
	}

	// call the error callback
	onError(err: any) {
		this.errorCallback(err);
	}

	// do the known node list management
	handleNode(address: string, port: number) {

		let nodeIsKnown: boolean = false;

		// handle remote info
		this.nodes.map((node: Node) => {
			
			if(node.address == address && node.port == port) {

				nodeIsKnown = true;

				// update node last time seen
				node.lastTimeSeen = new Date();

			}

		});

		if(!nodeIsKnown) {

			const node: Node = {
				address: address,
				port: port,
				lastTimeSeen: new Date(),
				authenticated: false
			};

			this.nodes.push(node);

		}

		// sort by descending last time seen
		this.nodes.sort((a: Node, b: Node) => {

			if(a.lastTimeSeen && b.lastTimeSeen)
				return b.lastTimeSeen.getTime() - a.lastTimeSeen.getTime();
			
			return 0;

		});

	}

	// handle the received call add call the respective callback
	onMessage(msg: string) {


		this.messageCallback(msg);
	}

}