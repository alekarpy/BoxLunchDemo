/**
 * TableOrders - Box Lunch order table component
 * Display and manage orders with filters by date and status
 */
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarDays,
  Clock,
  User,
  Package,
  CircleDot,

  MoreHorizontal,
  Eye,
  X,
  Download,
  MessageCircle,
  FileText,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { EmployeePhotoAvatar } from '@/components/employee-photo-avatar';
import { useEmpleado } from '@/generated/hooks/use-empleado';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NewOrderPopup } from '@/components/new-order-popup';
import { AdminOrderConfirmation } from '@/components/admin-order-confirmation';
import { ConfettiCelebration } from '@/components/confetti-celebration';

import { cn, formatLocalDateKey, formatTime, getStatusColor } from '@/lib/utils';
import { exportarPedidosAExcel } from '@/lib/export-xlsx';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useUserRole } from '@/hooks/use-user-role';

import { usePedidoList, useUpdatePedido } from '@/generated/hooks/use-pedido';

import { PedidoEstatusKeyToLabel, PedidoMotivocancelacinKeyToLabel } from '@/generated/models/pedido-model';
import type { Pedido, PedidoMotivocancelacinKey } from '@/generated/models/pedido-model';
import { useNewOrderNotifications } from '@/hooks/use-notifications';

export type FilterStatus = 'all' | 'EstatusKey0' | 'EstatusKey1' | 'EstatusKey2';

/**
 * Memoized component to display employee avatar in table row.
 * Upload profile photo using employee ID.
 * Search the Users_List by email first, then use the employee profile photo field.
 */
const AvatarEmpleadoFila = memo(function AvatarEmpleadoFila({
  empleadoId,
  nombreCompleto,
  entraObjectId,
  fotodeperfil,
}: {
  empleadoId?: string;
  nombreCompleto: string;
  entraObjectId?: string;
  fotodeperfil?: string;
}) {
  // We only fetch the Employee if we don't already have the photo (for fallback/enrichment)
  const { data: empleado } = useEmpleado(empleadoId ?? '');
  
  return (
    <div className="flex items-center gap-2.5">
      <EmployeePhotoAvatar
        photoUrl={fotodeperfil || empleado?.fotodeperfil}
        employeeName={empleado?.nombrecompleto || nombreCompleto}
        employeeEmail={empleado?.userprincipalname}
        entraObjectId={entraObjectId || empleado?.entraobjectid}
        className="h-8 w-8 shrink-0"
        enableLazyLoad={true}
      />
      <span className="typo-table-cell font-medium truncate">{nombreCompleto}</span>
    </div>
  );
});

/**
 * Memoized component to show only the employee's avatar.
 * Used in mobile view of order table to load employee data.
 */
const AvatarEmpleadoSoloFoto = memo(function AvatarEmpleadoSoloFoto({
  empleadoId,
  nombreCompleto,
  entraObjectId,
  fotodeperfil,
  className,
}: {
  empleadoId?: string;
  nombreCompleto: string;
  entraObjectId?: string;
  fotodeperfil?: string;
  className?: string;
}) {
  const { data: empleado } = useEmpleado(empleadoId ?? '');
  
  return (
    <EmployeePhotoAvatar
      photoUrl={fotodeperfil || empleado?.fotodeperfil}
      employeeName={empleado?.nombrecompleto || nombreCompleto}
      employeeEmail={empleado?.userprincipalname}
      entraObjectId={entraObjectId || empleado?.entraobjectid}
      className={className}
      enableLazyLoad={true}
    />
  );
});

/**
 * Component that shows the detail of the employee with his photo in the detail modal.
 * Search the employee by ID to get the profile photo.
 * Prioritizes the Users_List photo (by email) over the profile photo field.
 */
function SeccionDetalleEmpleado({ 
  empleadoId, 
  nombreCompleto,
  entraObjectId
}: { 
  empleadoId?: string; 
  nombreCompleto: string;
  entraObjectId?: string;
}) {
  // Search for the employee to obtain the profile photo and additional data
  const { data: empleado, isLoading } = useEmpleado(empleadoId ?? '');
  
  return (
    <div className="flex items-center gap-4 min-w-0 flex-1">
      {/* Avatar with employee photo - prioritize Users_List by email, then profile photo */}
      <EmployeePhotoAvatar
        photoUrl={empleado?.fotodeperfil}
        employeeName={nombreCompleto}
        employeeEmail={empleado?.userprincipalname}
        entraObjectId={entraObjectId || empleado?.entraobjectid}
        className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/10 shrink-0"
        fallbackClassName="text-lg sm:text-xl"
        enableLazyLoad={false}
      />
      <div className="min-w-0 flex-1">
        <p className="typo-modal-user-name leading-tight break-words" title={nombreCompleto}>
          {nombreCompleto}
        </p>
        {isLoading && (
          <p className="text-xs text-muted-foreground animate-pulse mt-0.5">Cargando...</p>
        )}
        {empleado?.userprincipalname && (
          <p className="typo-modal-user-email truncate mt-0.5" title={empleado.userprincipalname}>
            {empleado.userprincipalname}
          </p>
        )}
      </div>
    </div>
  );
}

