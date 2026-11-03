import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{message:string}>{state={message:''};static getDerivedStateFromError(e:Error){return {message:e.message};}render(){return this.state.message?<main className="panel fatal" role="alert"><h1>The dashboard encountered a problem</h1><p>{this.state.message}</p><button onClick={()=>location.reload()}>Reload</button></main>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
