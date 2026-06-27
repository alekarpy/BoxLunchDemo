using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoxLunch.API.Data;
using BoxLunch.API.Models;

namespace BoxLunch.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesDelSistemaController(VibeDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await db.RolesDelSistema.ToListAsync();
        return Ok(roles.Select(r => new { id = r.Id, nombrederol = r.NombreDeRol, descripcion = r.Descripcion }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var r = await db.RolesDelSistema.FindAsync(id);
        return r is null ? NotFound() : Ok(new { id = r.Id, nombrederol = r.NombreDeRol, descripcion = r.Descripcion });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RolDto dto)
    {
        var rol = new RolDelSistema { NombreDeRol = dto.Nombrederol, Descripcion = dto.Descripcion };
        db.RolesDelSistema.Add(rol);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = rol.Id }, new { id = rol.Id, nombrederol = rol.NombreDeRol });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var r = await db.RolesDelSistema.FindAsync(id);
        if (r is null) return NotFound();
        db.RolesDelSistema.Remove(r);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record RolDto(string Nombrederol, string? Descripcion);
