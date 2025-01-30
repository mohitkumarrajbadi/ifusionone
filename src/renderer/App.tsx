import { useState } from 'react'
import './App.css'
import { SideNav } from './components/SideNav'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SideNav></SideNav>
      {/* <h1>iFusion One</h1>
      <div className="card">
        <p>Communication with Preload.js</p>
        <ul>
          <li>Node Version : {window.versions.node()}</li>
          <li>Chrome Version : {window.versions.chrome()}</li>
          <li>Electron Version : {window.versions.electron()}</li>
        </ul>
      </div> */}
      
    </>
  )
}

export default App
