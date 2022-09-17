/* eslint-disable @typescript-eslint/no-explicit-any */
import algosdk from 'algosdk'
import fs from 'fs/promises'

// // Deploys a TEAL smart contract application.
export async function deployApp(
  algodClient: algosdk.Algodv2,
  creatorAccount: algosdk.Account,
  approvalProgramCode: string | Uint8Array,
  clearProgramCode: string | Uint8Array,
  numGlobalByteSlices: number,
  numGlobalInts: number,
  numLocalByteSlices: number,
  numLocalInts: number,
  appArgs: Uint8Array[] | undefined
) {
  const params = await algodClient.getTransactionParams().do()

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: creatorAccount.addr,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    approvalProgram: await compileProgram(algodClient, approvalProgramCode),
    clearProgram: await compileProgram(algodClient, clearProgramCode),
    numGlobalByteSlices,
    numGlobalInts,
    numLocalByteSlices,
    numLocalInts,
    appArgs,
  })

  const txnDetails = await signAndSubmitTransaction(
    algodClient,
    creatorAccount,
    txn
  )
  const appId = txnDetails.response['application-index']
  const appAddr = algosdk.getApplicationAddress(appId)
  return {
    appId,
    appAddr,
    ...txnDetails,
  }
}

// // Deletes a TEAL smart contract application.
export async function deleteApp(
  algodClient: algosdk.Algodv2,
  creatorAccount: algosdk.Account,
  appId: number
) {
  const params = await algodClient.getTransactionParams().do()
  const txn = algosdk.makeApplicationDeleteTxn(
    creatorAccount.addr,
    params,
    appId
  )

  const txnDetails = await signAndSubmitTransaction(
    algodClient,
    creatorAccount,
    txn
  )
  const deletedAppId = txnDetails.response['txn']['txn'].apid
  return deletedAppId
}

// // Reads a file from the file system.
export async function readFile(fileName: string) {
  return await fs.readFile(fileName, 'utf-8')
}

// // Loads and compiles a TEAL program.
async function compileProgram(
  client: algosdk.Algodv2,
  sourceCode: string | Uint8Array
) {
  const compileResponse = await client.compile(sourceCode).do()
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'))
}

// // Submits a signed transaction, then waits for confirmation.
async function submitTransaction(
  algodClient: algosdk.Algodv2,
  signedTxn: Uint8Array | Uint8Array[]
) {
  const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
  const response = await algosdk.waitForConfirmation(algodClient, txId, 4)
  return { txId, response }
}

// // Signs and submits a transaction, then waits for confirmation.
export async function signAndSubmitTransaction(
  algodClient: algosdk.Algodv2,
  fromAccount: algosdk.Account,
  txn: algosdk.Transaction
) {
  const result = await submitTransaction(
    algodClient,
    txn.signTxn(fromAccount.sk)
  )
  return {
    txnId: result.txId,
    confirmedRound: result.response['confirmed-round'],
    response: result.response,
  }
}

// // Reads the global state of applications.
export async function getGlobalState(
  client: algosdk.Algodv2,
  addr: string,
  appId: number
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalState: any = {}
  const accountInfo = await client.accountInformation(addr).do()
  const createdApps = accountInfo['created-apps']
  const app = createdApps.find((elem: { id: number }) => elem.id == appId)
  if (app) {
    const appState = app['params']['global-state']
    for (let valueIndex = 0; valueIndex < appState.length; valueIndex++) {
      const valuePair = appState[valueIndex]
      const valueKey = Buffer.from(valuePair.key, 'base64').toString()
      globalState[valueKey] = valuePair.value
    }
  }
  return globalState
}

// // Creates a new account.
export async function createAccount() {
  return algosdk.generateAccount()
}

// // Transfer funds from one account to another.
export async function transferFunds(
  algodClient: algosdk.Algodv2,
  fromAccount: algosdk.Account,
  toAccountAddr: string,
  amount: number
) {
  const params = await algodClient.getTransactionParams().do()

  const txn = algosdk.makePaymentTxnWithSuggestedParams(
    fromAccount.addr,
    toAccountAddr,
    algosdk.algosToMicroalgos(amount),
    undefined,
    undefined,
    params
  )
  return await signAndSubmitTransaction(algodClient, fromAccount, txn)
}

