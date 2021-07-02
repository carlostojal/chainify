import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export default class Block {

	readonly id: string;
	hash: string;
	readonly createdAt: Date;
	readonly data: any;
	readonly previous: string | null;
	// readonly creatorId: string;
	// readonly signature: string;
	nonce: number | null;

	constructor(previous: string | null, data: any) {

		this.id = uuidv4();
		this.createdAt = new Date();
		this.data = data;
		this.previous = previous;
		this.hash = crypto.createHash("sha256").update(JSON.stringify(this)).digest("hex");
		this.nonce = 0;

	}

	public mine() {

		while(!this.hash.startsWith("0000")) {

			this.hash = crypto.createHash("sha256").update(JSON.stringify(this)).digest("hex");
			if(this.nonce == null)
				this.nonce = 0;
			this.nonce++;

		}

	}
}