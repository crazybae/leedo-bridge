import React, { Component, useState } from "react";
import { ethers } from "ethers";

import getPOSClient from "./getPOSClient";
import ShowInstruction from "./instruction";

import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Table from 'react-bootstrap/Table';
// import BootstrapTable from "react-bootstrap-table-next";
import DataTable from 'react-data-table-component';

import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import FormControl from 'react-bootstrap/FormControl';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.css";

import config from './config';

const currentConfig = config.testnet;
const leedoCoinAddress = currentConfig.leedoCoinAddress;  // goerli erc20 (LEEDO)
const maticCoinAddress = currentConfig.maticCoinAddress;  // matic mumbai erc20 (LEEDO)

const leedoFaucetAddress = currentConfig.leedoFaucetAddress;

const erc20PredicateAddress = currentConfig.erc20PredicateAddress; // goerli mumbai, approve --> transfer & lock
const rootChainManagerAddress = currentConfig.rootChainManagerAddress; // goerli mumbai, depostFor callee

const LeedoCoinABI = config.abi.LeedoCoinABI;
const MaticCoinABI = config.abi.MaticCoinABI;
const RootChainManagerABI = config.abi.RootChainManagerABI;
const LeedoFaucetABI = config.abi.LeedoFaucetABI;

const rootChainID = currentConfig.L1ChainID;
const childChainID = currentConfig.L2ChainID;

const leedoBridgeServerAddress = currentConfig.leedoBridgeServerAddress;

var networkList = {
  1: "Mainnet",
  5: "Goerli Testnet",
  137: "Matic Polygon",
  80001: "Matic Mumbai"
};

/* helper function */
function getElem(elemId) {
  return document.getElementById(elemId);
}

// const datatimeOptions = {
//   year: 'numeric', month: 'numeric', day: 'numeric',
//   hour: 'numeric', minute: 'numeric', second: 'numeric',
//   hour12: false,
// };


const burnTxTableHeader = [
  {
      name: 'BurnTx',
      selector: row => row.BurnTx,
      width: "400pt",
  },
  {
      name: 'Amount',
      selector: row => row.Amount,
      width: "70pt",
      sortable: true,
  },
  {
      name: 'Claimed',
      selector: row => row.Claimed,
      width: "100pt",
      sortable: true,
  },
  {
      name: 'CreatedAt',
      selector: row => row.CreatedAt,
      sortable: true,
  },
];

const postData = async (url = '', data = {}) => {
    return fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        // credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify(data),
    })
    .then(response => response.json());
};

class App extends Component {
  state = {
    loaded: false,
    chainId: 0,
    leedoBalance: 0,
    leedoMaticBalance: 0,
    myAddress: null,
    leedoAddress: null,
    maticConnected: false,
    depositProgress: 0,
    burnProgress: 0,
    exitProgress: 0,
    burnTxTableContents: [],
  };

  ////////////////
  // init
  ////////////////
  componentDidMount = async () => {

    if (typeof window.ethereum === 'undefined') {
      return <div>You need an ethereum wallet extention to play this game ...</div>;
    }
    await this.startApp();
    await this.watchChainAccount();
  };

