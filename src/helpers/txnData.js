import axios from "axios";
import {TokenList as coins} from "../assets/tokens_by_chain";
import Web3 from "web3";
import { ethers } from "ethers";

const swapAPI = "https://api.0x.org/swap/v1/quote";
import { uniswapAbi } from "../assets/abis/uniswapAbi";
import { crossSwapAbi } from "../assets/abis/crossSwapAbi";
const proxyAdd = "0x80705283D1E2CaA3fB126f1262aeC6C260C7c205";



const ParseEthUtil = (amount, decimal) => {
  let response = Number(amount) * 10 ** decimal;
  return parseInt(response);
};


export const getSwapTxnData = async (fromCoin, toCoin, network, fromAmt, accountAdd) => {
    try{
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
      , {
        headers: {
            "0x-api-key": process.env.Ox_API_KEY,
        }
      });
      txData = txData?.data;
      if (txData) {
        let finalTxData = uniswapInterface?.encodeFunctionData("swap", [txData.message.calldata, accountAdd]);
        const feeData = await Provider.getFeeData();
        let gasFees;
        if (network.id == 56){
          gasFees = Number(feeData.gasPrice._hex);
        }else {
          gasFees = Number(feeData.gasPrice._hex) + (Number(feeData.gasPrice._hex) * (15/100));
        }
        let tx = {
          to: proxyAdd,
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


export const getCrossChainTxnData = async (fromCoin, toCoin, srcNetwork, destNetwork, fromAmt, provider) => {
    try{
      const cross_swap = new ethers.utils.Interface(crossSwapAbi);

      const usdt = coins?.filter((el) => el?.symbol === "USDT")[0];
      let txData = await axios.get(
        swapAPI +
          "?buyToken=" +
          usdt?.address[srcNetwork?.id] +
          "&sellToken=" +
          fromCoin?.address[srcNetwork?.id] +
          "&sellAmount=" +
          ParseEthUtil(fromAmt, fromCoin?.decimals[srcNetwork?.id]).toLocaleString("en", { useGrouping: false }) +
          "&chainId=" +
          srcNetwork?.id
      , {
        headers: {
            '0x-api-key': process.env.Ox_API_KEY,
        }
      });
      txData = txData?.data;
      if (txData) {
        let finalTxData = cross_swap?.encodeFunctionData("lock", [txData.message.calldata, Web3.utils.asciiToHex(destNetwork?.chain_bytes).padEnd(66, "0"), toCoin?.address[destNetwork?.id]]);
        const feeData = await provider.getFeeData();
        let gasFees;
        if (srcNetwork.id == 56){
          gasFees = Number(feeData.gasPrice._hex);
        }else {
          gasFees = Number(feeData.gasPrice._hex) + (Number(feeData.gasPrice._hex) * (15/100));
        }
        let tx = {
          to: proxyAdd,
          data: finalTxData,
          gasLimit: 700000,
          gasPrice: feeData.gasPrice._hex,
          value: fromCoin.address[srcNetwork?.id].toLowerCase() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? fromAmt * 10 ** 18 + "" : "0",
        };
        return tx;
      }
    }catch(err){
      console.log(err?.message);
    }
  };

export const getAllTokens = () => {
    return coins;
}