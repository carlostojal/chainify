import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// the call is the basic data structure used for transmission on the network
// data encryption between parts is implemented here

interface CallArgs {

	name: "get" | "set" | "auth" | "alive";
	extra?: any;

}

export default class Call implements CallArgs {

	id: string; // uuid for call identification
	time: Date; // time of the call creation
	parent?: Call | null; // call that originated the current
	name: "get" | "set" | "auth" | "alive"; // available calls
	extra?: any; // extra data

	constructor(args: CallArgs) {
		
		this.id = uuidv4();
		this.time = new Date();
		this.parent = null;
		this.name = args.name;
		this.extra = args.extra;

	}

	public static from(data: any) {

		const decrypted = crypto.privateDecrypt({
			key: "dasdsadgweaser",
			padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
			oaepHash: "sha256"
		}, data);

		return JSON.parse(decrypted.toString());
	}

	// convert the call to string format and encrypt it with the key
	public toString(encrypt: boolean = true) {

		let out: any = JSON.stringify(this);

		if(encrypt) {
			const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
				modulusLength: 2048
			});

			out = crypto.publicEncrypt({
				key: publicKey,
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