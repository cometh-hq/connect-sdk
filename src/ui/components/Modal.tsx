import React, { useState } from 'react'

export function Modal({ onClose }) {
  const [count, setCount] = useState(0)

  console.log({ onClose })

  const style = {
    margin: 'auto',
    width: '50%',
    height: '50%',
    borderRadius: '16px',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'center'
  }

  function handleClose() {
    console.log('CLOSING...')
    onClose()
  }

  return (
    <div style={style}>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={handleClose}>Close</button>
    </div>
  )
}
