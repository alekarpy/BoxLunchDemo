import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, BellRing, Info, X } from 'lucide-react';
import { NewOrderPopup } from '@/components/new-order-popup';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useUserRole } from '@/hooks/use-user-role';
import type { Pedido } from '@/generated/models/pedido-model';

export function DemoWidget() {
  const { isOperativo } = useUserRole();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mockOrder, setMockOrder] = useState<Pedido | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const { playNotificationSound } = useNotificationSound();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Only show the widget if the user is Operative
  if (!isOperativo) {
    return null;
  }

  const simulateNewOrder = () => {
    setIsMenuOpen(false);

    // Create a mock order for demo
    const fakeOrder: Pedido = {
      id: `demo-${Date.now()}`,
      cantidad: 1,
      estatusKey: "EstatusKey0" as any,
      fechaentrega: new Date().toISOString().split('T')[0],
      horaentrega: "14:30:00",
      fechadecreacin: new Date().toISOString(),
      pedidonombre: "BoxLunch Ejecutivo",
      notas: "Entregarlo en Recepción",
      empleado: {
        id: "empleado-demo",
        nombrecompleto: "Diego Gómez Rodríguez",
        fotodeperfil: "https://randomuser.me/api/portraits/men/32.jpg"
      }
    };

    setMockOrder(fakeOrder);
    setIsPopupOpen(true);
    playNotificationSound();
  };

  return (
    <>
      {/* The floating widget */}
      <div className="fixed bottom-6 right-6 z-[9999]" ref={widgetRef}>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 w-64 bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-border/50 mb-1 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo Tools</span>
              </div>

              <div className="p-1 space-y-1">
                <button
                  onClick={simulateNewOrder}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-secondary/80 transition-colors text-left cursor-pointer"
                >
                  <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <span>Simular Nuevo Pedido</span>
                </button>

                <div className="mt-2 px-3 py-2 bg-muted/50 rounded-lg flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Utiliza esta herramienta para evaluar en tiempo real la respuesta del sistema (sonido y alerta) como Operativo.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center justify-center h-12 w-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          title="Herramientas de Demo"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
        </motion.button>
      </div>

      {/* The real modal of new order */}
      <NewOrderPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        order={mockOrder}
      />
    </>
  );
}
