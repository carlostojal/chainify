import NetworkAuthentication from "../types/NetworkAuthentication";
import KeyPair from "../types/KeyPair";
import Node from "../types/Node";

export default interface NodeConfig {

	networkAuthentication: NetworkAuthentication,
	rsaKeyPair: KeyPair,
	host: string,
	port: number,
	alwaysActiveNodes: Node[]

};