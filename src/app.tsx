import './app.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import type { JSX } from 'react';
import { Home } from './home/home';

function DynamicHeader(): JSX.Element {

    return (
        <header>
            <span className='heading'>10x Legal Dashboard</span>
        </header>
    )
}

export default function App() {
    return (
        <Router>
            <div>
                <DynamicHeader />
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </div>
        </Router>
    )
}