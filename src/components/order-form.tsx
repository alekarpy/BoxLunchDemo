// OrderForm component for creating box lunch orders - v3 (force reload)
import { useState, useMemo, useDeferredValue } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus, Loader2, UtensilsCrossed, User, Search, Check, ChevronsUpDown, Shield, Clock, Mail, CheckCircle2, FileText, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
  
  // Helper function to construct the full name from multiple fields
  const getDisplayName = (user: MicrosoftEntraID): string => {
    // Prioridad: nombreparamostrar > nombredepila + apellido > nombreprincipaldeusuario > correo
    if (user.nombreparamostrar && user.nombreparamostrar.trim()) {
      return user.nombreparamostrar.trim();
    }
    
    const firstName = user.nombredepila?.trim() || '';
    const lastName = user.apellido?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
      return fullName;
    }
    
    // Fallback: usar UPN o correo
    return user.nombreprincipaldeusuario || user.correo || '';
  };
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CommandInput,
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

import { useMicrosoftEntraIDList } from '@/generated/hooks/use-microsoft-entra-id';


import { useCreatePedido } from '@/generated/hooks/use-pedido';
import { useEmpleadoList, useCreateEmpleado } from '@/generated/hooks/use-empleado';
import { useEmailNotification } from '@/hooks/use-email-notification';
import type { MicrosoftEntraID } from '@/generated/models/microsoft-entra-id-model';

const orderSchema = z.object({
  entraUserId: z.string().min(1, 'Seleccione un empleado'),
  fechaEntrega: z.date({ message: 'Seleccione la fecha de entrega' }),
  horaEntrega: z.string().min(1, 'Seleccione la hora de entrega'),
  cantidad: z.number().min(1, 'La cantidad debe ser al menos 1'),
  notas: z.string().min(1, 'Ingrese sus notas o especificaciones'),
});

type OrderFormData = z.infer<typeof orderSchema>;

// Time options for the delivery time selector
const TIME_OPTIONS = [
  { value: '07:00', label: '7:00 AM', period: 'Mañana' },
  { value: '07:30', label: '7:30 AM', period: 'Mañana' },
  { value: '08:00', label: '8:00 AM', period: 'Mañana' },
  { value: '08:30', label: '8:30 AM', period: 'Mañana' },
  { value: '09:00', label: '9:00 AM', period: 'Mañana' },
  { value: '09:30', label: '9:30 AM', period: 'Mañana' },
  { value: '10:00', label: '10:00 AM', period: 'Mañana' },
  { value: '10:30', label: '10:30 AM', period: 'Mañana' },
  { value: '11:00', label: '11:00 AM', period: 'Mañana' },
  { value: '11:30', label: '11:30 AM', period: 'Mañana' },
  { value: '12:00', label: '12:00 PM', period: 'Mediodía' },
  { value: '12:30', label: '12:30 PM', period: 'Mediodía' },
  { value: '13:00', label: '1:00 PM', period: 'Tarde' },
  { value: '13:30', label: '1:30 PM', period: 'Tarde' },
  { value: '14:00', label: '2:00 PM', period: 'Tarde' },
  { value: '14:30', label: '2:30 PM', period: 'Tarde' },
  { value: '15:00', label: '3:00 PM', period: 'Tarde' },
  { value: '15:30', label: '3:30 PM', period: 'Tarde' },
  { value: '16:00', label: '4:00 PM', period: 'Tarde' },
  { value: '16:30', label: '4:30 PM', period: 'Tarde' },
  { value: '17:00', label: '5:00 PM', period: 'Tarde' },
  { value: '17:30', label: '5:30 PM', period: 'Tarde' },
  { value: '18:00', label: '6:00 PM', period: 'Tarde' },
];

// getUserInitials and getAvatarColor are imported from user-photo-avatar

// Get the display label for a time value
function getTimeLabel(value: string): string {
  const option = TIME_OPTIONS.find(t => t.value === value);
  return option?.label || value;
}

interface OrderFormProps {
  onOrderCreated?: (order: { id: string; fechaentrega: string; nombreEmpleado: string }) => void;
}

