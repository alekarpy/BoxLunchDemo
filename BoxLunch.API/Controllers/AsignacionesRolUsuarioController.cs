using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Models;
using System.Text.Json.Serialization;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AsignacionesRolUsuarioController(VibeDbContext db) : ControllerBase
{
    private const string SuperUserEmail = "desarrollador@demo.com";
    private static readonly Guid DesarrolladorRolId = Guid.Parse("11111111-0000-0000-0000-000000000003");

    private string? GetCurrentUserEmail() => User.FindFirst("preferred_username")?.Value ?? User.Identity?.Name;

    private async Task<bool> IsCurrentRequesterDeveloper()
    {
        var email = GetCurrentUserEmail()?.ToLower().Trim();
        if (string.IsNullOrEmpty(email)) return false;
        if (email.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase)) return true;

        var asignacion = await db.AsignacionesRolUsuario
            .FirstOrDefaultAsync(a => a.CorreoElectronico.ToLower() == email);
        return asignacion?.RolDelSistemaId == DesarrolladorRolId;
    }
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? correo)
    {
        var query = db.AsignacionesRolUsuario
            .Include(a => a.RolDelSistema)
            .AsQueryable();

        if (!string.IsNullOrEmpty(correo))
            query = query.Where(a => a.CorreoElectronico == correo);

        var items = await query.ToListAsync();
        
        // Enriquecer con EntraObjectId de la tabla de Empleados si existe
        var dtos = new List<object>();
        foreach (var item in items)
        {
            var empleado = await db.Empleados.FirstOrDefaultAsync(e => e.Email == item.CorreoElectronico);
            dtos.Add(MapToDto(item, empleado?.EntraObjectId));
        }
        
        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var a = await db.AsignacionesRolUsuario.Include(x => x.RolDelSistema).FirstOrDefaultAsync(x => x.Id == id);
        if (a == null) return NotFound();
        
        var empleado = await db.Empleados.FirstOrDefaultAsync(e => e.Email == a.CorreoElectronico);
        return Ok(MapToDto(a, empleado?.EntraObjectId));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AsignacionDto dto)
    {
        var requesterEmail = GetCurrentUserEmail();
        var isSuper = requesterEmail?.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase) ?? false;
        var isDev = isSuper || await IsCurrentRequesterDeveloper();

        if (!isDev)
            return Forbid("Solo los desarrolladores pueden crear asignaciones de rol.");

        if (dto.Roldelsistema?.Id == null || dto.Roldelsistema.Id == default)
            return BadRequest("El ID del Rol del Sistema es requerido.");

        // Validar que sea un correo válido
        if (string.IsNullOrEmpty(dto.Correoelectronico) || !dto.Correoelectronico.Contains('@'))
            return BadRequest("El correo electrónico no es válido.");

        // Protección de Rol Desarrollador
        if (dto.Roldelsistema.Id == DesarrolladorRolId && !isDev)
            return Forbid("No tienes permisos para asignar el rol de Desarrollador.");

        var emailNormalized = dto.Correoelectronico?.ToLower().Trim() ?? string.Empty;

        // --- VALIDACIÓN DE DUPLICADOS ---
        var existe = await db.AsignacionesRolUsuario.AnyAsync(a => a.CorreoElectronico.ToLower() == emailNormalized);
        if (existe) 
            return BadRequest($"El usuario con correo {emailNormalized} ya tiene una asignación de rol. Edita su registro existente en lugar de crear uno nuevo.");

        var asignacion = new AsignacionRolUsuario
        {
            Nombre = dto.Asignacionesderoldeusuarionombre ?? "Asignación",
            CorreoElectronico = emailNormalized,
            EstadoActivo = dto.Estadoactivo ?? true,
            // Forzamos la fecha del servidor siempre para evitar desfases del cliente
            FechaDeAsignacion = DateTime.Now,
            HistorialDeCambios = dto.Historialdecambios,
            RolDelSistemaId = dto.Roldelsistema.Id
        };
        db.AsignacionesRolUsuario.Add(asignacion);
        await db.SaveChangesAsync();
        var created = await db.AsignacionesRolUsuario.Include(a => a.RolDelSistema).FirstAsync(a => a.Id == asignacion.Id);
        var empleado = await db.Empleados.FirstOrDefaultAsync(e => e.Email == created.CorreoElectronico);
        return CreatedAtAction(nameof(GetById), new { id = asignacion.Id }, MapToDto(created, empleado?.EntraObjectId));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AsignacionDto dto)
    {
        var requesterEmail = GetCurrentUserEmail();
        var isSuper = requesterEmail?.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase) ?? false;
        var isDev = isSuper || await IsCurrentRequesterDeveloper();

        var a = await db.AsignacionesRolUsuario.FindAsync(id);
        if (a is null) return NotFound();

        if (!isDev)
            return Forbid("Solo los desarrolladores pueden modificar asignaciones de rol.");

        // Si no es Superusuario, proteger cuentas críticas
        if (!isSuper)
        {
            // No se puede editar al Superusuario
            if (a.CorreoElectronico.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase))
                return Forbid("No se puede modificar la cuenta del Súperusuario.");

            // No se puede editar a un Desarrollador si no eres Desarrollador
            if (a.RolDelSistemaId == DesarrolladorRolId && !isDev)
                return Forbid("No tienes permisos para modificar a un Desarrollador.");
            
            // No se puede otorgar Rol Desarrollador si no eres Desarrollador
            if (dto.Roldelsistema?.Id == DesarrolladorRolId && !isDev)
                return Forbid("No tienes permisos para otorgar el rol de Desarrollador.");
        }
        
        if (dto.Correoelectronico != null)
        {
            if (!dto.Correoelectronico.Contains('@'))
                return BadRequest("El correo electrónico no es válido.");
            
            a.CorreoElectronico = dto.Correoelectronico;
        }

        if (dto.Asignacionesderoldeusuarionombre != null) a.Nombre = dto.Asignacionesderoldeusuarionombre;
        if (dto.Estadoactivo.HasValue) a.EstadoActivo = dto.Estadoactivo.Value;
        if (dto.Historialdecambios != null) a.HistorialDeCambios = dto.Historialdecambios;
        if (dto.Roldelsistema?.Id != null && dto.Roldelsistema.Id != default) a.RolDelSistemaId = dto.Roldelsistema.Id;
        
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var requesterEmail = GetCurrentUserEmail();
        var isSuper = requesterEmail?.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase) ?? false;
        var isDev = isSuper || await IsCurrentRequesterDeveloper();

        var a = await db.AsignacionesRolUsuario.FindAsync(id);
        if (a is null) return NotFound();

        if (!isDev)
            return Forbid("Solo los desarrolladores pueden eliminar asignaciones de rol.");

        // Protección
        if (!isSuper)
        {
            if (a.CorreoElectronico.Equals(SuperUserEmail, StringComparison.OrdinalIgnoreCase))
                return Forbid("No se puede eliminar la cuenta del Súperusuario.");

            if (a.RolDelSistemaId == DesarrolladorRolId && !isDev)
                return Forbid("No tienes permisos para eliminar a un Desarrollador.");
        }

        db.AsignacionesRolUsuario.Remove(a);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static object MapToDto(AsignacionRolUsuario a, string? entraObjectId = null) => new
    {
        id = a.Id,
        asignacionesderoldeusuarionombre = a.Nombre,
        correoelectrnico = a.CorreoElectronico,
        estadoactivo = a.EstadoActivo,
        fechadeasignacin = a.FechaDeAsignacion.ToString("yyyy-MM-dd"),
        historialdecambios = a.HistorialDeCambios,
        roldelsistema = a.RolDelSistema == null ? null : new { id = a.RolDelSistema.Id, nombrederol = a.RolDelSistema.NombreDeRol },
        entraobjectid = entraObjectId
    };
}

public record AsignacionDto(
    [property: JsonPropertyName("asignacionesderoldeusuarionombre")] string? Asignacionesderoldeusuarionombre,
    [property: JsonPropertyName("correoelectrnico")] string? Correoelectronico,
    [property: JsonPropertyName("estadoactivo")] bool? Estadoactivo,
    [property: JsonPropertyName("fechadeasignacin")] string? Fechadeasignacion,
    [property: JsonPropertyName("historialdecambios")] string? Historialdecambios,
    [property: JsonPropertyName("roldelsistema")] RolRefDto? Roldelsistema
);

public record RolRefDto(Guid Id, string NombreDeRol);
