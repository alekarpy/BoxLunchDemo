using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoxLunch.API.Models;

public class AsignacionRolUsuario
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(320)]
    public string CorreoElectronico { get; set; } = string.Empty;

    [Required]
    public bool EstadoActivo { get; set; } = true;

    [Required]
    public DateTime FechaDeAsignacion { get; set; } = DateTime.UtcNow;

    [MaxLength(4000)]
    public string? HistorialDeCambios { get; set; }

    [Required]
    public Guid RolDelSistemaId { get; set; }

    [ForeignKey(nameof(RolDelSistemaId))]
    public RolDelSistema? RolDelSistema { get; set; }
}
