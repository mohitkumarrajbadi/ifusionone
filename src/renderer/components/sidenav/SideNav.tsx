import React from 'react';
import './SideNav.css';
import { FaGear, FaStore, FaStar, FaAtom } from "react-icons/fa6";
import { NavLink } from 'react-router-dom';

const SideNav: React.FC = () => {
    return (
        <nav className="side-nav">
            <ul className="side-nav-list">
              
                <li>
                    <NavLink
                        to="/"
                        className={({ isActive }) => isActive ? "active" : ""}
                        end
                    >
                        <FaStar />
                        <span>Favourites</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/aispace"
                        className={({ isActive }) => isActive ? "active" : ""}
                    >
                        <FaAtom />
                        <span>AI Space</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/store"
                        className={({ isActive }) => isActive ? "active" : ""}
                    >
                        <FaStore />
                        <span>Fusion Space</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => isActive ? "active" : ""}
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
