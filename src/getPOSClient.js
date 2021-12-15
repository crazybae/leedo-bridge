import { MaticPOSClient } from '@maticnetwork/maticjs'

const parentProvider = 'https://goerli.infura.io/v3/58a91f9437554be9ba02e3269a7b9a31'
const maticProvider = 'https://rpc-mumbai.maticvigil.com/v1/b4f231540ac5d1e8500e4e64e4bf94d73ae9b8c9'

// const parentProvider = 'https://goerli.infura.io/v3'
// const maticProvider = 'https://rpc-mumbai.maticvigil.com/v1'


const getPOSClient = () => {
  return new MaticPOSClient({
    network: 'testnet', // For mainnet change this to mainnet
    version: 'mumbai', // For mainnet change this to v1
    parentProvider: parentProvider,
    maticProvider: maticProvider,
  })
}

export default getPOSClient;
