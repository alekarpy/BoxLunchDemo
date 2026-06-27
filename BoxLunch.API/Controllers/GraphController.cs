using Microsoft.AspNetCore.Mvc;
using BoxLunch.API.Services;

namespace BoxLunch.API.Controllers;

/// <summary>
/// Endpoints para consultar empleados y fotos directamente desde Microsoft Graph API.
/// Estos datos vienen del directorio de Entra ID de la empresa, no de la BD local.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GraphController(GraphService graphService) : ControllerBase
{
    // GET api/Graph/empleados
    // Retorna todos los usuarios activos del directorio de la empresa
    [HttpGet("empleados")]
    public async Task<IActionResult> GetEmpleados([FromQuery] string? buscar)
    {
        var users = await graphService.GetAllUsersAsync();

        if (!string.IsNullOrEmpty(buscar))
        {
            users = users.Where(u =>
                u.NombreCompleto.Contains(buscar, StringComparison.OrdinalIgnoreCase) ||
                u.Email.Contains(buscar, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        return Ok(users);
    }

    // GET api/Graph/foto/{entraObjectId}
    // Retorna la foto de perfil como imagen JPEG directamente
    [HttpGet("foto/{entraObjectId}")]
    public async Task<IActionResult> GetFoto(string entraObjectId)
    {
        var bytes = await graphService.GetUserPhotoAsync(entraObjectId);
        if (bytes is null)
            return NotFound(new { mensaje = "Este usuario no tiene foto de perfil configurada." });

        return File(bytes, "image/jpeg");
    }

    // GET api/Graph/foto-base64/{entraObjectId}
    // Retorna la foto como string base64 (útil para el frontend React)
    [HttpGet("foto-base64/{entraObjectId}")]
    public async Task<IActionResult> GetFotoBase64(string entraObjectId)
    {
        var base64 = await graphService.GetUserPhotoBase64Async(entraObjectId);
        if (base64 is null)
            return NotFound(new { mensaje = "Sin foto disponible." });

        return Ok(new { foto = base64 });
    }

    // GET api/Graph/usuario-por-email/{email}
    // Busca un empleado específico por email (útil al iniciar sesión)
    [HttpGet("usuario-por-email/{email}")]
    public async Task<IActionResult> GetByEmail(string email)
    {
        var user = await graphService.GetUserByEmailAsync(email);
        return user is null
            ? NotFound(new { mensaje = $"No se encontró usuario con email: {email}" })
            : Ok(user);
    }
}
