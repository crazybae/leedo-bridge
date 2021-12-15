import Web3 from "web3";

const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {

      var web3;
      if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
      } else if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://rpc-mumbai.matic.today"));
      }
      
      try {
        resolve(web3);
      } catch (error) {
        reject(error)
      }
    });
  });

export default getWeb3;
