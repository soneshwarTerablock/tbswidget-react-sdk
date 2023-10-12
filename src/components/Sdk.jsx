import React, { Fragment, useEffect, useRef, useState } from "react";
import { TokenList } from "../assets/tokens_by_chain";
import { Contract, ethers } from "ethers";
import { switchNetwork } from "../contexts/metamask";
import { networks } from "../config";
import { toast } from "react-toastify";
import useEffectAsync from "../helpers/useEffectAsync";
import { getBridgeTxn, getSwappedPrice, getSwapData, isTransactionMined, TransferPathWay, getCrossSwapData } from "../helpers/swapCentral";
import { toastError, toastProcess, toastSuccess } from "../helpers/alertpopup";
import SelectNetwork from "./SelectNetwork";
import Web3 from "../contexts/web3";
import axios from "axios";
import Loader from "./Loader";
import TerablockLogo from "./TBCLogo";
import {erc20Abi} from "../assets/abis/erc20Abi";
import {bridgeJson} from "../assets/abis/Bridge";
import { chain } from "../assets/chainlist";

function Swidget({text, color, fromChains, toChains, fromTokens, toTokens, userAddress, provider, styles, background, bgStyles}) {

  const bridgeABI = bridgeJson.abi;
  const [step, setStep] = useState(0);
  const [pathway, setPathway] = useState([]);
  const [pathStatus, setPathStatus] = useState({});
  const [pathAmt, setPathAmt] = useState([]);
  const [fromNetworks, setFromNetworks] = useState([]);
  const [toNetworks, setToNetworks] = useState([]);
  const [networkData, setNetworkData] = useState({});
  const [isFromNetworkOpen, setIsFromNetworkOpen] = useState(false);
  const [isToNetworkOpen, setIsToNetworkOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(fromChains && fromChains.length == 0 ? networks[1] : networks.find((el) => el?.id == (fromChains.includes(56) ? 56 : fromChains[0])));
  const [selectedToNetwork, setSelectedToNetwork] = useState(toChains && toChains.length == 0 ? networks[2] : networks.find((el) => el?.id == (toChains.includes(137) ? 137 : toChains[0])));
  const [fromTokenAmount, setFromTokenAmount] = useState(1);
  const [toTokenAmount, setToTokenAmount] = useState(0);
  const [isFromCoinOpen, setIsFromCoinOpen] = useState(false);
  const [fromCoinSearch, setFromCoinSearch] = useState("");
  const [toCoinSearch, setToCoinSearch] = useState("");
  const [coins, setCoins] = useState(fromTokens == undefined || fromTokens.length == 0 ? TokenList : TokenList.filter((el) => fromTokens.includes(el?.coinId)));
  const [toCoins, setToCoins] = useState(toTokens == undefined || toTokens.length == 0 ? TokenList : TokenList.filter((el) => toTokens.includes(el?.coinId)));
  const [selectedCoin, setSelectedCoin] = useState(coins.length != 0 && coins?.filter((el) => el?.symbol === "USDC" || el?.symbol == "TBC" || el?.symbol == "ETH" || el?.symbol == "MATIC" )?.length != 0 ? coins?.filter((el) => el?.symbol === "USDC" || el?.symbol == "TBC" || el?.symbol == "ETH" || el?.symbol == "MATIC" )[0] : coins[0]);
  const [selectedToCoin, setSelectedToCoin] = useState(toCoins.length != 0 && toCoins?.filter((el) => el?.symbol === "USDC" || el?.symbol == "TBC" || el?.symbol == "ETH" || el?.symbol == "MATIC" )?.length != 0 ? toCoins?.filter((el) => el?.symbol === "USDC" || el?.symbol == "TBC" || el?.symbol == "ETH" || el?.symbol == "MATIC" )[0] : toCoins[0]);

  const [loading, setLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [fromTokenData, setFromTokenData] = useState({});
  const [isconvert, setIsConvert] = useState(false);
  const [isPendingSwap, setIsPendingSwap] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [getRecieve, setGetRecieve] = useState(false);
  const [isTokenRelease, setIsTokenRelease] = useState(false);
  const [isToCoinOpen, setIsToCoinOpen] = useState(false);
  const [swapHash, setSwapHash] = useState();
  const [getWallet, setgetWallet] = useState(false);
  const [pathProcess, setPathProcess] = useState();
  const [approveHash, setApproveHash] = useState(null);
  const [approvalHashes, setApprovalHashes] = useState([]);
  const [error, setError] = useState(false);

  const [showProcess, setShowProcess] = useState(0);
  const [loadingChain, setLoadingChain] = useState(false);

  const [isbuySwap, setIsBuySwap] = useState(false);
  const [est_Error, setEst_Error] = useState(false);
  
  const [changeProcess, setChangeProcess] = useState(false)
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const previousTxnHash = useRef(null);
  const [showMax, setShowMax] = useState(false);
  const [showTotalTime, setTotalTime] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [txnFee, setTxnFee] = useState(0);
  const previousNetwork = useRef(null);
  const [nativeToken, setNativeToken] = useState({ethereum: 1, binancecoin: 1, matic: 1});
  const [exchangeRate, setExcRate] = useState({ethereum: 1, binancecoin: 1, matic: 1});

  const [hovering, setHovering] = useState(false);

  const handleUpdateProcess = (ind, stepname) => {
    setPathProcess((prev) => ({...prev, [`${ind}`]: {...prev[ind], [stepname]: true}}));
    setChangeProcess(!changeProcess);
  }

  useEffect(() => {
    setPathAmt([]);
    setPathProcess([]);
    setPathStatus([]);
    setIsConvert(false);
    setIsPendingSwap(false);
    setIsBuySwap(false);
    setIsSwapped(false);
    setIsTokenRelease(false);
    setSwapHash(null);
    setStep(0);
    setSeconds(0);
    setApprovalHashes([]);
    setApproveHash(null);
    setChangeProcess(false);
    setPathway([]);
    setShowProcess(0);
    setIsActive(false);
    setTotalTime(0);
    setTxnFee(0);
  },[error]);

  const getEthPrice = async () => {
    try{
        let allTokenPrice = {}
    let allExcPrice = {};
    for (let i=0; i<networks.length; i++){
      axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${networks[i]?.slug}&vs_currencies=eth`).then((res) => {
        // ethPriceRef.current = res?.data?.ethereum?.usd;
        let result = res?.data?.[networks[i]?.slug]?.eth;
        if (networks[i]?.id == 1){
          allExcPrice.ethereum = result;
        }else if (networks[i]?.id == 56){
          allExcPrice.binancecoin = result;
        }else {
          allExcPrice.matic = result;
        }
      }).catch((err) => {
        console.log("Exchange Price err");
      })
      axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${networks[i]?.slug}&vs_currencies=usd`).then((res) => {
        // ethPriceRef.current = res?.data?.ethereum?.usd;
        let result = res?.data?.[networks[i]?.slug]?.usd;
        setEthPrice(res?.data?.[networks[i]?.slug]?.usd);
        if (networks[i]?.id == 1){
          allTokenPrice.ethereum = result;
        }else if (networks[i]?.id == 56){
          allTokenPrice.binancecoin = result;
        }else {
          allTokenPrice.matic = result;
        }
      }).catch((err) => {
        console.log("Native Token Price err");
      })
    }
    console.log("allTokenPrice: ",allTokenPrice);
    setNativeToken(allTokenPrice);
    setExcRate(allExcPrice);
    }catch(err){
        console.log('err: ', err.message)
    }
  }

  useEffect(() => {
    getEthPrice();
  },[selectedNetwork])

  const handleUpdateHashes = (hash) => {
    let temp = approvalHashes;
    temp.push(hash);
    setApprovalHashes(temp);
    console.log("update hash")
  }
  
    useEffect(() => {
      let interval = null;
      if (isActive && seconds > 400) {
        clearInterval(interval);
        setSeconds(0);
      } else if (isActive) {
        interval = setInterval(() => {
          setSeconds(seconds => seconds + 1);
        }, 1000);
      }else {
        clearInterval(interval);
        setSeconds(0);
      }
      return () => clearInterval(interval);
    }, [isActive, seconds]);

  useEffect(()=> {
    setPathProcess(pathProcess);
  },[changeProcess])


   useEffect(() => {
    setTotalTime(seconds);
   },[seconds != 0 && isActive == true])

  const getFromData = async () => {
    try {
      // console.log("getData from function: ");
      if (selectedCoin && selectedNetwork && networkData){
        const fromTokenContract = await new Contract(selectedCoin?.address[selectedNetwork?.id], erc20Abi, networkData?.provider);
        let approvedAmount = 0;
        let balance = 0;
        if (selectedCoin?.address[selectedNetwork?.id].toLowerCase() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
          approvedAmount = 1000000000;
          balance = Number(await networkData?.provider.getBalance(networkData?.account)) / 10 ** 18;
        } else {
          try {
            approvedAmount = Number(await fromTokenContract.allowance(networkData?.account, networkData.proxy)) / 10 ** selectedCoin.decimals[selectedNetwork?.id];
            console.log();
            balance = Number(await fromTokenContract.balanceOf(networkData?.account)) / 10 ** selectedCoin?.decimals[selectedNetwork?.id];
  
            if (isNaN(balance)) {
              let web3 = Web3.instance;
              const contract = new web3.eth.Contract(erc20Abi, selectedCoin?.address[selectedNetwork?.id]);
              approvedAmount = Number(await contract.methods.allowance(networkData?.account, selectedCoin?.address[selectedNetwork?.id])) / 10 ** selectedCoin?.decimals[selectedNetwork?.id];
  
              balance = Number(await contract.methods.balanceOf(networkData?.account).call());
            }
          } catch (err) {
            console.log("reached error in amount and balance: ", err);
          }
        }
        setFromTokenData({
          approvedAmount: approvedAmount,
          balance: balance,
        });
      }
    } catch (err) {
      console.log("reached code err to getFromData function: ", err);
    }
  };

  const addCommas = (number) => {
    // console.log("Number in addCommans: ", number);
    if (isNaN(number)) {
      setToTokenAmount(0);
      return;
    }
    let parts = number.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1] || "";

    let reversedInteger = integerPart.split("").reverse().join("");
    // console.log("reversed: ", reversedInteger);
    if (isNaN(reversedInteger)) {
      setToTokenAmount(0);
      return;
    }
    let commaInteger = reversedInteger.match(/\d{1,3}/g)?.join(",");

    let result = commaInteger.toString().split("").reverse().join("");
    if (decimalPart !== "") {
      result += "." + decimalPart;
    }

    // Return the final result
    return result;
  };

  useEffect(() => {
    fromTokenData.approvedAmount >= fromTokenAmount ? setIsApproved(true) : setIsApproved(false);
  },[fromTokenData])

  let timerId;
  useEffect(() => {
    clearTimeout(timerId);
    setGetRecieve(false);
    timerId = setTimeout(async () => {
      try {
        setLoading(true);
        getEstimatedExchangePrice();
        setGetRecieve(true);
      } catch (error) {
        console.error("Error:", error);
        setGetRecieve(false);
      }
    }, 1200);
    return () => clearTimeout(timerId);
  }, [fromTokenAmount, selectedCoin, selectedToCoin]);

  const handleChange = (event) => {
    setLoading(true);
    setFromTokenAmount(Number(event.target.value));
  };

  function useOutsideAlerter(ref, func) {
    useEffect(() => {
      function handleClickOutside(event) {
        if (ref.current && !ref.current.contains(event.target)) {
          func();
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  useEffect(() => {
    if (fromTokens && selectedCoin?.address[selectedNetwork?.id] == undefined && selectedNetwork?.id != null){
      setSelectedCoin(TokenList.filter((el) => el?.address[selectedNetwork?.id] != undefined && (el?.symbol == "MATIC" || el?.symbol == "TBC" || el?.symbol == "ETH"))[0]);
    }
  }, [isFromCoinOpen])

  useEffect(() => {
    if (toTokens && selectedToCoin?.address[selectedToNetwork?.id] == undefined){
      setSelectedToCoin(TokenList.filter((el) => el?.address[selectedToNetwork?.id] != undefined && (el?.symbol == "MATIC" || el?.symbol == "TBC" || el?.symbol == "ETH"))[0]);
    }
  }, [isToCoinOpen])

  let ethereum = null;
  if (typeof window !== "undefined") {
    ethereum = window.ethereum;
  }

  const loadWallet = async () => {
    try {
      let Provider = provider == undefined ? new ethers.providers.Web3Provider(ethereum) : provider;
      const accounts = await Provider.send("eth_requestAccounts", []);
      const { chainId } = await Provider.getNetwork();
      const network = {
        account: accounts[0],
        provider: Provider,
        chainId: chainId,
        chainName: chain[chainId]?.name,
        graphApi: chain[chainId]?.graphApi,
        proxy: chain[chainId]?.proxy,
        icon: chain[chainId]?.icon,
        txApi: chain[chainId]?.txApi,
      };
      return network;
    } catch (err) {
      console.log("error in load Wallet: ", err?.message);
      return;
    }
  };

  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    ethereum.on("chainChanged", () => {
      loadWallet()
        .then((res) => {
          setNetworkData(res);
        })
        .catch((err) => {
          console.log("chain not connected on Chain Change!");
        });
    });
    ethereum.on("accountsChanged", () => {
      loadWallet()
        .then((res) => {
          setNetworkData(res);
        })
        .catch((err) => {
          console.log("chain not connected on account Change!");
        });
    });
  }

  useEffect(() => {
    loadWallet()
      .then((res) => {
        setNetworkData(res);
        let allfromnetworks = [];
        let alltonetworks = [];
        let fromnet = [];
        let tonet = [];
        for (let i = 0; i < networks.length; i++) {
          if (Object.keys(selectedCoin?.address).includes(`${networks[i]?.id}`)) {
            allfromnetworks.push(networks[i]);
            fromnet.push(networks[i]?.id);
          }
          if (Object.keys(selectedToCoin?.address).includes(`${networks[i]?.id}`)) {
            alltonetworks.push(networks[i]);
            tonet.push(networks[i]?.id);
          }
        }
        setFromNetworks(fromnet);
        setSelectedNetwork(allfromnetworks.filter((el) => el?.id == 56).length != 0 ? allfromnetworks.filter((el) => el?.id == 56)[0] : allfromnetworks[0]);
        previousNetwork.current = allfromnetworks.filter((el) => el?.id == 56).length != 0 ? allfromnetworks.filter((el) => el?.id == 56)[0] : allfromnetworks[0];
        setToNetworks(tonet);
        setSelectedToNetwork(alltonetworks[0]);
        setgetWallet(true);
      })
      .catch((err) => {
        toastError("Not Network Detected!");
      });
  }, []);

  useEffect(() => {
    setLoadingChain(false);
    setShowMax(true);
  }, [selectedNetwork?.id == networkData?.chainId]);

  useEffect(() => {
    if (selectedNetwork?.id != networkData?.chainId){
      setShowMax(false);
    }else {
      setShowMax(true);
    }
    previousNetwork.current = selectedNetwork;
  },[selectedNetwork])



  useEffect(() => {
    if (selectedCoin && selectedNetwork){
        let network = Object.keys(selectedCoin?.address).map((el) => (Number(el)));
        if (selectedCoin?.address[selectedNetwork?.id] == undefined){
        let allnetworks = [];
        for (let i=0; i<network?.length; i++){
            allnetworks.push(networks.find(el => el?.id == network[i]));
        }
        setFromNetworks(network);
        setSelectedNetwork(networks.filter((el) => el?.id == fromChains[0])[0]);
        
        console.log("on different chain: ",network, selectedNetwork?.id);
        }else {
            let network = Object.keys(selectedCoin?.address).map((el) => (Number(el)));
            let allnetworks = [];
            for (let i=0; i<network?.length; i++){
                allnetworks.push(networks.find(el => el?.id == network[i]));
            }
            setFromNetworks(network);
            console.log("already on same network: ",network, selectedNetwork?.id)
            if (selectedNetwork?.id == selectedToNetwork?.id && selectedCoin?.symbol == selectedToCoin?.symbol){
                let toCoin = TokenList.filter((el) => el?.symbol != selectedCoin?.symbol && el?.address[selectedNetwork?.id] != undefined)[0];
                setSelectedToCoin(toCoin);
            }
        }
    }
  }, [selectedCoin]);

  useEffect(() => {
    if (selectedToCoin && selectedToNetwork){
        let network = Object.keys(selectedToCoin?.address).map((el) => (Number(el)));
    if (selectedToCoin?.address[selectedToNetwork?.id] == undefined){
      let allnetworks = [];
      for (let i=0; i<network?.length; i++){
        allnetworks.push(networks.find(el => el?.id == network[i]));
      }
      setToNetworks(network);
      setSelectedToNetwork(networks.filter((el) => el?.id == network[0])[0]);
      
      console.log("on different chain: ",network, selectedNetwork?.id);
    }else {
      let network = Object.keys(selectedToCoin?.address).map((el) => (Number(el)));
      let allnetworks = [];
      for (let i=0; i<network?.length; i++){
        allnetworks.push(networks.find(el => el?.id == network[i]));
      }
      setToNetworks(network);
      console.log("already on same network: ",network, selectedToNetwork?.id)
    }
    }
  }, [selectedToCoin]);

  useEffect(() => {
    getFromData();
  }, [selectedCoin, networkData, fromTokenAmount, selectedNetwork]);

  useEffect(() => {
    setLoading(true);
    getEstimatedExchangePrice();
  }, [selectedNetwork, selectedToNetwork]);


  useEffectAsync(async () => {
    try{
      let check = Object.keys(pathStatus).filter((el) => pathStatus[el] === false).length;
      if (check === 0) return;

      let ind = Object.values(pathStatus).indexOf(false);
      let temp = pathway[ind];
      let network = selectedNetwork;

      if (ind == 0 && temp.split(" ")[0] == "swap"){
        let fromCoin = coins?.filter((el) => el?.symbol == temp?.split(" ")[1])[0];
        let toCoin = toCoins?.filter((el) => el?.symbol == temp?.split(" ")[2])[0];
        console.log(fromCoin, toCoin);

        try{
          await handleSwap(fromCoin, toCoin, network, pathAmt[ind], ind, check);
        }catch(err){
          setStep(0);
          setError(true);
        }
      }else if (temp.split(" ")[0] == "bridge"){
        try{
          await handleBridge(pathAmt[ind], ind, check, userAddress);
        }catch(err){
          console.log("Handle bridge error")
          setError(true);
          setStep(0);
        }
      }else if (temp.split(" ")[0] == "swap_and_bridge"){
        try{
          setIsActive(false);
          await handleOneClickSwap(pathAmt[ind], ind, check);
        }catch(err){
          console.log("Handle onClick swap error");
          setError(true);
          setStep(0);
          setIsActive(false);
        }
      }
    }catch(err){
      toastError("Error Occured In trasaction Process");
      toast.dismiss(2);
      setStep(0);
      setError(true);
    }
  }, [pathStatus]);

  const handleOneClickSwap = async (fromamount, pathInd, check) => {
    try {
      let fromCoin = coins?.filter((el) => el.symbol == selectedCoin?.symbol)[0];
      let toCoin = coins?.filter((el) => el?.symbol == selectedToCoin?.symbol)[0];
      let network = {selectedNetwork: selectedNetwork, selectedToNetwork: selectedToNetwork}

      let res = await getCrossSwapData(fromCoin, toCoin, network, fromamount, networkData);

      // console.log("res in cross_chain_swap:::::", res);
      await sendOneClickTransaction(res, selectedNetwork, pathInd, check);
    } catch (err) {
      toastError(`${err?.message.split("(")[0]}`);
      setStep(0);
      setError(true);
    }
  }
  const handleBridge = async (fromamount, pathInd, check, address) => {
    const usdc = coins?.filter((el) => el?.symbol == "USDT")[0];
    try {
      let tx = null;
      tx = await getBridgeTxn(fromamount, networkData, selectedNetwork, selectedToNetwork, selectedToCoin, address);
      let res = {
        selectedFromToken: usdc,
        selectedToToken: usdc,
        tx: tx,
        fromAmount: fromamount + "",
      };
      sendBridgeTxn(res, selectedNetwork, pathInd, check);
    } catch (err) {
      toastError(`${err?.message.split("(")[0]}`);
      setStep(0);
      console.log("error in handleBridge: ", err.message);
      setError(true);
    }
  };

  const handleSwap = async (fromCoin, toCoin, network, fromAmt, pathInd, check) => {
    try {
      let res = await getSwapData(fromCoin, toCoin, network, fromAmt, networkData);
        console.log("swapData: ", res);
      sendTransaction(res, network, pathInd, check);
    } catch (err) {
      toastError(`${err?.message.split("(")[0]}`);
      setStep(0);
      setError(true);
    }
  };

  const getTransactionReceiptMined = (txHash, type, network, check) => {
    const pathInd = 0;
    const interval = setInterval(function () {
      isTransactionMined(txHash, network).then((res) => {
        // console.log("res: in getTransaction Mined: ", res);
        if (res) {
          clearInterval(interval);
          if (res.status == 1) {
            toast.dismiss(2);
            if (type === "continue") {
              // console.log("txnHash in getTransactionRecieptMined::::::::: ", txHash);
             if (pathway[0].split(" ")[0] == "swap_and_bridge" ){
              if (selectedToCoin?.symbol == "USDT") {
                handleUpdateProcess(pathInd, "bridge");
              }else {
                handleUpdateProcess(pathInd, "swap");
              }
             }else if (pathway[0].split(" ")[0] == "swap"){
              handleUpdateProcess(pathInd, "release");
              setIsActive(false);
             }else if (pathway[0].split(" ")[0] == "bridge"){
              if (selectedToCoin?.symbol == "USDT"){
                handleUpdateProcess(pathInd, "bridge");
              }else {
                handleUpdateProcess(pathInd, "swap");
              }
             }
             setIsActive(false);

            } else {
              setIsApproved(true);
              setApproveHash(txHash);
            }
            toastSuccess("Transaction Successful");
            toast.dismiss();
            setIsTokenRelease(true);
            clearInterval(interval);
          } else {
            toast.dismiss(2);
            toastError("Transaction Failed");
            setStep(0);
            setError(true);
          }
        } else {
          console.log("not in res: ", "in else condition");
        }
      });
    }, 3000);
  };
  
  const calculateTxnFee = (txn) => {
    try{
      let feeInGwei = ethers.utils.formatUnits(txn.gasPrice.mul(txn.gasLimit), "gwei");
      let feeValue = feeInGwei / (10 ** 9);
      if (networkData?.chainId == 1){
        console.log("fee in eth ", feeValue);
        feeValue = feeValue * nativeToken?.ethereum;
      }else if (networkData?.chainId == 56){
        console.log("fee in bnb: ", feeValue * exchangeRate?.binancecoin);
        feeValue = feeValue * exchangeRate?.binancecoin * nativeToken?.binancecoin
      }else if (networkData?.chainId == 137){
        console.log("fee in matic: ", feeValue * exchangeRate?.matic);
        feeValue = feeValue * exchangeRate?.matic * nativeToken?.matic
      }
      setTxnFee(feeValue);
    }catch(err){
      console.log(err.message);
      setError(true);
    }
  }

  function ToChainGetTxnHash(txHash) {

    function runWithInterval() {
      return new Promise((resolve) => {
        let startTime = Date.now();
        let endTime = startTime + 400000; // 1 min 40 sec
  
        function handleTransactionHistory() {
          // Assuming you have a function called handleTransactionHistory() that returns a promise with the result
          return new Promise((resolve, reject) => {
            // console.log("api url : ----------------", `${process.env.NEXT_PUBLIC_BACKEND_API}/gettransactions/${user?.attributes?.ethAddress}`)
            axios
              .get(`https://bwapi.terablock.com/status?hash=${previousTxnHash?.current}`)
              .then((response) => {
                let results = response.data;
                resolve(results); // Resolve the promise with the sorted array list
              })
              .catch((err) => {
                console.log(err);
                reject(err); // Reject the promise if there is an error during the API call
              });
          });
        }
  
        function performIteration() {
          if (Date.now() < endTime) {
            handleTransactionHistory(txHash)
              .then((result) => {

                if (result?.status == "success" && result?.data?.processed){
                  console.log("results: ", result);
                  if (pathway[0].split(" ")[0] == "bridge" && !pathProcess[0]['convert']){
                    handleUpdateProcess(0, 'convert');
                  }else if (pathway[0].split(" ")[0] == "swap_and_bridge"){
                    if (!pathProcess[0]['bridge'] && selectedToCoin?.symbol != "USDT"){
                      handleUpdateProcess(0, "bridge");
                    }
                  }
                  if (result?.data?.releaseHash){
                    resolve(result?.data?.releaseHash);
                    return;
                  }else {
                    setTimeout(performIteration, 5000);
                  }
                }else {
                  if (!pathProcess[0]['convert'] && selectedToCoin?.symbol == "USDT"){
                    handleUpdateProcess(0, "convert");
                  }
                  console.log("result but not succeeded: ", result);
                  setTimeout(performIteration, 5000);
                }
              })
              .catch((error) => {
                console.error(error); // Log any error that occurs during the task
                performIteration(); // Continue to the next iteration
              })
          } else {
            resolve(false); // Resolve the outer promise with false if the time interval is exceeded
            return;
          }
        }
  
        performIteration(); // Start the first iteration
      });
    }
    return runWithInterval();
  }

  const sendBridgeTxn = async (data, network, pathInd, check) => {
    try {
      if (network?.id != networkData?.chainId) {
        loadWallet().then(async (res) => {
          if (res?.provider){
          const provider = res.provider;
          const signer = provider.getSigner();
          console.log("signing Done");
          const tx = await signer.sendTransaction(data.tx);
          handleUpdateProcess(pathInd, 'approval');
          setIsActive(true);
          console.log("Bridge Transaction Details: ", tx); 
          toastProcess("Transaction in Progress");
          calculateTxnFee(tx);
          handleUpdateHashes(tx?.hash);
          await new Promise(resolve => setTimeout(resolve, 5000));
          previousTxnHash.current = tx?.hash;
          ToChainGetTxnHash(tx?.hash).then((res) => {
            if (res === false){
              toastError("Transaction not Detected!");
              toast.dismiss(2);
              setStep(0);
              setError(true);
              return;
            }else {
              // find the transaction within 30 seconds of time and with the given user address
              handleUpdateHashes(res);
              // console.log("in if condition hash after bridging in send Txn function: ", res);
              getTransactionReceiptMined(res, "continue", selectedToNetwork, check);
            }
            
          }).catch((err) => {
            toastError("Transaction Error Occured!");
            toast.dismiss(2);
            setStep(0);
            setError(true);
          })
          }
        });
      } else {
        const provider = networkData?.provider;
        const signer = provider.getSigner();
        console.log("signing done");
        const tx = await signer.sendTransaction(data.tx);
        handleUpdateProcess(pathInd, 'approval');
        calculateTxnFee(tx);
        toastProcess("Transaction in Progress");
        console.log("Bridge Transaction Details: ", tx);
        setIsActive(true);

        handleUpdateHashes(tx?.hash);
        await new Promise(resolve => setTimeout(resolve, 5000));
        previousTxnHash.current = tx?.hash;
          ToChainGetTxnHash(tx?.hash).then((res) => {
            if (res === false){
              toastError("Transaction not Detected!");
              toast.dismiss(2);
              setStep(0);
              setError(true);
              return;
            }else {
              // find the transaction within 30 seconds of time and with the given user address
              handleUpdateHashes(res);
              // console.log("in if condition hash after bridging in send Txn function: ", res);
              getTransactionReceiptMined(res, "continue", selectedToNetwork, check);
            }
            
          }).catch((err) => {
            toastError("Transaction Error Occured!");
            toast.dismiss(2);
            setStep(0);
            setError(true);
          })
      }
    } catch (err) {
      console.log("err in send BRidgeTxn: ", err?.message);
      toastError(`${err.message.split("(")[0]}`);
      toast.dismiss(2);
      setStep(0);
      setError(true);
    }
  };

  const sendOneClickTransaction = async (data, network, pathInd, check) => {
    try {
      if (selectedNetwork?.id != networkData?.chainId) {
        // console.log("if --------- condition: ");
        loadWallet().then(async (res) => {
          const provider = res?.provider;
          const signer = provider?.getSigner();
          // console.log("into the signer");
          const tx = await signer?.sendTransaction(data.tx);
          handleUpdateProcess(pathInd, "approval");
          setIsActive(true);
          tx?.wait();
          calculateTxnFee(tx);
          console.log("Swidge Transaction Details: ", tx);
          toastProcess("Transaction in Progress");
          handleUpdateHashes(tx?.hash);
          
          if (selectedToCoin?.symbol != "USDT"){
            handleUpdateProcess(pathInd, "convert");
          }
          previousTxnHash.current = tx?.hash;
          await new Promise(resolve => setTimeout(resolve, 15000));
          ToChainGetTxnHash(previousTxnHash?.current).then((res) => {
            if (res === false){
              toastError("Transaction not Detected!");
              toast.dismiss(2);
              setStep(0);
              setError(true);
              return;
            }else {
              // find the transaction within 30 seconds of time and with the given user address
              handleUpdateHashes(res);
              // console.log("just before Confirm bridge Transaction: ------------");
              getTransactionReceiptMined(res, "continue", selectedToNetwork, check);
            }
          }).catch((err) => {
            toastError("Transaction Error Occured!");
            toast.dismiss(2);
            setStep(0);
            setError(true);
          });
        });
      } else {
        const provider = networkData?.provider;
        const signer = provider.getSigner();
        const tx = await signer.sendTransaction(data.tx);
        handleUpdateProcess(pathInd, "approval");
        setIsActive(true);
        tx.wait();
        calculateTxnFee(tx);
        console.log("Swidge Transaction Details: ", tx);
        toastProcess("Transaction in Progress");
        handleUpdateHashes(tx.hash);
        previousTxnHash.current = tx.hash;
        if (selectedToCoin?.symbol != "USDT"){
          handleUpdateProcess(pathInd, "convert");
        }
        await new Promise(resolve => setTimeout(resolve, 15000));
        ToChainGetTxnHash(previousTxnHash?.current).then((res) => {
          if (res === false){
            toastError("Transaction not Detected!");
            toast.dismiss(2);
            setStep(0);
            setError(true);
            return;
          }else {
            // find the transaction within 30 seconds of time and with the given user address
            handleUpdateHashes(res);
            // console.log("just before Confirm bridge Transaction: ------------");
            getTransactionReceiptMined(res, "continue", selectedToNetwork, check);
          }
        }).catch((err) => {
          toastError("Transaction Error Occured!");
          toast.dismiss(2);
          setStep(0);
          setError(true);
        });
      }
    } catch (err) {
      toastError("Transaction Rejected");
      toast.dismiss(2);
      setStep(0);
      setError(true);
    }
  };

  const sendTransaction = async (data, network, pathInd, check) => {
    // console.log("In------------ send transaction: ", {data, network, pathInd})
    try {
      // const provider = new ethers.providers.JsonRpcProvider(network?.rpc_url);
      console.log("into send Txn if: ");
      if (network?.id != networkData?.chainId) {
        loadWallet().then(async (res) => {
          const provider = res?.provider;
          const signer = provider.getSigner();
          const tx = await signer.sendTransaction(data.tx);
          handleUpdateProcess(pathInd, 'approval');
          tx.wait();
          calculateTxnFee(tx);
          setIsActive(true);
          toastProcess("Transaction in Progress");
          handleUpdateHashes(tx.hash);
          handleUpdateProcess(pathInd, "convert");
          getTransactionReceiptMined(tx.hash, "continue", network, check);
        });
      } else {
        // console.log("into Txn Else: ", data);
        const provider = networkData?.provider;
        // console.log("provider: ",provider);
        const signer = await provider.getSigner();
        // console.log("signer: ", signer);
        // console.log("signing done");
        const tx = await signer.sendTransaction(data.tx);
        handleUpdateProcess(pathInd, 'approval');
        tx.wait();
        calculateTxnFee(tx);
        setIsActive(true);
        toastProcess("Transaction in Progress");
        handleUpdateHashes(tx.hash);
        handleUpdateProcess(pathInd, "convert");
        getTransactionReceiptMined(tx.hash, "continue", network, check);
      }
    } catch (err) {
      toastError("Transaction Rejected");
      toast.dismiss(2);
      setStep(0);
      setError(true);
      setIsActive(false);
    }
  };

  const parseEtherUnits = (decimals) => {
    return 10 ** decimals
  }
  
  const getEstimatedExchangePrice = async () => {
    try{
        if (selectedNetwork?.id == undefined || selectedToNetwork?.id == undefined){
            return;
          }
         
          let allSwap_Bridge_amt = [];
          if (selectedNetwork?.id == selectedToNetwork?.id && selectedCoin?.symbol != selectedToCoin?.symbol) {
            // console.log("condition 1");
            allSwap_Bridge_amt.push(fromTokenAmount);
            let res = await getSwappedPrice(selectedCoin, selectedToCoin, selectedNetwork, fromTokenAmount);
      
            if (res == "error") {
              setLoading(true);
              setEst_Error(true);
              return;
            }
            if (Number(res?.swap_quote / parseEtherUnits(res?.dest_decimals)) <= 0 || isNaN(Number(res?.swap_quote / parseEtherUnits(res?.dest_decimals)))){
              setEst_Error(true);
              return;
            }
            setToTokenAmount(Number(res?.swap_quote / parseEtherUnits(res?.dest_decimals)));
            setPathAmt(allSwap_Bridge_amt);
            setEst_Error(false);
            setLoading(false);
            return;
          } else if (selectedNetwork?.id != selectedToNetwork?.id && selectedCoin?.symbol == selectedToCoin?.symbol) {
      
            if (selectedCoin?.symbol == "USDC") {
             
              allSwap_Bridge_amt.push(fromTokenAmount - Number(fromTokenAmount * 1.5/100));
              
              setToTokenAmount(fromTokenAmount - Number(fromTokenAmount * 1.5/100));
              setPathAmt(allSwap_Bridge_amt);
              setEst_Error(false);
              setLoading(false);
              return;
            } else {
              try {
                const usdc = coins?.filter((el) => el?.symbol == "USDC")[0];
                let newAmt = fromTokenAmount;
                allSwap_Bridge_amt.push(fromTokenAmount);
      
                let coin_to_usdc_swap = await getSwappedPrice(selectedCoin, usdc, selectedNetwork, newAmt);
      
                newAmt = coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals);
              
                allSwap_Bridge_amt.push(coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals));
      
                allSwap_Bridge_amt.push(Number(newAmt - (newAmt * 0.5/100)))
                newAmt = Number(newAmt - (newAmt * 0.5/100))
      
                let usdc_to_coin_swap = await getSwappedPrice(usdc, selectedToCoin, selectedToNetwork, Math.trunc(newAmt));
      
                const finalTokenPrice = usdc_to_coin_swap?.swap_quote / parseEtherUnits(usdc_to_coin_swap?.dest_decimals);
      
                if (Number(finalTokenPrice) <= 0 || isNaN(Number(finalTokenPrice))){
                  setEst_Error(true);
                  return;
                }
      
                setToTokenAmount(Number(finalTokenPrice));
                setPathAmt(allSwap_Bridge_amt);
                setEst_Error(false);
                setLoading(false);
                return;
              } catch (err) {
                setLoading(true);
                setEst_Error(true);
              }
            }
          } else if (selectedNetwork?.id != selectedToNetwork?.id && selectedCoin?.symbol != selectedToCoin?.symbol) {
            if (selectedCoin?.symbol === "USDC") {
              try {
                const usdc = coins?.filter((el) => el?.symbol == "USDC")[0];
                allSwap_Bridge_amt.push(fromTokenAmount);
                allSwap_Bridge_amt.push(Number(fromTokenAmount - (fromTokenAmount * 1.5/100)))
                let newAmt = Number(fromTokenAmount - (fromTokenAmount * 1.5/100))
      
                let usdc_to_coin_swap = await getSwappedPrice(usdc, selectedToCoin, selectedToNetwork, newAmt);
      
                let finalEstimatedPrice = usdc_to_coin_swap?.swap_quote / parseEtherUnits(usdc_to_coin_swap?.dest_decimals);
      
                if (Number(finalEstimatedPrice) <= 0 || isNaN(Number(finalEstimatedPrice))){
                  setEst_Error(true);
                  return;
                }
      
                setToTokenAmount(Number(finalEstimatedPrice));
                setPathAmt(allSwap_Bridge_amt);
                setEst_Error(false);
                setLoading(false);
                return;
              } catch (err) {
                setLoading(true);
                setEst_Error(true);
              }
      
            } else if (selectedToCoin?.symbol === "USDC") {
              console.log("condition 3.2");
              try {
                const usdc = coins?.filter((el) => el?.symbol == "USDC")[0];
      
                allSwap_Bridge_amt.push(fromTokenAmount);
                let coin_to_usdc_swap = await getSwappedPrice(selectedCoin, usdc, selectedNetwork, fromTokenAmount);
                let newAmt = coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals);
                allSwap_Bridge_amt.push(coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals));
      
                const finalEstimatedPrice = (newAmt - (newAmt * 1.5/100));
                if (Number(finalEstimatedPrice) <= 0 || isNaN(Number(finalEstimatedPrice))){
                  setEst_Error(true);
                  return;
                }
                setToTokenAmount(Number(finalEstimatedPrice));
                setPathAmt(allSwap_Bridge_amt);
                setEst_Error(false);
                setLoading(false);
                return;
              } catch (err) {
                setLoading(true);
                setEst_Error(true);
              }
            } else {
              try {
                const usdc = coins?.filter((el) => el?.symbol == "USDC")[0];
                let newAmt = fromTokenAmount;
                allSwap_Bridge_amt.push(fromTokenAmount);
                let coin_to_usdc_swap = await getSwappedPrice(selectedCoin, usdc, selectedNetwork, fromTokenAmount);
      
                newAmt = coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals);
                allSwap_Bridge_amt.push(coin_to_usdc_swap?.swap_quote / parseEtherUnits(coin_to_usdc_swap?.dest_decimals));
      
                allSwap_Bridge_amt.push(newAmt - Number(newAmt * 1.5/100));
                newAmt = newAmt - Number(newAmt * 1.5/100);
      
                let usdc_to_coin_swap = await getSwappedPrice(usdc, selectedToCoin, selectedToNetwork, Math.round(newAmt));
      
                const finalTokenPrice = usdc_to_coin_swap?.swap_quote / parseEtherUnits(usdc_to_coin_swap?.dest_decimals);
                if (Number(finalTokenPrice) <= 0 || isNaN(Number(finalTokenPrice))){
                  setEst_Error(true);
                  return;
                }
                setToTokenAmount(Number(finalTokenPrice));
                setPathAmt(allSwap_Bridge_amt);
                setEst_Error(false);
                setLoading(false);
                return;
              } catch (err) {
                console.log("error in swidging: ", err);
                setLoading(true);
                setEst_Error(true);
              }
            }
          }
      
          if (selectedCoin?.symbol == "USDC") {
            if (Number(fromTokenAmount) < 5){
              setEst_Error(true);
              return;
            }
          }else {
            let {data} = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin?.coinId}&vs_currencies=usd`);
            if (fromTokens && (data[`${selectedCoin?.coinId}`].usd * Number(fromTokenAmount)) < 5){
              setEst_Error(true);
              return;
            }
          }  
    }catch(err){
        console.log("err in price Estimation: ", err.message);
    }
  };

  const approveAmount = async (pathInd, network, fromCoin) => {
    try {
      if (network?.id != networkData?.chainId) {
        loadWallet().then(async (result) => {
          if (fromTokenData.balance < fromTokenAmount){
            return toast.warning("Insufficient Balance!");
          }
          // console.log("result networkData: ", result);
          const Provider = result?.provider;
          const Signer = await Provider.getSigner();
          const fromTokenContract = await new Contract(fromCoin?.address[network?.id], erc20Abi, Signer);
          toastProcess("Confirming Transaction");
          const res = await fromTokenContract.approve(result?.proxy, ethers.utils.parseEther("1000000000"));
          res.wait();
          getTransactionReceiptMined(res.hash, "approved", network, 0);
        });
      } else {
        if (fromTokenData.balance < fromTokenAmount){
          return toast.warning("Insufficient Balance!");
        }
        const Provider = networkData?.provider;
        const Signer = await Provider.getSigner();
        const fromTokenContract = await new Contract(fromCoin?.address[networkData?.chainId], erc20Abi, Signer);
        toastProcess("Confirming Transaction");
        const res = await fromTokenContract.approve(networkData.proxy, ethers.utils.parseEther("1000000000"));
        res.wait();
        getTransactionReceiptMined(res.hash, "approved", network, pathInd, 0);
      }
    } catch (err) {
      toastError(`Transaction Rejected!`);
      toast.dismiss(2);
      setStep(0);
      setError(true);
      console.log("err in swap approve: ", err?.message);
    }
  };

  const handleTokenTransfer = () => {
    if (toTokenAmount <= 20 && selectedToCoin?.symbol == "SPS") {
      toastError("Required a minimum of 20 SPS");
      return;
    }

    if (fromTokenData?.balance < fromTokenAmount){
      toastError("Insufficient Balance to Complete the Transaction");
      return;
    }

    const { pathProcess, pathStatus, transferpathway } = TransferPathWay(selectedNetwork, selectedToNetwork, selectedCoin, selectedToCoin);
    
    console.log({ pathProcess, pathStatus, transferpathway, approvalHashes})

    setStep(2);
    setPathway(transferpathway);
    setPathStatus(pathStatus);
    setPathProcess(pathProcess);
  };

  function OutsideAlerter(props) {
    const wrapperRef = useRef(null);
    useOutsideAlerter(wrapperRef, props.func);

    return <div ref={wrapperRef}>{props.children}</div>;
  }

  let allOptions = [
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Fiat.png",
      name: "Fiat",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: 1,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/ETH.png",
      name: "Ethereum",
      status: true,
      srcChain: fromChains != undefined && fromChains.length != 0 &&  fromChains.includes(1) ? true : false,
      destChain: toChains != undefined && toChains.length != 0 &&  toChains.includes(1) ? true : false,
    },
    {
      id: 56,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/BNB.png",
      name: "BNB Chain",
      status: true,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes(56) ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes(56) ? true : false,
    },
    {
      id: 137,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/MATIC.png",
      name: "Polygon",
      status: true,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes(137) ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes(137) ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/AVAX.png",
      name: "Avalanche",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/ARB.png",
      name: "Arbitrum",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/FTM.png",
      name: "Fantom",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/OP.png",
      name: "Optimism",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/ZKS.png",
      name: "zkSync",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    },
    {
      id: null,
      icon: "https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Sol.png",
      name: "Solana",
      status: false,
      srcChain: fromChains != undefined && fromChains.length != 0 && fromChains.includes("fiat") ? true : false,
      destChain: toChains != undefined && toChains.length != 0 && toChains.includes("fiat") ? true : false,
    }
  ]

  return (
    <div className='w-[100vw] h-[100vh] flex flex-col items-center justify-center py-10 px-10 gap-y-2 relative' style={bgStyles}>
    <img className='w-[100%] h-[100%] absolute blur-lg left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2' src={background}/>
    <div className={`bg-[white] border-[1px] border-[#D0D9F8] relative rounded sm:rounded-lg -z-0 shadow-md h-[640px] mt-2 overflow-hidden mx-0 w-[40vw] min-w-[350px]`} style={styles}>
      <p className="m-0 text-[15px] md:text-lg font-semibold text-center py-3 border-b" style={{color: color, opacity: 0.5}}>Swidge</p>
      {(fromChains != undefined && fromTokens != undefined && isFromCoinOpen) && <div className="w-[90%] h-[85%] bg-white z-30 absolute rounded-b-md shadow-md rounded-md border border-[#D0D9F8] opacity-100 flex flex-col justify-between px-2 py-4 my-1 mx-5 shadow-lg">
        <div className="relative flex flex-row justify-center">
          <img className="h-[25px] absolute left-[0.5rem]" src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/left-arrow.png" onClick={() => {
            setIsFromCoinOpen(false)
          }}/>
          <p>Buy From</p>
        </div>
        <div className="grid grid-cols-5 gap-2 px-2 py-5">
          {allOptions.map((el) => {
            return <div className={`${selectedNetwork?.id == el?.id ? "shadow-lg" : "border-[#ebebeb]"} ${!el?.srcChain && "opacity-50"} flex flex-col items-center justify-center overflow-hidden gap-2 cursor-pointer hover:border-[#0052FF] border-[1px] rounded-md aspect-square hover:shadow-lg duration-200`} onClick={() => {
              if (el?.srcChain){
                setSelectedNetwork(networks.filter((elm) => elm?.id == el?.id)[0])
              }else {
                toast.warning(`${el.name == "Fiat" ? el.name : `${el.name} Chain`} will be available soon!`)
              }
            }} onMouseEnter={() => {setHovering(el?.name)}} onMouseLeave={() => {setHovering(false)}} style={{
                borderColor: selectedNetwork?.id == el?.id ? color : hovering == el?.name && color,
            }}>
              <img className="w-[50%]" src={el?.icon}/>
              <p className="text-ellipsis truncate ... text-[0.62rem] w-[90%] text-center">{el?.name}</p>
            </div>
          })}
        </div>
        <div className="h-[60%]">
        <div className="flex items-center justify-between border border-[#D0D9F8] rounded-md pt-1.5 px-2 pb-1.5">
          <input
            placeholder="Type a Cryptocurrency or Ticker"
            className="p-1 bg-transparent !outline-none text-sm flex-1"
            value={fromCoinSearch}
            key="fromToken"
            autoFocus={true}
            onChange={(e) => setFromCoinSearch(e.target.value)}
            style={{color: text}}
          />
          <img src="/svgFiles/SearchLogo.svg" className="w-5 h-5" />
          {/* <p className="text-sm cursor-pointer" onClick={() => setIsFromCoinOpen(false)}>
            x
          </p> */}
        </div>

        <div className="h-[80%] overflow-y-auto px-2 mt-2">
          {coins?.filter((el) => el?.address[selectedNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "TBC" || coin?.symbol == "BNB" || coin?.symbol == "USDC" || coin?.symbol == "ETH" || coin?.symbol == "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase())).length >
            0 && (
            <div className="flex justify-between text-[0.8rem] font-semibold items-center pb-1">
              <p>Popular Cryptocurrencies</p>
            </div>
          )}
          {coins?.filter((el) => el?.address[selectedNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "TBC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between`}
                onClick={() => {
                  setSelectedCoin(crypto);
                  setIsFromCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
          {coins?.filter((el) => el?.address[selectedNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "ETH" || coin?.symbol == "BNB" || coin?.symbol == "USDC" || coin?.symbol == "MATIC")
            // ?.filter((coin) => coin?.chainId == selectedNetwork?.id)
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between`}
                onClick={() => {
                  setSelectedCoin(crypto);
                  setIsFromCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
          {coins?.filter((el) => el?.address[selectedNetwork?.id] != undefined)
            ?.filter((coin) => (coin?.symbol != "ETH" && coin?.symbol != "BNB" && coin?.symbol != "USDC" && coin?.symbol != "TBC") || coin?.symbol != "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase())).length >
            0 && (
            <div className="flex justify-between text-[0.8rem] font-semibold items-center pb-1 mt-1">
              <p>All Cryptocurrencies</p>
            </div>
          )}
          {coins?.filter((el) => el?.address[selectedNetwork?.id] != undefined)
            ?.filter((coin) => (coin?.symbol != "ETH" && coin?.symbol != "BNB" && coin?.symbol != "USDC" && coin?.symbol != "TBC") || coin?.symbol != "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(fromCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between`}
                onClick={() => {
                  setSelectedCoin(crypto);
                  setIsFromCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
        </div>
        </div>
      </div>}

      {(toChains != undefined && toTokens != undefined && isToCoinOpen) && <div className="w-[90%] h-[85%] bg-white z-30 absolute rounded-b-md shadow-md rounded-md border border-[#D0D9F8] opacity-100 flex flex-col justify-between px-2 py-4 my-1 mx-5 shadow-lg">
        <div className="relative flex flex-row justify-center">
          <img className="h-[25px] absolute left-[0.5rem]" src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/left-arrow.png" onClick={() => {
            setIsToCoinOpen(false)
          }}/>
          <p>Buy To</p>
        </div>
        <div className="grid grid-cols-5 gap-2 px-2 py-5">
        {allOptions.map((el) => {
            return <div className={`${selectedToNetwork?.id == el?.id ? "border-[#0052FF] shadow-lg" : "border-[#ebebeb]"} ${(!el?.destChain)&& "opacity-50"} flex flex-col items-center justify-center overflow-hidden gap-2 cursor-pointer hover:border-[#0052FF] border-[1px] rounded-md aspect-square hover:shadow-lg duration-200`} onClick={() => {
              if (el?.destChain){
                setSelectedToNetwork(networks.filter((elm) => elm?.id == el?.id)[0])
              }else {
                toast.warning(`${el.name == "Fiat" ? el.name : `${el.name} Chain`} will be available soon!`)
              }
            }} onMouseEnter={() => setHovering(el?.name)} onMouseLeave={() => setHovering(false)} style={{
                borderColor: selectedToNetwork?.id == el?.id ? color : hovering == el?.name && color,
            }}>
              <img className="w-[50%]" src={el?.icon}/>
              <p className="text-ellipsis truncate ... text-[0.62rem] w-[90%] text-center">{el?.name}</p>
            </div>
          })}
        </div>
        <div className="h-[60%]">
        <div className="flex items-center justify-between border border-[#D0D9F8] rounded-md pt-1.5 px-2 pb-1.5">
          <input
            placeholder="Type a Cryptocurrency or Ticker"
            className="p-1 bg-transparent !outline-none text-sm flex-1"
            value={toCoinSearch}
            key="fromToken"
            autoFocus={true}
            onChange={(e) => setToCoinSearch(e.target.value)}
            style={{color: text}}
          />
          <img src="/svgFiles/SearchLogo.svg" className="w-5 h-5" />
          {/* <p className="text-sm cursor-pointer" onClick={() => setIsToCoinOpen(false)}>
            x
          </p> */}
        </div>

        <div className="h-[80%] overflow-y-auto px-2 mt-2">
          {toCoins?.filter((el) => el?.address[selectedToNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "TBC" || coin?.symbol == "BNB" || coin?.symbol == "USDC" || coin?.symbol == "ETH" || coin?.symbol == "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(toCoinSearch?.toLowerCase())).length >
            0 && (
            <div className="flex justify-between text-[0.8rem] font-semibold items-center pb-1">
              <p>Popular Cryptocurrencies</p>
            </div>
          )}
          {toCoins?.filter((el) => el?.address[selectedToNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "TBC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between`}
                onClick={() => {
                  setSelectedToCoin(crypto);
                  setIsToCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
          {toCoins?.filter((el) => el?.address[selectedToNetwork?.id] != undefined)
            ?.filter((coin) => coin?.symbol == "ETH" || coin?.symbol == "BNB" || coin?.symbol == "USDC" || coin?.symbol == "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between flex-row justify-between`}
                onClick={() => {
                  setSelectedToCoin(crypto);
                  console.log("selectedTOCoin: ", crypto);
                  setIsToCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
          {toCoins?.filter((el) => el?.address[selectedToNetwork?.id] != undefined)
            ?.filter((coin) => (coin?.symbol != "ETH" && coin?.symbol != "BNB" && coin?.symbol != "USDC" && coin?.symbol != "TBC") || coin?.symbol != "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(toCoinSearch?.toLowerCase())).length >
            0 && (
            <div className="flex justify-between text-[0.8rem] font-semibold items-center pb-1 mt-1">
              <p>All Cryptocurrencies</p>
            </div>
          )}
          {toCoins?.filter((el) => el?.address[selectedToNetwork?.id] != undefined)
            ?.filter((coin) => (coin?.symbol != "ETH" && coin?.symbol != "BNB" && coin?.symbol != "USDC" && coin?.symbol != "TBC") || coin?.symbol != "MATIC")
            ?.filter((coin) => coin?.symbol?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()) || coin?.name?.toLowerCase()?.includes(toCoinSearch?.toLowerCase()))
            ?.map((crypto, index) => (
              <div
                key={index}
                className={`flex p-1 items-center cursor-pointer flex-row justify-between`}
                onClick={() => {
                  setSelectedToCoin(crypto);
                  setIsToCoinOpen(false);
                }}
              >
                <img src={crypto?.logoURI} className="w-6 h-6 rounded-full" />
                <p className="text-black w-[20%] text-sm text-left font-semibold w-[55px]">{crypto?.symbol}</p>
                <p className="text-black w-[50%] text-sm text-left font-semibold">{crypto?.name}</p>
              </div>
            ))}
        </div>
        </div>
      </div>}
      {step == 0 && (
        <Fragment>
          <div className="mx-8 mt-10">
            {fromChains && fromChains.length != 0 && <SelectNetwork
              title={"From"}
              selectedNetwork={selectedNetwork}
              isNetworkOpen={isFromNetworkOpen}
              setNetworkOpen={setIsFromNetworkOpen}
              allnetworks={fromNetworks}
              networks={networks}
              setSelectedNetwork={setSelectedNetwork}
              OutsideAlerter={OutsideAlerter}
              loadingChain={loadingChain}
              networkData={networkData}
            />}
            {fromChains && fromChains.length != 0 && <div className={`border border-[#D0D9F8] rounded px-4 py-2 my-4 ${est_Error && "mb-1"}`}>
              <div className="flex items-center justify-between">
                <p className="m-0 text-[11px] sm:text-xs font-semibold text-gray-400">Convert</p>
                <p
                  className="m-0 text-[11px] sm:text-xs font-semibold text-gray-400"
                  onClick={() => {
                    setFromTokenAmount(fromTokenData?.balance || 0);
                    console.log("fromTokenData: ", fromTokenData);
                  }}
                >
                  {fromChains && showMax ? <Fragment>Max: <span className={`text-black ${showMax && "underline"} font-normal`}>{!showMax ? "..........." : Number(fromTokenData?.balance) == 0 ? 0 : Number(fromTokenData?.balance).toFixed(4) || 0}</span></Fragment> : <Fragment></Fragment>}
                </p>
              </div>
              {(fromChains && fromChains.length != 0) && <div className="flex items-center justify-between mt-3">
                <input
                  className="w-[70%] bg-transparent !outline-none text-sm sm:text-base sm:font-bold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  type="text"
                  placeholder="0"
                  value={fromTokenAmount}
                  onChange={handleChange}
                  style={{color: text}}
                />
                <div className="relative">
                  <div className="flex items-center py-1 rounded-md cursor-pointer w-20 z-[10]" onClick={() => setIsFromCoinOpen(true)}>
                    <img src={selectedCoin?.logoURI} className="w-4 h-4 rounded-full" />
                    <p className="text-xs sm:text-sm font-semibold text-[black] px-2 flex-1">{selectedCoin?.symbol}</p>
                    <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/drop-down.png" className="w-3 h-3" />
                  </div>
                </div>
              </div>}
            </div>}


            {/* {est_Error && <p className={`text-sm mb-3 mt-0 text-red-500`}>{"⚠ Amount too low for Swidge"}</p>} */}


            {toChains && toChains.length != 0 && <SelectNetwork
              title={"To"}
              selectedNetwork={selectedToNetwork}
              isNetworkOpen={isToNetworkOpen}
              setNetworkOpen={setIsToNetworkOpen}
              allnetworks={toNetworks}
              networks={networks}
              setSelectedNetwork={setSelectedToNetwork}
              OutsideAlerter={OutsideAlerter}
            />}
            {toChains && toChains.length != 0 && toTokens && <div className="flex flex-col items-center border border-[#D0D9F8] px-4 py-2 rounded-md mt-2">
              <div className="flex justify-between items-center w-full">
                <p className="m-0 text-[11px] sm:text-xs font-semibold text-gray-400">{"Receive (estimated)"}</p>
              </div>
              {(toChains && toChains.length != 0) && <div className="mt-2 flex justify-between items-center w-full">
              {loading
                    ? <Loader color={color}/>
                    : fromTokenAmount == 0 || isNaN(Number(fromTokenAmount)) || fromTokenAmount == null || fromTokenAmount == undefined
                    ? <Loader color={color}/>
                    : getRecieve
                    ? !loading && isNaN(Number(fromTokenAmount))
                      ? <p className="flex-1 text-sm sm:text-base">{0}</p>
                      : <p className="flex-1 text-sm sm:text-base">{addCommas(Number(toTokenAmount.toFixed(4)))}</p>
                    : <Loader color={color}/>}
                <div className="relative">
                  <div className="flex items-center py-1 rounded-md cursor-pointer w-20" onClick={() => setIsToCoinOpen(true)}>
                    <img src={selectedToCoin?.logoURI} className="w-4 h-4 rounded-full" />
                    <p className="text-xs sm:text-sm font-semibold text-[black] px-2 flex-1">{selectedToCoin?.symbol}</p>
                    <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/drop-down.png" className="w-3 h-3" />
                  </div>
                </div>
              </div>}
            </div>}
            <div className="absolute bottom-10 w-[85%]">
            {(fromChains && fromChains.length != 0 && toChains && toChains.length != 0) && selectedNetwork?.id == networkData?.chainId ? (
              isApproved ? (
                <button
                  onClick={() => {
                    // fromTokenAmount > Number(fromTokenData?.balance) ? toastError("Insufficient Amount") : handleTokenTransfer();
                    handleTokenTransfer();
                  }}
                  disabled={fromChains == undefined || toChains == undefined || fromChains.length == 0 || toChains.length == 0 || !networkData || !fromTokenAmount || !toTokenAmount || loading || !getRecieve || isNaN(toTokenAmount)}
                  className={`${!networkData || !fromTokenAmount || !toTokenAmount || loading || !getRecieve || isNaN(toTokenAmount) ? "bg-[#0051ff93]" : "bg-[#0052FF]"} w-full text-white py-3 rounded text-sm sm:text-base mt-6 justify-self-end`}
                  style={{
                    backgroundColor: color,
                    opacity: (!networkData || !fromTokenAmount || !toTokenAmount || loading || !getRecieve || isNaN(toTokenAmount) || fromChains == undefined || toChains == undefined || fromChains.length == 0 || toChains.length == 0) ? 0.5 : 1
                  }}
                >
                  {est_Error ? "⚠ Amount too low for Swidge" : "Continue"}
                </button>
              ) : (fromChains && fromChains.length != 0 && toChains && toChains.length != 0) && (
                <button
                  onClick={() => {
                    approveAmount(0, selectedNetwork, selectedCoin);
                  }}
                  disabled={fromChains == undefined || toChains == undefined || fromChains?.length == 0 || toChains?.length == 0 || !networkData || !fromTokenAmount || !toTokenAmount}
                  className={`${!networkData || !fromTokenAmount || !toTokenAmount ? "bg-[#0051ff93]" : "bg-[#0052FF]"} w-full text-white py-3 rounded text-sm sm:text-base mt-6 justify-self-end`}
                  style={{
                    backgroundColor: color,
                    opacity: (!networkData || !fromTokenAmount || !toTokenAmount || fromChains.length == 0 || toChains.length == 0) && 0.5,
                  }}
                >
                  {est_Error ? "⚠ Amount too low for Swidge" : "Approve"}
                </button>
              )
            ) : (fromChains && fromChains.length != 0 && toChains && toChains.length != 0) && selectedNetwork?.id != networkData?.chainId && (
                <button
                disabled={fromChains && fromChains.length == 0}
                className={`w-full text-white py-3 rounded text-base mt-6 justify-self-end animate-vibrate`}
                onClick={() => {
                  switchNetwork(selectedNetwork?.id);
                  setLoadingChain(true);
                }}
                style={{
                    backgroundColor: color,
                    opacity: (fromChains && fromChains.length == 0)? 0.5 : 1,
                }}
              >
                {loadingChain ? <div className="grid gap-2">
                <div className="flex items-center justify-center space-x-3 animate-pulse py-2">
                    <div className="w-3 h-3 bg-[#ffffffc4] rounded-full"></div>
                    <div className="w-3 h-3 bg-[#ffffffc4] rounded-full"></div>
                    <div className="w-3 h-3 bg-[#ffffffc4] rounded-full"></div>
                </div>
            </div> : `Switch to ${selectedNetwork?.name}`}
              </button>
            )}
            </div>
          </div>
        </Fragment>
      )}
      {step == 1 && (
        <div className="mx-auto">
          <div className="flex justify-between items-center mx-8 px-4 py-2 mt-6 mb-2 border rounded" style={{borderColor: color}}>
            <img src="/tick.svg" className="w-5 h-5" />
            <p className="font-semibold text-sm">
              <span className="text-[#0052ff]">Buy Route:</span> USD &rarr; BNB &rarr; SPS
            </p>
            <p></p>
          </div>
          <div className="flex justify-between items-center mx-8 px-4 py-2 my-2 border border-[#0052ff] rounded">
            <img src="/loading.svg" className="w-5 h-5 animate-spin" />
            <p className="font-semibold text-sm">
              <span className="text-[#0052ff]">Conversion:</span> 12,000.90 USDC to BNB
            </p>
            <p></p>
          </div>
          <iframe src="https://buy.onramper.com?themeName=bluey" className="mx-auto" title="Onramper Widget" height="420px" width="360px" allow="accelerometer; autoplay; camera; gyroscope; payment" />
          <button className="text-center mt-4 w-full" onClick={() => setStep(0)}>
            Start over
          </button>
        </div>
      )}
      {step == 2 && (
        <div className="mx-auto overflow-hidden h-[90%] mt-10">
          {isbuySwap && (
            <Fragment>
              <div className="flex justify-between items-center mx-8 px-4 py-2 mt-6 mb-2 border border-[#0052ff] rounded">
                <img src="/tick.svg" className="w-5 h-5" />
                <p className="font-semibold text-sm">
                  <span className="text-[#0052ff]">Buy Route:</span> USD &rarr; BNB &rarr; SPS
                </p>
                <p></p>
              </div>
              <div className="flex justify-between items-center mx-8 px-4 py-2 my-2 border border-[#0052ff] rounded">
                <img src="/tick.svg" className="w-5 h-5" />
                <p className="font-semibold text-sm">
                  <span className="text-[#0052ff]">Conversion:</span> 12,000.90 USDC to BNB
                </p>
                <p></p>
              </div>
              <div className="flex justify-between items-center mx-8 px-4 py-2 my-2 border border-[#0052ff] rounded">
                <img src="/loading.svg" className="w-5 h-5 animate-spin" />
                <p className="font-semibold text-sm">
                  <span className="text-[#0052ff]">Waiting for funds to be deposited in your wallet</span>
                </p>
                <p></p>
              </div>
            </Fragment>
          )}
          <div className="w-[85%] m-[auto] flex flex-col gap-y-4 overflow-y-hidden">
            <div className="flex justify-between items-center px-4 py-2 border rounded h-[60px] rounded-md shadow-md bg-[white]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div>
                <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">Transaction: <span className="text-[#3d3d3d]">{`${fromTokenAmount} ${selectedCoin?.symbol.toUpperCase()} to ${selectedToCoin?.symbol.toUpperCase()}`}</span></p>
                <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">Route: <span className="text-[#3d3d3d]">{`${selectedNetwork?.name} to ${selectedToNetwork?.name}`}</span></p>
              </div>
              <p></p>
            </div>

          {pathway &&
            pathway.map((el, ind) => {
              return (
                <Fragment>
                <div className="flex justify-between items-center px-4 py-2 border rounded h-[60px] rounded-md shadow-md bg-[white]">
                {pathProcess && pathProcess[ind]['approval'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>}
                  <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">Transaction Approval</p>
                  <p></p>
                </div>
                  {el?.split(" ")[0] == "swap_and_bridge" ? <Fragment>
                    {pathProcess && pathProcess[ind]['convert'] != undefined && (
                      <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                        {pathProcess[ind]['convert'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>}

                        <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">
                          Swap: <span className="text-[#3d3d3d]">{`${isNaN(Number(pathAmt[ind])) ? "" : pathAmt[ind] == Math.floor(pathAmt[ind]) ? addCommas(pathAmt[ind]) : pathAmt[ind].toString().split(".")[1].length > 2 ? addCommas(Number(Number(pathAmt[ind]).toFixed(2))) : addCommas(Number(pathAmt[ind]))} ${pathway[ind].split(" ")[3].toUpperCase()} to USDT on ${pathway[ind].split(" ")[1].toUpperCase()}`} </span>
                        </p>
                        {(approvalHashes[ind] != undefined) ? (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[1])[0].explorer}tx/${approvalHashes[ind]}`} target="_blank">
                        <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="filter sepia-100 hue-rotate-190 saturate-900 h-4 w-4" />
                        </a>) : <p></p>}
                      </div>
                    )}

                    {pathProcess && pathProcess[ind]['bridge'] != undefined && (
                      <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                        {pathProcess[ind]['bridge'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>}

                          <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">
                            Bridge: <span className="text-[#3d3d3d]">{`USDT on ${pathway[ind].split(" ")[1].toUpperCase()} to ${pathway[ind].split(" ")[2].toUpperCase()}`} </span>
                        </p>
                        {selectedToCoin?.symbol == "USDT" ? (approvalHashes.length != 0 && approvalHashes[1] != undefined) ? (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[2])[0].explorer}tx/${approvalHashes[1]}`} target="_blank">
                           <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4 aspect-square" />
                          </a>) : pathway[ind].split(" ")[0] == "swap_and_bridge" && seconds ? (<p className="text-[green] font-normal text-sm w-5">{pathway[ind].split(" ")[0] == "swap_and_bridge" && seconds}</p>) : <p></p> : (approvalHashes[ind] != undefined) ? (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[1])[0].explorer}tx/${approvalHashes[ind]}`} target="_blank">
                           <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4 aspect-square" />
                          </a>) : <p></p>}
                      </div>
                    )}  

                    {(pathProcess && pathProcess[ind]['swap'] != undefined) && (
                        <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                          {pathProcess[ind]['swap'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>}

                            <p className="font-semibold text-xs text-[#0052FF] text-center mobile:text-xs">
                              Swap: <span className="text-[#3d3d3d]">{`USDT to ${pathway[ind].split(" ")[4].toUpperCase()} on ${pathway[ind].split(" ")[2].toUpperCase()}`} </span> 
                            </p>

                          {(approvalHashes.length != 0 && approvalHashes[1] != undefined) ?  (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[2])[0].explorer}tx/${approvalHashes[1]}`} target="_blank">
                            <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4" />
                          </a>) : pathway[ind].split(" ")[0] == "swap_and_bridge" && seconds ? (<p className="text-[green] font-normal text-sm w-5">{pathway[ind].split(" ")[0] == "swap_and_bridge" && seconds}</p>) : (<p className="w-5"></p>)}
                        </div>
                      )}                 
                    </Fragment> : (el?.split(" ")[0] == "swap") ? <Fragment>
                      {pathProcess && pathProcess[ind]['convert'] != undefined && (
                        <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                          {pathProcess[ind]['convert'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>}

                          <p className="font-semibold text-xs text-[#0052FF] text-center">
                            Swap: <span className="text-[#3d3d3d]">{`${isNaN(Number(pathAmt[ind])) ? "" : pathAmt[ind] == Math.floor(pathAmt[ind]) ? addCommas(pathAmt[ind]) : pathAmt[ind].toString().split(".")[1].length > 2 ? addCommas(Number(Number(pathAmt[ind]).toFixed(2))) : addCommas(Number(pathAmt[ind]))} ${pathway[ind].split(" ")[1].toUpperCase()} to ${pathway[ind].split(" ")[2].toUpperCase()} on ${(selectedNetwork?.symbol).toUpperCase()}`} </span> 
                          </p>
                          <p></p>
                        </div>
                      )}

                      {pathProcess && pathProcess[ind]['release'] != undefined && (
                        <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                          {pathProcess[ind]['release'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>}

                          <p className="font-semibold text-xs text-[#0052FF] text-center">
                            {`Swap Completed`}
                          </p>
                          {approvalHashes[ind] != undefined ?  (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[3])[0].explorer}tx/${approvalHashes[ind]}`} target="_blank">
                            <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4" />
                          </a>) : (<p className="w-5"></p>)}
                        </div>
                      )}  

                    </Fragment> : <Fragment>
                        {pathProcess && pathProcess[ind]['convert'] != undefined && (
                        <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                          {pathProcess[ind]['convert'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>}



                          <p className="font-semibold text-xs text-[#0052FF] text-center">
                            Bridge: {<span className="text-[#3d3d3d]">{isNaN(Number(pathAmt[ind])) ? "" : pathAmt[ind] == Math.floor(pathAmt[ind]) ? addCommas(pathAmt[ind]) : pathAmt[ind].toString().split(".")[1].length > 2 ? addCommas(Number(Number(pathAmt[ind]).toFixed(2))) : addCommas(Number(pathAmt[ind]))} {`USDT on ${selectedNetwork?.symbol.toUpperCase()} to ${selectedToNetwork?.symbol.toUpperCase()}`}</span>}
                          </p>
                          {(approvalHashes[ind] != undefined) ?  (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[1])[0].explorer}tx/${approvalHashes[ind]}`} target="_blank">
                            <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4" />
                          </a>) : (<p className="w-5"></p>)}
                        </div>
                        )}

                      

                      {(pathProcess && pathProcess[ind]['bridge'] != undefined && selectedToCoin?.symbol == "USDT") && (
                      <div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">
                        {pathProcess[ind]['bridge'] ? <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg> : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>}

                        <p className="font-semibold text-xs text-[#0052FF] text-center">
                          Bridge Completed
                        </p>
                        {(approvalHashes[1] != undefined) ?  (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[2])[0].explorer}tx/${approvalHashes[1]}`} target="_blank">
                            <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4" />
                          </a>) : pathway[ind].split(" ")[0] == "bridge" && seconds ? (<p className="text-[green] font-normal text-sm w-5">{pathway[ind].split(" ")[0] == "bridge" && seconds}</p>) : (<p className="w-5"></p>)}
                      </div>
                      )}  

                      {(pathProcess && pathProcess[ind]['swap'] != undefined && selectedToCoin?.symbol != "USDT") &&
                      (<div className="flex justify-between items-center px-4 py-2 border rounded-md shadow-md bg-[white] h-[60px]">  
                        {pathProcess[ind]['swap'] ?<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path className="" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#0052FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path className="" d="M7.75 12L10.58 14.83L16.25 9.17004" stroke="#0052ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>  : <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 3V6M3 12H6M5.63607 5.63604L7.75739 7.75736M5.63604 18.3639L7.75736 16.2426M21 12.0005H18M18.364 5.63639L16.2427 7.75771M11.9998 21.0002V18.0002M18.3639 18.3642L16.2426 16.2429" stroke="#0052FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>}
                        <p className="font-semibold text-xs text-[#0052FF] text-center">
                          Swap: <span className="text-[#3d3d3d]">{`USDT to ${selectedToCoin?.symbol.toUpperCase()} on ${selectedToNetwork?.symbol.toUpperCase()}`}</span>
                        </p>
                        {(approvalHashes[1] != undefined) ?  (<a href={`${networks.filter((el) => el?.symbol == pathway[ind].split(" ")[2].toLowerCase())[0].explorer}tx/${approvalHashes[1]}`} target="_blank">
                            <img src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Swidget_link.png" className="h-4 w-4" />
                          </a>) : pathway[ind].split(" ")[0] == "bridge" && seconds ? (<p className="text-[green] font-normal text-sm w-5">{pathway[ind].split(" ")[0] == "bridge" && seconds}</p>) : (<p className="w-5"></p>)}
                      </div>)}      
                    </Fragment>}
                </Fragment>
              );
            })}
            <div className="flex flex-row justify-between items-center h-[60px]">
              {isTokenRelease && <Fragment>
                <div className="flex flex-row gap-x-3 items-center w-[50%]">
                <img className="w-[auto] h-7" src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Lightning.png" alt="" />
                <div className="w-[85%]">
                  <p className="font-semibold text-xs text-[#0052FF] text-left mobile:text-xs">Transaction Time : <span className="text-[#3d3d3d]">{`${showTotalTime} s`}</span></p>
                  <p className="font-semibold text-xs w-[100%] whitespace-nowrap overflow-hidden truncate text-[#d55686] text-left mobile:text-xs">Fastest Cross-Chain Transaction</p>
                </div>
              </div>

              <div className="flex flex-row gap-x-3 items-center w-[50%]">
                <div className="w-[90%]">
                  <p className="font-semibold text-xs text-[#0052FF] text-right mobile:text-xs w-full">Transaction Fee : <span className="text-[#3d3d3d]">{`$ ${isNaN(Number(txnFee)) ? Number("0").toFixed(2) : txnFee.toFixed(2)}`}</span></p>
                  <p className="text-right font-semibold text-xs w-[100%] whitespace-nowrap overflow-hidden truncate text-[#d55686] text-left mobile:text-xs">Lowest in the Market</p>
                </div>
                <img className="w-[auto] h-7" src="https://gfa.nyc3.digitaloceanspaces.com/testapp/testdir/Money.png" alt="" />
              </div>
              </Fragment>}
            </div>
          </div>
          <div className="mx-8">
            <button
              className="mt-1 bg-[#0052ff] w-full py-3 rounded text-white disabled:opacity-50"
              disabled={!isTokenRelease}
              onClick={() => {
                setPathAmt([]);
                setPathProcess([]);
                setPathStatus([]);
                setIsConvert(false);
                setIsPendingSwap(false);
                setIsBuySwap(false);
                setIsSwapped(false);
                setIsTokenRelease(false);
                setSwapHash(null);
                setStep(0);
                setSeconds(0);
                setApprovalHashes([]);
                setApproveHash(null);
                setChangeProcess(false);
                setPathway([]);
                setShowProcess(0);
                setTotalTime(0);
                setTxnFee(0);
              }}
            >
              Convert Again
            </button>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 text-center w-full text-[0.8rem] text-[#0052FF] flex flex-row items-center justify-center gap-x-2">
        <p>Powered By </p>
        <TerablockLogo width={80} height={40}/>
      </div>
    </div>
    </div>
  );
}

export default Swidget;