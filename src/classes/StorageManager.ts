import StorageKey from "../types/StorageKey";
import Block from "./Block";

export default class StorageManager {

	keys: StorageKey[];

	constructor() {
		this.keys = [];
	}

	public key(key: string) {

		this.keys.map((storageKey: StorageKey) => {

			if(storageKey.key == key)
				return storageKey.chain[storageKey.chain.length];

		});

		return null;
	}

	public set(key: string, value: string) {

		let keyExists = false;

		this.keys.map((storageKey: StorageKey) => {
			
			if(storageKey.key == key) {
				keyExists = true;
				storageKey.chain.push(new Block(storageKey.chain[storageKey.chain.length - 1].hash, value));
			}

		});

		if(!keyExists) {

			let newKey: StorageKey = {
				key,
				chain: [new Block(null, value)]
			};

			this.keys.push(newKey);
		}
	}
}