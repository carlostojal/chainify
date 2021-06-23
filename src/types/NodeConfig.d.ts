
import NetworkAuthentication from "../types/NetworkAuthentication";

export default interface NodeConfig {

	networkAuthentication: NetworkAuthentication,
	host: string,
	port: number,
	alwaysActiveNodes: string[] // in format ip_address:port

};