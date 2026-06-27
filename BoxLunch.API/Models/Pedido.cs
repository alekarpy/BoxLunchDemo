using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoxLunch.API.Models;

public enum EstatusPedido
{
    Pendiente = 0,
    Entregado = 1,
    Cancelado = 2
}

public enum MotivoCancelacion
{
    AusenciaDelEmpleado = 0,
    CambioDeHorario = 1,
    DuplicadoAccidental = 2,
    CanceladoPorLogistica = 3,
    ErrorEnLaSolicitud = 4,
    Otro = 5
}

public class Pedido
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string PedidoNombre { get; set; } = string.Empty;

    // FK → Empleado que hace el pedido
    public Guid? EmpleadoId { get; set; }

    [ForeignKey(nameof(EmpleadoId))]
    public Empleado? Empleado { get; set; }

    // FK → Segundo empleado (empleado1 en el modelo original)
    public Guid? Empleado1Id { get; set; }

    [ForeignKey(nameof(Empleado1Id))]
    public Empleado? Empleado1 { get; set; }

    [Required]
    public EstatusPedido Estatus { get; set; } = EstatusPedido.Pendiente;

    public DateTime? FechaDeCreacion { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime FechaEntrega { get; set; }

    [Required]
    [MaxLength(25)]
    public string HoraEntrega { get; set; } = string.Empty;  // "YYYY-MM-DDTHH:mm" o "HH:mm"

    public int Cantidad { get; set; } = 1;

    [Required]
    [MaxLength(500)]
    public string Notas { get; set; } = string.Empty;

    public MotivoCancelacion? MotivoCancelacion { get; set; }

    [MaxLength(1000)]
    public string? MotivoCancelacionTextoLibre { get; set; }
}
