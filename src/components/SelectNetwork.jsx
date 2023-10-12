import React from 'react'

const SelectNetwork = ({title, selectedNetwork, isNetworkOpen, setNetworkOpen, loadingChain, networkData}) => {
    
  return (
    <div className="flex justify-between items-center">
    <p className="text-xs sm:text-sm">{title}</p>
    <div className={`relative w-[140px] ${loadingChain && "animate-blinker"} ${(selectedNetwork?.id != networkData?.chainId && selectedNetwork?.id != "fiat") && "animate-blinker"} ${title == "To" && "animate-blinker2"}`}>
      <div className="flex items-center border border-[#D0D9F8] px-2 py-1 rounded-md" onClick={() => setNetworkOpen(true)}>
        <img src={selectedNetwork?.logo} className="w-4 h-4 rounded-full" />
        <p className="text-xs sm:text-sm font-semibold text-[black] px-2 flex-1">{selectedNetwork?.name}</p>
        {/* <img src="/svgFiles/drop-down.png" className="w-3 h-3" /> */}
      </div>
    </div>
  </div>
  )
}

export default SelectNetwork;