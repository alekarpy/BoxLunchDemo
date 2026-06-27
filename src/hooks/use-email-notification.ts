import { useMutation } from '@tanstack/react-query';
import { useCreateNotificacin } from '@/generated/hooks/use-notificacin';

// Generic employee type that works with both MicrosoftEntraID and adapted UsersList
interface EmpleadoParaNotificacion {
  id: string;
  nombreparamostrar?: string;
  nombredepila?: string;
  apellido?: string;
  correo?: string;
  nombreprincipaldeusuario?: string;
  unidentificadornicoparamicrosoftentraid?: string;
}

interface EmailNotificationParams {
  empleado: EmpleadoParaNotificacion;
  fechaEntrega: string;
  horaEntrega: string;
  lugarEntrega: string;
}

/**
 * Hook to send email notifications to the employee
 * when a Box Lunch order is registered.
 */
export function useEmailNotification() {
  const createNotificacion = useCreateNotificacin();

  return useMutation({
    mutationFn: async (params: EmailNotificationParams) => {
      const { empleado, fechaEntrega, horaEntrega, lugarEntrega } = params;

      const nombreCompleto = empleado.nombreparamostrar ||
        `${empleado.nombredepila || ''} ${empleado.apellido || ''}`.trim() ||
        'Usuario';

      const correoDestino = empleado.correo || empleado.nombreprincipaldeusuario;

      if (!correoDestino) {
        throw new Error('El empleado no tiene un email configurado');
      }

      // Format the date and time for the message
      const fechaFormateada = new Date(fechaEntrega).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Convert 24h time to readable format
      const [hours, minutes] = horaEntrega.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const horaFormateada = `${hour12}:${minutes} ${ampm}`;

      // Create the notification message
      const mensaje = `
🍱 ¡Tu Box Lunch ha sido solicitado!

Hola ${nombreCompleto},

Te informamos que se ha registrado un pedido de Box Lunch para ti con los siguientes detalles:

📅 Fecha de entrega: ${fechaFormateada}
⏰ Hora de entrega: ${horaFormateada}
📍 Lugar de entrega: ${lugarEntrega}

Por favor, asegúrate de estar disponible en el lugar indicado a la hora programada.

¡Buen provecho!

Este es un mensaje automático del Sistema de Box Lunch.
      `.trim();

      // Create the notification in the system
      // This notification can be processed by Power Automate to send the email
      await createNotificacion.mutateAsync({
        notificacinnombre: `Notificación Box Lunch - ${nombreCompleto}`,
        empleado: {
          id: empleado.unidentificadornicoparamicrosoftentraid || '',
          nombrecompleto: nombreCompleto
        },
        fechahoraentrega: `${fechaEntrega} ${horaEntrega}`,
        lugarentrega: lugarEntrega,
        mensaje: mensaje,
      });

      return {
        success: true,
        email: correoDestino,
        nombreCompleto,
      };
    },
  });
}
