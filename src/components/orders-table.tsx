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
  FileText,
  Hash,
  MoreHorizontal,
  Eye,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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

import { cn, formatLocalDateKey, formatTime, getStatusColor } from '@/lib/utils';

import { usePedidoList, useUpdatePedido } from '@/generated/hooks/use-pedido';

import { PedidoEstatusKeyToLabel } from '@/generated/models/pedido-model';
import type { Pedido } from '@/generated/models/pedido-model';
import { useNewOrderNotifications } from '@/hooks/use-notifications';

export type FilterStatus = 'all' | 'EstatusKey0' | 'EstatusKey1' | 'EstatusKey2';

/**
 * Memoized component to display employee avatar in table row.
 * Upload profile photo using employee ID.
 */
const EmployeeRowAvatar = memo(function EmployeeRowAvatar({
  empleadoId,
  nombreCompleto,
  entraObjectId,
}: {
  empleadoId?: string;
  nombreCompleto: string;
  entraObjectId?: string;
}) {
  const { data: empleado } = useEmpleado(empleadoId ?? '');
  
  return (
    <div className="flex items-center gap-3">
      <EmployeePhotoAvatar
        photoUrl={empleado?.fotodeperfil}
        employeeName={nombreCompleto}
        employeeEmail={empleado?.userprincipalname}
        entraObjectId={entraObjectId || empleado?.entraobjectid}
        className="h-8 w-8 shrink-0"
        enableLazyLoad={true}
      />
      <span className="font-medium truncate">{nombreCompleto}</span>
    </div>
  );
});

/**
 * Component that shows the detail of the employee with his photo in the detail modal.
 * Search the employee by ID to get the profile photo synced from Microsoft Sign In ID.
 */
function EmployeeDetailSection({ 
  empleadoId, 
  nombreCompleto,
  entraObjectId
}: { 
  empleadoId?: string; 
  nombreCompleto: string;
  entraObjectId?: string;
}) {
  // Find the employee to obtain the profile photo (synchronized from Entra ID) and additional data
  const { data: empleado, isLoading } = useEmpleado(empleadoId ?? '');
  
  return (
    <div className="flex items-center gap-4">
      {/* Avatar with employee photo - use the profile photo field synchronized from Entra ID */}
      <EmployeePhotoAvatar
        photoUrl={empleado?.fotodeperfil}
        employeeName={nombreCompleto}
        employeeEmail={empleado?.userprincipalname}
        entraObjectId={entraObjectId || empleado?.entraobjectid}
        className="h-14 w-14 ring-2 ring-primary/20"
        enableLazyLoad={false}
      />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" />
          Empleado
        </p>
        <p className="font-semibold text-lg">{nombreCompleto}</p>
        {isLoading && (
          <p className="text-xs text-muted-foreground animate-pulse">Cargando datos...</p>
        )}
        {empleado?.userprincipalname && (
          <p className="text-xs text-muted-foreground truncate">{empleado.userprincipalname}</p>
        )}
      </div>
    </div>
  );
}

interface OrdersTableProps {
  /** Order ID to highlight (newly created) */
  highlightedOrderId?: string | null;
  /** Callback when highlight animation completes */
  onHighlightComplete?: () => void;
  /** External date to navigate to */
  navigateToDate?: Date | null;
  /** Callback when navigation is complete */
  onNavigationComplete?: () => void;
  /** External status filter controlled by parent */
  externalStatusFilter?: FilterStatus;
  /** Callback when status filter changes */
  onStatusFilterChange?: (filter: FilterStatus) => void;
}

