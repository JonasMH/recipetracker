import React from 'react';
import MainLayout from './MainLayout';

const RecipePage = ({ recipe, history }) => {
  return (
    <MainLayout>
      <div style={{ backgroundColor: '#333', color: '#fff', minHeight: '100vh', padding: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>{recipe.Title}</h1>
        <a href={`/recipes/${recipe.Id}/edit`} style={{ color: '#007bff', textDecoration: 'none' }}>Edit</a>
        <p style={{ marginTop: '16px', fontSize: '18px' }}>{recipe.Description}</p>
        <ul style={{ marginTop: '24px', listStyle: 'none', padding: 0 }}>
          {recipe.Ingredients.map((ingredient, index) => (
            <li key={index} style={{ fontSize: '14px', backgroundColor: '#444', padding: '8px', borderRadius: '4px' }}>
              {ingredient.Name} - {ingredient.Quantity} {ingredient.Unit}
            </li>
          ))}
        </ul>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginTop: '32px' }}>History</h2>
        <ul style={{ marginTop: '16px', listStyle: 'none', padding: 0 }}>
          {history.map((entry, index) => (
            <li key={index} style={{ fontSize: '14px', backgroundColor: '#444', padding: '8px', borderRadius: '4px' }}>
              {new Date(entry.Committer.When).toLocaleString()} - {entry.Message} by {entry.Author.Name}
            </li>
          ))}
        </ul>
      </div>
    </MainLayout>
  );
};

export default RecipePage;
