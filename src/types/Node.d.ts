
export default interface Node {

	id?: string;
	address: string;
	port: number;
	lastTimeSeen?: Date = new Date();
	authenticated?: boolean = false;

}