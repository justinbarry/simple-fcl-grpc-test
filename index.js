const {send: transportGRPC} = require("@onflow/transport-grpc")
const fcl = require("@onflow/fcl")
const {TransactionAuthorizer} = require("@freshmint/core")
const {
  HashAlgorithm,
  InMemoryECSigner,
  SignatureAlgorithm,
  InMemoryECPrivateKey,
} = require("@freshmint/core/crypto")

// This key is burnt. DO NOT use it for anything other than demonstration purposes.
const PRIVATE_KEY_HEX =
  "b651f83aa6975142c3a330ac16099b1aca86e8ea135443c7c3c5094b5039ab1b"
const privateKey = InMemoryECPrivateKey.fromHex(
  PRIVATE_KEY_HEX,
  SignatureAlgorithm.ECDSA_P256
)
const signer = new InMemoryECSigner(privateKey, HashAlgorithm.SHA3_256)
const ownerAuthorizer = new TransactionAuthorizer({
    address: "81e6363e059cd66e",
    keyIndex: 0,
    signer,
  })

;(async () => {
  fcl.config({
    "accessNode.api": "https://access-testnet.onflow.org",
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    "sdk.send": transportGRPC,
  })

  const authz = ownerAuthorizer.toFCLAuthorizationFunction()

  for (let i = 0; i < 100; i++) {
    console.log(`Attempt ${i}`);

    const transactionId = await fcl
      .send([
        fcl.transaction(
          `transaction() {prepare(auth: AuthAccount) { log("hello")} }`
        ),
        fcl.args([]),
        fcl.limit(9999),
        fcl.proposer(authz),
        fcl.payer(authz),
        fcl.authorizations([authz]),
      ])
      .then(fcl.decode)

    console.log("transactionId", transactionId)

    try {
      const status = await fcl
        .tx({
          transactionId,
        })
        .onceSealed()

      console.log("Success!")
    } catch (e) {
      console.log("Error Caught!!!", e)
    }
  }
})()
