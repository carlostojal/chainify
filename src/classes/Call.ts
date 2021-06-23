import { v4 as uuidv4 } from "uuid";

interface CallArgs {

	caller: string;
	name: "get" | "set" | "auth";
	extra: any;

}

export default class Call implements CallArgs {

	id: string;
	time: Date;
	caller: string;
	name: "get" | "set" | "auth";
	extra: any;

	constructor(args: CallArgs) {
		
		this.id = uuidv4();
		this.time = new Date();
		this.caller = args.caller;
		this.name = args.name;
		this.extra = args.extra;

	}

	toString() {
		return JSON.stringify(this);
	}
}