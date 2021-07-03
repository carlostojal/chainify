import StorageKey from "../types/StorageKey";
import Block from "./Block";

export default class StorageManager {

	keys: StorageKey[];

	constructor() {
		this.keys = [];
	}

	public get(key: string) {

		for(let i: number = 0; i < this.keys.length; i++) {

			if(this.keys[i].key == key)
				return this.keys[i].chain[this.keys[i].chain.length - 1].data;
		}

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