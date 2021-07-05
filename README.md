# chainify

The blockchain and peer-to-peer networks represent a revolution in today's information systems.
With that in mind, providing easy ways to implement this technologies is essential.
Chainify appears as the solution to this problem, by providing a framework and a protocol specification for peer-to-peer networks creation based on the blockchain technology.
Each Chainify machine is a network node.
A Chainify network is like a key-value storage distributed among all nodes with the integrity, security and transparency that the blockchain provides.

## Usage

Run ```npm install @carlostojal/chainify```.

Get a RSA key pair that will be used for data encryption.

```openssl genrsa -out private.pem 2048```
```openssl rsa -in private.pem -outform PEM -pubout -out public.pem```

Code example:

```javascript
const { ChainifyNode } = require("@carlostojal/chainify");

// create the object with the configurations
const node = new ChainifyNode({
	host: "127.0.0.1",
	port: 1235,
	alwaysActiveNodes: [{
		address: "127.0.0.1",
		port: 1234
	}],
	networkAuthentication: {
		name: "chainify_test_network",
		secret: "mysupersecret"
	},
	rsaKeyPair: {
		public: "my_public_key",
		private: "my_private_key"
	}
});

// initialize the node (get it working)
node.init();

// get an item
node.getItem("users", (users) => {
	console.log(JSON.parse(users));
});
```

There is a complete REST API example using "chainify" as database available [here]("https://github.com/carlostojal/chainify-demo").

## Configuration Explanation

- ### ```alwaysActiveNodes```
	You must have at least one node that you know that is always active. This node is the gateway into the network. From here your presence will be announced to the known nodes of all your active nodes, and so on.

- ### ```networkAuthentication```
	Each developer can create a network of nodes. The network is like your private distributed key-value storage.
	Each network has an unique name. If you provided always active nodes, the node will use this configuration to connect to them. If you didn't, this value will still be used for authentication from other nodes.

- ### ```rsaKeyPair```
	As the name says, this defines the RSA key pair to be used.
	RSA encryption is used to encrypt calls between your nodes.
	All your nodes must use the same key pair, so they can communicate but if an attacker or a node from another network gets the call can't do anything.

## Disclaimer

This is a work under progress. This module is far from complete/working yet.

Contributions are welcome, go ahead and open issues/pull requests.