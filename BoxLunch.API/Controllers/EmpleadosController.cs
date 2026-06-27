using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Models;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmpleadosController(VibeDbContext db) : ControllerBase
{
    // GET api/Empleados
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? buscar)
    {
        var query = db.Empleados.AsQueryable();

        if (!string.IsNullOrEmpty(buscar))
            query = query.Where(e =>
                e.NombreCompleto.Contains(buscar) ||
                e.Email.Contains(buscar));

        var empleados = await query.OrderBy(e => e.NombreCompleto).ToListAsync();
        return Ok(empleados.Select(MapToDto));
    }

    // GET api/Empleados/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var e = await db.Empleados.FindAsync(id);
        return e is null ? NotFound() : Ok(MapToDto(e));
    }

    // GET api/Empleados/by-email/{email}
    // Útil para buscar al empleado que acaba de iniciar sesión
    [HttpGet("by-email/{email}")]
    public async Task<IActionResult> GetByEmail(string email)
    {
        var e = await db.Empleados.FirstOrDefaultAsync(e => e.Email == email);
        return e is null ? NotFound() : Ok(MapToDto(e));
    }

    // POST api/Empleados
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmpleadoDto dto)
    {
        // En el front-end SDK se llama 'userprincipalname'
        var email = dto.Email ?? dto.UserPrincipalName ?? "";
        
        // Evitar duplicados por email
        if (await db.Empleados.AnyAsync(e => e.Email == email))
            return Conflict(new { mensaje = "Ya existe un empleado con ese correo." });

        var empleado = new Empleado
        {
            NombreCompleto = dto.NombreCompleto ?? "Usuario",
            Email = email,
            EntraObjectId = dto.EntraObjectId
        };
        db.Empleados.Add(empleado);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = empleado.Id }, MapToDto(empleado));
    }

    // PATCH api/Empleados/{id}
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] EmpleadoDto dto)
    {
        var e = await db.Empleados.FindAsync(id);
        if (e is null) return NotFound();
        if (dto.NombreCompleto != null) e.NombreCompleto = dto.NombreCompleto;
        
        var email = dto.Email ?? dto.UserPrincipalName;
        if (email != null) e.Email = email;
        
        if (dto.EntraObjectId != null) e.EntraObjectId = dto.EntraObjectId;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE api/Empleados/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var e = await db.Empleados.FindAsync(id);
        if (e is null) return NotFound();
        db.Empleados.Remove(e);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static object MapToDto(Empleado e) => new
    {
        id = e.Id,
        nombrecompleto = e.NombreCompleto,
        email = e.Email,
        userprincipalname = e.Email, // Mapeado para que coincida con el SDK de front-end
        numeronomina = e.NumeroNomina,
        entraobjectid = e.EntraObjectId,
        fotodeperfil = e.FotoDePerfil
    };
}

public record EmpleadoDto(
    string? NombreCompleto,
    string? Email,
    string? UserPrincipalName,
    string? NumeroNomina,
    string? EntraObjectId
);

