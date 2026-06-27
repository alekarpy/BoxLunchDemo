import { useEffect, useRef, useCallback, useState } from 'react';
import type { Pedido } from '@/generated/models/pedido-model';

interface NotificationStore {
  seenIds: Set<string>;
  lastCheck: number;
}

const notificationStore: NotificationStore = {
  seenIds: new Set(),
  lastCheck: Date.now(),
};

/**
 * Hook to detect and handle notifications of new orders.
 * Returns the most recent order to display in a popup.
 */
export function useNewOrderNotifications(orders: Pedido[] | undefined) {
  const previousOrdersRef = useRef<Pedido[] | null>(null);
  const [newOrderForPopup, setNewOrderForPopup] = useState<Pedido | null>(null);

  // Function to close the popup
  const dismissNewOrder = useCallback(() => {
    setNewOrderForPopup(null);
  }, []);

  useEffect(() => {
    if (!orders) return;

    // Initialize seen IDs on first load
    if (previousOrdersRef.current === null) {
      orders.forEach(order => notificationStore.seenIds.add(order.id));
      previousOrdersRef.current = orders;
      return;
    }

    // Check for new orders
    const newOrders = orders.filter(order => !notificationStore.seenIds.has(order.id));
    
    // If there are new orders, show the most recent one in the popup
    if (newOrders.length > 0) {
      newOrders.forEach(order => {
        notificationStore.seenIds.add(order.id);
      });
      
      // Show the last order created (most recent)
      const latestOrder = newOrders[newOrders.length - 1];
      setNewOrderForPopup(latestOrder);
    }

    previousOrdersRef.current = orders;
  }, [orders]);

  return {
    /** The new order to show in the popup (null if there is none) */
    newOrderForPopup,
    /** Function to close/dismiss the popup notification */
    dismissNewOrder,
    /** Indicates if there is a new order to display */
    hasNewOrder: newOrderForPopup !== null,
  };
}
