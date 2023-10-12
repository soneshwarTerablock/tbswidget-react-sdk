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

import { TBSwidget } from "tbswidget-react-sdk";
import 'tbswidget-react-sdk/dist/index.css';

const App = () => {
  return <TBSwidget />
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


## License

MIT © [soneshwarTerablock](https://github.com/soneshwarTerablock)
