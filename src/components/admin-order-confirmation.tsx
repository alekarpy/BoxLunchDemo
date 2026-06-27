/**
 * AdminOrderConfirmation - Toast/modal confirmation for admin
 * Shown when the administrator successfully creates an order
 * This is different from the NewOrderPopup that operational users receive
 */
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  FileText,
  Hash,
  User,
  Sparkles,
} from 'lucide-react';

import { Confetti } from '@/components/confetti';
import { EmployeePhotoAvatar } from '@/components/employee-photo-avatar';

import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import type { Pedido } from '@/generated/models/pedido-model';
import { useEmpleado } from '@/generated/hooks/use-empleado';

interface AdminOrderConfirmationProps {
  /** The newly created order */
  order: Pedido | null;
  /** If the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

export function AdminOrderConfirmation({
  order,
  isOpen,
  onClose,
}: AdminOrderConfirmationProps) {
  // Upload complete employee data to obtain photo and email
  const { data: empleado } = useEmpleado(order?.empleado?.id ?? '');

  if (!order) return null;

  const nombreEmpleado = order.empleado?.nombrecompleto ?? 'Sin asignar';

  return (
    <>
      {/* Confetti celebration */}
      <Confetti active={isOpen} particleCount={120} duration={2500} />

      <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
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
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-[360px] sm:max-w-[420px] md:max-w-md"
          >
            <div className="relative rounded-2xl bg-card border shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="admin-confirmation-header relative bg-gradient-to-br from-primary via-primary to-accent px-6 pt-5 pb-6 text-center">
                {/* decorative pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* success icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="relative z-10 mx-auto mb-3 w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-8 w-8 text-white" />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut' as const,
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-200" />
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="relative z-10 text-lg font-bold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ¡Pedido Creado!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative z-10 text-white/80 text-sm mt-1"
                >
                  El pedido ha sido registrado exitosamente
                </motion.p>
              </div>

              {/* Contenido */}
              <div className="px-6 py-5 space-y-5">
                {/* Employee with real photo */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-4 pl-1 py-1"
                >
                  <div className="relative shrink-0">
                    <EmployeePhotoAvatar
                      photoUrl={empleado?.fotodeperfil}
                      employeeName={nombreEmpleado}
                      employeeEmail={empleado?.userprincipalname}
                      entraObjectId={(order.empleado as any)?.entraobjectid || empleado?.entraobjectid}
                      className="h-14 w-14 ring-4 ring-primary/20 shadow-lg"
                      fallbackClassName="text-lg"
                      enableLazyLoad={false}
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.35, type: 'spring', stiffness: 400 }}
                      className="absolute -bottom-1 -right-1 z-10 p-1 bg-emerald-500 rounded-full shadow-md"
                    >
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </motion.div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                      <User className="h-3 w-3" />
                      Empleado
                    </p>
                    <p className="font-semibold text-base leading-tight line-clamp-2" title={nombreEmpleado}>
                      {nombreEmpleado}
                    </p>
                    {empleado?.userprincipalname && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5" title={empleado.userprincipalname}>
                        {empleado.userprincipalname}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3 }}
                  className="border-b origin-left"
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
                        <p className="font-medium text-sm">{order.cantidad}</p>
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 shrink-0 mt-0.5">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Notas</p>
                        <p className="font-medium text-sm leading-relaxed">
                          {order.notas}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* close button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-5 py-4 border-t bg-muted/30"
              >
                <Button
                  onClick={onClose}
                  className="w-full admin-confirmation-btn"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Entendido
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

export default AdminOrderConfirmation;
