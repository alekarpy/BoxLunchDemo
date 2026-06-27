using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoxLunch.API.Models;

public class Notificacion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string NotificacionNombre { get; set; } = string.Empty;

    public Guid? EmpleadoId { get; set; }

    [ForeignKey(nameof(EmpleadoId))]
    public Empleado? Empleado { get; set; }

    public Guid? Empleado1Id { get; set; }

    [ForeignKey(nameof(Empleado1Id))]
    public Empleado? Empleado1 { get; set; }

    [Required]
    [MaxLength(50)]
    public string FechaHoraEntrega { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string LugarEntrega { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Mensaje { get; set; } = string.Empty;
}
