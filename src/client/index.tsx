import React from 'react';
import ReactDOM from 'react-dom';
import MainLayout from './components/MainLayout';

const App = () => (
  <MainLayout>
    <h2>Welcome to Recipe Tracker</h2>
  </MainLayout>
);

ReactDOM.render(<App />, document.getElementById('root'));
