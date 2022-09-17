import path from 'path'
import algosdk from 'algosdk'

// Algorand node client
export const client = new algosdk.Algodv2(
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'http://127.0.0.1',
  '4001'
)

// Contract deployment parameters.
export const deployConfig = {
  GLOBAL_BYTE_SLICES: 14,
  GLOBAL_INTS: 14,
  LOCAL_BYTE_SLICES: 0,
  LOCAL_INTS: 0,
  APPROVAL_PROGRAM: path.join(__dirname, '../../contracts/approval.teal'),
  CLEAR_PROGRAM: path.join(__dirname, '../../contracts/clear.teal'),
}
