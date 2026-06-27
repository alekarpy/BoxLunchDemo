using System.ComponentModel.DataAnnotations;

namespace BoxLunch.API.Models;

/// <summary>
/// Referencia local de un empleado.
/// Los datos completos (foto, departamento, etc.) vienen de la nómina de la empresa
/// o de Microsoft Graph API, NO se almacenan aquí.
///
/// TODO: Cuando IT proporcione acceso a la BD de nómina, agregar un servicio
/// que consulte directamente esa tabla para enriquecer estos datos.
/// </summary>
public class Empleado
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Nombre completo del empleado, sincronizado desde nómina o Entra ID.</summary>
    [Required]
    [MaxLength(255)]
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>Correo corporativo — clave principal para buscar al empleado en nómina y Entra ID.</summary>
    [Required]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Número de nómina del empleado en el sistema de RRHH de la empresa.
    /// Clave de cruce cuando se conecte a la BD de nómina.
    /// Se llena cuando IT proporcione acceso al sistema de nómina.
    /// </summary>
    [MaxLength(50)]
    public string? NumeroNomina { get; set; }

    /// <summary>
    /// Object ID en Microsoft Entra ID (Azure AD).
    /// Se usa para consultar foto de perfil vía Microsoft Graph API.
    /// </summary>
    [MaxLength(36)]
    public string? EntraObjectId { get; set; }

    /// <summary>
    /// URL de foto de perfil del empleado.
    /// En modo demo se guarda una URL de randomuser.me.
    /// En producción se obtiene vía Microsoft Graph API.
    /// </summary>
    [MaxLength(512)]
    public string? FotoDePerfil { get; set; }

    // Navigation properties
    public ICollection<Pedido> Pedidos { get; set; } = [];
    public ICollection<Notificacion> Notificaciones { get; set; } = [];
}
