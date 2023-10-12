import React from "react";

const Loader = ({color}) => {
    return (
      <div className="grid gap-2 px-1">
        <div className="flex items-center justify-center space-x-2 animate-pulse py-2">
          <div className={`w-[6px] h-[6px] bg-[#0052FF] rounded-full`} style={{backgroundColor: color}}></div>
          <div className={`w-[6px] h-[6px] bg-[#0052FF] rounded-full`} style={{backgroundColor: color}}></div>
          <div className={`w-[6px] h-[6px] bg-[#0052FF] rounded-full`} style={{backgroundColor: color}}></div>
        </div>
      </div>
    )
}

export default Loader;