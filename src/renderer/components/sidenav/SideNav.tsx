import React from 'react';
import './SideNav.css';
import { FaGear, FaStore, FaStar } from "react-icons/fa6";
import { NavLink } from 'react-router-dom';

const SideNav: React.FC = () => {
    return (
        <nav className='side-nav'>
            <ul className='side-nav-list'>
                <li>
                    <NavLink
                        to="/"
                        activeClassName="active"
                        exact
                    >
                        <FaStar />
                        <span>Favourites</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/store"
                        activeClassName="active"
                    >
                        <FaStore />
                        <span>Fusion Space</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/settings"
                        activeClassName="active"
                    >
                        <FaGear />
                        <span>Settings</span>
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default SideNav;
