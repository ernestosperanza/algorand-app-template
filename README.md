# App Algorand Template

## Setup and Workflow
⚠️  PyTeal requires Python version >= 3.10.
1. Make sure you have Python, Pip3, Node.js and Docker installed
2. Run `yarn setup`
3. The sandbox might not start correctly, if not, start docker and then run `./sandbox up dev`
4. Modify the code inside pyteal/contract.py as you wish
5. Compile with `yarn compile` and find your TEAL code in the folder contracts

## Useful Commands

```Bash
# Run main.test with sandbox up in dev mode
yarn test

# Run sandbox in dev mode
./sandbox up dev

# Run sandbox in testnet of mainnet
./sandbox down # if it's running
./sandbox clean
./sandbox up mainnet|testnet
```
