
export default interface Node {

	address: string;
	port: number;
	lastTimeSeen?: Date = new Date();
	authenticated?: boolean = false;

}