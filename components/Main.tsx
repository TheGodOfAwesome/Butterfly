import { useState, useEffect, useRef } from 'react'
import SocialLogin from '@biconomy/web3-auth'
import { ChainId } from '@biconomy/core-types'
import { IBalances } from '@biconomy/node-client'
import { ethers } from 'ethers'
import SmartAccount from '@biconomy/smart-account'
import { css } from '@emotion/css'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Web3AuthModalPack, Web3AuthConfig } from '@safe-global/auth-kit'
import { Web3AuthOptions } from '@web3auth/modal'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  IAdapter,
  SafeEventEmitterProvider,
  UserInfo,
  WALLET_ADAPTERS
} from '@web3auth/base'


const tokens = [
  {
    address: '0x0000000000000000000000000000000000001010',
    decimals: 18,
    symbol: 'MATIC',
  },
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    decimals: 6,
    symbol: 'USDC'
  },
  {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
    symbol: 'USDT'
  },
  {
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    decimals: 18,
    symbol: 'DAI'
  },
  {
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    symbol: 'WETH'
  },
  {
    // address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    symbol: 'ETH'
  },
  {
    address: '0x4200000000000000000000000000000000000042',
    decimals: 18,
    symbol: 'OP'
  },
  {
    address: '0x6810e776880c02933d47db1b9fc05908e5386b96',
    decimals: 18,
    symbol: 'GNO'
  }
]

