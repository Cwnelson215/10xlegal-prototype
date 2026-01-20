import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

function DynamicHeader(): JSX.Element {
    const location: Location = useLocation();

    return (
        <header>
            <span className='heading'>10x Legal Dashboard</span>
        </header>
    )
    
}