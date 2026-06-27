using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Models;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PedidosController(VibeDbContext db) : ControllerBase
{
    // GET api/Pedido
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? estatus, [FromQuery] string? fecha)
    {
        var query = db.Pedidos
            .Include(p => p.Empleado)
            .Include(p => p.Empleado1)
            .AsQueryable();

        if (!string.IsNullOrEmpty(estatus) && Enum.TryParse<EstatusPedido>(estatus, out var estatusEnum))
            query = query.Where(p => p.Estatus == estatusEnum);

        if (!string.IsNullOrEmpty(fecha))
        {
            if (!TryParseDateKey(fecha, out var parsedDate))
                return BadRequest("La fecha debe tener formato yyyy-MM-dd.");

            var startDate = parsedDate.Date;
            var endDate = startDate.AddDays(1);
            query = query.Where(p => p.FechaEntrega >= startDate && p.FechaEntrega < endDate);
        }

        var pedidos = await query.OrderByDescending(p => p.FechaDeCreacion).ToListAsync();
        return Ok(pedidos.Select(MapToDto));
    }

    // GET api/Pedido/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var pedido = await db.Pedidos
            .Include(p => p.Empleado)
            .Include(p => p.Empleado1)
            .FirstOrDefaultAsync(p => p.Id == id);

        return pedido is null ? NotFound() : Ok(MapToDto(pedido));
    }

    // POST api/Pedido
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PedidoDto dto)
    {
        if (!TryGetDeliveryDateOrToday(dto.Fechaentrega, out var fechaEntrega))
            return BadRequest("La fecha de entrega debe tener formato yyyy-MM-dd.");

        var pedido = new Pedido
        {
            PedidoNombre = dto.Pedidonombre ?? "Nuevo Pedido",
            EmpleadoId = dto.Empleado?.Id,
            Empleado1Id = dto.Empleado1?.Id,
            Estatus = ParseEstatus(dto.EstatusKey),
            FechaEntrega = fechaEntrega,
            HoraEntrega = dto.Horaentrega ?? string.Empty,
            Cantidad = dto.Cantidad ?? 1,
            Notas = dto.Notas ?? string.Empty,
            MotivoCancelacion = dto.MotivocancelacinKey != null ? ParseMotivo(dto.MotivocancelacinKey) : null,
            MotivoCancelacionTextoLibre = dto.Motivocancelacintextolibre
        };

        db.Pedidos.Add(pedido);
        await db.SaveChangesAsync();

        var created = await db.Pedidos.Include(p => p.Empleado).FirstAsync(p => p.Id == pedido.Id);
        return CreatedAtAction(nameof(GetById), new { id = pedido.Id }, MapToDto(created));
    }

    // PATCH api/Pedido/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PedidoDto dto)
    {
        var pedido = await db.Pedidos.FindAsync(id);
        if (pedido is null) return NotFound();

        if (dto.Pedidonombre != null) pedido.PedidoNombre = dto.Pedidonombre;
        if (dto.Fechaentrega != null)
        {
            if (!TryParseDateKey(dto.Fechaentrega, out var fechaEntrega))
                return BadRequest("La fecha de entrega debe tener formato yyyy-MM-dd.");

            pedido.FechaEntrega = fechaEntrega;
        }
        if (dto.Horaentrega != null) pedido.HoraEntrega = dto.Horaentrega;
        if (dto.Cantidad != null) pedido.Cantidad = dto.Cantidad.Value;
        if (dto.Notas != null) pedido.Notas = dto.Notas;
        if (dto.EstatusKey != null) pedido.Estatus = ParseEstatus(dto.EstatusKey);
        if (dto.MotivocancelacinKey != null) pedido.MotivoCancelacion = ParseMotivo(dto.MotivocancelacinKey);
        if (dto.Motivocancelacintextolibre != null) pedido.MotivoCancelacionTextoLibre = dto.Motivocancelacintextolibre;

        await db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE api/Pedido/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var pedido = await db.Pedidos.FindAsync(id);
        if (pedido is null) return NotFound();
        db.Pedidos.Remove(pedido);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // --- Helpers ---
    private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();

    private static bool TryGetDeliveryDateOrToday(string? dateKey, out DateTime date)
    {
        if (string.IsNullOrWhiteSpace(dateKey))
        {
            date = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BusinessTimeZone).Date;
            return true;
        }

        return TryParseDateKey(dateKey, out date);
    }

    private static bool TryParseDateKey(string dateKey, out DateTime date)
    {
        return DateTime.TryParseExact(
            dateKey,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out date
        );
    }

    private static TimeZoneInfo ResolveBusinessTimeZone()
    {
        foreach (var timeZoneId in new[] { "America/Mexico_City", "Central Standard Time (Mexico)", "Central Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Local;
    }

    private static object MapToDto(Pedido p) => new
    {
        id = p.Id,
        pedidonombre = p.PedidoNombre,
        empleado = p.Empleado == null ? null : new { id = p.Empleado.Id, nombrecompleto = p.Empleado.NombreCompleto, entraobjectid = p.Empleado.EntraObjectId, fotodeperfil = p.Empleado.FotoDePerfil },
        empleado1 = p.Empleado1 == null ? null : new { id = p.Empleado1.Id, nombrecompleto = p.Empleado1.NombreCompleto, entraobjectid = p.Empleado1.EntraObjectId, fotodeperfil = p.Empleado1.FotoDePerfil },
        estatusKey = $"EstatusKey{(int)p.Estatus}",
        fechadecreacin = p.FechaDeCreacion?.ToString("yyyy-MM-dd"),
        fechaentrega = p.FechaEntrega.ToString("yyyy-MM-dd"),
        horaentrega = p.HoraEntrega,
        cantidad = p.Cantidad,
        notas = p.Notas,
        motivocancelacinKey = p.MotivoCancelacion.HasValue ? $"MotivocancelacinKey{(int)p.MotivoCancelacion.Value}" : null,
        motivocancelacintextolibre = p.MotivoCancelacionTextoLibre
    };

    private static EstatusPedido ParseEstatus(string? key) => key switch
    {
        "EstatusKey0" => EstatusPedido.Pendiente,
        "EstatusKey1" => EstatusPedido.Entregado,
        "EstatusKey2" => EstatusPedido.Cancelado,
        _ => EstatusPedido.Pendiente
    };

    private static MotivoCancelacion ParseMotivo(string key) => key switch
    {
        "MotivocancelacinKey1" => Models.MotivoCancelacion.CambioDeHorario,
        "MotivocancelacinKey2" => Models.MotivoCancelacion.DuplicadoAccidental,
        "MotivocancelacinKey3" => Models.MotivoCancelacion.CanceladoPorLogistica,
        "MotivocancelacinKey4" => Models.MotivoCancelacion.ErrorEnLaSolicitud,
        "MotivocancelacinKey5" => Models.MotivoCancelacion.Otro,
        _ => Models.MotivoCancelacion.AusenciaDelEmpleado
    };
}

// DTO que coincide con el shape que espera el frontend
public record PedidoDto(
    string? Pedidonombre,
    EmpleadoRefDto? Empleado,
    EmpleadoRefDto? Empleado1,
    string? EstatusKey,
    string? Fechaentrega,
    string? Horaentrega,
    int? Cantidad,
    string? Notas,
    string? MotivocancelacinKey,
    string? Motivocancelacintextolibre
);

public record EmpleadoRefDto(Guid Id, string NombreCompleto, string? EntraObjectId);
