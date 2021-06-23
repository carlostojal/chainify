import net from "net";
import Node from "../types/Node";
import NodeConfig from "../types/NodeConfig";
import Call from "../classes/Call";

export default class NetworkManager {

	client: any;
	server: any;
	nodes: Node[];
	nodeConfig: NodeConfig;

	// callbacks
	connectionCallback: Function;
	closeCallback: Function;

	constructor(config: NodeConfig) {

		this.nodeConfig = config;
		this.nodes = [];

		this.connectionCallback = () => {};
		this.closeCallback = () => {};

	}

	public init(callback: Function) {

		this.client = new net.Socket();

		if(this.nodeConfig.alwaysActiveNodes) {

			this.nodeConfig.alwaysActiveNodes.map((node) => {

				const addr = node.split(":");

				// connect to the node
				this.client.connect(addr[1], addr[0]);
				// authenticate
				const authCall: Call = new Call({
					name: "auth",
					caller: this.nodeConfig.host + ":" + this.nodeConfig.port,
					extra: this.nodeConfig.networkAuthentication
				});
				this.client.write(authCall.toString());
			});

		}

		// create the server and listen with the config provided
		this.server = net.createServer();
		this.server.listen(this.nodeConfig.port, this.nodeConfig.host);

		// when a node requests connection
		this.server.on("connection", (socket: any) => {
			const n: Node = {
				socket,
				lastTimeSeen: new Date(),
				authenticated: false
			};
			// add to the list of active nodes
			this.nodes.push(n);
			// call the connection callback defined by the developer
			this.connectionCallback(n);
		});

		// when a node closes or loses connection
		this.server.on("close", (socket: any) => {
			// remove this socket from the node list
			this.nodes.filter((node) => !node.socket.equals(socket));
			// call the callback defined by the developer
			this.closeCallback(socket);
		});


		if(callback)
			callback(this.nodeConfig);
	}

	// broadcast the call to all known nodes
	public broadcastCall(call: Call) {

		this.nodes.map((node) => {

			if(node.authenticated)
				node.socket.write(call.toString());

		});
	}

	public onConnection(callback: Function) {
		this.connectionCallback = callback;
	}

	public onConnectionClose(callback: Function) {
		this.closeCallback = callback;
	}

}