export function OrdersTable({ 
  highlightedOrderId,
  onHighlightComplete,
  navigateToDate,
  onNavigationComplete,
  externalStatusFilter,
  onStatusFilterChange,
}: OrdersTableProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // Helper function to check if order is cancelled
  const checkCancelled = (order: Pedido) => order.estatusKey === 'EstatusKey2';

  const { data: orders, isLoading } = usePedidoList();

  const updatePedido = useUpdatePedido();

  // Notifications for new orders
  useNewOrderNotifications(orders);

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

  const handleMarkAsDelivered = async (order: Pedido) => {
    try {
      await updatePedido.mutateAsync({
        id: order.id,
        changedFields: {
          estatusKey: 'EstatusKey1', // Entregado
        },
      });
      toast.success('Pedido marcado como entregado');
    } catch {
      toast.error('Error al actualizar el pedido');
    }
  };

  const handleCancel = async (order: Pedido) => {
    try {
      await updatePedido.mutateAsync({
        id: order.id,
        changedFields: { estatusKey: 'EstatusKey2' }, // Cancelado
      });
      toast.success('Pedido cancelado');
    } catch {
      toast.error('Error al cancelar el pedido');
    }
  };

  const handleRestore = async (order: Pedido) => {
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

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = formatLocalDateKey(selectedDate) === formatLocalDateKey(new Date());

  // Effect to navigate to a specific date when navigateToDate changes
  useEffect(() => {
    if (navigateToDate) {
      setSelectedDate(navigateToDate);
      // Reset filters to show all orders on that date
      setStatusFilter('all');
      setSearchQuery('');
      onNavigationComplete?.();
    }
  }, [navigateToDate, onNavigationComplete, setStatusFilter]);

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
      className="bg-card rounded-xl border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b bg-gradient-to-r from-card to-secondary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-background rounded-lg border p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={goToPreviousDay}
                className="h-8 w-8 nav-arrow-btn"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 min-w-[180px] text-center">
                <span className="font-medium capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={goToNextDay}
                className="h-8 w-8 nav-arrow-btn"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="gap-1.5 elegant-outline-btn"
              >
                <CalendarDays className="h-4 w-4" />
                Hoy
              </Button>
            )}
          </div>

          {/* Orders Count Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1.5 font-medium">
              {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o lugar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          {/* Status Filter - Tab Style */}
          <div className="flex items-center bg-background rounded-lg border p-1 gap-0.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                statusFilter === 'all'
                  ? 'bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800/60 dark:text-slate-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('EstatusKey1')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                statusFilter === 'EstatusKey1'
                  ? 'bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('EstatusKey0')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                statusFilter === 'EstatusKey0'
                  ? 'bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Entregados
            </button>
            <button
              onClick={() => setStatusFilter('EstatusKey2')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                statusFilter === 'EstatusKey2'
                  ? 'bg-red-100 text-red-700 shadow-sm dark:bg-red-900/40 dark:text-red-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Cancelados
            </button>
          </div>


        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[250px] pl-6">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Empleado
                </span>
              </TableHead>
              <TableHead className="px-4">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Hora
                </span>
              </TableHead>
              <TableHead className="px-4 w-[100px] text-center">
                <span className="flex items-center justify-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Cant.
                </span>
              </TableHead>
              <TableHead className="w-[280px] px-4">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notas
                </span>
              </TableHead>
              <TableHead className="px-4">
                <span className="flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-muted-foreground" />
                  Estatus
                </span>
              </TableHead>
              <TableHead className="w-[180px] px-4 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-5 bg-skeleton rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-10 w-10 opacity-50" />
                      <p>No hay pedidos para esta fecha</p>
                      {statusFilter === 'EstatusKey2' && (
                        <p className="text-sm">No hay pedidos cancelados</p>
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        backgroundColor: highlightedOrderId === order.id 
                          ? ['hsl(var(--primary)/0.15)', 'hsl(var(--primary)/0.05)', 'transparent']
                          : 'transparent'
                      }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ 
                        delay: index * 0.03,
                        backgroundColor: { duration: 2, times: [0, 0.5, 1] }
                      }}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        checkCancelled(order) && 'opacity-60',
                        highlightedOrderId === order.id && 'ring-2 ring-primary/50 ring-inset'
                      )}
                    >
                      <TableCell className="pl-6">
                        <EmployeeRowAvatar
                          empleadoId={order.empleado?.id}
                          nombreCompleto={userName}
                          entraObjectId={(order.empleado as any)?.entraobjectid}
                        />
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                          {formatTime(order.horaentrega)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        <span className="font-medium">
                          {order.cantidad}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 max-w-[280px]">
                        <span 
                          className="block truncate" 
                          title={order.notas}
                        >
                          {order.notas}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium text-xs px-2.5 py-0.5',
                            getStatusColor(PedidoEstatusKeyToLabel[order.estatusKey])
                          )}
                        >
                          {PedidoEstatusKeyToLabel[order.estatusKey]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Main button visible for Pending (StatusKey1) */}
                          {order.estatusKey === 'EstatusKey1' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarkAsDelivered(order)}
                              disabled={updatePedido.isPending}
                              className="gap-1.5 success-action-btn"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Entregar
                            </Button>
                          )}
                          {/* Context menu for actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8 menu-trigger-btn"
                                disabled={updatePedido.isPending}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* Ver detalle siempre disponible */}
                              <DropdownMenuItem
                                onClick={() => setSelectedOrderForDetail(order)}
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Pendiente (EstatusKey1): Cancelar */}
                              {order.estatusKey === 'EstatusKey1' && (
                                <DropdownMenuItem
                                  onClick={() => handleCancel(order)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar pedido
                                </DropdownMenuItem>
                              )}
                              {/* Entregado (EstatusKey0): Revertir a Pendiente */}
                              {order.estatusKey === 'EstatusKey0' && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(order)}
                                  className="cursor-pointer"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Revertir a pendiente
                                </DropdownMenuItem>
                              )}
                              {/* Cancelado (EstatusKey2): Restaurar a Pendiente */}
                              {order.estatusKey === 'EstatusKey2' && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(order)}
                                  className="cursor-pointer"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
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

      {/* Footer with summary */}
      {filteredOrders.length > 0 && (
        <div className="px-5 py-3 border-t bg-muted/20 text-sm text-muted-foreground flex items-center justify-between">
          <span>Mostrando {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}</span>
          <span className="text-xs">
            {statusFilter === 'EstatusKey1' && 'Filtrado: Pendientes'}
            {statusFilter === 'EstatusKey0' && 'Filtrado: Entregados'}
            {statusFilter === 'EstatusKey2' && 'Filtrado: Cancelados'}
            {statusFilter === 'all' && 'Mostrando todos los estatus'}
          </span>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)}>
        <DialogContent className="!w-[calc(100vw-2rem)] !max-w-sm sm:!max-w-md md:!max-w-md lg:!max-w-md border-4 border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25)] bg-yellow-50">
          <DialogHeader className="box-lunch-modal-header order-details-header">
            <DialogTitle className="flex items-center gap-2 modal-title">
              <div className="modal-icon-circle">
                <Package className="h-5 w-5 modal-icon" />
              </div>
              DEBUG MODAL ORDERS-TABLE
            </DialogTitle>
          </DialogHeader>
          {selectedOrderForDetail && (
            <div className="space-y-4">
              {/* DEBUG TEXT - TEMPORARY */}
              <p className="text-lg font-bold text-red-600 bg-red-100 p-2 rounded text-center">ESTE MODAL VIENE DE orders-table.tsx</p>
              {/* Estatus principal destacado */}
              <div className="flex justify-center py-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-sm font-semibold px-4 py-1.5',
                    getStatusColor(PedidoEstatusKeyToLabel[selectedOrderForDetail.estatusKey])
                  )}
                >
                  {PedidoEstatusKeyToLabel[selectedOrderForDetail.estatusKey]}
                </Badge>
              </div>

              <div className="grid gap-4 border-t pt-4">
                {/* Employee with photo - occupies 2 columns in md+ */}
                <div>
                  <EmployeeDetailSection 
                    empleadoId={selectedOrderForDetail.empleado?.id}
                    nombreCompleto={selectedOrderForDetail.empleado?.nombrecompleto ?? 'Sin asignar'}
                    entraObjectId={(selectedOrderForDetail.empleado as any)?.entraobjectid}
                  />
                </div>

                {/* Delivery date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium capitalize">
                      {format(new Date(selectedOrderForDetail.fechaentrega + 'T12:00:00'), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Delivery time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hora de Entrega</p>
                    <p className="font-medium font-mono">{formatTime(selectedOrderForDetail.horaentrega)}</p>
                  </div>
                </div>

                {/* Cantidad */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cantidad</p>
                    <p className="font-medium">{selectedOrderForDetail.cantidad}</p>
                  </div>
                </div>

                {/* Notes - occupies 2 columns in md+ */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="font-medium">{selectedOrderForDetail.notas}</p>
                  </div>
                </div>

              </div>

              {/* Registration information - visually separated */}
              {selectedOrderForDetail.fechadecreacin && (
                <div className="mt-2 pt-4 border-t border-dashed">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-secondary/80 border border-border/50">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pedido registrado</p>
                      <p className="text-sm font-semibold text-foreground/80 mt-0.5">
                        {format(new Date(selectedOrderForDetail.fechadecreacin), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        <span className="text-muted-foreground font-normal"> a las </span>
                        {format(new Date(selectedOrderForDetail.fechadecreacin), "HH:mm 'hrs'", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* close button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedOrderForDetail(null)} className="elegant-outline-btn modal-btn-secondary">
                  <X className="h-4 w-4" />
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

