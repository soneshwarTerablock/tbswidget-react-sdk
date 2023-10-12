import React, {Fragment} from 'react'
import "./tailwind.css";
import Swidget from './components/Sdk';

export const TBSwidget = (props) => {
  const toChains = [1,56,137];
  const background = "https://st5.depositphotos.com/11965080/64694/i/450/depositphotos_646946936-stock-photo-abstract-neon-background-colorful-beams.jpg";
  const style = {
    backdropFilter: 'blur(px)',
    backgroundColor: 'rgba(255,255,255, 1)',
    width: '400px',
    height: '90%',
  }
  const fromtokenIds = [];
  const toTokenIds = [];
  const fromChains = [1,56,137];

  const bgStyles = {
    width: "100vw",
    height: "100vh",
    padding: "2rem",
    margin: "1rem",
  }
  const color = "#0052FF";
  const text = "#000000";

  return (
    <React.Fragment>
      <Swidget text={props?.text ? props?.text : text} color={props?.color ? props?.color : color} fromChains={props?.fromChains ? props.fromChains : fromChains} toChains={props?.toChains ? props?.toChains : toChains} fromTokens={props?.fromTokens ? props?.fromTokens : fromtokenIds} toTokens={props?.toTokens ? props?.toTokens : toTokenIds} styles={props?.style ? props?.style : style} background={props?.background ? props?.background : background} userAddress={props?.userAddress ? props.userAddress : null} bgStyles={props.bgStyles ? props?.bgStyles : bgStyles} provider={props?.provider ? props?.provider : undefined}/>
    </React.Fragment>
  )
}
