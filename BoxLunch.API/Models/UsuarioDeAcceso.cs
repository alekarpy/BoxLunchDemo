using System.ComponentModel.DataAnnotations;

namespace BoxLunch.API.Models;

public enum RolAcceso
{
    Administrador = 0,
    Operativo = 1,
    Desarrollador = 2
}

public class UsuarioDeAcceso
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string NombreDeUsuario { get; set; } = string.Empty;

    [Required]
    [MaxLength(320)]
    public string CorreoElectronico { get; set; } = string.Empty;

    [Required]
    public RolAcceso Rol { get; set; } = RolAcceso.Operativo;
}
