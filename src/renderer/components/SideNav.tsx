import React from 'react'
import './SideNav.css'
import { FaGear,FaStore,FaStar } from "react-icons/fa6";




export const SideNav = () => {
    return (
        <div className='side-nav'>


            <div className='side-nav-links'>
                <ul>
                    <li>
                        <FaStar></FaStar>
                        <span>Favourites</span>
                    </li>
                </ul>
            </div>

            <div className='side-nav-links'>
                <ul>
                    <li>
                        <FaStore></FaStore>
                        <span>Fusion Store</span>
                    </li>
                </ul>
            </div>

            <div className='side-nav-links'>
                <ul>
                    <li>
                        <FaGear></FaGear>
                        <span>Settings</span>
                    </li>
                </ul>
            </div>


        </div>
    )
}
