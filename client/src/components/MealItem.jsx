import { useContext } from 'react';
import { currencyFormatter } from '../util/formatting.js';
import Button from './UI/Button.jsx';
import CartContext from '../store/CartContext.jsx';

export default function MealItem({ meal }) {
  const cartCtx = useContext(CartContext);
  const quantity = cartCtx.getItemQuantity(meal.id);

  function handleAdd() {
    cartCtx.addItem(meal);
  }

  function handleRemove() {
    cartCtx.removeItem(meal.id);
  }

  return (
    <li className="meal-item">
      <article>
        <img 
          src={meal.imageData || '/placeholder-image.jpg'} 
          alt={meal.name}
          onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
        />
        <div>
          <h3>{meal.name}</h3>
          <p className="meal-item-price">
            {currencyFormatter.format(meal.price)}
          </p>
          <p className="meal-item-description">{meal.description}</p>
        </div>
        <div className="meal-item-actions">
          {quantity === 0 ? (
            <Button onClick={handleAdd}>Add to Cart</Button>
          ) : (
            <div className="quantity-controls">
              <Button onClick={handleRemove}>-</Button>
              <span>{quantity}</span>
              <Button onClick={handleAdd}>+</Button>
            </div>
          )}
        </div>
      </article>
    </li>
  );
}
