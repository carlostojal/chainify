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

	// send the call to a specific node
	public sendCall(call: Call, node: Node) {

		// send the call to the specified node
		this.socket.send(call.toString(false, this.nodeConfig.rsaKeyPair), node.port, node.address);
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
			name: "alive",
			caller: {
				id: this.nodeConfig.id,
				address: this.nodeConfig.host,
				port: this.nodeConfig.port
			},
			extra: {
				node_id: this.nodeConfig.id,
				public_key: this.nodeConfig.rsaKeyPair.public.toString()
			}
		});

		this.broadcastCall(call);
	}

	// send an auth call to all nodes
	announceAuth() {

		const call: Call = new Call({
			name: "auth",
			caller: {
				id: this.nodeConfig.id,
				address: this.nodeConfig.host,
				port: this.nodeConfig.port
			},
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

	// do the known node list management
	handleNode(call: Call | null, address: string, port: number) {

		let nodeIsKnown: boolean = false;

		let authIsValid: boolean = false;

		// verify auth
		if(call && call.name == "auth") {

			try {
				const auth: NetworkAuthentication = call.extra;
				authIsValid = auth.name == this.nodeConfig.networkAuthentication.name &&
					auth.secret == this.nodeConfig.networkAuthentication.secret;

			} catch(e) {

			}

		}

		// handle remote info
		this.nodes.map((node: Node) => {
			
			// node was already known, only update the last time seen
			if(node.address == address && node.port == port) {

				nodeIsKnown = true;

				// update node last time seen
				node.lastTimeSeen = new Date();

				// only update the auth if the call was an auth call
				if(call && call.name == "auth")
					node.authenticated = authIsValid;

			}

		});

		// the node was not known, add it
		if(!nodeIsKnown) {

			const node: Node = {
				address: address,
				port: port,
				lastTimeSeen: new Date(),
				authenticated: authIsValid
			};

			this.nodes.push(node);

			// reply to all nodes, including the new one, with an auth call
			this.announceAuth();

		}

		// sort by descending last time seen
		// this way, when iterating the list
		// the most likely online nodes are prioritized
		this.nodes.sort((a: Node, b: Node) => {

			if(a.lastTimeSeen && b.lastTimeSeen)
				return b.lastTimeSeen.getTime() - a.lastTimeSeen.getTime();
			
			return 0;

		});

	}

	// every communication received is handled from here
	onMessage(msg: string, address: string, port: number) {

		const call: Call = JSON.parse(msg);

		// this will add the node to the known list, handle authentication attempts, etc.
		this.handleNode(call, address, port);

		// only handle messages from authenticated nodes
		this.nodes.map((node) => {

			if(node.address == address && node.port == port && node.authenticated || true) {
				this.messageCallbacks.map((callback: Function) => {
					callback(call);
				});
			}

		});

	}

}