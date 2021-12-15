import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

function ShowInstruction() {
  const [show, setShow] = useState(false);

  if (show) {
    return (
      <Alert variant="info" onClose={() => setShow(false)} dismissible>
        <Alert.Heading>
          Deposit from Ethereum goerli to Matic mumbai
        </Alert.Heading>
        <b>In 'Ethereum --&gt; Matic' tab,</b>
        <ul>
          <li>[Claim from Faucet] you can claim up to 2 LEEDO (goerli).
          </li>
          <li>[Deposit to L2] it gives 'transfer' right of the deposit amount to the Matic contract, called erc20Predicate that will hold your tokens until withdrawal,
            next your tokens are depositted to the Matic contract, and finally the same amount of tokens are minted in Matic.
            <b>Note that you have to confirm two transactions in your wallet and your new tokens in Matic will be minted 5 to 20 minutes later</b>.
          </li>
        </ul>
        <Alert.Heading>
          Withdrawal from Matic mumbai to Ethereum goerli
        </Alert.Heading>
        <b>In 'Matic --&gt; Ethereum' tab,</b>
        <ul>
          <li><b>Note that you should add a matic mumbai network into your Metamask wallet first. 
          See <a href="https://docs.polygon.technology/docs/develop/metamask/config-polygon-on-metamask/" target="_blank">the mumbai section of Matic official docs</a></b>.
          When selecting the 'Matic --&gt; Ethereum' tab, your wallet will request the change of network to Matic mumbai.</li>
          <li>[Withdraw - Burn] it burns (i.e., removes) the tokens from the token contract in Matic and fill the transaction ID into the edit box under the [Withdraw - Exit] button.
          </li>
          <li>[Switch to Ethereum] it changes your wallet network into Ethereum goerli</li>
          <li>[Withdraw - Exit] you need to copy a 'unclaimed' burn tx and paste it into the edit box. By pressing the button,
            you can withdraw your tokens in Ethereum that has been locked by the Matic contract.&nbsp;
            <b>Note that the transaction can be executed only after 20 to 60 minutes from the buring transaction in Matic (called checkpointing)</b>.
          </li>
          <li>Check if your tokens are back well.</li>
        </ul>
      </Alert>
    );
  }
  return (
    <Button variant="info" onClick={() => setShow(true)}>
      Instruction
    </Button>
  );
}

export default ShowInstruction;
