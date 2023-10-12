

export const switchNetwork = async (network) => {
    try {
      let ethereum = null
      if (typeof window !== 'undefined') {
      // Boom
      // const { ethereum } = window;
      ethereum = window.ethereum;
  
      }
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${Number(network).toString(16)}` }], // using rinkeby - @yash
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};