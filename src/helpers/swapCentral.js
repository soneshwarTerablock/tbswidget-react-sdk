import axios from "axios";
import {TokenList as coins} from "../assets/tokens_by_chain";
import Web3 from "web3";
import { toastError } from "./alertpopup";
import { ethers } from "ethers";

const swapAPI = "https://sw-api.terablock.com/quote";
const bridgeAPI = "https://sw-api.terablock.com/bridge";
import { uniswapAbi } from "../assets/abis/uniswapAbi";
import { crossSwapAbi } from "../assets/abis/crossSwapAbi";


const ParseEthUtil = (amount, decimal) => {
  let response = Number(amount) * 10 ** decimal;
  return parseInt(response);
};


  const getSwapData = async (fromCoin, toCoin, network, fromAmt, networkData) => {
    try{
      console.log("into getSwap Data: ", fromAmt, network);
      let tx = null;
      tx = await getTxn(fromCoin, toCoin, network, fromAmt, networkData);
      return {
        selectedFromToken: fromCoin,
        selectedToToken: toCoin,
        tx: tx,
        fromAmount: fromAmt,
      };
    }catch(err){

      console.log(err?.message);
    }
  };

  const getCrossSwapData = async (fromCoin, toCoin, network, fromAmt, networkData) => {
    try{
      let tx = null;
      tx = await getOneClickTxn(fromCoin, toCoin, network, fromAmt, networkData);
      // console.log("get txn data for cross chain: ", tx);
      return {
        selectedFromToken: fromCoin?.address[network?.selectedNetwork?.id],
        selectedToToken: toCoin?.address[network?.selectedToNetwork?.id],
        tx: tx,
        fromAmount: fromAmt,
      };
    }catch(err){

      console.log("error in one click cross chain swap",err?.message);
    }
  };

