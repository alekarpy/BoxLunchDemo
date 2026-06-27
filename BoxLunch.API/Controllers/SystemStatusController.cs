using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Services;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemStatusController(VibeDbContext db, GraphService graphService, ILogger<SystemStatusController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStatus()
    {
        var status = new StatusReport();

        // 1. Validar SQL Server
        try
        {
            var roleCount = await db.RolesDelSistema.CountAsync();
            status.Database = new CheckResult(true, $"Conectado a SQL Server. Registros en RolesDelSistema: {roleCount}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error verificando SQL Server");
            status.Database = new CheckResult(false, $"Error de conexión: {ex.Message}");
        }

        // 2. Validar Microsoft Graph
        try
        {
            // Intentamos una búsqueda simple para validar el token y permisos
            var users = await graphService.GetAllUsersAsync();
            status.MicrosoftGraph = new CheckResult(true, $"Conectado. Se encontraron {users.Count} usuarios en el directorio.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error verificando Microsoft Graph");
            
            var mensaje = ex.Message;
            if (mensaje.Contains("ClientSecret"))
            {
                mensaje = "El ClientSecret es inválido o no está configurado (revisar appsettings.json o variables de entorno).";
            }
            
            status.MicrosoftGraph = new CheckResult(false, mensaje);
        }

        return Ok(status);
    }

    private record StatusReport
    {
        public CheckResult Database { get; set; } = new(false, "No probado");
        public CheckResult MicrosoftGraph { get; set; } = new(false, "No probado");
        public DateTime CheckedAt { get; } = DateTime.Now;
    }

    private record CheckResult(bool Success, string Message);
}
