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

	processedCallIds: string[];

	// callbacks
	listeningCallback: Function;
	messageCallbacks: Function[];
	outgoingMessageCallback: Function;
	errorCallback: Function;

	constructor(config: NodeConfig) {

		this.nodeConfig = config;
		if(this.nodeConfig.alwaysActiveNodes)
			this.nodes = this.nodeConfig.alwaysActiveNodes;
		else
			this.nodes = [];

		this.processedCallIds = [];

		this.listeningCallback = () => {};
		this.messageCallbacks = [];
		this.outgoingMessageCallback = () => {};
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
			try {
				this.onMessage(msg.toString(), rinfo.address, rinfo.port);
			} catch(e) {
				throw e;
				throw new Error("Error handling incoming call.");
			}
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

		this.processedCallIds.push(call.id);

		// send the call to the specified node
		this.socket.send(JSON.stringify(call), node.port, node.address);

		this.outgoingMessageCallback(call, node);
	}

	// broadcast the call to all known nodes
	public broadcastCall(call: Call) {

		this.nodes.map((node) => {

			this.sendCall(call, node);
			
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

	// send an auth call to a specific node
	sendAuth(node: Node) {

		const call: Call = new Call({
			name: "auth",
			caller: {
				id: this.nodeConfig.id,
				address: this.nodeConfig.host,
				port: this.nodeConfig.port
			},
			extra: this.nodeConfig.networkAuthentication
		});

		this.sendCall(call, node);
	}

	// call the listening callback
	onListening() {
		this.listeningCallback(this.nodeConfig);
	}

	// call the error callback
	onError(err: any) {
		this.errorCallback(err);
	}

	// do the known node list management
	handleNode(call: Call, address: string, port: number) {


		if(call.name === "auth") {

			let nodeExists: boolean = false;
			let validAuth = call.extra.name === this.nodeConfig.networkAuthentication.name &&
				call.extra.secret === this.nodeConfig.networkAuthentication.secret;

			this.nodes.map((node: Node) => {
				// find the node and update
				if(node.address == address && node.port == port) {
					nodeExists = true;
					node.lastTimeSeen = new Date();
				}

			});

			// this is the first time this node knows of the other
			if(validAuth) {

				if(!nodeExists) {

					// add to the list
					this.nodes.push({
						id: call.extra.node_id,
						address,
						port,
						authenticated: true
					});

					// send him an auth call back
					this.sendAuth({
						address,
						port
					});

				}

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

	}

	// this trusts all the nodes involved in a call chain
	// all nodes in the chain can be thrusted, and  
	// this node now knows the existence of these nodes and thrusts them
	trustChain(call: Call) {

		let currGen: Call = call;
		while(currGen.parent) {
			// if the array doesn't contain this node
			if(!this.nodes.some((node: Node) => node.id === currGen.caller.id))
				this.nodes.push({
					id: currGen.caller.id,
					address: currGen.caller.address,
					port: currGen.caller.port,
					authenticated: true
				});
			// regress to the previous generation
			currGen = currGen.parent;
		}
	}

	// every communication received is handled from here
	onMessage(msg: string, address: string, port: number) {

		const call: Call = JSON.parse(msg);

		// this will add the node to the known list, handle authentication attempts, etc.
		this.handleNode(call, address, port);


		// always handle auth calls
		if(call.name == "auth") {

			this.messageCallbacks.map((callback: Function) => {
				callback(call, {address, port});
			});

		} else {

			if(!this.processedCallIds.includes(call.id)) {

				this.processedCallIds.push(call.id);

				// only handle message if the node is authenticated
				this.nodes.map((node) => {

					if((node.address == address && node.port == port)) {

						if(node.authenticated) {

							// trust all nodes involved in the call
							this.trustChain(call);
						
							this.messageCallbacks.map((callback: Function) => {
								callback(call, {address, port});
							});

						}

					}

				});
			}
		}
	}

}