// OrderForm - Component to create Box Lunch requests
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus, Loader2, UtensilsCrossed, User, ChevronsUpDown, Shield, Clock, Search, X, Check, FileText, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserRole } from '@/hooks/use-user-role';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmployeePhotoAvatar } from '@/components/employee-photo-avatar';
import { cn } from '@/lib/utils';

import type { Empleado } from '@/generated/models/empleado-model';
import { useCreatePedido } from '@/generated/hooks/use-pedido';
import { useEmpleadoList } from '@/generated/hooks/use-empleado';

// Function to normalize text: remove accents and convert to lowercase
// This allows you to search for "garcia" and find "García"
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
    .trim();
}

const pedidoSchema = z.object({
  entraUserId: z.string().min(1, 'Seleccione un empleado'),
  fechaEntrega: z.date({ message: 'Seleccione la fecha de entrega' }),
  horaEntrega: z.string().min(1, 'Seleccione la hora de entrega'),
  cantidad: z.number().min(1, 'La cantidad debe ser al menos 1'),
  notas: z.string().min(1, 'Ingrese sus notas o especificaciones'),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

// Time options for the delivery time selector
const OPCIONES_HORA = [
  { value: '06:00', label: '6:00 AM', periodo: 'Mañana' },
  { value: '06:30', label: '6:30 AM', periodo: 'Mañana' },
  { value: '07:00', label: '7:00 AM', periodo: 'Mañana' },
  { value: '07:30', label: '7:30 AM', periodo: 'Mañana' },
  { value: '08:00', label: '8:00 AM', periodo: 'Mañana' },
  { value: '08:30', label: '8:30 AM', periodo: 'Mañana' },
  { value: '09:00', label: '9:00 AM', periodo: 'Mañana' },
  { value: '09:30', label: '9:30 AM', periodo: 'Mañana' },
  { value: '10:00', label: '10:00 AM', periodo: 'Mañana' },
  { value: '10:30', label: '10:30 AM', periodo: 'Mañana' },
  { value: '11:00', label: '11:00 AM', periodo: 'Mañana' },
  { value: '11:30', label: '11:30 AM', periodo: 'Mañana' },
  { value: '12:00', label: '12:00 PM', periodo: 'Mediodía' },
  { value: '12:30', label: '12:30 PM', periodo: 'Mediodía' },
  { value: '13:00', label: '1:00 PM', periodo: 'Tarde' },
  { value: '13:30', label: '1:30 PM', periodo: 'Tarde' },
  { value: '14:00', label: '2:00 PM', periodo: 'Tarde' },
  { value: '14:30', label: '2:30 PM', periodo: 'Tarde' },
  { value: '15:00', label: '3:00 PM', periodo: 'Tarde' },
  { value: '15:30', label: '3:30 PM', periodo: 'Tarde' },
  { value: '16:00', label: '4:00 PM', periodo: 'Tarde' },
  { value: '16:30', label: '4:30 PM', periodo: 'Tarde' },
  { value: '17:00', label: '5:00 PM', periodo: 'Tarde' },
  { value: '17:30', label: '5:30 PM', periodo: 'Tarde' },
  { value: '18:00', label: '6:00 PM', periodo: 'Tarde' },
];

// Get the display label for a time value
function obtenerEtiquetaHora(valor: string): string {
  const opcion = OPCIONES_HORA.find(t => t.value === valor);
  return opcion?.label || valor;
}

export interface FormularioPedidosProps {
  onOrderCreated?: (order: { id: string; fechaentrega: string; nombreEmpleado: string }) => void;
}

export function FormularioPedidos({ onOrderCreated }: FormularioPedidosProps) {
  const { isAdmin, isDeveloper } = useUserRole();
  const [open, setOpen] = useState(false);

  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // selectedUser is directly an Employee of the SQLite DB
  const [selectedUser, setSelectedUser] = useState<Empleado | null>(null);
  const DISPLAY_LIMIT = 50;
  const [displayCount, setDisplayCount] = useState(DISPLAY_LIMIT);

  // Debounce for search
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchQuery]);

  // ── DATA SOURCE: Employees from SQLite (no ID entered) ────────────────
  const { data: empleadosRaw, isLoading: usersLoading } = useEmpleadoList();

  // Filter: exclude system accounts (admin, operating, etc.)
  const empleados = useMemo(() => {
    if (!empleadosRaw) return [];
    const systemEmails = ['admin@demo.com', 'operativo@demo.com', 'desarrollador@demo.com'];
    return empleadosRaw.filter(
      (e) => !systemEmails.includes((e.userprincipalname || '').toLowerCase())
    );
  }, [empleadosRaw]);

  // Preprocessed search index (no accents, lowercase)
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const e of empleados) {
      const text = normalizeText(`${e.nombrecompleto} ${e.userprincipalname || ''}`);
      index.set(e.id, text);
    }
    return index;
  }, [empleados]);

  // Filter by search
  const searchFilteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) return empleados;
    const query = normalizeText(debouncedSearch);
    return empleados.filter((e) => {
      const text = searchIndex.get(e.id);
      return text ? text.includes(query) : false;
    });
  }, [empleados, searchIndex, debouncedSearch]);

  // Pagination
  const displayedUsers = useMemo(() => searchFilteredUsers.slice(0, displayCount), [searchFilteredUsers, displayCount]);
  const hasMoreUsers = searchFilteredUsers.length > displayCount;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setDisplayCount(DISPLAY_LIMIT);
  }, [DISPLAY_LIMIT]);

  const loadMoreUsers = () => setDisplayCount((prev) => prev + DISPLAY_LIMIT);

  const createPedido = useCreatePedido();

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      entraUserId: '',
      fechaEntrega: new Date(),
      horaEntrega: '',
      cantidad: 1,
      notas: '',
    },
  });

  // Manually register fields that are not associated with a native HTML input
  // This prevents react-hook-form from discarding them and sending 'undefined' to Zod
  useEffect(() => {
    form.register('entraUserId');
    form.register('fechaEntrega');
    form.register('horaEntrega');
  }, [form.register]);

  const onSubmit = async (data: PedidoFormData) => {
    // Validate that the date/time is not in the past
    const now = new Date();
    const selectedDate = data.fechaEntrega;
    const [hours, minutes] = data.horaEntrega.split(':').map(Number);
    
    // Create complete delivery date/time
    const deliveryDateTime = new Date(selectedDate);
    deliveryDateTime.setHours(hours, minutes, 0, 0);
    
    // If the delivery date/time has already passed
    if (deliveryDateTime < now) {
      const isToday = selectedDate.toDateString() === now.toDateString();
      if (isToday) {
        toast.error('La hora de entrega ya pasó', {
          description: 'Por favor selecciona una hora futura para hoy o elige otra fecha.',
        });
      } else {
        toast.error('No se puede registrar en una fecha pasada', {
          description: 'Por favor selecciona una fecha y hora futura.',
        });
      }
      return;
    }

    // The selected user is already an Employee of the SQLite DB
    const empleado = selectedUser;

    if (!empleado) {
      toast.error('Error al obtener empleado', {
        description: 'No se pudo encontrar el empleado seleccionado. Intenta seleccionarlo nuevamente.',
      });
      return;
    }

    const nombreCompleto = empleado.nombrecompleto || 'Usuario';

    try {

      // Validate that the time is selected (required for DateAndTime)
      if (!data.horaEntrega || !data.horaEntrega.trim()) {
        toast.error('Hora de entrega requerida', {
          description: 'Por favor selecciona la hora de entrega antes de guardar.',
        });
        return;
      }

      // Construir DateTime ISO completo combinando fecha + hora
      // The delivery hour field is of type DateAndTime and requires ISO format: YYYY-MM-DDTHH:mm
      const fechaISO = format(data.fechaEntrega, 'yyyy-MM-dd');
      const horaEntregaDateTime = `${fechaISO}T${data.horaEntrega}`;

      const createdOrder = await createPedido.mutateAsync({
        pedidonombre: `Pedido - ${nombreCompleto}`,
        // Use the Employee ID (not the Entra ID)
        empleado: { 
          id: empleado.id, 
          nombrecompleto: empleado.nombrecompleto 
        },
        // Default status: Pending (using the enum key)
        estatusKey: 'EstatusKey0',
        // Creation date: current ISO timestamp (includes date and time)
        fechadecreacin: new Date().toISOString(),
        fechaentrega: fechaISO,
        // Hora Entrega: DateTime ISO completo (YYYY-MM-DDTHH:mm) - campo obligatorio
        horaentrega: horaEntregaDateTime,
        cantidad: data.cantidad,
        notas: data.notas,
      });

      // Save data from the created order to notify the callback
      const orderData = {
        id: createdOrder.id,
        fechaentrega: fechaISO,
        nombreEmpleado: nombreCompleto,
      };

      // Clear and close the form FIRST (the order is already created)
      resetForm();
      setOpen(false);

      // Notify the callback that the order was created successfully
      // This allows the UI to update the table and display the order
      onOrderCreated?.(orderData);

      // Send mail notification to employee in background (without blocking UI)
      // TEMPORARILY DISABLED: email is not being used right now.
      /* sendEmailNotification.mutateAsync({
        employee: user,
        DeliveryDate: format(data.deliverydate, 'yyyy-MM-dd'),
        DeliveryTime: data.DeliveryTime,
        DeliveryPlace: data.DeliveryPlace,
      }).catch((emailError) => {
        // Only error log, the popup already showed the order confirmation
        console.warn('Error sending email notification:', emailError);
      }); */
    } catch (error) {
      console.error('Error al registrar la solicitud:', error);
      
      // Handle specific error from aaduser table (Microsoft Entra ID)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAadUserError = errorMessage.toLowerCase().includes('aaduser');
      
      if (isAadUserError) {
        toast.error('Error de permisos en Microsoft Entra ID', {
          description: 'No se puede crear el registro. Por favor, verifica que el empleado seleccionado existe en el directorio y vuelve a intentar.',
        });
      } else {
        toast.error('Error al registrar la solicitud', {
          description: errorMessage || 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
        });
      }
    }
  };

  const handleUserSelect = (empleadoId: string) => {
    const emp = empleados.find((e) => e.id === empleadoId);
    if (emp) {
      setSelectedUser(emp);
      form.setValue('entraUserId', emp.id, { shouldValidate: true, shouldDirty: true });
      setSearchQuery('');
      setEmployeePopoverOpen(false);
    }
  };

  const selectedTime = form.watch('horaEntrega');

  // Function to clear the form completely
  const resetForm = () => {
    form.reset({
      entraUserId: '',
      fechaEntrega: new Date(),
      horaEntrega: '',
      cantidad: 1,
      notas: '',
    });
    setSelectedUser(null);
  };

  // Handle dialog opening/closing
  const handleOpenChange = (isOpen: boolean) => {
    // Always reset the form when opening/closing
    // This ensures that the delivery date is always the current date
    resetForm();
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="nueva-solicitud-btn gap-2 mobile-compact">
          <Plus className="h-4 w-4" />
          <span className="btn-text">Nueva Solicitud</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="!w-[calc(100vw-2rem)] !max-w-[22rem] sm:!max-w-md md:!max-w-lg lg:!max-w-lg overflow-hidden flex flex-col p-0 gap-0 bg-white dark:bg-card rounded-2xl"
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header with gradient and decorative circle */}
        <div className={cn("box-lunch-modal-header", isDeveloper && "border-b-purple-500/10")}>
          {/* Decorative circle inspired by dashboard cards - THEME-AWARE */}
          <div className={cn("absolute -top-6 -right-6 w-32 h-32 rounded-bl-full pointer-events-none z-0", isDeveloper ? "bg-gradient-to-bl from-purple-500/12 to-transparent" : "bg-gradient-to-bl from-primary/12 to-transparent")} />
          <motion.div 
            className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-bl-full pointer-events-none z-0", isDeveloper ? "bg-gradient-to-bl from-purple-500/8 to-transparent" : "bg-gradient-to-bl from-primary/8 to-transparent")}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.10, 0.14, 0.10],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Close button in upper right corner */}
          <motion.button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="modal-close-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            aria-label="Cerrar modal"
            tabIndex={0}
          >
            <X className="h-4 w-4" />
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05
            }}
            className="relative z-10 pt-1"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <motion.div 
                  className="modal-icon-circle"
                  initial={{ rotate: -15, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20,
                    delay: 0.15
                  }}
                >
                  {isDeveloper ? (
                    <Shield className="h-5 w-5 modal-icon text-purple-600" />
                  ) : isAdmin ? (
                    <UtensilsCrossed className="h-5 w-5 modal-icon text-blue-600" />
                  ) : (
                    <UtensilsCrossed className="h-5 w-5 modal-icon" />
                  )}
                </motion.div>
                <motion.span
                  className="typo-modal-title modal-title"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  {isDeveloper ? "Diagnóstico: Nuevo Pedido" : isAdmin ? "Registrar Pedido" : "Solicitar Box Lunch"}
                </motion.span>
              </DialogTitle>
            </DialogHeader>
          </motion.div>
        </div>
        
        {/* Form content with padding */}
        <motion.form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="px-6 pb-6 pt-4"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1
          }}
        >
          {/* Hidden inputs to guarantee React Hook Form registers custom fields natively */}
          <input type="hidden" {...form.register('entraUserId')} />
          <input type="hidden" {...form.register('horaEntrega')} />
          
          <AnimatePresence mode="wait">
            {/* Empleado from Microsoft Entra ID */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.35, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.15 
              }}
              className="space-y-2"
            >

              <Label htmlFor="empleado" className="flex items-center gap-2 typo-modal-label">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Empleado <span className="required-asterisk">*</span>
              </Label>
              <Popover 
                open={employeePopoverOpen} 
                onOpenChange={(open) => {
                  setEmployeePopoverOpen(open);
                  if (!open) {
                    setSearchQuery('');
                    setDebouncedSearch(''); // Reset debounce too
                    setDisplayCount(DISPLAY_LIMIT); // Reset al cerrar
                  }
                }}
                modal={true}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={employeePopoverOpen}
                    className={cn(
                      'w-full form-input-trigger h-auto min-h-10 py-2 justify-between',
                      !selectedUser && 'text-muted-foreground',
                      form.formState.errors.entraUserId && 'border-destructive'
                    )}
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <EmployeePhotoAvatar
                          photoUrl={selectedUser.fotodeperfil}
                          employeeName={selectedUser.nombrecompleto}
                          employeeEmail={selectedUser.userprincipalname}
                          className="h-7 w-7 shrink-0"
                          enableLazyLoad={false}
                        />
                        <div className="flex flex-col min-w-0 overflow-hidden text-left">
                          <span className="font-medium truncate typo-modal-input leading-tight">{selectedUser.nombrecompleto}</span>
                          {selectedUser.userprincipalname && (
                            <span className="typo-modal-secondary text-muted-foreground truncate leading-tight">{selectedUser.userprincipalname}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 typo-modal-input text-muted-foreground">
                        <User className="h-4 w-4" />
                        Seleccionar empleado...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] min-w-0 sm:min-w-[420px] p-0 rounded-xl overflow-hidden shadow-xl employee-popover mobile-employee-popover" 
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  style={{ zIndex: 99999 }}
                >
                  <Command shouldFilter={false}>
                    {/* Search zone - no autofocus to show normal status */}
                    <div className="p-3 employee-search-zone">
                      <div className="relative search-input-wrapper">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 search-icon pointer-events-none" />
                        <input
                          placeholder="Buscar empleado..."
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="search-input-neutral typo-modal-input w-full pl-10 rounded-lg py-2 pr-3 h-10 border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                        />
                      </div>
                    </div>
                    {/* Employee list - with custom scroll */}
                    <CommandList 
                      className="max-h-64 overflow-y-auto employee-list-scroll"
                      onScroll={(e: React.UIEvent<HTMLDivElement>) => {
                        // Load more when the user gets closer to the end
                        const target = e.currentTarget;
                        const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                        if (scrolledToBottom && hasMoreUsers) {
                          loadMoreUsers();
                        }
                      }}
                    >
                      {usersLoading ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Cargando usuarios...</span>
                        </div>
                      ) : displayedUsers.length === 0 ? (
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-2 py-2 text-muted-foreground">
                            <User className="h-8 w-8 opacity-50" />
                            <span>{searchQuery ? 'No se encontraron empleados' : 'No hay empleados disponibles'}</span>
                          </div>
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {displayedUsers.map((emp) => (
                            <CommandItem 
                              key={emp.id}
                              value={emp.id}
                              onSelect={() => handleUserSelect(emp.id)}
                              className="px-4 py-3 cursor-pointer"
                              data-employee-selected={selectedUser?.id === emp.id ? "true" : undefined}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <EmployeePhotoAvatar
                                  photoUrl={emp.fotodeperfil}
                                  employeeName={emp.nombrecompleto}
                                  employeeEmail={emp.userprincipalname}
                                  className="h-8 w-8 shrink-0"
                                  enableLazyLoad={true}
                                />
                                <div className="flex flex-col min-w-0 overflow-hidden">
                                  <span className="font-medium truncate">
                                    {emp.nombrecompleto}
                                  </span>
                                  {emp.userprincipalname && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {emp.userprincipalname}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedUser?.id === emp.id && (
                                <Check className="ml-auto h-4 w-4 shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                          {hasMoreUsers && (
                            <div className="flex items-center justify-center py-3 text-sm text-muted-foreground border-t">
                              <span>Mostrando {displayedUsers.length} de {searchFilteredUsers.length} • Desplaza para ver más</span>
                            </div>
                          )}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.formState.errors.entraUserId && (
                <p className="text-sm text-destructive">{form.formState.errors.entraUserId.message}</p>
              )}
            </motion.div>

            {/* Fecha y Hora */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.35, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.22 
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label className="flex items-center gap-2 typo-modal-label">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  Fecha de entrega <span className="required-asterisk">*</span>
                </Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-between text-left font-normal form-input-trigger overflow-hidden typo-modal-input',
                        !form.watch('fechaEntrega') && 'text-muted-foreground',
                        form.formState.errors.fechaEntrega && 'border-destructive'
                      )}
                    >
                      {form.watch('fechaEntrega') ? (
                        <span className="truncate min-w-0 flex-1">{format(form.watch('fechaEntrega'), 'PPP', { locale: es })}</span>
                      ) : (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate text-muted-foreground">Seleccionar</span>
                        </span>
                      )}
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 99999 }}>
                    <Calendar
                      mode="single"
                      selected={form.watch('fechaEntrega')}
                      onSelect={(date) => {
                        if (date) {
                          form.setValue('fechaEntrega', date, { shouldValidate: true, shouldDirty: true });
                          setDatePopoverOpen(false);
                        }
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.fechaEntrega && (
                  <p className="text-sm text-destructive">{form.formState.errors.fechaEntrega.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 typo-modal-label">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Hora de entrega <span className="required-asterisk">*</span>
                </Label>
                <Select
                  value={selectedTime}
                  onValueChange={(value) => form.setValue('horaEntrega', value, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className={cn(
                    'w-full form-input-trigger typo-modal-input',
                    !selectedTime && 'text-muted-foreground',
                    form.formState.errors.horaEntrega && 'border-destructive'
                  )}>
                    <SelectValue placeholder={
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
        Seleccionar
                      </span>
                    }>
                      {selectedTime && obtenerEtiquetaHora(selectedTime)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50">
                      Mañana
                    </div>
                    {OPCIONES_HORA.filter(t => t.periodo === 'Mañana').map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        <span className="flex items-center gap-2">
                          {time.label}
                        </span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50 mt-1">
                      Mediodía
                    </div>
                    {OPCIONES_HORA.filter(t => t.periodo === 'Mediodía').map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        <span className="flex items-center gap-2">
                          {time.label}
                        </span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50 mt-1">
                      Tarde
                    </div>
                    {OPCIONES_HORA.filter(t => t.periodo === 'Tarde').map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        <span className="flex items-center gap-2">
                          {time.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.horaEntrega && (
                  <p className="text-sm text-destructive">{form.formState.errors.horaEntrega.message}</p>
                )}
              </div>
            </motion.div>

            {/* Cantidad */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.35, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.29 
              }}
              className="space-y-2"
            >
              <Label htmlFor="cantidad" className="flex items-center gap-2 typo-modal-label">
                <Hash className="h-3.5 w-3.5 text-primary" />
                Cantidad <span className="required-asterisk">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                {...form.register('cantidad', { valueAsNumber: true })}
                className={cn(
                  'w-full form-input-trigger typo-modal-input h-10',
                  form.formState.errors.cantidad && 'border-destructive'
                )}
              />
              {form.formState.errors.cantidad && (
                <p className="text-sm text-destructive">{form.formState.errors.cantidad.message}</p>
              )}
            </motion.div>

            {/* Notas */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.35, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.32 
              }}
              className="space-y-2"
            >
              <Label htmlFor="notas" className="flex items-center gap-2 typo-modal-label">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Notas <span className="required-asterisk">*</span>
              </Label>
              <Textarea
                placeholder={"Ej: Sin condimentos, para llevar, etc."}
                {...form.register('notas')}
                className={cn(
                  'min-h-[80px] resize-none form-input-trigger typo-modal-input',
                  form.formState.errors.notas && 'border-destructive'
                )}
                rows={3}
              />
              {form.formState.errors.notas && (
                <p className="text-sm text-destructive">{form.formState.errors.notas.message}</p>
              )}
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.36 
            }}
            className="flex justify-end gap-4 pt-5 mt-6 modal-separator"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                className="elegant-outline-btn modal-btn-secondary"
              >
                Cancelar
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                disabled={createPedido.isPending} 
                className="nueva-solicitud-btn modal-btn-primary"
              >
                {createPedido.isPending ? (
                  <Loader2 className="modal-btn-icon animate-spin" />
                ) : (
                  <Check className="modal-btn-icon" />
                )}
                <span>Registrar Pedido</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}

export default FormularioPedidos;
