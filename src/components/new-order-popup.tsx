/**
 * NewOrderPopup - Notification modal for new orders
 * Shows detailed information of the newly created order with actions
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  CalendarDays,
  Clock,
  FileText,
  Hash,
  Sparkles,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmployeePhotoAvatar } from '@/components/employee-photo-avatar';
import { useEmpleado } from '@/generated/hooks/use-empleado';
import { formatTime } from '@/lib/utils';
import type { Pedido } from '@/generated/models/pedido-model';
import { PedidoEstatusKeyToLabel } from '@/generated/models/pedido-model';

interface NewOrderPopupProps {
  /** The order to show */
  order: Pedido | null;
  /** If the popup is visible */
  isOpen: boolean;
  /** Callback to close the popup */
  onClose: () => void;
}

/**
 * Component that shows the employee's photo and data
 */
function EmployeeDetail({
  empleadoId,
  nombreCompleto,
  entraObjectId,
  fotoDePerfil,
}: {
  empleadoId?: string;
  nombreCompleto: string;
  entraObjectId?: string;
  fotoDePerfil?: string;
}) {
  const { data: empleado } = useEmpleado(empleadoId ?? '');

  return (
    <div className="flex items-center gap-4 flex-1 min-w-0 pl-1 py-2">
      <div className="relative shrink-0">
        <EmployeePhotoAvatar
          photoUrl={fotoDePerfil || empleado?.fotodeperfil}
          employeeName={nombreCompleto}
          employeeEmail={empleado?.userprincipalname}
          entraObjectId={entraObjectId || empleado?.entraobjectid}
          className="h-16 w-16 ring-4 ring-primary/20 shadow-lg"
          fallbackClassName="text-xl"
          enableLazyLoad={false}
        />
        {/* Back indicator - lower right corner above the avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
          className="absolute -bottom-1 -right-1 z-10 p-1.5 bg-success rounded-full shadow-md"
        >
          <motion.div
            animate={{
              filter: [
                'brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))',
                'brightness(1.3) drop-shadow(0 0 6px rgba(255,255,255,0.8))',
                'brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut' as const,
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </motion.div>
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
          <User className="h-3 w-3" />
          Empleado
        </p>
        <p
          className="font-semibold text-lg leading-tight line-clamp-2"
          title={nombreCompleto}
        >
          {nombreCompleto}
        </p>
        {empleado?.userprincipalname && (
          <p
            className="text-xs text-muted-foreground truncate mt-0.5"
            title={empleado.userprincipalname}
          >
            {empleado.userprincipalname}
          </p>
        )}
      </div>
    </div>
  );
}

export function NewOrderPopup({
  order,
  isOpen,
  onClose,
}: NewOrderPopupProps) {
  if (!order) return null;

  const nombreEmpleado = order.empleado?.nombrecompleto ?? 'Sin asignar';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark overlay with animation - DOES NOT close on click (only the button closes) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal centrado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="new-order-popup fixed left-1/2 top-1/2 z-[100] -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-[360px] sm:max-w-[420px] md:max-w-md"
          >
            <div className="relative rounded-2xl bg-card border shadow-2xl">
              {/* Header with gradient */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent px-6 pt-6 pb-8 rounded-t-2xl">
                {/* decorative pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* close button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors text-white cursor-pointer"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5 pointer-events-none" />
                </button>

                {/* Icon and title */}
                <div className="relative flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                  >
                    <Package className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-xl font-bold text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      ¡Nuevo Pedido Registrado!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/80 text-sm"
                    >
                      Se ha creado un nuevo Box Lunch
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-6 py-5 space-y-5">
                {/* Empleado + Estatus */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="w-full flex items-start justify-between gap-4 overflow-visible"
                >
                  <EmployeeDetail
                    empleadoId={order.empleado?.id}
                    nombreCompleto={nombreEmpleado}
                    entraObjectId={order.empleado?.entraobjectid}
                    fotoDePerfil={order.empleado?.fotodeperfil}
                  />
                  <div className="shrink-0">
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-3 py-1.5 whitespace-nowrap dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/40"
                    >
                      {PedidoEstatusKeyToLabel[order.estatusKey]}
                    </Badge>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border-b origin-left mt-1"
                />

                {/* Delivery data */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Datos de Entrega
                  </p>

                  <div className="grid gap-3">
                    {/* Fecha */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="font-medium capitalize text-sm">
                          {format(
                            new Date(order.fechaentrega + 'T12:00:00'),
                            "EEEE, d 'de' MMMM yyyy",
                            { locale: es }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Hora */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Hora</p>
                        <p className="font-medium text-sm">
                          {formatTime(order.horaentrega)}
                        </p>
                      </div>
                    </div>

                    {/* Cantidad */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                        <Hash className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Cantidad</p>
                        <p className="font-medium text-sm">
                          {order.cantidad}
                        </p>
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Notas</p>
                        <p className="font-medium text-sm break-words">
                          {order.notas}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer with actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="elegant-outline-btn modal-btn-secondary"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cerrar
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NewOrderPopup;
