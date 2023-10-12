import React from 'react'

import { TBSwidget } from 'example-library-test'
import 'example-library-test/dist/index.css'

const App = () => {
  return <TBSwidget style={{width: "300px", height: "90%"}} bgStyles={{width: "100%"}} fromTokens={["binancecoin", "ethereum", "tether"]} color="#000000"/>
}

export default App
