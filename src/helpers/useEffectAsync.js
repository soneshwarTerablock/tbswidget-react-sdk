import { useEffect } from "react";

const useEffectAsync = (effect, deps = []) => {
  useEffect(() => {
    effect();
  }, deps);
};

export default useEffectAsync;