const getBridgeTxn = async (amount, networkData, selectedNetwork, selectedToNetwork, toCoin, address) => {
    try{
      let provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpc_url);
      const code = await provider.getCode(address);
      console.log("getCode; ", code)
      let gasFeesData = selectedNetwork?.id == 56 ? await provider.getGasPrice() : await provider.getFeeData();
      const cross_swap = new ethers.utils.Interface(crossSwapAbi);
      
      gasFeesData = selectedNetwork?.id == 56 ? gasFeesData : gasFeesData.gasPrice;
      const usdt = coins?.filter((el) => el?.symbol == "USDT")[0];
      let toToken;
      if (toCoin?.symbol == "USDT"){
        toToken = coins?.filter((el) => el?.symbol == "USDT")[0];
      }else {
        toToken = toCoin;
      }
      // console.log({amount, selectedNetwork, selectedToNetwork, networkData, fromCoin: usdt.address[selectedNetwork.id],  toCoin: toCoin?.address[selectedToNetwork?.id], address});
      // console.log("toToken: ", toCoin);
      // let gasPriceinHex =  selectedNetwork?.id == 56 ? res?.data?.message?.rawTx?.gasPrice?.hex : res?.data?.message?.rawTx?.maxPriorityFeePerGas?.hex
      // console.log("gasPrice before: ", Number(gasPriceinHex));
      // if (selectedNetwork?.id != 56){
      //   gasPriceinHex =  Number(gasPriceinHex) + (Number(gasPriceinHex) * (30/100))
      // }else {
      //   gasPriceinHex = Number(gasPriceinHex);
      // }
      // console.log("gasPrice After: ", gasPriceinHex);
      let {data} = await axios.get(
        swapAPI +
          "?buyToken=" +
          usdt?.address[selectedNetwork?.id] +
          "&sellToken=" +
          usdt?.address[selectedNetwork?.id] +
          "&sellAmount=" +
          ParseEthUtil(amount, usdt?.decimals[selectedNetwork?.id]).toLocaleString("en", { useGrouping: false }) +
          "&chainId=" +
          selectedNetwork?.id
      );
      console.log("CallData of swap", data)
      let finalTxData = cross_swap?.encodeFunctionData("lock", [data?.message?.calldata, Web3.utils.asciiToHex(selectedToNetwork?.chain_bytes).padEnd(66, "0"), toToken?.address[selectedToNetwork?.id]]);


      if (finalTxData){
        let tx = {
          to: networkData?.proxy,
          data: finalTxData,
          // gasLimit: parseInt(res?.data?.message?.rawTx?.gasLimit?.hex),
          gasLimit: 700000,
          gasPrice: gasFeesData._hex,
          value: usdt?.address[selectedNetwork?.id].toLowerCase() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? amount * 10 ** 18 + "" : "0",
        };
        // console.log("data in bridge Txn $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", tx);
        return tx;
      }
    }catch(err){
      
      console.log("err in getBridge Txn: ",err?.message);
    }
  }

  const getTxn = async (fromCoin, toCoin, network, fromAmt, networkData) => {
    try{
      // console.log("In getTxn: ");
      const Provider = new ethers.providers.JsonRpcProvider(network?.rpc_url);
      const uniswapInterface = new ethers.utils.Interface(uniswapAbi);
      console.log("1");
      let txData = await axios.get(
        swapAPI +
          "?buyToken=" +
          toCoin?.address[network?.id] +
          "&sellToken=" +
          fromCoin?.address[network?.id] +
          "&sellAmount=" +
          ParseEthUtil(fromAmt, fromCoin?.decimals[network?.id]).toLocaleString("en", { useGrouping: false }) +
          "&chainId=" +
          network?.id
      );
      txData = txData?.data;
      if (txData) {
        let finalTxData = uniswapInterface?.encodeFunctionData("swap", [txData.message.calldata, networkData?.account]);
        const feeData = await Provider.getFeeData();
        let gasFees;
        if (network.id == 56){
          gasFees = Number(feeData.gasPrice._hex);
        }else {
          gasFees = Number(feeData.gasPrice._hex) + (Number(feeData.gasPrice._hex) * (15/100));
        }
        let tx = {
          to: networkData?.proxy,
          data: finalTxData,
          gasLimit: 700000,
          gasPrice: feeData.gasPrice._hex,
          value: fromCoin.address[network?.id].toLowerCase() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? fromAmt * 10 ** 18 + "" : "0",
        };
        
        return tx;
      }
    }catch(err){
      console.log(err?.message);
    }
  };


  const getOneClickTxn = async (fromCoin, toCoin, network, fromAmt, networkData) => {
    try{
      // console.log("In getTxn: ");
      const {selectedNetwork, selectedToNetwork} = network;
      const cross_swap = new ethers.utils.Interface(crossSwapAbi);

      const usdt = coins?.filter((el) => el?.symbol === "USDT")[0];
      let txData = await axios.get(
        swapAPI +
          "?buyToken=" +
          usdt?.address[selectedNetwork?.id] +
          "&sellToken=" +
          fromCoin?.address[selectedNetwork?.id] +
          "&sellAmount=" +
          ParseEthUtil(fromAmt, fromCoin?.decimals[selectedNetwork?.id]).toLocaleString("en", { useGrouping: false }) +
          "&chainId=" +
          selectedNetwork?.id
      );
      txData = txData?.data;
      // console.log("2", txData);
      if (txData) {
        let finalTxData = cross_swap?.encodeFunctionData("lock", [txData.message.calldata, Web3.utils.asciiToHex(selectedToNetwork?.chain_bytes).padEnd(66, "0"), toCoin?.address[selectedToNetwork?.id]]);
        const feeData = await networkData.provider.getFeeData();
        let gasFees;
        // console.log("GasPrices before: -----------",feeData.gasPrice._hex);
        if (selectedNetwork.id == 56){
          gasFees = Number(feeData.gasPrice._hex);
        }else {
          gasFees = Number(feeData.gasPrice._hex) + (Number(feeData.gasPrice._hex) * (15/100));
        }
        // console.log("GasPrices after: -----------", gasFees)
        let tx = {
          to: networkData?.proxy,
          data: finalTxData,
          gasLimit: 700000,
          gasPrice: feeData.gasPrice._hex,
          value: fromCoin.address[selectedNetwork?.id].toLowerCase() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? fromAmt * 10 ** 18 + "" : "0",
        };
        return tx;
      }
    }catch(err){
      console.log(err?.message);
    }
  };


  const getSwappedPrice = async (fromCoin, toCoin, network, amountfrom) => {
    // console.log("network in swapprice function: ", network);
    let amount = Number(amountfrom * 10 ** fromCoin?.decimals[network?.id]);
    const params = {
      sellToken: fromCoin?.address[network?.id],
      buyToken: toCoin?.address[network?.id],
      sellAmount: amount.toLocaleString("en", { useGrouping: false }),
      chainId: network?.id,
    };
    try {
      const { data } = await axios.get(`https://sw-api.terablock.com/quote`, { params: params });
      return {
        swap_quote: data?.message?.quote,
        dest_decimals: toCoin?.decimals[network?.id],
      }
    } catch (err) {
      return "error"
    }
  };

  const getBridgingPrice = async (fromCoin, toCoin, amountfrom, selectedNetwork, selectedToNetwork, address) => {
    try{
      const url = `${bridgeAPI}?chainIdFrom=${selectedNetwork?.id}&chainIdTo=${selectedToNetwork?.id}&amountFrom=${ParseEthUtil(amountfrom, fromCoin?.decimals[selectedNetwork?.id]).toLocaleString("en", { useGrouping: false })}&addressTo=${address}`;

      const {data} = await axios.get(url);

      return {
        bridge_quote: data?.message?.quote,
        dest_decimals: toCoin?.decimals[selectedToNetwork?.id],
      }
    }catch(err){
      console.log("err: ", err);
      return "error"
    }
  }

  const isTransactionMined = async (txHash, network) => {
    const provider = new ethers.providers.JsonRpcProvider(network?.rpc_url);
    console.log({txHash, network, provider});
    const txReceipt = await provider.getTransactionReceipt(txHash);
    // console.log("into isTransaction MIned: ", txReceipt);
    if (txReceipt && txReceipt.blockNumber) {
      return txReceipt;
    }
    return null;
  };

  const TransferPathWay = (selectedNetwork, selectedToNetwork, selectedCoin, selectedToCoin) => {
        let sideProcess;
        let transferPath = [];

      if (selectedNetwork?.id === selectedToNetwork?.id && selectedCoin?.symbol != selectedToCoin?.symbol){
        // console.log("swap");
        transferPath.push(`swap ${selectedCoin?.symbol} ${selectedToCoin?.symbol} ${selectedNetwork?.symbol}`);

        sideProcess = {0: {approval: false, convert: false, release: false}};
      }else if (selectedNetwork?.id != selectedToNetwork?.id && selectedCoin?.symbol == selectedToCoin?.symbol){
        // console.log("bridge");
        if (selectedCoin?.symbol === "USDT"){
          transferPath.push(`bridge ${selectedNetwork?.symbol} ${selectedToNetwork?.symbol} USDT USDT`);

          sideProcess = {0: {approval: false, convert: false, bridge: false}};
        }else {
          // console.log("swap and bridge", "swap");
          transferPath.push(`swap_and_bridge ${selectedNetwork?.symbol} ${selectedToNetwork?.symbol} ${selectedCoin?.symbol} ${selectedToCoin?.symbol}`);

          sideProcess = {0: {approval: false, convert: false, bridge: false, swap: false}};
        }
      }else if (selectedNetwork?.id != selectedToNetwork?.id && selectedCoin?.symbol != selectedToCoin?.symbol){

        if (selectedCoin?.symbol == "USDT"){
          transferPath.push(`bridge ${selectedNetwork?.symbol} ${selectedToNetwork?.symbol} USDT ${selectedToCoin?.symbol}`);

          sideProcess = {0: {approval: false, convert: false, swap: false}};
        }else if (selectedToCoin?.symbol == "USDT"){
          transferPath.push(`swap_and_bridge ${selectedNetwork?.symbol} ${selectedToNetwork?.symbol} ${selectedCoin?.symbol} USDT`);

          sideProcess = {0: {approval: false, convert: false, bridge: false}};
        } else {
          transferPath.push(`swap_and_bridge ${selectedNetwork?.symbol} ${selectedToNetwork?.symbol} ${selectedCoin?.symbol} ${selectedToCoin?.symbol}`);

          sideProcess = {0: {approval: false, convert: false, bridge: false, swap: false}};
        }
      }

  
      if (transferPath.length === 0) {
        toastError("No action detect for the selected Chain and token");
        return;
      }
  
      console.log(transferPath);
      let obj = {};
      transferPath.forEach((element) => {
        if (obj[element.split(" ")[0]] === undefined){
          obj[element.split(" ")[0]] = false;
        }
      });

      return {
        transferpathway: transferPath,
        pathProcess: sideProcess,
        pathStatus: obj,
      }
}

  

export {getBridgeTxn, getTxn, getSwappedPrice, getBridgingPrice, getSwapData, isTransactionMined, TransferPathWay, getCrossSwapData};