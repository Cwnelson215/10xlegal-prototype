import React from "react";
import { useNavigate } from "react-router-dom";
import './home.css';

export function Home() {
    const navigate = useNavigate();

    const handleButtonClick = (service: string) => {
        navigate(`/${service}`)
    };

    return (
        <div>
            <h1 className="welcome">Welcome!</h1>
        </div>
    )
}