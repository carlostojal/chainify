import dgram from "dgram";
import Node from "../types/Node";
import NodeConfig from "../types/NodeConfig";
import NetworkAuthentication from "../types/NetworkAuthentication";
import Call from "../classes/Call";

// the network manager is responsible for all
// underlying network communication

export default class NetworkManager {

	socket: any;
	nodes: Node[];
	nodeConfig: NodeConfig;

	// callbacks
	listeningCallback: Function;
	messageCallbacks: Function[];
	errorCallback: Function;

	constructor(config: NodeConfig) {

		this.nodeConfig = config;
		if(this.nodeConfig.alwaysActiveNodes)
			this.nodes = this.nodeConfig.alwaysActiveNodes;
		else
			this.nodes = [];

		this.listeningCallback = () => {};
		this.messageCallbacks = [];
		this.errorCallback = () => {};

	}

	public init(callback: Function) {

		// create the socket
		this.socket = dgram.createSocket("udp4");

		// socket error event
		this.socket.on("error", (err: any) => {
			this.onError(err);
		});

		// socket message event
		this.socket.on("message", (msg: any, rinfo: any) => {
			this.onMessage(msg.toString(), rinfo.address, rinfo.port);
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

		this.announceAuth();

		if(callback)
			callback(this.nodeConfig);
	}

	// broadcast the call to all known nodes
	public broadcastCall(call: Call) {

		this.nodes.map((node) => {

			if(call.name == "auth" || node.authenticated)
				this.socket.send(call.toString(false, this.nodeConfig.rsaKeyPair), node.port, node.address);
			
		});
	}

	// announce that we are alive
	announceAlive() {

		const call: Call = new Call({
			name: "alive"
		});

		this.broadcastCall(call);
	}

	// send an auth call to all nodes
	announceAuth() {

		const call: Call = new Call({
			name: "auth",
			extra: this.nodeConfig.networkAuthentication
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

	// TODO: FIX AUTHENTICATION OVERWRITES AND CLEAN CODE
	// do the known node list management
	handleNode(call: Call, address: string, port: number) {

		let nodeIsKnown: boolean = false;

		let isAuthAndVerified = false;
		if(call.name == "auth") {

			try {
				const auth: NetworkAuthentication = call.extra;
				isAuthAndVerified = call.name == "auth" &&
					auth.name == this.nodeConfig.networkAuthentication.name &&
					auth.secret == this.nodeConfig.networkAuthentication.secret;

			} catch(e) {

			}

		}
			
		// handle remote info
		this.nodes.map((node: Node) => {
			
			if(node.address == address && node.port == port) {

				nodeIsKnown = true;

				// update node last time seen
				node.lastTimeSeen = new Date();
				node.authenticated = isAuthAndVerified;

			}

		});

		if(!nodeIsKnown) {

			const node: Node = {
				address: address,
				port: port,
				lastTimeSeen: new Date(),
				authenticated: isAuthAndVerified
			};

			this.nodes.push(node);

			// reply to the new node with an auth call
			this.announceAuth();

		}

		// sort by descending last time seen
		this.nodes.sort((a: Node, b: Node) => {

			if(a.lastTimeSeen && b.lastTimeSeen)
				return b.lastTimeSeen.getTime() - a.lastTimeSeen.getTime();
			
			return 0;

		});

	}

	onMessage(msg: string, address: string, port: number) {

		const call: Call = JSON.parse(msg);

		this.handleNode(call, address, port);

		console.log(this.nodes);

		this.nodes.map((node) => {

			if(node.address == address && node.port == port && node.authenticated || true) {
				this.messageCallbacks.map((callback: Function) => {
					callback(call);
				});
			}

		});

	}

}