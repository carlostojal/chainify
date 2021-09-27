import StorageKey from "../types/StorageKey";

export default class StorageManager {

	keys: StorageKey[];

	constructor() {
		this.keys = [];
	}

	public get(key: string) {

		for(let i: number = 0; i < this.keys.length; i++) {

			if(this.keys[i].key == key)
				return this.keys[i].value;
		}

		return null;

	}

	public set(key: string, value: string) {

		let keyExists = false;

		this.keys.map((storageKey: StorageKey) => {
			
			if(storageKey.key == key) {
				keyExists = true;
				storageKey.value = value;
			}

		});

		if(!keyExists) {

			let newKey: StorageKey = {
				key,
				value
			};

			this.keys.push(newKey);
		}

	}
}