  startApp = async () => {
    try {

      if ( !this.accounts || this.accounts.length === 0 ) {
        await this.connectWallet();
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.networkId = (await this.provider.getNetwork()).chainId;
      if ( this.networkId !== rootChainID ) {
        await this.switchToRootChain();
      }

      this.networkId = (await this.provider.getNetwork()).chainId;
      this.signer = this.provider.getSigner();
      this.account = await this.signer.getAddress();

      this.leedoInstance = new ethers.Contract(leedoCoinAddress, LeedoCoinABI, this.signer);
      this.rcmInstance = new ethers.Contract(rootChainManagerAddress, RootChainManagerABI, this.signer);

      this.setState({
        chainId: this.networkId,
        loaded: true,
        myAddress: this.account,
        leedoAddress: this.leedoInstance.address,
        leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
        maticConnected: false,
      });

      let res = await postData(leedoBridgeServerAddress+"query", {address: this.account})

      if (res !== null && res.burntxlist !== null) {

        let burnTxList = res.burntxlist
        for (let i = 0; i<burnTxList.length; i++) {
          burnTxList[i].Claimed = (burnTxList[i].Claimed) ? 'Claimed' : 'Unclaimed';
        }
        this.setState({ burnTxTableContents: burnTxList });
      }

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  watchChainAccount = async () => {
    window.ethereum.on("accountsChanged", (accounts) => {
      this.startApp();
    });
  }

  ////////////////
  // wallet ops
  ////////////////
  connectWallet = async () => {
    this.accounts = await window.ethereum
        .request({method: 'eth_requestAccounts'});
  }

  switchToChildChain = async () => {

    getElem("withdrawAmount").value = '';

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x'+childChainID.toString(16) }],
      });

    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x'+childChainID.toString(16), rpcUrl: currentConfig.maticProvider }],
          });
        } catch (addError) {
          console.log(addError);
        }
      }
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.networkId = (await this.provider.getNetwork()).chainId;
    this.signer = this.provider.getSigner();
    this.account = await this.signer.getAddress();
    this.leedoMaticInstance = new ethers.Contract(maticCoinAddress, MaticCoinABI, this.signer);
    
    this.setState({
      chainId: this.networkId,
      leedoAddress: this.leedoMaticInstance.address,
      leedoMaticBalance: ethers.utils.formatUnits(await this.leedoMaticInstance.balanceOf(this.account), 18),
      maticConnected: true,
      burnProgress: 0,
      exitProgress: 0,
    });
  };

  switchToRootChain = async () => {

    getElem("depositAmount").value = '';

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x'+rootChainID.toString(16) }],
      });

    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: '0x'+rootChainID.toString(16), rpcUrl: currentConfig.parentProvider }],
          });
        } catch (addError) {
          console.log(addError);
        }
      }
    }

    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.networkId = (await this.provider.getNetwork()).chainId;
    this.signer = this.provider.getSigner();
    this.account = await this.signer.getAddress();
    this.leedoInstance = new ethers.Contract(leedoCoinAddress, LeedoCoinABI, this.signer);

    this.setState({
      chainId: this.networkId,
      leedoAddress: this.leedoInstance.address,
      leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
      maticConnected: false,
      depositProgress: 0,
      exitProgress: 0,
    });

  };
  
  switchNetwork = async (eventKey) => {
    if (eventKey === "deposit") {
      await this.switchToRootChain();
    } else {  // withdraw
      await this.switchToChildChain();
    }
  }

  addL1Token = async () => {
    await this.addToken(leedoCoinAddress);
  }

  addL2Token = async () => {
    await this.addToken(maticCoinAddress);
  }

  addToken = async (tokenAddress) => {
    await ethereum
      .request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: "LEEDO",
            decimals: 18,
            image: "https://gosquidgame.com/leedo_icon.png",
          },
        },
      })
      .then((success) => {
        if (success) {
          console.log("LEEDO successfully added to wallet!");
        } else {
          throw new Error("Something went wrong.");
        }
      })
      .catch(console.error);
  }

  ////////////////
  // contract ops
  ////////////////
  claimFaucet = async () => {
    if ( this.networkId !== rootChainID ) {
      alert("Wrong network. Please change the network into Ethereum")
      return
    }
    try {
      getElem("claimFaucetMessage").innerHTML = "please confirm in your wallet";

      let leedoFaucetInstance = new ethers.Contract(leedoFaucetAddress, LeedoFaucetABI, this.signer);
      let tx = await leedoFaucetInstance.claim();

      getElem("claimFaucetMessage").innerHTML = "waiting for claim tx confirmation ...";
      await tx.wait();

      this.setState({
        leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
      });
  
      getElem("claimFaucetMessage").innerHTML = `LEEDO is transferred into your account. check your balance.`;
    } catch (err) {
      getElem("claimFaucetMessage").innerHTML = `Error claiming faucet - ${err.message}. Hodlers having 2 LEEDO or more cannot claim`;
    }
  }

  // approve and depositFrom for deposit
  depositToMatic = async () => {
    if ( this.networkId !== rootChainID ) {
      alert("Wrong network. Please change the network into Ethereum")
      return
    }
    try {
      const _depositAmount = getElem("depositAmount").value
      if (_depositAmount === "") {
        alert("please input the amount to deposit");
        return;
      }
      if (isNaN(parseInt(_depositAmount, 10))) {
        alert("please input a correct number format of the amount to deposit");
        return;
      }

      const depositAmount = ethers.utils.parseUnits(_depositAmount, currentConfig.leedoCoinDecimals);
      const currentBalance = await this.leedoInstance.balanceOf(this.account);

      if (depositAmount.gt(currentBalance)) {
        alert("you do not have enough balance to deposit");
        return;
      }

      getElem("depositMessage").innerHTML = "please confirm in your wallet";
      this.setState({ depositProgress: 25 });

      console.log(depositAmount);

      let tx = await this.leedoInstance.approve(erc20PredicateAddress, depositAmount);

      getElem("depositMessage").innerHTML = "waiting for approval tx confirmation ...";
      this.setState({ depositProgress: 50 });
      await tx.wait();
      getElem("depositMessage").innerHTML = "approved. please confirm in your wallet again";
      this.setState({ depositProgress: 75 });

      const abiCoder = new ethers.utils.AbiCoder();
      const depositData = abiCoder.encode(['uint256'], [depositAmount.toString()]);
      tx = await this.rcmInstance.depositFor(this.account, this.leedoInstance.address, depositData);

      getElem("depositMessage").innerHTML = "waiting for depositFor tx confirmation ...";
      await tx.wait();

      this.setState({
        leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
        depositProgress: 100
      });
  
      console.log(tx);
  
      getElem("depositMessage").innerHTML = `${_depositAmount} LEEDO is transferred into Matic. check your balance in Matic 5 to 15 minutes later.`;
    } catch (err) {
      getElem("depositMessage").innerHTML = 'Error depositting - ' + err.message;
      this.setState({ depositProgress: 0 });
    }
  }

  // burn for withdrawal
  withdrawBurn = async () => {
    if ( this.networkId !== childChainID ) {
      alert("Wrong network. Please change the network into Matic")
      return
    }
    try {

      const _withdrawAmount = getElem("withdrawAmount").value
      if (_withdrawAmount === "") {
        alert("please input the amount to withdraw");
        return;
      }
      if (isNaN(parseInt(_withdrawAmount, 10))) {
        alert("please input a correct number format of the amount to withdraw");
        return;
      }

      let withdrawAmount = ethers.utils.parseUnits(_withdrawAmount, currentConfig.maticCoinDecimals);
      const currentBalance = await this.leedoMaticInstance.balanceOf(this.account);

      if (withdrawAmount.gt(currentBalance)) {
        alert("you do not have enough balance to withdraw");
        return;
      }

      getElem("withdrawMessage").innerHTML = "please confirm in your wallet";
      this.setState({ burnProgress: 33 });

      let tx = await this.leedoMaticInstance.withdraw(withdrawAmount); // burn

      getElem("withdrawMessage").innerHTML = "waiting for withdraw tx confirmation ...";
      this.setState({ burnProgress: 67 });
      await tx.wait();

      getElem("withdrawMessage").innerHTML = `${_withdrawAmount} LEEDO is burned from Matic. Please switch to Ethereum and do exit tx 20 to 30 minutes later, your burn tx is ${tx.hash}`;
      
      this.setState({
        leedoMaticBalance: ethers.utils.formatUnits(await this.leedoMaticInstance.balanceOf(this.account), 18),
        burnProgress: 100,
      });

      getElem("burntx").value = tx.hash

      postData(leedoBridgeServerAddress+"register", {
        address: this.account,
        burntx: tx.hash,
        amount: _withdrawAmount,
        claimed: false,
      })
      .then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
      .catch(error => console.error(error));

      let res = await postData(leedoBridgeServerAddress+"query", {address: this.account})

      if (res !== null && res.burntxlist !== null) {

        let burnTxList = res.burntxlist
        for (let i = 0; i<burnTxList.length; i++) {
          burnTxList[i].Claimed = (burnTxList[i].Claimed) ? 'Claimed' : 'Unclaimed';
        }
        this.setState({ burnTxTableContents: burnTxList });
      }

    } catch (err) {
      getElem("withdrawMessage").innerHTML = `Error calling withdraw - ${err.message}`;
      this.setState({ burnProgress: 0 });
    }
  }

  // exit for withdrawal
  withdrawExit = async () => {
    if ( this.networkId !== rootChainID ) {
      alert("Wrong network. Please change the network into Ethereum")
      return
    }
    try {

      getElem("exitMessage").innerHTML = "please confirm in your wallet";
      this.setState({ exitProgress: 33 });

      const burnTxHash = getElem("burntx").value

      const maticPOSClient = getPOSClient();
      // before checkpointed, exception 'Burn transaction has not been checkpointed as yet'
      const exitCalldata = await maticPOSClient
        .exitERC20(burnTxHash, { from: this.state.myAddress, encodeAbi: true })

      const tx = await this.signer.sendTransaction({
        from: this.state.myAddress,
        to: rootChainManagerAddress,
        data: exitCalldata.data,
      });
    
      getElem("exitMessage").innerHTML = "waiting for exit tx confirmation ...";
      this.setState({ exitProgress: 67 });

      await tx.wait();

      postData(leedoBridgeServerAddress+"update", {
        burntx: burnTxHash,
        claimed: true,
      })
      .then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
      .catch(error => console.error(error));

      let res = await postData(leedoBridgeServerAddress+"query", {address: this.account})

      if (res !== null && res.burntxlist !== null) {

        let burnTxList = res.burntxlist
        for (let i = 0; i<burnTxList.length; i++) {
          burnTxList[i].Claimed = (burnTxList[i].Claimed) ? 'Claimed' : 'Unclaimed';
        }
        this.setState({
          leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
          exitProgress: 100,
          burnTxTableContents: burnTxList,
        });
      } else {
        this.setState({
          leedoBalance: ethers.utils.formatUnits(await this.leedoInstance.balanceOf(this.account), 18),
          exitProgress: 100,
        });
      }

      getElem("exitMessage").innerHTML = `Your tokens are withdrawn from Matic. Check your balance in Ethereum`;

    } catch (err) {
      if (err.message === 'Returned error: execution reverted: RootChainManager: EXIT_ALREADY_PROCESSED') {
        getElem("exitMessage").innerHTML = `the tx ${getElem("burntx").value} is already processed. check your LEEDO balance in Ethereum`;
      } else {
        getElem("exitMessage").innerHTML = err.message;
      }
      this.setState({ exitProgress: 0 });
    }
  }

  render() {
    if (!this.state.loaded) {
      return <div>Change your wallet network into Goerli testnet and press F5 ...</div>;
    }
    return (

      <div className="App">

          <h1>LEEDO ERC20 Token Bridge<br /><span>(Ethereum goerli to Matic mumbai)</span></h1>

          <div id="content">

            <ShowInstruction />
            <hr />

            <ul className="info padding">
              <li><p>Current network ID</p><p>{ networkList[this.state.chainId] }, {this.state.chainId}</p></li>
              <li><p>Your Address</p><p>{this.state.myAddress}</p></li>
              <li><p>Your balance in Ethereum</p><p>{ this.state.leedoBalance }<span> LEEDO</span></p><span> ({ leedoCoinAddress })</span>&nbsp;
                  <Button onClick={this.addL1Token} disabled={this.state.maticConnected} >Add L1 LEEDO into Wallet</Button>
              </li>
              <li><p>Your balance in Matic</p><p>{ this.state.leedoMaticBalance }<span> LEEDO</span></p><span> ({ maticCoinAddress })</span>&nbsp;
                  <Button onClick={this.addL2Token} disabled={!this.state.maticConnected} >Add L2 LEEDO into Wallet</Button>
              </li>
            </ul>

            <div id="tab_Wrap" className="padding">

              <Tabs defaultActiveKey="deposit" onSelect={this.switchNetwork} id="uncontrolled-tab-example" className="mb-3">

                <Tab eventKey="deposit" title="Ethereum --&gt; Matic">

                  <p>
                    <Button onClick={this.claimFaucet} >Claim from Faucet (Goerli)</Button>
                    <div id="claimFaucetMessage"></div>
                  </p>

                  <p>
                  <InputGroup className="mb-3">
                    <Button onClick={this.depositToMatic} >Deposit to L2</Button>&nbsp;
                    <FormControl type="text" id="depositAmount" placeholder="deposit amount (LEEDO) ..." />
                  </InputGroup>
                  <div id="depositMessage"></div></p>
                  <p><ProgressBar striped variant="warning" now={this.state.depositProgress} label={`${this.state.depositProgress}%`} /></p>

                </Tab>

                <Tab eventKey="withdraw" title="Matic --&gt; Ethereum">

                  <p>
                  <InputGroup className="mb-3">
                    <Button onClick={this.withdrawBurn} disabled={!this.state.maticConnected} >Withdraw - Burn</Button>&nbsp;
                    <FormControl type="text" id="withdrawAmount" placeholder="withdraw amount (LEEDO) ..." />
                  </InputGroup>
                  <div id="withdrawMessage"></div></p>
                  <p><ProgressBar striped variant="danger" now={this.state.burnProgress} label={`${this.state.burnProgress}%`} /></p>

                  <p><Button variant="dark" onClick={this.switchToRootChain} >Switch to Ethereum</Button></p>

                  <p>
                  <InputGroup className="mb-3">
                    <Button onClick={this.withdrawExit} disabled={this.state.maticConnected} >Withdraw - Exit</Button>&nbsp;
                    <FormControl type="text" id="burntx" placeholder="copy a 'Unclaimed' burntx below and paste it here ..." />
                  </InputGroup>
                  <div id="exitMessage"></div></p>
                  <p><ProgressBar striped variant="success" now={this.state.exitProgress} label={`${this.state.exitProgress}%`} /></p>

                </Tab>

              </Tabs>
              
            </div>

            <DataTable
                  title='Withdraw History'
                  columns={ burnTxTableHeader }
                  data={ this.state.burnTxTableContents }
                  keyField='BurnTx'
                  defaultSortFieldId='Claimed'
                  defaultSortAsc={false}
            />

          </div>

      </div>
    );
  }
}

export default App;