// // Create a new account and fund it with the specified amount.
export async function createFundedAccount(
  algodClient: algosdk.Algodv2,
  faucetAccount: algosdk.Account,
  amount: number
) {
  const newAccount = await createAccount()
  await transferFunds(algodClient, faucetAccount, newAccount.addr, amount)
  return newAccount
}

export async function createAsa(
  client: algosdk.Algodv2,
  account: algosdk.Account,
  assetName: string,
  decimals: number,
  totalSupply: number,
  unitName: string,
  isFrozen: boolean
) {
  const sp = await client.getTransactionParams().do()
  const asa = await algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    assetName: assetName,
    decimals: decimals,
    defaultFrozen: isFrozen,
    from: account.addr,
    suggestedParams: sp,
    total: totalSupply,
    unitName: unitName,
    clawback: account.addr,
    freeze: account.addr,
    manager: account.addr,
    reserve: account.addr,
  })

  const signedTx = algosdk.signTransaction(asa, account.sk)
  await client.sendRawTransaction(signedTx.blob).do()
  const accountInfo = await client.accountInformation(account.addr).do()
  return accountInfo['created-assets'].pop().index
}

export async function sendAsa(
  from: algosdk.Account,
  to: string,
  amount: number,
  assetId: number,
  client: algosdk.Algodv2,
  clawbackAddress?: string
) {
  const sp = await client.getTransactionParams().do()
  const asaTransfer =
    await algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: from.addr,
      to,
      amount,
      revocationTarget: clawbackAddress,
      assetIndex: assetId,
      suggestedParams: sp,
    })

  const signedTx = algosdk.signTransaction(asaTransfer, from.sk)
  await client.sendRawTransaction(signedTx.blob).do()
}

export async function getBalance(
  client: algosdk.Algodv2,
  address: string
): Promise<number> {
  const balance = (await client.accountInformation(address).do())['amount']
  return balance
}

export async function getAssetBalance(
  client: algosdk.Algodv2,
  address: string,
  tokenId: number
) {
  const balance = (await client.accountInformation(address).do())['assets']
  const asaBalance = balance.find((asset: any) => asset['asset-id'] === tokenId)
  return asaBalance != undefined ? asaBalance['amount'] : 0
}

export async function optIn(
  client: algosdk.Algodv2,
  address: algosdk.Account,
  asaId: number
) {
  const sp = await client.getTransactionParams().do()
  const optIn = await algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
    {
      from: address.addr,
      to: address.addr,
      assetIndex: asaId,
      amount: 0,
      suggestedParams: sp,
    }
  )

  const signedTx = algosdk.signTransaction(optIn, address.sk)
  await client.sendRawTransaction(signedTx.blob).do()
}

// TODO: opt-out

export function getAttributeValue(global: any, name: string) {
  const attribute = global[name]
  if (attribute) {
    if (attribute.type == Type.uint64) {
      const decodedAddress = Buffer.from(attribute.bytes, 'base64')
      return algosdk.encodeAddress(decodedAddress)
    }
    if (attribute.type == Type.bytes) return attribute.uint
  }
  return attribute
}

export async function freezeOrUnfreeze(
  client: algosdk.Algodv2,
  admin: algosdk.Account,
  address: string,
  freeze: boolean,
  asaId: number
) {
  const sp = await client.getTransactionParams().do()
  const freezeTx = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
    from: admin.addr,
    suggestedParams: sp,
    assetIndex: asaId,
    freezeTarget: address,
    freezeState: freeze,
  })
  const signedTx = algosdk.signTransaction(freezeTx, admin.sk)
  await client.sendRawTransaction(signedTx.blob).do()
}

export enum Type {
  uint64 = 1,
  bytes = 2,
}
