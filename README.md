# tbswidget-react-sdk

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/tbswidget-react-sdk.svg)](https://www.npmjs.com/package/tbswidget-react-sdk) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save-dev tbswidget-react-sdk
```

## Usage

```jsx
import React, { Fragment } from 'react'

import { TB_SDK } from "tbswidget-react-sdk";
import 'tbswidget-react-sdk/dist/index.css';

const App = () => {
  return <TB_SDK.TBSwidget />
}
```

The SDK is a versatile tool for integrating customizable background and styles into your application. It comes with the following features and customization options:

- **Minimum Width:** 360px
- **Minimum Height:** 640px
- **Customization:** You can customize the SDK using the "style" prop passed onto the SDK component.
- **Theme Color:** Users can provide a theme color for the SDK, with a default color available if not specified by the user.
- **Network IDs:** Users must provide an array of network IDs for source chains and destination chains.
- **Tokens:** Users can specify an array of tokens they want on the fromChains as well as toChains. Token IDs can be referred from the CoinGecko API.
- **Token Filtering:** From the available tokens in the SDK, you can filter the provided token IDs to select from.
- **Providers:** You can pass providers as props if the default provider is not already provided with the SDK.
- **User Address:** The user's address is needed as a prop.

### Available Chains to Select From
- Ethereum (ID: 1)
- Binance Chain (ID: 56)
- Polygon (ID: 137)

### Available Tokens
[Provide information about available tokens here]

### Props to Be Passed
You can use the following props to configure the SDK component:

```jsx
<TBSwidget
  color={color}                // Optional: string
  fromChains={fromChains}       // Optional: array of network IDs
  toChains={toChains}           // Optional: array of network IDs
  fromTokens={fromTokens}       // Optional: array of token IDs (referred from CoinGecko)
  toTokens={toTokens}           // Optional: array of token IDs
  provider={provider}           // Optional
  styles={style}                // Optional: customization for height, width, background, and more
  background={background}       // Optional: URL or any relative path for background
  bgStyles={bgStyles}           // Optional: styles for the main container wrapping the SDK component
/>
```


## Function Documentation

This README provides documentation for three JavaScript functions related to cryptocurrency transactions. These functions are primarily used for obtaining transaction data for swaps and cross-chain transactions. 

### `getSwapTxnData`

The `getSwapTxnData` function is responsible for retrieving transaction data for a swap operation. It takes the following parameters:

- `fromCoin`: The token you are swapping from.
- `toCoin`: The token you are swapping to.
- `network`: The network on which the swap is taking place.
- `fromAmt`: The amount of `fromCoin` you want to swap.
- `accountAdd`: The account address for the transaction.

#### `Example Usage:`

```javascript
const transactionData = await TB_SDK.getSwapTxnData(fromCoin, toCoin, network, fromAmt, accountAdd);
```

### `getCrossChainTxnData Function`
The `getCrossChainTxnData` function is used to obtain transaction data for cross-chain transactions. It accepts the following parameters:

- `fromCoin`: The token you want to transfer from.
- `toCoin`: The token you want to transfer to.
- `srcNetwork`: The source network for the transaction.
- `destNetwork`: The destination network for the transaction.
- `fromAmt`: The amount of fromCoin you want to transfer.
- `provider`: The provider for the transaction.


#### `Example Usage`:

``` javascript
const crossChainTransactionData = await TB_SDK.getCrossChainTxnData(fromCoin, toCoin, srcNetwork, destNetwork, fromAmt, provider);
```

### `getAllTokens Function`
The `getAllTokens` function is a simple utility function that returns a list of all available tokens.

### `Example Usage:`
```javascript
const tokenList = TB_SDK.getAllTokens();
```

`To get all the available tokens available for swidge or Cross Chain transactions`


Please make sure to install the required dependencies and configure your environment before using these functions. Ensure that you handle any potential errors that may occur during their execution.



#### ```Feel free to customize this documentation further, including any specific usage instructions or additional details relevant to your project.```


## License

MIT © [soneshwarTerablock](https://github.com/soneshwarTerablock)