export default function Home() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState<boolean>(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  let msg : string[] = []

  const defaultMessage = `
  💥 Welcome to Access Wallet 💥\n
      --- All --- \n
      1 - Send Tokens\n
      2 - Switch Chains \n
      0 - Help \n
  `;

  const sendMessage = `
    💥 Send Tokens 💥\n
    --- Choose Token --- \n
    a - Polygon Matic \n
    b - Optimism OP \n
    c - Gnosis GNO\n
    d - Ethereum ETH\n
  `;



  // Forwarder config
  const [amount, setAmount] = useState<string>('')
  const [balances, setBalances] = useState<IBalances[]>([])
  const [gasToken, setGasToken] = useState<IBalances | null>()
  const [recipientAddress, setRecipientAddress] = useState<string>('')
  const [selectedToken, setSelectedToken] = useState(tokens[0])
  const [messages, setMessages] = useState(msg);
  const [inputValue, setInputValue] = useState('');
  
  const [userDataEoa, setUserDataEoa] = useState<string>('');
  const [userData, setUserData] = useState<string>('');
  const [loggedIn, setLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    let configureLogin
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
    console.log(amount);
    console.log(recipientAddress);
  }, [interval, amount, recipientAddress])

  // https://web3auth.io/docs/sdk/pnp/web/modal/initialize#arguments
  const options: Web3AuthOptions = {
    clientId: 'BHZ5l7ugmj-aS05zWFlVV31RNfDnOL9Edkrt0f1lNtpMHp3Tq7fBHUdKiM1Vi39kwDti2GfD1MPhxABYYJTPSDA', // Web3Auth Client ID https://dashboard.web3auth.io/
    web3AuthNetwork: 'testnet',
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      // chainNamespace: 'eip155',
      chainId: '0x5',
      // https://chainlist.org/
      rpcTarget: 'https://rpc.ankr.com/eth_goerli'
    },
    uiConfig: {
      // theme: 'dark',
      loginMethodsOrder: ['google', 'facebook']
    }
  }

  // https://web3auth.io/docs/sdk/pnp/web/modal/initialize#configuring-adapters
  const modalConfig = {
    [WALLET_ADAPTERS.TORUS_EVM]: {
      label: 'torus',
      showOnModal: false
    },
    [WALLET_ADAPTERS.METAMASK]: {
      label: 'metamask',
      showOnDesktop: true,
      showOnMobile: false
    }
  }

  // https://web3auth.io/docs/sdk/pnp/web/modal/whitelabel#whitelabeling-while-modal-initialization
  const openloginAdapter: IAdapter<unknown> = new OpenloginAdapter({
    loginSettings: {
      mfaLevel: 'mandatory'
    },
    adapterSettings: {
      uxMode: 'popup',
      whiteLabel: {
        // 'name': 'Safe'
      }
    }
  })


  const web3AuthConfig: Web3AuthConfig = {
    txServiceUrl: 'https://safe-transaction-goerli.safe.global'
  }

  const getPrefix = (chainId: string) => {
    switch (chainId) {
      case '0x1':
        return 'eth'
      case '0x5':
        return 'gor'
      case '0x100':
        return 'gno'
      case '0x137':
        return 'matic'
      default:
        return 'eth'
    }
  }
  

  async function login() {  
  // https://web3auth.io/docs/sdk/pnp/web/modal/initialize#arguments
    setUserData(authKitSignData.eoa)
    setLoggedIn(true)
  }

  const logout = async () => {
    setLoggedIn(false)
    alert("Logged Out")
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) return
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MAINNET,
        supportedNetworksIds: [ChainId.POLYGON_MAINNET],
      })
      await smartAccount.init()
      setSmartAccount(smartAccount)
      setLoading(false)
      getBalance(smartAccount)
    } catch (err) {
      console.log('error setting up smart account... ', err)
    }
  }

  async function getBalance(smartAccount: SmartAccount) {
    if (!smartAccount) return
    console.log('smartAccount: ', smartAccount)
    /* this function fetches the balance of the connected smart wallet */
    const balanceParams =  {
      chainId: ChainId.POLYGON_MAINNET,
      eoaAddress: smartAccount.address,
      tokenAddresses: [],
    }
    console.log('smartAccount: ', smartAccount)
    /* use getAlltokenBalances and getTotalBalanceInUsd query the smartAccount */
    const balFromSdk = await smartAccount.getAlltokenBalances(balanceParams)
    // alert(JSON.stringify(balFromSdk));
    console.log('balFromSdk::: ', balFromSdk)
    const usdBalFromSdk = await smartAccount.getTotalBalanceInUsd(balanceParams)
    console.log('usdBalFromSdk: ', usdBalFromSdk)
    setBalances(balFromSdk.data)
    setGasToken(balFromSdk.data[0])
  }

  function onGasTokenChange(e) {
    setGasToken(balances[e.target.value])
  }

  function onTokenChange(e) {
    setSelectedToken(tokens[e.target.value])
  }

  async function sendTokens() {
    // alert("Sending Tokens!");
    if (!smartAccount || !gasToken) return
    let tx

    /* if the selected token to send is the native token, configure a basic transaction */
    if (selectedToken.symbol === 'MATIC') {
      tx = {
        to: recipientAddress,
        value: ethers.utils.parseEther(amount)
      }
    } else {
      /* if the selected to send is not a native token (i.e. not MATIC), then configure a custom transaction */
      const erc20Interface = new ethers.utils.Interface([
        'function transfer(address _to, uint256 _value)'
      ])
      const data = erc20Interface.encodeFunctionData(
        'transfer', [recipientAddress, ethers.utils.parseUnits(amount, selectedToken.decimals)]
      )
      tx = {
        to: selectedToken.address,
        data
      }
    }

    /* check the fee quotes from the API */
    /* in our case we're letting the user choose which token to pay gas */
    const feeQuotes = await smartAccount.prepareRefundTransaction(
      {transaction:tx}
    )
    console.log('feeQuotes: ', feeQuotes)

    /* find the matching fee quote to the selected gas token the user has chosen */
    const feeQuote = feeQuotes.find(quote => quote.symbol === gasToken.contract_ticker_symbol)

    if (!feeQuote) {
      console.log('no matching quote ...')
      return
    }

    /* define the transaction */
    const transaction = await smartAccount.createRefundTransaction({
      transaction: tx,
      feeQuote
    })

    let gasLimit = {
      hex: '0x1E8480',
      type: 'hex',
    }

    /* send the transaction */
    try {
      const txId = await smartAccount.sendTransaction({
        tx: transaction,
        gasLimit
      })
      console.log({ txId })
    } catch (err) {
      console.log('ERROR SENDING TX: ', err)
    }
  }


  async function handleSubmit() {
    // inputValue = (message.split(': '))[1]
    // alert(inputValue);
    if (
      inputValue === '1' || inputValue === 'a' || inputValue === 'b' || inputValue === 'c' || 
      inputValue === 'd' || inputValue === 'Confirm' || inputValue.includes('0x') || inputValue.includes('Amount - ')
    ) {
      if (inputValue === '1') {
        setMessages([...messages,  "me: " + inputValue, sendMessage]);
      }
      if (inputValue === 'a') {
        const newMessage = `
        You are sending Matic Tokens \n
        💥 Send the amount 💥\n
        e.g. Amount - XX \n
        e.g. Amount - 0.1
        `;
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
      if (inputValue === 'b') {
        const newMessage = `
        You are sending OP Tokens \n
        💥 Send the amount 💥\n
        e.g. Amount - XX \n
        e.g. Amount - 0.1
        `; 
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
      if (inputValue === 'c') { 
        const newMessage = `
        You are sending GNO Tokens \n
        💥 Send the amount 💥\n
        e.g. Amount - XX \n
        e.g. Amount - 0.1
        `;
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
      if (inputValue === 'd') { 
        const newMessage = `
        You are sending ETH Tokens \n
        💥 Send the amount 💥\n
        e.g. Amount - XX \n
        e.g. Amount - 0.1
        `;
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
      if (inputValue.includes('Amount - ')) {
        const amt = inputValue.split('- ');
        let newMessage = `
          You are sending ` + amt[1] + ` tokens \n
          💥 Send the Recipients Address 💥\n
        `;
        setAmount(amt[1]);
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
      if (inputValue.includes('0x')) {
        const addr = inputValue;
        // const printAddr = addr?.length > 5 ? `${addr.substring(0, 3)}...` : addr;
        let start = addr.substring(0, 5);
        let end = addr.slice(-4);
        const printAddr = start + "..." + end;
        let newMessage = `You are sending ` + amount + ` tokens \n to ` + printAddr + `.\n Send "Confirm" to initiate the transaction!`;
        setRecipientAddress(addr);
        var left = inputValue.substring(0, 20);
        var right = inputValue.substring(20);
        var result = left + '\n' + right;
        setMessages([...messages,  "me: " + result, newMessage]);
      }
      if (inputValue === 'Confirm') {
        const addr = inputValue;
        let newMessage = `Processing Transaction!`;
        alert("Amt: " + amount + " Addr: " + recipientAddress)
        sendTokens();
        setMessages([...messages,  "me: " + inputValue, newMessage]);
      }
    } else {
      setMessages([...messages, "me: " + inputValue]);
    }
    setInputValue('');
    
  }

  return (
    <div className={containerStyle}>
      <h1 className={headerStyle}>Butterfly</h1>
      
      {
        (!loggedIn)
        ? <button className={buttonStyle} onClick={login}>Login</button>
        : <div>{userData}<button className={buttonStyle} onClick={logout}>Logout</button></div>
      }

      <div className="flex justify-center items-center h-screen bg-black">
        <div className="flex">
            <div className="flex flex-col ml-8">
              <video 
                className="w-64 h-64 md:w-96 md:h-96 lg:w-128 lg:h-128 rounded-lg"
                style={{ aspectRatio: '9 / 16' }}
                src="/video/test.mp4" 
                controls 
                autoPlay 
                muted
                loop
              >
                  Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex flex-col ml-4">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"><h3>↑ previous</h3></button>
              &nbsp;
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"><h3>like</h3></button>
              &nbsp;
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"><h3>upload</h3></button>
              &nbsp;
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"><h3>share</h3></button>
              &nbsp;
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"><h3>↓ next</h3></button>
            </div>
        </div>
      </div>

      {
        // !smartAccount && !loading && <button className={buttonStyle} onClick={login}>Login</button>
      }
      {
        // loading && <p>Loading account details...</p> 
      }
      {
        !!smartAccount 
          && 
        (
          <div>
            <h3>Smart account address:</h3>
            <p>{smartAccount.address}</p>
            <button className={buttonStyle} onClick={logout}>Logout</button>
            <div className={tokenBalancesContainerStyle}>
            {
              balances.map((balance, index) => {
                return (
                  <div key={index} >
                    <p>{balance.contract_name} - {balance.contract_ticker_symbol} - {ethers.utils.formatUnits(balance.balance, balance.contract_decimals)}</p>
                  </div>
                )
              })
            }
            </div>
            <div className={formContainerStyle}>
              <p>Choose which token you would like to send</p>
              <select className={selectStyle} name='tokens' id='tokens' onChange={onTokenChange}>
                {
                  tokens.map((token, index) => (
                    <option
                      key={index}
                      value={index}
                    >{token.symbol}</option>
                  ))
                }
              </select>
              <p>Choose which token to pay gas in</p>
              <select className={selectStyle} name='tokens' id='tokens' onChange={onGasTokenChange}>
                {
                  balances.map((balance, index) => (
                    <option
                    key={index}
                    value={index}
                    >{balance.contract_ticker_symbol}</option>
                  ))
                }
              </select>
              <button className={buttonStyle} onClick={sendTokens}>sendTokens</button>
            </div>
            <div className={chatStyle}>
              {/* <div className={chatBoxStyle}> */}
              <div className={messageContainerStyle}>
                {messages.map((message, index) => (
                  (message.includes('me:'))
                  ?
                    <div className={sentStyle} key={index}>
                      {(message.split(': '))[1]}
                    </div>
                  :
                    <div className={receivedStyle} key={index}>
                      {message}
                    </div>
                ))}
              </div>
              <div className={inputContainerStyle}>
                <input
                  className={inputStyle}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button className={buttonStyle} onClick={handleSubmit}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

const chatStyle = css`
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 400px;
  height: 500px;
  padding: 10px;
  display: flex;
  flex-direction: column;
`;

const messageContainerStyle = css`
  height: 450px;
  overflow-y: scroll; /* Add overflow-y:scroll to create a vertical scroll bar */
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 20px;
  overflow-y: scroll;
`;

const receivedStyle = css`
  background-color: #0084ff;
  color: #fff;
  padding: 10px 15px;
  border-radius: 20px;
  min-width: 96%;
  max-width: 96%;
  margin-right: 10px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
  position: relative;
  white-space:pre-wrap;
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -8px;
    border-style: solid;
    border-width: 0 8px 8px 0;
    border-color: transparent #0084ff transparent transparent;
  }
`

const sentStyle = css`
  background-color: #eaeaea;
  color: #000;
  padding: 10px 15px;
  border-radius: 20px;
  min-width: 96%;
  max-width: 96%;
  margin-right: 10px;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
  position: relative;
  white-space:pre-wrap;
  text-align: right;
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -8px;
    border-style: solid;
    border-width: 0 8px 8px 0;
    border-color: transparent #0084ff transparent transparent;
  }
`

const inputContainerStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; /* Add margin-top:auto to move the inputContainer to the bottom of the chat */
`;

const inputStyle = css`
  padding: 10px;
  border-radius: 5px;
  border: none;
  flex-grow: 1;
  margin-right: 10px;
`;

const buttonStyle = css`
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const containerStyle = css`
  width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 100px;
  @media (max-width: 900px) {
    width: 100%;
  }
`

const headerStyle = css`
  font-size: 44px;
  color: #4CAF50;
`

const tokenBalancesContainerStyle = css`
  margin-top: 15px;
`

const formContainerStyle = css`
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  display: none;
`;

const selectStyle = css`
  width: 230px;
  padding: 7px 11px;
  margin: 0px 0px 9px;
  border-radius: 10px
`