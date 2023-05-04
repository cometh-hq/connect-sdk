import React from 'react'

export function Modal({ onDeny, onAccept, txGasFees }) {
  const style = {
    margin: 'auto',
    padding: '16px',
    width: '50%',
    height: 'auto',
    borderRadius: '16px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'center'
  }

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#101010',
    color: 'white',
    fontFamily: 'sans-serif',
    fontSize: '16px',
    margin: '0 8px'
  }

  const acceptBtnStyle = {
    ...buttonStyle,
    backgroundColor: '#00ff00'
  }

  const denyBtnStyle = {
    ...buttonStyle,
    backgroundColor: '#ff0000'
  }

  const textStyle = {
    fontFamily: 'sans-serif',
    fontSize: '24px',
    color: '#101010',
    marginBottom: '24px'
  }

  return (
    <div style={style}>
      <p style={textStyle}>This tx is gonna cost: {txGasFees}</p>
      <button style={acceptBtnStyle} onClick={onAccept}>
        Continue
      </button>
      <button style={denyBtnStyle} onClick={onDeny}>
        Cancel
      </button>
    </div>
  )
}
