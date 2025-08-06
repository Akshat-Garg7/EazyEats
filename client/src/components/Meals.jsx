import { useState } from 'react';
import MealItem from './MealItem.jsx';
import useHttp from '../hooks/useHttp.js';
import Error from './Error.jsx';
import ChatWindow from './ChatWindow.jsx';

const requestConfig = {};

export default function Meals() {
  const [showChat, setShowChat] = useState(false);

  const {
    data: loadedMeals,
    isLoading,
    error,
  } = useHttp(`${import.meta.env.VITE_API_URL}/api/menu-items`, requestConfig, []);

  function toggleChat() {
    setShowChat(prev => !prev);
  }

  if (isLoading) {
    return <p className="center">Fetching meals...</p>;
  }

  if (error) {
    return <Error title="Failed to fetch meals" message={error} />;
  }

  return (
    <>
      <ul id="meals">
        {loadedMeals.map((meal) => (
          <MealItem key={meal.id} meal={meal} />
        ))}
      </ul>

      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          backgroundColor: '#333',
          color: '#fff',
          fontSize: '30px',
          zIndex: 1000,
        }}
      >
        💬
      </button>

      {showChat && <ChatWindow />}
    </>
  );
}