interface TablaPedidosProps {
  /** Order ID to highlight (newly created) */
  highlightedOrderId?: string | null;
  /** Callback when highlight animation ends */
  onHighlightComplete?: () => void;
  /** External date to navigate to */
  navigateToDate?: Date | null;
  /** Callback when navigation is complete */
  onNavigationComplete?: () => void;
  /** External status filter controlled by parent */
  externalStatusFilter?: FilterStatus;
  /** Callback when status filter changes */
  onStatusFilterChange?: (filter: FilterStatus) => void;
  /** Fecha seleccionada controlada externamente */
  selectedDate?: Date;
  /** Callback when the date changes */
  onDateChange?: (date: Date) => void;
}

export function TablaPedidos({ 
  highlightedOrderId,
  onHighlightComplete,
  navigateToDate,
  onNavigationComplete,
  externalStatusFilter,
  onStatusFilterChange,
  selectedDate: externalSelectedDate,
  onDateChange,
}: TablaPedidosProps) {
  const [orderToCancel, setOrderToCancel] = useState<Pedido | null>(null);
  const [selectedMotivoKey, setSelectedMotivoKey] = useState<PedidoMotivocancelacinKey | ''>('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState<FilterStatus>('all');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Pedido | null>(null);

  // Use external filter if provided, otherwise use internal state
  const statusFilter = externalStatusFilter ?? internalStatusFilter;
  const setStatusFilter = useCallback((filter: FilterStatus) => {
    if (onStatusFilterChange) {
      onStatusFilterChange(filter);
    } else {
      setInternalStatusFilter(filter);
    }
  }, [onStatusFilterChange]);

  // Use external date if provided, otherwise use internal state
  const selectedDate = externalSelectedDate ?? internalSelectedDate;
  const setSelectedDate = useCallback((date: Date) => {
    if (onDateChange) {
      onDateChange(date);
    } else {
      setInternalSelectedDate(date);
    }
  }, [onDateChange]);

  // Auxiliary function to check if the order is canceled
  const verificarCancelado = (order: Pedido) => order.estatusKey === 'EstatusKey2';

  const { data: orders, isLoading } = usePedidoList();

  const updatePedido = useUpdatePedido();
  
  // Get the role of the current user
  const { isAdmin, isOperativo } = useUserRole();

  // Notifications for new orders - now return the order for the popup
  const { newOrderForPopup, dismissNewOrder } = useNewOrderNotifications(orders);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  // Status for admin confirmation modal
  const [isAdminConfirmationOpen, setIsAdminConfirmationOpen] = useState(false);
  
  // Notification sound for new orders
  const { playNotificationSound } = useNotificationSound();
  
  // Status for confetti animation
  const [showConfetti, setShowConfetti] = useState(false);

  // Effect to open the popup when there is a new order
  // Only operatives see NewOrderPopup with sound, admin sees different confirmation
  useEffect(() => {
    if (newOrderForPopup) {
      if (isOperativo) {
        // Operational: show popup with sound
        setIsPopupOpen(true);
        playNotificationSound();
      } else if (isAdmin) {
        // Admin: Show confirmation that the order was created
        setIsAdminConfirmationOpen(true);
      }
    }
  }, [newOrderForPopup, playNotificationSound, isAdmin, isOperativo]);

  // Close the operative popup (only operative can close their popup)
  const handleClosePopup = useCallback(() => {
    setIsPopupOpen(false);
    dismissNewOrder();
  }, [dismissNewOrder]);

  // Close admin confirmation
  const handleCloseAdminConfirmation = useCallback(() => {
    setIsAdminConfirmationOpen(false);
    dismissNewOrder();
  }, [dismissNewOrder]);


  const dateStr = formatLocalDateKey(selectedDate);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      // Date filter
      if (order.fechaentrega !== dateStr) return false;

      // Status filter
      if (statusFilter !== 'all') {
        // Filter by specific status key
        if (order.estatusKey !== statusFilter) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = order.empleado?.nombrecompleto?.toLowerCase().includes(query) ?? false;
        const matchPlace = order.notas.toLowerCase().includes(query);
        if (!matchName && !matchPlace) return false;
      }

      return true;
    });
  }, [orders, dateStr, statusFilter, searchQuery]);

  const handleMarcarEntregado = async (order: Pedido) => {
    try {
      await updatePedido.mutateAsync({
        id: order.id,
        changedFields: {
          estatusKey: 'EstatusKey1', // Entregado
        },
      });
      // Show celebration confetti
      setShowConfetti(true);
      toast.success('¡Pedido entregado exitosamente! 🎉');
    } catch {
      toast.error('Error al actualizar el pedido');
    }
  };

  const handleOpenCancelModal = (order: Pedido) => {
    setOrderToCancel(order);
    setSelectedMotivoKey('');
    setCancelReasonOther('');
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await updatePedido.mutateAsync({
        id: orderToCancel.id,
        changedFields: { 
          estatusKey: 'EstatusKey2',
          motivocancelacinKey: selectedMotivoKey || undefined,
          // Only send free text if 'Other' was selected and there is text
          motivocancelacintextolibre: selectedMotivoKey === 'MotivocancelacinKey5' && cancelReasonOther.trim() ? cancelReasonOther.trim() : undefined,
        },
      });
      toast.success('Pedido cancelado');
      setOrderToCancel(null);
      setSelectedMotivoKey('');
      setCancelReasonOther('');
    } catch {
      toast.error('Error al cancelar el pedido');
    }
  };

  const handleCloseCancelModal = () => {
    setOrderToCancel(null);
    setSelectedMotivoKey('');
    setCancelReasonOther('');
  };

  const handleRestaurar = async (order: Pedido) => {
    try {
      await updatePedido.mutateAsync({
        id: order.id,
        changedFields: { estatusKey: 'EstatusKey0' }, // Pendiente (restaurado)
      });
      toast.success('Pedido restaurado');
    } catch {
      toast.error('Error al restaurar el pedido');
    }
  };

  const irADiaAnterior = () => setSelectedDate(subDays(selectedDate, 1));
  const irADiaSiguiente = () => setSelectedDate(addDays(selectedDate, 1));
  const irAHoy = () => setSelectedDate(new Date());

  const esHoy = formatLocalDateKey(selectedDate) === formatLocalDateKey(new Date());

  // Effect to navigate to a specific date when navigateToDate changes
  useEffect(() => {
    if (navigateToDate) {
      setSelectedDate(navigateToDate);
      // Reset filters to show all orders from that date
      setStatusFilter('all');
      setSearchQuery('');
      onNavigationComplete?.();
    }
  }, [navigateToDate, onNavigationComplete, setStatusFilter, setSelectedDate]);

  // Effect to clear highlight after animation
  useEffect(() => {
    if (highlightedOrderId) {
      const timer = setTimeout(() => {
        onHighlightComplete?.();
      }, 3000); // Highlight lasts 3 seconds
      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId, onHighlightComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border shadow-sm w-full overflow-hidden tabla-pedidos-root"
    >
      {/* Encabezado */}
      <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-card to-secondary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center justify-between bg-background rounded-lg border p-0.5 h-9 flex-1 md:flex-initial md:w-auto">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={irADiaAnterior}
                className="h-7 w-7 nav-arrow-btn"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="px-2 flex-1 md:flex-none md:min-w-[150px] text-center">
                {/* Short format for mobile */}
                <span className="typo-date capitalize sm:hidden text-[13px]">
                  {format(selectedDate, "EEE d MMM", { locale: es })}
                </span>
                {/* Full format for desktop */}
                <span className="hidden sm:inline typo-date capitalize text-[13px]">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={irADiaSiguiente}
                className="h-7 w-7 nav-arrow-btn"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Today button - only visible on desktop */}
            {!esHoy && (
              <Button
                variant="outline"
                size="sm"
                onClick={irAHoy}
                className="gap-1 hidden sm:flex h-9 elegant-outline-btn text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Hoy
              </Button>
            )}
            {/* Inline status filters for Operational - desktop only */}
            {isOperativo && (
              <div className="hidden md:flex items-center bg-background rounded-md border p-0.5 gap-0.5 shrink-0 h-9">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('all'); }}
                  className={cn(
                    'px-2 md:px-2.5 py-1 typo-filter text-xs rounded-md transition-all duration-200',
                    statusFilter === 'all'
                      ? 'bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800/60 dark:text-slate-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey0'); }}
                  className={cn(
                    'px-2 md:px-2.5 py-1 typo-filter text-xs rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey0'
                      ? 'bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey1'); }}
                  className={cn(
                    'px-2 md:px-2.5 py-1 typo-filter text-xs rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey1'
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Entregados
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey2'); }}
                  className={cn(
                    'px-2 md:px-2.5 py-1 typo-filter text-xs rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey2'
                      ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900/40 dark:text-red-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Cancelados
                </button>
              </div>
            )}
          </div>

          {/* Order Counting and Export Badge */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center justify-center px-2.5 h-9 md:h-7 rounded-md border bg-background typo-body text-xs font-medium">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            </div>
            {/* Export to Excel button */}
            {filteredOrders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void exportarPedidosAExcel(filteredOrders, selectedDate)}
                className="flex-1 md:flex-none gap-1 text-xs h-9 md:h-7 export-btn"
                title="Exportar pedidos visibles a Excel"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="sm:inline">Exportar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col gap-2 mt-3">
          {/* On mobile: Search above, filters below. On tablet/desktop: search left, filter right with consistent gap */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            {/* Search - Only visible to administrators */}
            {isAdmin && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o lugar..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background h-[42px]"
                />
              </div>
            )}

            {/* Status Filter for Admin - grid on mobile, flex inline on tablet/desktop, aligned to the right */}
            {isAdmin && (
              <div className="grid grid-cols-2 md:flex md:items-center bg-background rounded-md border p-1 gap-1 md:gap-0.5 shrink-0 h-auto md:h-[42px]">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('all'); }}
                  className={cn(
                    'px-2 md:px-3 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'all'
                      ? 'bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800/60 dark:text-slate-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey0'); }}
                  className={cn(
                    'px-2 md:px-3 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey0'
                      ? 'bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey1'); }}
                  className={cn(
                    'px-2 md:px-3 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey1'
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Entregados
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey2'); }}
                  className={cn(
                    'px-2 md:px-3 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey2'
                      ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900/40 dark:text-red-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Cancelados
                </button>
              </div>
            )}

            {/* Status filters for Mobile Operation (on desktop they are above, next to date navigation) */}
            {isOperativo && (
              <div className="grid grid-cols-2 md:hidden bg-background rounded-md border p-1 gap-1 shrink-0 h-auto">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('all'); }}
                  className={cn(
                    'px-2 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'all'
                      ? 'bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800/60 dark:text-slate-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey0'); }}
                  className={cn(
                    'px-2 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey0'
                      ? 'bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey1'); }}
                  className={cn(
                    'px-2 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey1'
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Entregados
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setStatusFilter('EstatusKey2'); }}
                  className={cn(
                    'px-2 py-1.5 typo-filter rounded-md transition-all duration-200',
                    statusFilter === 'EstatusKey2'
                      ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900/40 dark:text-red-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  Cancelados
                </button>
              </div>
            )}
          </div>

          {/* Today button - visible only on mobile below the calendar */}
          {!esHoy && (
            <Button
              variant="outline"
              size="sm"
              onClick={irAHoy}
              className="gap-1.5 md:hidden w-full elegant-outline-btn"
            >
              <CalendarDays className="h-4 w-4" />
              Ir a Hoy
            </Button>
          )}
        </div>
      </div>

      {/* Table - Desktop Version */}
      <div className="hidden md:block tabla-pedidos-container">
        <Table className="w-full table-fixed tabla-pedidos-fixed">
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="pl-4 pr-2" style={{ width: '28%' }}>
                <span className="flex items-center gap-1.5 typo-table-header">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Empleado
                </span>
              </TableHead>
              <TableHead className="px-2 text-center" style={{ width: '70px' }}>
                <span className="flex items-center justify-center gap-1.5 typo-table-header">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Hora
                </span>
              </TableHead>
              <TableHead className="px-2 text-center" style={{ width: '70px' }}>
                <span className="flex items-center justify-center gap-1.5 typo-table-header">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Cant.
                </span>
              </TableHead>
              <TableHead className="px-2" style={{ width: '30%' }}>
                <span className="flex items-center gap-1.5 typo-table-header">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Notas
                </span>
              </TableHead>
              <TableHead className="px-2 text-center" style={{ width: '85px' }}>
                <span className="flex items-center justify-center gap-1.5 typo-table-header">
                  <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                  Estatus
                </span>
              </TableHead>
              <TableHead className="px-2 pr-4 text-right" style={{ width: '110px' }}>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout" key={`desktop-${dateStr}`}>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 bg-skeleton rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-10 w-10 opacity-50" />
                    {statusFilter === 'EstatusKey2' ? (
                        <p>No hay pedidos cancelados</p>
                      ) : statusFilter === 'EstatusKey1' ? (
                        <p>No hay pedidos entregados</p>
                      ) : statusFilter === 'EstatusKey0' ? (
                        <p>No hay pedidos pendientes</p>
                      ) : (
                        <p>No hay pedidos para esta fecha</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order, index) => {
                  const userName = order.empleado?.nombrecompleto ?? 'Usuario';
                  
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        backgroundColor: highlightedOrderId === order.id 
                          ? ['hsl(var(--primary)/0.15)', 'hsl(var(--primary)/0.05)', 'transparent']
                          : 'transparent'
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        delay: index * 0.03,
                        backgroundColor: { duration: 2, times: [0, 0.5, 1] }
                      }}
                      className={cn(
                        'border-b cursor-pointer table-row-hover',
                        verificarCancelado(order) && 'opacity-60',
                        highlightedOrderId === order.id && 'ring-2 ring-primary/50 ring-inset'
                      )}
                    >
                      <TableCell className="pl-4 pr-2 py-3 row-hover-cell" style={{ width: '28%' }}>
                        <AvatarEmpleadoFila
                          empleadoId={order.empleado?.id}
                          nombreCompleto={userName}
                          entraObjectId={order.empleado?.entraobjectid}
                          fotodeperfil={order.empleado?.fotodeperfil}
                        />
                      </TableCell>
                      <TableCell className="px-2 py-3 text-center row-hover-cell" style={{ width: '70px' }}>
                        <span className="typo-table-cell font-medium bg-secondary/80 px-2 py-1 rounded-md whitespace-nowrap">
                          {formatTime(order.horaentrega)}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-center row-hover-cell" style={{ width: '70px' }}>
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-semibold tabular-nums mx-auto">
                          {order.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-3 row-hover-cell" style={{ width: '30%' }}>
                        <span 
                          className="block truncate typo-table-cell" 
                          title={order.notas}
                        >
                          {order.notas}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-center row-hover-cell" style={{ width: '85px' }}>
                        <Badge
                          variant="outline"
                          className={cn(
                            'typo-badge font-medium px-2 py-0.5 whitespace-nowrap',
                            getStatusColor(PedidoEstatusKeyToLabel[order.estatusKey])
                          )}
                        >
                          {PedidoEstatusKeyToLabel[order.estatusKey]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 pr-4 py-3 row-hover-cell" style={{ width: '110px' }}>
                        <div className="flex items-center gap-1 justify-end flex-nowrap">

                          {/* Main button visible for Pending (StatusKey0) */}
                          {order.estatusKey === 'EstatusKey0' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarcarEntregado(order)}
                              disabled={updatePedido.isPending}
                              className="h-7 px-2 text-xs gap-1 success-action-btn whitespace-nowrap"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden lg:inline">Entregar</span>
                            </Button>
                          )}
                          {/* Context menu for actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-7 w-7 menu-trigger-btn"
                                disabled={updatePedido.isPending}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[240px] pr-3">
                              {/* Ver detalle siempre disponible */}
                              <DropdownMenuItem
                                onClick={() => setSelectedOrderForDetail(order)}
                                className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                              >
                                <Eye className="h-4 w-4" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1.5" />
                              {/* Pendiente (EstatusKey0): Cancelar */}
                              {order.estatusKey === 'EstatusKey0' && (
                              <DropdownMenuItem
                                onClick={() => handleOpenCancelModal(order)}
                                className="cursor-pointer whitespace-nowrap text-red-600 dark:text-red-500 hover:!text-red-600 dark:hover:!text-red-500 focus:!text-red-600 dark:focus:!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/50 focus:!bg-red-50 dark:focus:!bg-red-950/50 [&_svg]:!text-red-600 dark:[&_svg]:!text-red-500"
                              >
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                                Cancelar pedido
                              </DropdownMenuItem>
                              )}
                              {/* Entregado (EstatusKey1): Revertir a Pendiente */}
                              {order.estatusKey === 'EstatusKey1' && (
                                <DropdownMenuItem
                                  onClick={() => handleRestaurar(order)}
                                  className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restaurar a pendiente
                                </DropdownMenuItem>
                              )}
                              {/* Cancelado (EstatusKey2): Restaurar a Pendiente */}
                              {order.estatusKey === 'EstatusKey2' && (
                                <DropdownMenuItem
                                  onClick={() => handleRestaurar(order)}
                                  className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restaurar a pendiente
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Card List - Mobile Version */}
      <div className="md:hidden tabla-pedidos-container">
        <AnimatePresence mode="popLayout" key={`mobile-${dateStr}`}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-xl bg-card animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-skeleton rounded" />
                      <div className="h-3 w-20 bg-skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-skeleton rounded mb-2" />
                  <div className="h-4 w-2/3 bg-skeleton rounded" />
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Package className="h-10 w-10 opacity-50" />
                {statusFilter === 'EstatusKey2' ? (
                  <p>No hay pedidos cancelados</p>
                ) : statusFilter === 'EstatusKey1' ? (
                  <p>No hay pedidos entregados</p>
                ) : statusFilter === 'EstatusKey0' ? (
                  <p>No hay pedidos pendientes</p>
                ) : (
                  <p>No hay pedidos para esta fecha</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-3 tabla-pedidos-mobile-cards">
              {filteredOrders.map((order, index) => {
                const userName = order.empleado?.nombrecompleto ?? 'Usuario';
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      backgroundColor: highlightedOrderId === order.id 
                        ? ['hsl(var(--primary)/0.15)', 'hsl(var(--primary)/0.05)', 'hsl(var(--card))']
                        : 'hsl(var(--card))'
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      delay: index * 0.03,
                      backgroundColor: { duration: 2, times: [0, 0.5, 1] }
                    }}
                    className={cn(
                      'p-3 sm:p-4 border rounded-xl bg-card transition-colors w-full cursor-pointer',
                      'hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08] active:bg-primary/[0.06] dark:active:bg-primary/[0.10]',
                      verificarCancelado(order) && 'opacity-60',
                      highlightedOrderId === order.id && 'ring-2 ring-primary/50'
                    )}
                  >
                    {/* Header: Avatar + Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                        <AvatarEmpleadoSoloFoto
                          empleadoId={order.empleado?.id}
                          nombreCompleto={userName}
                          entraObjectId={order.empleado?.entraobjectid}
                          fotodeperfil={order.empleado?.fotodeperfil}
                          className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-[15px] truncate max-w-full">{userName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(order.horaentrega)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-medium text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 shrink-0 whitespace-nowrap',
                          getStatusColor(PedidoEstatusKeyToLabel[order.estatusKey])
                        )}
                      >
                        {PedidoEstatusKeyToLabel[order.estatusKey]}
                      </Badge>
                    </div>

                    {/* Cantidad y Notas */}
                    <div className="flex items-start gap-2 text-sm mb-1 sm:mb-2 overflow-hidden">
                      <Hash className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="leading-snug text-sm font-semibold text-primary tabular-nums">{order.cantidad} box lunch{order.cantidad !== 1 ? 'es' : ''}</p>
                    </div>
                    <div className="flex items-start gap-2 text-sm mb-3 sm:mb-4 overflow-hidden">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-snug text-xs sm:text-sm break-words line-clamp-2">{order.notas}</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      {order.estatusKey === 'EstatusKey0' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleMarcarEntregado(order)}
                          disabled={updatePedido.isPending}
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-[13px] gap-1 sm:gap-1.5 success-action-btn"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Entregar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              'h-8 w-8 sm:h-9 sm:w-9 shrink-0',
                              order.estatusKey !== 'EstatusKey0' && 'flex-1'
                            )}
                            disabled={updatePedido.isPending}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Más opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[240px] pr-3">
                          <DropdownMenuItem
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1.5" />
                          {order.estatusKey === 'EstatusKey0' && (
                          <DropdownMenuItem
                            onClick={() => handleOpenCancelModal(order)}
                            className="cursor-pointer whitespace-nowrap text-red-600 dark:text-red-500 hover:!text-red-600 dark:hover:!text-red-500 focus:!text-red-600 dark:focus:!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/50 focus:!bg-red-50 dark:focus:!bg-red-950/50 [&_svg]:!text-red-600 dark:[&_svg]:!text-red-500"
                          >
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                            Cancelar pedido
                          </DropdownMenuItem>
                          )}
                          {order.estatusKey === 'EstatusKey1' && (
                            <DropdownMenuItem
                              onClick={() => handleRestaurar(order)}
                              className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restaurar a pendiente
                            </DropdownMenuItem>
                          )}
                          {order.estatusKey === 'EstatusKey2' && (
                            <DropdownMenuItem
                              onClick={() => handleRestaurar(order)}
                              className="cursor-pointer whitespace-nowrap [&>svg]:text-muted-foreground focus:[&>svg]:text-white"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Restaurar a pendiente
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with summary */}
      {filteredOrders.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t bg-muted/20 text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between">
          <span>Mostrando {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}</span>
          <span className="text-xs">
            {statusFilter === 'EstatusKey0' && 'Filtrado: Pendientes'}
            {statusFilter === 'EstatusKey1' && 'Filtrado: Entregados'}
            {statusFilter === 'EstatusKey2' && 'Filtrado: Cancelados'}
            {statusFilter === 'all' && 'Mostrando todos los estatus'}
          </span>
        </div>
      )}

      {/* Order Detail Modal - Modern Design with Visual Identity */}
      <Dialog open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)}>
        <DialogContent className="!w-[calc(100vw-2rem)] !max-w-[22rem] sm:!max-w-md md:!max-w-lg lg:!max-w-lg overflow-hidden flex flex-col p-0 gap-0 bg-white dark:bg-card rounded-2xl [&_[data-slot=content]]:overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.22, 1, 0.36, 1]
            }}
            className="flex flex-col h-full"
          >
            {/* Header with subtle warm gradient and decorative circle */}
            <div className="relative overflow-hidden px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-gradient-to-br from-amber-500/[0.06] via-primary/[0.04] to-transparent">
              {/* Decorative circle - top right corner */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: 1,
                  x: [0, -3, 0],
                  y: [0, 3, 0]
                }}
                transition={{ 
                  scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.4 },
                  x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-400/[0.08] blur-2xl pointer-events-none" 
              />
              <motion.div 
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  y: [0, -4, 2, 0],
                  rotate: [0, 1, -0.5, 0]
                }}
                transition={{ 
                  scale: { duration: 0.3, delay: 0.1 },
                  opacity: { duration: 0.3, delay: 0.1 },
                  y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                  rotate: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
                }}
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.05] pointer-events-none" 
              />
              
              <DialogHeader className="relative z-10">
                <DialogTitle className="flex items-center gap-3 text-xl md:text-[22px] text-foreground">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
                    className="p-2.5 rounded-xl bg-primary/10 shadow-sm"
                  >
                    <Package className="h-5 w-5 text-primary" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12, duration: 0.2 }}
                    className="font-bold"
                  >
                    Detalle del pedido
                  </motion.span>
                </DialogTitle>
              </DialogHeader>
              
              {/* Subtle dividing line */}
              <div className="absolute bottom-0 left-5 right-5 sm:left-6 sm:right-6 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            </div>
            
            {selectedOrderForDetail && (
            <div className="flex-1">
              {/* Employee block: Avatar, name, email and status badge */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.22 }}
                className="px-5 sm:px-6 pt-4 pb-3"
              >
                <div className="flex items-center gap-3">
                  <SeccionDetalleEmpleado 
                    empleadoId={selectedOrderForDetail.empleado?.id}
                    nombreCompleto={selectedOrderForDetail.empleado?.nombrecompleto ?? 'Sin asignar'}
                    entraObjectId={selectedOrderForDetail.empleado?.entraobjectid}
                  />
                  {/* Status badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs sm:text-sm font-semibold px-3 py-1.5 shrink-0 whitespace-nowrap',
                      getStatusColor(PedidoEstatusKeyToLabel[selectedOrderForDetail.estatusKey])
                    )}
                  >
                    {PedidoEstatusKeyToLabel[selectedOrderForDetail.estatusKey]}
                  </Badge>
                </div>
              </motion.div>

              {/* Delivery Data Section */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.22 }}
                className="px-5 sm:px-6 py-3 border-t border-border/30"
              >
                <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest mb-2.5">
                  Datos de Entrega
                </p>
                <div className="space-y-2.5">
                  {/* Delivery date */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-muted/50">
                      <CalendarDays className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Fecha</p>
                      <p className="font-medium capitalize text-sm text-foreground">
                        {format(new Date(selectedOrderForDetail.fechaentrega + 'T12:00:00'), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>

                  {/* Delivery time */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-muted/50">
                      <Clock className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Hora</p>
                      <p className="font-medium text-sm text-foreground">
                        {formatTime(selectedOrderForDetail.horaentrega)}
                      </p>
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-muted/50">
                      <Hash className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Cantidad</p>
                      <p className="font-medium text-sm text-foreground">
                        {selectedOrderForDetail.cantidad}
                      </p>
                    </div>
                  </div>

                  {/* Notas */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-md bg-muted/50">
                      <FileText className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Notas</p>
                      <p className="font-medium text-sm text-foreground leading-snug break-words">
                        {selectedOrderForDetail.notas}
                      </p>
                    </div>
                  </div>

                  {/* Registration Date - always visible, within Delivery Data if there is cancellation */}
                  {selectedOrderForDetail.estatusKey === 'EstatusKey2' && selectedOrderForDetail.motivocancelacinKey && (
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-md bg-muted/50">
                        <CalendarDays className="h-4 w-4 text-primary/70" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Fecha de Registro</p>
                        <p className="font-medium text-sm text-foreground">
                          {selectedOrderForDetail.fechadecreacin
                            ? format(new Date(selectedOrderForDetail.fechadecreacin), "d 'de' MMMM yyyy, HH:mm", { locale: es })
                            : 'No disponible'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Reason for Cancellation Section - no section subtitle */}
              {selectedOrderForDetail.estatusKey === 'EstatusKey2' && selectedOrderForDetail.motivocancelacinKey && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.22 }}
                className="px-5 sm:px-6 py-3 border-t border-border/30"
              >
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-red-50/60 dark:bg-red-900/15">
                  <div className="p-1 rounded-md bg-red-100/70 dark:bg-red-900/40">
                    <MessageCircle className="h-4 w-4 text-red-500/80 dark:text-red-400/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-red-600/80 dark:text-red-400/80 uppercase tracking-widest">Motivo de Cancelación</p>
                    <p className="font-medium text-sm text-red-700 dark:text-red-300 leading-snug break-words">
                      {PedidoMotivocancelacinKeyToLabel[selectedOrderForDetail.motivocancelacinKey]}
                    </p>
                    {/* Show additional free text if the reason is 'Other' and there is text */}
                    {selectedOrderForDetail.motivocancelacinKey === 'MotivocancelacinKey5' && selectedOrderForDetail.motivocancelacintextolibre && (
                      <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5 break-words">
                        {selectedOrderForDetail.motivocancelacintextolibre}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
              )}

              {/* Registration Date - visible only when there is NO reason for cancellation */}
              {!(selectedOrderForDetail.estatusKey === 'EstatusKey2' && selectedOrderForDetail.motivocancelacinKey) && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.22 }}
                className="px-5 sm:px-6 py-3 border-t border-border/30"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-muted/50">
                    <CalendarDays className="h-4 w-4 text-primary/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">Fecha de Registro</p>
                    <p className="font-medium text-sm text-foreground">
                      {selectedOrderForDetail.fechadecreacin
                        ? format(new Date(selectedOrderForDetail.fechadecreacin), "d 'de' MMMM yyyy, HH:mm", { locale: es })
                        : 'No disponible'}
                    </p>
                  </div>
                </div>
              </motion.div>
              )}

              {/* Footer with close button */}
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: selectedOrderForDetail.estatusKey === 'EstatusKey2' && selectedOrderForDetail.motivocancelacinKey ? 0.32 : 0.26, duration: 0.22 }}
                className="px-5 sm:px-6 py-3 border-t border-border/40 flex justify-end"
              >
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="elegant-outline-btn modal-btn-secondary"
                >
                  <X className="h-4 w-4" />
                  Cerrar
                </Button>
              </motion.div>
            </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Confirmation Modal - Redesigned */}
      <AnimatePresence>
        {orderToCancel && (
          <>
            {/* Dark overlay with animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={handleCloseCancelModal}
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
              <div className="relative overflow-hidden rounded-2xl bg-card border shadow-2xl">
                {/* Header with gradient using theme colors */}
                <div className="relative bg-gradient-to-br from-red-500/90 via-red-500/80 to-red-600/90 dark:from-red-600/80 dark:via-red-500/70 dark:to-red-600/80 px-6 pt-6 pb-8">
                  {/* decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                  </div>

                  {/* close button */}
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleCloseCancelModal();
                    }}
                    disabled={updatePedido.isPending}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4 pointer-events-none" />
                  </button>

                  {/* Icon and title */}
                  <div className="relative flex items-center gap-3">
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                      className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                    >
                      <XCircle className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="typo-cancel-modal-title text-white"
                      >
                        Cancelar Pedido
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="typo-cancel-modal-subtitle text-white/85"
                      >
                        ¿Estás seguro de cancelar este pedido?
                      </motion.p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="px-6 py-5 space-y-5">
                  {/* Employee info with card style */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full"
                  >
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50">
                      <SeccionDetalleEmpleado 
                        empleadoId={orderToCancel.empleado?.id}
                        nombreCompleto={orderToCancel.empleado?.nombrecompleto ?? 'Sin asignar'}
                      />
                    </div>
                  </motion.div>

                  {/* Reason for Cancellation Section - Separate card type design */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-4"
                  >
                    {/* Section header styled similarly to the others */}
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-widest">
                        Motivo de Cancelación
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 font-normal">(opcional)</span>
                    </div>

                    {/* Improved style selection field */}
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-muted/50">
                        <MessageCircle className="h-4 w-4 text-primary/70" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <Select
                          value={selectedMotivoKey}
                          onValueChange={(val: PedidoMotivocancelacinKey) => setSelectedMotivoKey(val)}
                        >
                          <SelectTrigger id="cancel-reason-select" className="w-full bg-background border-border/60 hover:border-border transition-colors typo-cancel-modal-dropdown">
                            <SelectValue placeholder="Selecciona un motivo..." />
                          </SelectTrigger>
                          <SelectContent side="bottom" position="popper">
                            {(Object.entries(PedidoMotivocancelacinKeyToLabel) as [PedidoMotivocancelacinKey, string][]).map(([key, label]: [PedidoMotivocancelacinKey, string]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Free text field only when 'Other' is selected */}
                        <AnimatePresence>
                          {selectedMotivoKey === 'MotivocancelacinKey5' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2 overflow-hidden"
                            >
                              <Textarea
                                id="cancel-reason-other"
                                placeholder="Describe el motivo de la cancelación..."
                                value={cancelReasonOther}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReasonOther(e.target.value)}
                                className="resize-none min-h-[80px] bg-background border-border/60"
                                maxLength={500}
                              />
                              <p className="text-xs text-muted-foreground text-right">
                                {cancelReasonOther.length}/500
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Footer with rearranged actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="px-6 py-4 border-t bg-muted/30 flex flex-col-reverse sm:flex-row items-center justify-between gap-3"
                >
                  {/* Secondary button - Close */}
                  <Button
                    variant="outline"
                    onClick={handleCloseCancelModal}
                    disabled={updatePedido.isPending}
                    className="w-full sm:w-auto elegant-outline-btn modal-btn-secondary"
                  >
                    <X className="h-4 w-4" />
                    Cerrar
                  </Button>

                  {/* Main button - Confirm cancellation */}
                  <Button
                    variant="destructive"
                    onClick={() => void handleConfirmCancel()}
                    disabled={updatePedido.isPending}
                    className="w-full sm:w-auto modal-btn-primary modal-btn-cancel-confirm bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white transition-all duration-200"
                  >
                    {updatePedido.isPending ? (
                      <>
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Confirmar cancelación
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New order popup - Only for operations */}
      <NewOrderPopup
        order={newOrderForPopup}
        isOpen={isPopupOpen && isOperativo}
        onClose={handleClosePopup}
      />

      {/* Order confirmation created for administrator */}
      <AdminOrderConfirmation
        order={newOrderForPopup}
        isOpen={isAdminConfirmationOpen && isAdmin}
        onClose={handleCloseAdminConfirmation}
      />
      
      {/* Confetti animation when marking as delivered */}
      <ConfettiCelebration
        isActive={showConfetti}
        duration={3000}
        pieceCount={60}
        onComplete={() => setShowConfetti(false)}
      />
    </motion.div>
  );
}

export default TablaPedidos;
