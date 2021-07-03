import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import KeyPair from "../types/KeyPair";

// the call is the basic data structure used for transmission on the network
// data encryption between parts is implemented here

interface CallArgs {

	parent?: string | null;
	name: "get" | "set" | "auth" | "alive";
	extra?: any;

}

export default class Call implements CallArgs {

	id: string; // uuid for call identification
	time: Date; // time of the call creation
	parent?: string | null; // call that originated the current
	name: "get" | "set" | "auth" | "alive"; // available calls
	extra?: any | null; // extra data

	constructor(args: CallArgs) {
		
		this.id = uuidv4();
		this.time = new Date();
		this.parent = args.parent;
		this.name = args.name;
		this.extra = args.extra;

	}

	public static from(data: any, keyPair: KeyPair) {

		const decrypted = crypto.privateDecrypt({
			key: keyPair.private,
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256"
		}, data);

		return JSON.parse(decrypted.toString());
	}

	// convert the call to string format and encrypt it with the key
	public toString(encrypt: boolean = true, keyPair: KeyPair) {

		let out: any = JSON.stringify(this);

		if(encrypt) {

			out = crypto.publicEncrypt({
				key: keyPair.public,
				padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
				oaepHash: "sha256"
			}, Buffer.from(out));

			out = out.toString("base64");

			// console.log(privateKey);
			// console.log(publicKey);

			// console.log(encrypted.toString("base64"));
		}

		return out;

	}
}