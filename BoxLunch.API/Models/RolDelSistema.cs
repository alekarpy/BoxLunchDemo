using System.ComponentModel.DataAnnotations;

namespace BoxLunch.API.Models;

public class RolDelSistema
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string NombreDeRol { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    // Navigation property
    public ICollection<AsignacionRolUsuario> Asignaciones { get; set; } = [];
}