export function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [open, setOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const deferredSearch = useDeferredValue(userSearch);
  const [selectedUser, setSelectedUser] = useState<MicrosoftEntraID | null>(null);
  
  // Build OData filter for server-side search in Microsoft Entra ID
  const entraFilter = useMemo(() => {
    // NOTE: We do not filter by microsoftaccountentraidenabled as it may exclude valid users
    const baseFilter = '';
    
    if (!deferredSearch.trim()) {
      return baseFilter;
    }
    
    // Escape single quotes in search term for OData
    const searchTerm = deferredSearch.trim().replace(/'/g, "''");
    
    // Build contains filters for multiple fields using OData contains function
    const searchFilters = [
      `contains(nombreparamostrar, '${searchTerm}')`,
      `contains(nombredepila, '${searchTerm}')`,
      `contains(apellido, '${searchTerm}')`,
      `contains(correo, '${searchTerm}')`,
      `contains(puesto, '${searchTerm}')`
    ].join(' or ');
    
    // If there is baseFilter, combine it with searchFilters, if not, just use searchFilters
    return baseFilter ? `${baseFilter} and (${searchFilters})` : `(${searchFilters})`;
  }, [deferredSearch]);
  
  // Fetch users directly from Microsoft Entra ID with server-side filtering
  const { data: entraUsers, isLoading: usersLoading, isFetching } = useMicrosoftEntraIDList({
    filter: entraFilter,
    orderBy: 'nombreparamostrar asc'
  });
  
  // Filter valid users (those with required fields)
  // Exclude system accounts (like VMware) and groups
  const filteredUsers = useMemo(() => {
    // Patterns to exclude from the user list
    const excludedPatterns = [
      '___VMware_Conv_SA__',
      'VMware',
    ];
    
    return entraUsers?.filter(u => {
      // Must have required fields
      if (!u.id || !u.unidentificadornicoparamicrosoftentraid) {
        return false;
      }
      
      // NOTE: We removed the "isLikelyGroup" filter because it excluded valid users
      // that have displayname but do not have the individual fields
      // The displayname field can contain the full name
      
      // Only exclude if you have NO identifiable name
      const hasAnyName = u.nombreparamostrar || u.nombredepila || u.apellido || u.correo;
      if (!hasAnyName) {
        return false;
      }
      
      // Exclude system accounts by name patterns
      const displayName = u.nombreparamostrar || '';
      const isExcluded = excludedPatterns.some(pattern => 
        displayName.includes(pattern)
      );
      
      return !isExcluded;
    }) ?? [];
  }, [entraUsers]);

  const createPedido = useCreatePedido();
  const createEmpleado = useCreateEmpleado();
  // Load employees with the expanded lookup to be able to search by microsoftentraid.id
  const { refetch: refetchEmpleados } = useEmpleadoList();
  const sendEmailNotification = useEmailNotification();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      entraUserId: '',
      fechaEntrega: undefined,
      horaEntrega: '',
      cantidad: 1,
      notas: '',
    },
  });

  const onSubmit = async (data: OrderFormData) => {
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

    // Use the already selected user instead of searching for them in the filtered list
    // The enterUsers list can change depending on the search filter, so we use selectedUser
    const user = selectedUser;

    // Validation of the selected user
    if (!user) {
      toast.error('Error al obtener empleado', {
        description: 'No se pudo encontrar el empleado seleccionado. Intenta seleccionarlo nuevamente.',
      });
      return;
    }

    // In portfolio mode the IDs may not be GUIDs (e.g. EMP-001)
    if (!user.id) {
      toast.error('Usuario inválido', {
        description: 'El usuario seleccionado no tiene un identificador válido.',
      });
      return;
    }

    const nombreCompleto = getDisplayName(user) || 'Usuario';

    try {
      // Refresh the employee list to ensure we have the most recent data
      const { data: empleadosActualizados } = await refetchEmpleados();
      
      // Search if there is already an Employee linked to this Entra ID user
      // We use the entraobjectid (text) to find matches
      const entraObjectId = user.unidentificadornicoparamicrosoftentraid || user.id;
      let empleado = empleadosActualizados?.find(
        (e) => e.entraobjectid === entraObjectId
      );

      // If the employee does not exist, create it
      // IMPORTANT: Now we use text fields (entraobjectid, userprincipalname)
      // instead of a direct lookup to Microsoft Enter ID
      if (!empleado) {
        try {
          empleado = await createEmpleado.mutateAsync({
            nombrecompleto: nombreCompleto,
            // Save the Entra Object ID as text (mandatory field)
            entraobjectid: entraObjectId,
            // Save the UPN (email) as an additional field for reference
            userprincipalname: user.correo || user.nombreparamostrar || undefined,
          });
        } catch (createError) {
          console.error('Error al crear empleado:', createError);
          throw createError;
        }
      }

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

      // Send notification by mail to the employee (regardless of the success of the order)
      // Mail is sent in the background, without blocking the UI
      try {
        const notificationResult = await sendEmailNotification.mutateAsync({
          empleado: user,
          fechaEntrega: format(data.fechaEntrega, 'yyyy-MM-dd'),
          horaEntrega: data.horaEntrega,
          lugarEntrega: data.notas,
        });

        toast.success('¡Solicitud registrada exitosamente!', {
          description: (
            <div className="flex flex-col gap-1">
              <span>Box Lunch para {nombreCompleto}</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Mail className="h-3 w-3" />
                Notificación enviada a {notificationResult.email}
              </span>
            </div>
          ),
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          duration: 5000,
        });
      } catch (emailError) {
        // Order was created but mail failed - show warning
        console.warn('Error enviando notificación por correo:', emailError);
        toast.success('¡Solicitud registrada exitosamente!', {
          description: (
            <div className="flex flex-col gap-1">
              <span>Box Lunch para {nombreCompleto}</span>
              <span className="text-xs text-amber-600">
                ⚠️ No se pudo enviar la notificación por correo
              </span>
            </div>
          ),
          duration: 5000,
        });
      }
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

  const handleUserSelect = (user: MicrosoftEntraID) => {
    setSelectedUser(user);
    form.setValue('entraUserId', user.id, { shouldValidate: true, shouldDirty: true });
    setUserPopoverOpen(false);
    setUserSearch('');
  };

  const selectedTime = form.watch('horaEntrega');

  // Function to clear the form completely
  const resetForm = () => {
    form.reset({
      entraUserId: '',
      fechaEntrega: undefined,
      horaEntrega: '',
      cantidad: 1,
      notas: '',
    });
    setSelectedUser(null);
    setUserSearch('');
  };

  // Handle dialog opening/closing
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Clear form when dialog closes
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 nueva-solicitud-btn">
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="box-lunch-modal p-0 w-full max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl rounded-2xl shadow-2xl">
        <div className="box-lunch-modal-header relative">
        <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          Solicitar Box Lunch
        </DialogTitle>
        </DialogHeader>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="mobile-modal-scrollable p-4 sm:p-6 pt-2 sm:pt-3 space-y-5">
          <AnimatePresence mode="wait">
            {/* Empleado from Microsoft Entra ID */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-2"
            >
              <Label htmlFor="empleado" className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Empleado <span className="required-asterisk">*</span>
              </Label>
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userPopoverOpen}
                    className={cn(
                      'w-full max-w-full justify-between font-normal h-auto min-h-10 py-2 form-input-trigger',
                      !selectedUser && 'text-muted-foreground',
                      form.formState.errors.entraUserId && 'border-destructive'
                    )}
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        <EmployeePhotoAvatar
                          employeeName={getDisplayName(selectedUser)}
                          employeeEmail={selectedUser.correo}
                          entraObjectId={selectedUser.id}
                          className="h-7 w-7 shrink-0"
                          enableLazyLoad={false}
                        />
                        <div className="flex flex-col items-start min-w-0 overflow-hidden">
                          <span className="font-medium truncate w-full block">{getDisplayName(selectedUser)}</span>
                          {selectedUser.correo && (
                            <span className="text-xs text-muted-foreground truncate w-full block">{selectedUser.correo}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Buscar empleado...
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-xl border border-gray-100" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nombre, correo o puesto..."
                      value={userSearch}
                      onValueChange={setUserSearch}
                    />
                    <CommandList className="max-h-[280px]">
                      {(usersLoading || isFetching) ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{deferredSearch ? 'Buscando en Microsoft Entra ID...' : 'Cargando usuarios...'}</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                              <Search className="h-8 w-8 opacity-50" />
                              <span>No se encontraron usuarios</span>
                              <span className="text-xs">Intenta con otro término de búsqueda</span>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.map((user) => (
                              <CommandItem
                                key={user.id}
                                value={user.id}
                                onSelect={() => handleUserSelect(user)}
                                className="flex items-center gap-3 py-2.5 cursor-pointer"
                              >
                                <EmployeePhotoAvatar
                                  employeeName={getDisplayName(user)}
                                  employeeEmail={user.correo}
                                  entraObjectId={user.id}
                                  className="h-8 w-8"
                                  enableLazyLoad={true}
                                />
                                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                                  <span className="font-medium truncate">
                                    {getDisplayName(user)}
                                  </span>
                                  {user.correo && (
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {user.correo}
                                    </span>
                                  )}
                                </div>
                                {selectedUser?.id === user.id && (
                                  <Check className="h-4 w-4 text-orange-500 shrink-0" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  Fecha de entrega <span className="required-asterisk">*</span>
                </Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal form-input-trigger',
                        !form.watch('fechaEntrega') && 'text-muted-foreground',
                        form.formState.errors.fechaEntrega && 'border-destructive'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('fechaEntrega') ? (
                        format(form.watch('fechaEntrega'), 'PPP', { locale: es })
                      ) : (
                        <span>Seleccionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" translate="no">
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
                <Label className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Hora de entrega <span className="required-asterisk">*</span>
                </Label>
                <Select
                  value={selectedTime}
                  onValueChange={(value) => form.setValue('horaEntrega', value, { shouldValidate: true, shouldDirty: true })}
                >
                  <SelectTrigger className={cn(
                    'w-full',
                    !selectedTime && 'text-muted-foreground',
                    form.formState.errors.horaEntrega && 'border-destructive'
                  )}>
                    <SelectValue placeholder="Seleccionar hora">
                      {selectedTime && (
                        <span className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {getTimeLabel(selectedTime)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Mañana
                    </div>
                    {TIME_OPTIONS.filter(t => t.period === 'Mañana').map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        <span className="flex items-center gap-2">
                          {time.label}
                        </span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Mediodía
                    </div>
                    {TIME_OPTIONS.filter(t => t.period === 'Mediodía').map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        <span className="flex items-center gap-2">
                          {time.label}
                        </span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-1">
                      Tarde
                    </div>
                    {TIME_OPTIONS.filter(t => t.period === 'Tarde').map((time) => (
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <Label htmlFor="cantidad" className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-primary" />
                Cantidad <span className="required-asterisk">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                {...form.register('cantidad', { valueAsNumber: true })}
                className={cn(
                  'w-full h-10 form-input-trigger',
                  form.formState.errors.cantidad && 'border-destructive'
                )}
              />
              {form.formState.errors.cantidad && (
                <p className="text-sm text-destructive">{form.formState.errors.cantidad.message}</p>
              )}
            </motion.div>

            {/* Notas */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="space-y-2"
            >
              <Label htmlFor="notas" className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Notas <span className="required-asterisk">*</span>
              </Label>
              <Textarea
                placeholder="Ej: Sin condimentos, para llevar, etc."
                {...form.register('notas')}
                className={cn(
                  'min-h-[80px] resize-none',
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mobile-modal-buttons flex justify-end gap-3 pt-4"
          >
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="modal-btn-secondary">
              Cancelar
            </Button>
            <Button type="submit" disabled={createPedido.isPending || createEmpleado.isPending} className="modal-btn-primary nueva-solicitud-btn">
              {(createPedido.isPending || createEmpleado.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Registrar Pedido
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
